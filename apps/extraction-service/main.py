from pathlib import Path
import json

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

from pdf_parser import extract_text, is_text_sufficient
from ocr import extract_text_ocr
import llm_extract
import rules_engine

app = FastAPI(title="ClaimClear Extraction Service")

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)

# Load rules config once at startup, not on every request
RULES_CONFIG_PATH = Path(__file__).resolve().parent / "rules_config.json"
with open(RULES_CONFIG_PATH, "r", encoding="utf-8") as f:
    RULES_CONFIG = json.load(f)


class DocumentExtractionResult(BaseModel):
    text: str
    method: str
    char_count: int


class ExtractTextResponse(BaseModel):
    clinical_doc: DocumentExtractionResult
    draft_claim: DocumentExtractionResult


def get_document_text(pdf_bytes: bytes) -> DocumentExtractionResult:
    """Try direct text extraction first; fall back to OCR if it looks empty/scanned."""
    text = extract_text(pdf_bytes)
    if is_text_sufficient(text):
        return DocumentExtractionResult(text=text, method="direct", char_count=len(text))

    ocr_text = extract_text_ocr(pdf_bytes)
    return DocumentExtractionResult(text=ocr_text, method="ocr", char_count=len(ocr_text))


def is_valid_clinical_doc(text: str) -> bool:
    """Heuristic check to ensure the document contains clinical keywords."""
    keywords = ["patient", "discharge", "diagnosis", "hospital", "admission"]
    return any(word in text.lower() for word in keywords)


def is_valid_claim_form(text: str) -> bool:
    """Heuristic check to ensure the document contains insurance claim keywords."""
    keywords = ["claim", "insurance", "policy", "billing", "charges"]
    return any(word in text.lower() for word in keywords)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/extract-text", response_model=ExtractTextResponse)
async def extract_text_endpoint(
    clinical_doc: UploadFile = File(...),
    draft_claim: UploadFile = File(...),
):
    """NOTE: this endpoint ONLY does PDF/OCR text extraction.
    It never calls Gemini and never runs the rules audit.
    Use /extract for the full pipeline."""
    clinical_bytes = await clinical_doc.read()
    claim_bytes = await draft_claim.read()

    return ExtractTextResponse(
        clinical_doc=get_document_text(clinical_bytes),
        draft_claim=get_document_text(claim_bytes),
    )


@app.post("/extract")
async def extract_endpoint(
    clinical_doc: UploadFile = File(...),
    draft_claim: UploadFile = File(...),
):
    """Full pipeline: PDF/OCR extraction -> Validation -> Gemini structuring -> rules audit."""
    clinical_bytes = await clinical_doc.read()
    claim_bytes = await draft_claim.read()

    clinical_result = get_document_text(clinical_bytes)
    claim_result = get_document_text(claim_bytes)

    # ---------------- VALIDATION CHECK ----------------
    reasons = []
    if not is_valid_clinical_doc(clinical_result.text):
        reasons.append("File 1 does not appear to be a valid clinical document.")
    if not is_valid_claim_form(claim_result.text):
        reasons.append("File 2 does not appear to be a valid insurance claim form.")

    if reasons:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Document validation failed.",
                "reasons": reasons
            }
        )
    # --------------------------------------------------

    try:
        structured = llm_extract.run(clinical_result.text, claim_result.text)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"LLM extraction failed: {e}. Check Gemini api key in .env",
        )

    discharge_summary = structured["discharge_summary"]
    claim_part_b = structured["claim_part_b"]

    try:
        audit_report = rules_engine.run_claim_audit(discharge_summary, claim_part_b, RULES_CONFIG)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Rules audit failed: {e}",
        )

    return {
        "extraction_debug": {
            "clinical_doc_method": clinical_result.method,
            "draft_claim_method": claim_result.method,
        },
        "audit": audit_report,
    }