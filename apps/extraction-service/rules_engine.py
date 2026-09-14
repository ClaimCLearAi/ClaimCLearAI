import json
from datetime import datetime
from typing import Any, Dict, List, Tuple, Optional
import re

# -------------------------------------------------------------------------
# SECTION 1: HELPER FUNCTIONS (Data Cleaning & Parsing)
# -------------------------------------------------------------------------


HONORIFICS = r"^(mr|mrs|ms|miss|dr|prof|master|shri|smt|kum)\.?\s+"

def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    text = value.strip().lower()
    text = re.sub(HONORIFICS, "", text)          # strip leading honorific
    text = re.sub(r"\s+", " ", text)              # collapse whitespace
    text = re.sub(r"[^\w\s]", "", text)            # strip punctuation (periods, commas)
    return text.strip()


def parse_iso_datetime(date_str: Optional[str], time_str: Optional[str] = "00:00") -> datetime:
    """Converts separate date and time strings into a single comparable Python datetime object.
    Raises ValueError if date_str is missing/None -- callers should catch this."""
    if not date_str or not str(date_str).strip():
        raise ValueError("date_str is missing or empty")

    clean_date = str(date_str).strip()
    if time_str and str(time_str).strip():
        clean_time = str(time_str).strip()
    else:
        clean_time = "00:00"
    return datetime.strptime(f"{clean_date} {clean_time}", "%Y-%m-%d %H:%M")


# -------------------------------------------------------------------------
# SECTION 2: AUDIT CHECK FUNCTIONS
# Each rule function evaluates data and returns: (has_failed: bool, error_message: str)
# -------------------------------------------------------------------------

def check_rule_01_preauth(clinical: Dict[str, Any], claim: Dict[str, Any]) -> Tuple[bool, str]:
    """RULE_01: Verifies that surgical claims have an approved Pre-Authorization ID."""
    treatment_section = claim.get("section_c_ailment_and_treatment", {}) or {}
    procedure_code = treatment_section.get("procedure_icd10_pcs")
    pre_auth_id = treatment_section.get("pre_auth_id")

    # If a procedure code exists, pre-authorization is mandatory
    if procedure_code and (not pre_auth_id or not str(pre_auth_id).strip()):
        return True, "Surgical procedure is billed, but the Pre-Authorization Reference ID is missing or empty."
    return False, ""


def check_rule_02_chronology(clinical: Dict[str, Any], claim: Dict[str, Any]) -> Tuple[bool, str]:
    """RULE_02: Checks if discharge occurs before admission or conflicts with clinical records."""
    claim_patient = claim.get("section_b_patient_details", {}) or {}
    clinical_stay = clinical.get("hospitalization_timeline", {}) or {}

    try:
        # Parse claim dates
        claim_adm = parse_iso_datetime(
            claim_patient.get("date_of_admission"),
            claim_patient.get("time_of_admission")
        )
        claim_dis = parse_iso_datetime(
            claim_patient.get("date_of_discharge"),
            claim_patient.get("time_of_discharge")
        )

        # Logical Check 1: Did the patient leave before they arrived?
        if claim_dis <= claim_adm:
            return True, f"Chronology error: Discharge ({claim_dis}) is earlier than or equal to Admission ({claim_adm})."

        # Logical Check 2: Do claim dates conflict with the actual clinical notes?
        clin_adm = parse_iso_datetime(
            clinical_stay.get("admission_date"),
            clinical_stay.get("admission_time")
        )
        clin_dis = parse_iso_datetime(
            clinical_stay.get("discharge_date"),
            clinical_stay.get("discharge_time")
        )

        if claim_adm.date() != clin_adm.date() or claim_dis.date() != clin_dis.date():
            return True, (
                f"Date conflict: Claim Form dates ({claim_adm.date()} to {claim_dis.date()}) "
                f"do not match Discharge Summary ({clin_adm.date()} to {clin_dis.date()})."
            )

    except (KeyError, ValueError, TypeError, AttributeError) as err:
        return True, f"Failed to validate dates due to missing or invalid format: {str(err)}"

    return False, ""


def check_rule_03_diagnosis_match(clinical: Dict[str, Any], claim: Dict[str, Any]) -> Tuple[bool, str]:
    """RULE_03: Checks if primary ICD-10 code matches between clinical notes and claim form."""
    clinical_icd = (clinical.get("clinical_assessment", {}) or {}).get("primary_icd10_code")
    claim_icd = (claim.get("section_c_ailment_and_treatment", {}) or {}).get("primary_diagnosis_icd10")

    clinical_icd = (clinical_icd or "").strip().upper()
    claim_icd = (claim_icd or "").strip().upper()

    if not claim_icd:
        return True, "Primary ICD-10 diagnosis code is completely missing from Claim Form Part B."

    if not clinical_icd:
        return True, "Cannot verify diagnosis: Discharge Summary is missing a primary ICD-10 code to cross-check against the claim."

    if clinical_icd != claim_icd:
        return True, f"Diagnosis mismatch: Claim states ICD '{claim_icd}', but Discharge Summary specifies '{clinical_icd}'."

    return False, ""


def check_rule_04_min_24hr_stay(clinical: Dict[str, Any], claim: Dict[str, Any]) -> Tuple[bool, str]:
    """RULE_04: Flags inpatient admissions under 24 hours not marked as Day Care."""
    claim_patient = claim.get("section_b_patient_details", {}) or {}
    admission_type = normalize_text(claim_patient.get("type_of_admission"))

    try:
        adm = parse_iso_datetime(claim_patient.get("date_of_admission"), claim_patient.get("time_of_admission"))
        dis = parse_iso_datetime(claim_patient.get("date_of_discharge"), claim_patient.get("time_of_discharge"))

        duration_hours = (dis - adm).total_seconds() / 3600.0

        # If duration is negative, the dates are inverted -- that's a data integrity
        # problem already caught and reported by RULE_02_DATE_CHRONOLOGY. Don't stack
        # a second, nonsensical "-X hours" finding for the same root cause.
        if duration_hours < 0:
            return False, ""

        if duration_hours < 24.0 and "day" not in admission_type:
            return True, f"Inpatient stay was {duration_hours:.1f} hours (< 24 hours) but not marked as Day Care."
    except Exception:
        pass  # Date formatting errors will be caught by RULE_02

    return False, ""


def check_rule_05_name_mismatch(clinical: Dict[str, Any], claim: Dict[str, Any]) -> Tuple[bool, str]:
    """RULE_05: Checks if patient name differs across documents."""
    clin_name = normalize_text((clinical.get("patient_demographics", {}) or {}).get("patient_name"))
    claim_name = normalize_text((claim.get("section_b_patient_details", {}) or {}).get("patient_name"))

    if not claim_name:
        return True, "Patient name is missing on Claim Form Part B."

    if clin_name != claim_name:
        original_clin = (clinical.get("patient_demographics", {}) or {}).get("patient_name")
        original_claim = (claim.get("section_b_patient_details", {}) or {}).get("patient_name")
        return True, f"Name mismatch: Clinical notes say '{original_clin}', but Claim Form says '{original_claim}'."

    return False, ""


def check_rule_07_doctor_reg(clinical: Dict[str, Any], claim: Dict[str, Any]) -> Tuple[bool, str]:
    """RULE_07: Ensures treating doctor registration number is present."""
    doc_reg = (claim.get("section_a_hospital_details", {}) or {}).get("doctor_registration_no")
    if not doc_reg or not str(doc_reg).strip():
        return True, "Treating doctor's State Medical Council / NMC registration number is missing."
    return False, ""


def check_rule_08_hospital_id(clinical: Dict[str, Any], claim: Dict[str, Any]) -> Tuple[bool, str]:
    """RULE_08: Ensures Hospital ROHINI identification number is present."""
    rohini = (claim.get("section_a_hospital_details", {}) or {}).get("hospital_id_rohini")
    if not rohini or not str(rohini).strip():
        return True, "Hospital ROHINI ID (IIB registry) is missing in Section A."
    return False, ""


def check_rule_18_bank_details(clinical: Dict[str, Any], claim: Dict[str, Any]) -> Tuple[bool, str]:
    """RULE_18: Ensures insured's bank account number and IFSC code are present for NEFT settlement."""
    bank_details = claim.get("section_f_bank_details", {}) or {}
    account_no = bank_details.get("account_number")
    ifsc_code = bank_details.get("ifsc_code")

    missing = []
    if not account_no or not str(account_no).strip():
        missing.append("account number")
    if not ifsc_code or not str(ifsc_code).strip():
        missing.append("IFSC code")

    if missing:
        return True, f"Insured's bank {' and '.join(missing)} missing from Claim Form Part A Section F -- required for NEFT settlement."
    return False, ""


def check_rule_16_arithmetic(clinical: Dict[str, Any], claim: Dict[str, Any]) -> Tuple[bool, str]:
    """RULE_16: Verifies itemized line items sum up to total_claimed_amount."""
    finances = claim.get("section_e_financial_summary", {}) or {}
    claimed_total = float(finances.get("total_claimed_amount") or 0.0)

    line_items = [
        float(finances.get("room_nursing_charges") or 0.0),
        float(finances.get("icu_charges") or 0.0),
        float(finances.get("ot_charges") or 0.0),
        float(finances.get("surgeon_consultation_fees") or 0.0),
        float(finances.get("investigation_charges") or 0.0),
        float(finances.get("medicines_consumables") or 0.0),
    ]
    computed_sum = sum(line_items)

    if abs(computed_sum - claimed_total) > 1.0:
        return True, f"Sum of line items (₹{computed_sum:,.2f}) does not match Total Claimed Amount (₹{claimed_total:,.2f})."

    return False, ""


# -------------------------------------------------------------------------
# SECTION 3: THE REGISTRY (Connecting JSON Rule IDs to Functions)
# -------------------------------------------------------------------------

RULE_REGISTRY = [
    ("RULE_01_PREAUTH_REQ", check_rule_01_preauth),
    ("RULE_02_DATE_CHRONOLOGY", check_rule_02_chronology),
    ("RULE_03_DIAG_PROC_MATCH", check_rule_03_diagnosis_match),
    ("RULE_04_MIN_24HR_STAY", check_rule_04_min_24hr_stay),
    ("RULE_05_NAME_MISMATCH", check_rule_05_name_mismatch),
    ("RULE_07_DOCTOR_REG_MISSING", check_rule_07_doctor_reg),
    ("RULE_08_HOSPITAL_ID_MISSING", check_rule_08_hospital_id),
    ("RULE_16_ARITHMETIC_TOTAL_MISMATCH", check_rule_16_arithmetic),
    ("RULE_18_BANK_DETAILS_MISSING", check_rule_18_bank_details),
]


# -------------------------------------------------------------------------
# SECTION 4: THE AUDIT PIPELINE ENGINE
# -------------------------------------------------------------------------

def run_claim_audit(
    clinical_data: Dict[str, Any],
    claim_data: Dict[str, Any],
    rules_config: Dict[str, Any]
) -> Dict[str, Any]:
    """Runs all checks, deducts points, and prepares the output payload."""
    score = 100
    findings: List[Dict[str, Any]] = []

    for rule_id, check_function in RULE_REGISTRY:
        failed, issue_message = check_function(clinical_data, claim_data)

        if failed:
            meta = rules_config.get(rule_id, {})
            deduction = meta.get("deduction", 0)
            score -= deduction

            findings.append({
                "rule_id": rule_id,
                "title": meta.get("title", rule_id),
                "category": meta.get("category", "General"),
                "severity": meta.get("severity", "MINOR"),
                "deduction": deduction,
                "regulatory_source": meta.get("regulatory_source", ""),
                "detected_issue": issue_message,
                "suggested_fix": meta.get("suggested_fix", "")
            })

    final_score = max(0, score)

    if final_score >= 85:
        status = "READY_TO_SUBMIT"
    elif final_score >= 60:
        status = "ACTION_REQUIRED"
    else:
        status = "HIGH_REJECTION_RISK"

    return {
        "readiness_score": final_score,
        "status": status,
        "total_violations": len(findings),
        "findings": findings
    }


# -------------------------------------------------------------------------
# SECTION 5: STANDALONE EXECUTION BLOCK
# -------------------------------------------------------------------------

if __name__ == "__main__":
    with open("rules_config.json", "r") as f:
        rules_db = json.load(f)

    with open("discharge_summary.json", "r") as f:
        clinical_mock = json.load(f)

    with open("claim_part_b.json", "r") as f:
        claim_mock = json.load(f)

    audit_report = run_claim_audit(clinical_mock, claim_mock, rules_db)

    print("\n" + "=" * 60)
    print(f" CLAIM AUDIT REPORT | Score: {audit_report['readiness_score']}/100 [{audit_report['status']}]")
    print(f" Total Violations Found: {audit_report['total_violations']}")
    print("=" * 60 + "\n")

    for idx, item in enumerate(audit_report["findings"], 1):
        print(f"[{idx}] {item['title']} (-{item['deduction']} pts)")
        print(f"    Severity : {item['severity']} | Category: {item['category']}")
        print(f"    Issue    : {item['detected_issue']}")
        print(f"    Fix      : {item['suggested_fix']}\n")