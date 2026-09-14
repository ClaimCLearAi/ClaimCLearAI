import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel
from google import genai
from google.genai import types

from groq import Groq  # pip install groq

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # get a free key at https://console.groq.com/keys

# Fallback model config
GROQ_MODEL = "openai/gpt-oss-120b"  # llama-3.3-70b-versatile was deprecated by Groq in June 2026
GEMINI_MAX_RETRIES = 2                  # retries before falling back
GEMINI_RETRY_DELAY_SECONDS = 2          # backoff between retries
GROQ_MAX_RETRIES = 2                    # retries before falling back to Ollama
GROQ_RETRY_DELAY_SECONDS = 2

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


# ---------------- Discharge Summary schema ----------------

class TreatingDoctor(BaseModel):
    name: str | None
    qualification: str | None
    council_registration_number: str | None
    council_state: str | None

class Facility(BaseModel):
    hospital_name: str | None
    department: str | None
    treating_doctor: TreatingDoctor

class PatientDemographics(BaseModel):
    patient_name: str | None
    age: int | None
    gender: str | None
    uhid: str | None
    ipd_number: str | None

class HospitalizationTimeline(BaseModel):
    admission_date: str | None
    admission_time: str | None
    discharge_date: str | None
    discharge_time: str | None
    total_stay_duration_hours: float | None
    admission_type: str | None

class ClinicalAssessment(BaseModel):
    chief_complaints: str | None
    provisional_diagnosis: str | None
    final_diagnosis: str | None
    primary_icd10_code: str | None
    secondary_icd10_codes: list[str]

class ProcedureDetails(BaseModel):
    procedure_name: str | None
    procedure_code: str | None
    procedure_date: str | None
    anesthesia_type: str | None
    surgeon_name: str | None
    histopathology_sent: bool | None
    implant_used: bool | None

class DischargeStatus(BaseModel):
    condition_at_discharge: str | None
    follow_up_date: str | None

class DischargeSummary(BaseModel):
    document_type: str
    facility: Facility
    patient_demographics: PatientDemographics
    hospitalization_timeline: HospitalizationTimeline
    clinical_assessment: ClinicalAssessment
    procedure_details: ProcedureDetails
    discharge_status: DischargeStatus


# ---------------- Claim Part B schema ----------------

class SectionAHospitalDetails(BaseModel):
    hospital_name: str | None
    hospital_id_rohini: str | None
    hospital_type: str | None
    treating_doctor_name: str | None
    qualification: str | None
    doctor_registration_no: str | None
    phone_number: str | None

class SectionBPatientDetails(BaseModel):
    patient_name: str | None
    ip_registration_number: str | None
    gender: str | None
    age_years: int | None
    date_of_admission: str | None
    time_of_admission: str | None
    date_of_discharge: str | None
    time_of_discharge: str | None
    type_of_admission: str | None
    status_at_discharge: str | None

class SectionCAilmentAndTreatment(BaseModel):
    primary_diagnosis_description: str | None
    primary_diagnosis_icd10: str | None
    procedure_description: str | None
    procedure_icd10_pcs: str | None
    pre_auth_obtained: bool | None
    pre_auth_id: str | None
    system_of_medicine: str | None

class SectionDClaimDocumentsSubmitted(BaseModel):
    discharge_summary: bool
    investigation_reports: bool
    operation_theatre_notes: bool
    original_pre_auth_request_and_approval: bool
    itemized_hospital_bill: bool
    pharmacy_bills: bool
    implant_invoice_or_stickers: bool

class SectionEFinancialSummary(BaseModel):
    room_nursing_charges: float
    icu_charges: float
    ot_charges: float
    surgeon_consultation_fees: float
    investigation_charges: float
    medicines_consumables: float
    total_claimed_amount: float

class ClaimPartB(BaseModel):
    document_type: str
    section_a_hospital_details: SectionAHospitalDetails
    section_b_patient_details: SectionBPatientDetails
    section_c_ailment_and_treatment: SectionCAilmentAndTreatment
    section_d_claim_documents_submitted: SectionDClaimDocumentsSubmitted
    section_e_financial_summary: SectionEFinancialSummary


# ---------------- Combined output schema ----------------

class ExtractionOutput(BaseModel):
    discharge_summary: DischargeSummary
    claim_part_b: ClaimPartB


PROMPT_TEMPLATE = """You are a medical claims data extraction system. You will be given raw text
extracted from two documents: a clinical document (discharge summary) and a draft insurance claim
(claim form part B).

Extract the data into EXACTLY two JSON objects, "discharge_summary" and "claim_part_b", following
these two structures precisely (field names, nesting, and types must match exactly):

--- discharge_summary structure ---
{{
  "document_type": "DISCHARGE_SUMMARY",
  "facility": {{
    "hospital_name": "...",
    "department": "...",
    "treating_doctor": {{
      "name": "...",
      "qualification": "...",
      "council_registration_number": "...",
      "council_state": "..."
    }}
  }},
  "patient_demographics": {{
    "patient_name": "...", "age": 0, "gender": "...", "uhid": "...", "ipd_number": "..."
  }},
  "hospitalization_timeline": {{
    "admission_date": "YYYY-MM-DD", "admission_time": "HH:MM",
    "discharge_date": "YYYY-MM-DD", "discharge_time": "HH:MM",
    "total_stay_duration_hours": 0.0, "admission_type": "..."
  }},
  "clinical_assessment": {{
    "chief_complaints": "...", "provisional_diagnosis": "...", "final_diagnosis": "...",
    "primary_icd10_code": "...", "secondary_icd10_codes": []
  }},
  "procedure_details": {{
    "procedure_name": "...", "procedure_code": "...", "procedure_date": "YYYY-MM-DD",
    "anesthesia_type": "...", "surgeon_name": "...",
    "histopathology_sent": true, "implant_used": false
  }},
  "discharge_status": {{
    "condition_at_discharge": "...", "follow_up_date": "YYYY-MM-DD"
  }}
}}

--- claim_part_b structure ---
{{
  "document_type": "CLAIM_FORM_PART_B",
  "section_a_hospital_details": {{
    "hospital_name": "...", "hospital_id_rohini": "...", "hospital_type": "...",
    "treating_doctor_name": "...", "qualification": "...", "doctor_registration_no": "...",
    "phone_number": "..."
  }},
  "section_b_patient_details": {{
    "patient_name": "...", "ip_registration_number": "...", "gender": "...", "age_years": 0,
    "date_of_admission": "YYYY-MM-DD", "time_of_admission": "HH:MM",
    "date_of_discharge": "YYYY-MM-DD", "time_of_discharge": "HH:MM",
    "type_of_admission": "...", "status_at_discharge": "..."
  }},
  "section_c_ailment_and_treatment": {{
    "primary_diagnosis_description": "...", "primary_diagnosis_icd10": "...",
    "procedure_description": "...", "procedure_icd10_pcs": "...",
    "pre_auth_obtained": true, "pre_auth_id": "...", "system_of_medicine": "..."
  }},
  "section_d_claim_documents_submitted": {{
    "discharge_summary": true, "investigation_reports": true, "operation_theatre_notes": true,
    "original_pre_auth_request_and_approval": true, "itemized_hospital_bill": true,
    "pharmacy_bills": true, "implant_invoice_or_stickers": false
  }},
  "section_e_financial_summary": {{
    "room_nursing_charges": 0.0, "icu_charges": 0.0, "ot_charges": 0.0,
    "surgeon_consultation_fees": 0.0, "investigation_charges": 0.0,
    "medicines_consumables": 0.0, "total_claimed_amount": 0.0
  }}
}}

Rules:
- If a field cannot be found, use null (or false/0 for booleans/numbers where structurally required) -- do not guess or fabricate values.
- Dates must be YYYY-MM-DD, times HH:MM (24-hour).
- Return ONLY valid JSON with both objects nested under top-level keys "discharge_summary" and "claim_part_b".
- Do not include any explanation, markdown formatting, or code fences -- raw JSON only.

CLINICAL DOCUMENT TEXT (discharge summary source):
\"\"\"
{clinical_text}
\"\"\"

DRAFT CLAIM TEXT (claim part B source):
\"\"\"
{claim_text}
\"\"\"
"""

client = genai.Client(api_key=GEMINI_API_KEY)


def _call_gemini(prompt: str) -> dict:
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ExtractionOutput,
            temperature=0.0,
        ),
    )
    return json.loads(response.text)


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        # remove ```json ... ``` or ``` ... ```
        text = text.split("```", 2)[1] if text.count("```") >= 2 else text
        if text.lstrip().startswith("json"):
            text = text.lstrip()[4:]
    return text.strip().strip("`").strip()


def _call_groq(prompt: str) -> dict:
    if groq_client is None:
        raise RuntimeError("GROQ_API_KEY not set in .env")

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatileL",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content
    raw = _strip_code_fences(raw)
    return json.loads(raw)


def run(clinical_text: str, claim_text: str) -> dict:
    prompt = PROMPT_TEMPLATE.format(clinical_text=clinical_text, claim_text=claim_text)

    result = None
    gemini_error = None
    groq_error = None

    # --- Tier 1: Gemini ---
    for attempt in range(1, GEMINI_MAX_RETRIES + 1):
        try:
            result = _call_gemini(prompt)
            break
        except Exception as e:
            gemini_error = e
            print(f"[Gemini] attempt {attempt}/{GEMINI_MAX_RETRIES} failed: {e}")
            if attempt < GEMINI_MAX_RETRIES:
                time.sleep(GEMINI_RETRY_DELAY_SECONDS * attempt)

    # --- Tier 2: Groq ---
    if result is None:
        print(f"[Gemini] exhausted retries ({gemini_error}). Trying Groq '{GROQ_MODEL}'...")
        for attempt in range(1, GROQ_MAX_RETRIES + 1):
            try:
                result = _call_groq(prompt)
                break
            except Exception as e:
                groq_error = e
                print(f"[Groq] attempt {attempt}/{GROQ_MAX_RETRIES} failed: {e}")
                if attempt < GROQ_MAX_RETRIES:
                    time.sleep(GROQ_RETRY_DELAY_SECONDS * attempt)

    # --- Both providers failed ---
    if result is None:
        raise RuntimeError(
            f"All providers failed.\n"
            f"Gemini error: {gemini_error}\n"
            f"Groq error: {groq_error}"
        )

    # --- Validate against schema regardless of source ---
    try:
        validated = ExtractionOutput(**result)
        result = validated.model_dump()
    except Exception as e:
        raise RuntimeError(f"Extraction output failed schema validation: {e}") from e

    return {
        "discharge_summary": result["discharge_summary"],
        "claim_part_b": result["claim_part_b"],
    }


if __name__ == "__main__":
    # quick manual test
    sample_clinical = "Patient Name: John Doe. Admitted 2026-01-01, discharged 2026-01-05..."
    sample_claim = "Hospital: ABC Hospital. IP Reg No: 12345..."
    out = run(sample_clinical, sample_claim)
    print(json.dumps(out, indent=2))