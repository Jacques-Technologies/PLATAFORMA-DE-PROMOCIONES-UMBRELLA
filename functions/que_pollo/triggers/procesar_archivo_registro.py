"""Firestore trigger: descarga la imagen del cupón/ticket y la sube a GCS de forma asíncrona.

Se dispara on_document_written sobre `registros/{doc_id}`. Procesa solo si:
- El doc tiene `Archivo_url_origen` con valor.
- El doc NO tiene `Archivo_path` (idempotente: no reprocesa).

Esto separa el path crítico del flow conversacional (PATCH textual rápido) del trabajo
pesado de I/O (descarga + upload + signed URL), que puede tardar varios segundos sin
afectar a Kapso (Cloudflare 30s cap) ni a actualizar_registro (15s).
"""

from __future__ import annotations

import logging
from typing import Any

from firebase_functions import firestore_fn

from .. import firebase_app as _app  # noqa: F401
from ..storage_utils import upload_ticket


@firestore_fn.on_document_written(
    document="registros/{doc_id}",
    region="us-central1",
    memory=512,
    timeout_sec=120,
    max_instances=5,
)
def procesar_archivo_registro(event: firestore_fn.Event[firestore_fn.Change | None]) -> None:
    if event.data is None or event.data.after is None:
        return  # delete u otra mutación sin "after"

    snapshot = event.data.after
    if not snapshot.exists:
        return

    data: dict[str, Any] = snapshot.to_dict() or {}

    # Idempotente: si ya tiene Archivo_path, ya se procesó.
    if data.get("Archivo_path"):
        return

    source_url = data.get("Archivo_url_origen") or ""
    if not source_url or not str(source_url).startswith("http"):
        return

    id_registro = data.get("ID_registro") or event.params.get("doc_id", "")
    if not id_registro:
        logging.error("procesar_archivo_registro sin ID_registro en doc %s", snapshot.reference.path)
        return

    uploaded = upload_ticket(str(id_registro), str(source_url))
    if uploaded is None:
        logging.error("upload_ticket falló para %s (url=%s)", id_registro, source_url)
        return

    blob_path, signed = uploaded
    updates: dict[str, Any] = {"Archivo_path": blob_path}
    if signed:
        updates["Archivo_url"] = signed

    snapshot.reference.update(updates)
