"""Helpers para descargar imágenes externas y subirlas al bucket por defecto.

Reutilizado por crear_registro y migrar_archivos.
"""

from __future__ import annotations

import logging
from datetime import timedelta

import google.auth
import requests
from firebase_admin import storage
from google.auth.transport import requests as google_requests


SIGNED_URL_DAYS = 7

EXTENSION_BY_MIME = {
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


def download_image(url: str, timeout: int = 15) -> tuple[bytes, str] | None:
    try:
        r = requests.get(url, timeout=timeout, allow_redirects=True)
        r.raise_for_status()
    except requests.RequestException:
        return None
    mime = (r.headers.get("Content-Type") or "image/jpeg").split(";")[0].strip()
    if not mime.startswith("image/"):
        mime = "image/jpeg"
    return r.content, mime


def signed_url_v4(blob, days: int = SIGNED_URL_DAYS) -> str:
    credentials, _ = google.auth.default()
    credentials.refresh(google_requests.Request())
    return blob.generate_signed_url(
        expiration=timedelta(days=days),
        method="GET",
        version="v4",
        service_account_email=credentials.service_account_email,
        access_token=credentials.token,
    )


def upload_ticket(doc_id: str, source_url: str) -> tuple[str, str] | None:
    """Descarga la imagen desde source_url y la sube a tickets/{doc_id}.{ext}.

    Devuelve (gcs_path, signed_url) o None si la descarga/subida falla. Si la subida
    funciona pero la firma falla, devuelve (gcs_path, "").
    """
    downloaded = download_image(source_url)
    if downloaded is None:
        return None
    image_bytes, mime = downloaded
    ext = EXTENSION_BY_MIME.get(mime, "jpeg")
    blob_path = f"tickets/{doc_id}.{ext}"

    try:
        blob = storage.bucket().blob(blob_path)
        blob.upload_from_string(image_bytes, content_type=mime)
    except Exception:
        logging.exception("Failed to upload ticket image to GCS")
        return None

    try:
        url = signed_url_v4(blob)
    except Exception:
        logging.exception("Failed to generate signed URL for %s", blob_path)
        url = ""
    return blob_path, url
