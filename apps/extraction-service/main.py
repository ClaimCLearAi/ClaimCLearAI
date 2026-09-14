from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

from pdf_parser import extract_text, is_text_sufficient
from ocr import extract_text_ocr
import llm_extract

app = FastAPI(title="ClaimClear Extraction Service")
load_dotenv()  


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


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/extract-text", response_model=ExtractTextResponse)
async def extract_text_endpoint(
    clinical_doc: UploadFile = File(...),
    draft_claim: UploadFile = File(...),
):
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
    clinical_bytes = await clinical_doc.read()
    claim_bytes = await draft_claim.read()

    clinical_result = get_document_text(clinical_bytes)
    claim_result = get_document_text(claim_bytes)

    try:
        structured = llm_extract.run(clinical_result.text, claim_result.text)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"LLM extraction failed: {e}. Check Gemini api key in .env",
        )

    return {
        "extraction_debug": {
            "clinical_doc_method": clinical_result.method,
            "draft_claim_method": claim_result.method,
        },
        **structured,
    }