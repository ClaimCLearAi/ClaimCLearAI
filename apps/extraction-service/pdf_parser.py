import pymupdf


def extract_text(pdf_bytes: bytes) -> str:
    """
    Extract text directly from a PDF's text layer, page by page.
    Returns an empty/short string if the PDF has no real text layer
    (i.e. it's a scanned image) -- check with is_text_sufficient().
    """
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    try:
        pages = [page.get_text() for page in doc]
    finally:
        doc.close()
    return "\n".join(pages).strip()


def is_text_sufficient(text: str, min_chars: int = 50) -> bool:
    """
    Heuristic: if extracted text is very short, this was probably a
    scanned/image PDF with no real text layer -- OCR fallback needed.
    """
    return len(text.strip()) >= min_chars
