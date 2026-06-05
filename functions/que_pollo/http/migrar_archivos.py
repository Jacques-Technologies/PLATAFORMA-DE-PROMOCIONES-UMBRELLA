"""Endpoint POST /migrar_archivos: descarga imágenes externas y las copia al bucket propio.

Recorre los registros que aún no tienen Archivo_path (es decir, su Archivo_url apunta a
un host externo como Kapso). Para cada uno descarga la imagen, la sube a
tickets/{ID_registro}.{ext} y actualiza el documento con Archivo_path, Archivo_url
(signed URL v4) y Archivo_url_origen.

Body opcional:
    { "limit": 50, "dry_run": false }

Response:
    { "candidatos": N, "migrados": M, "errores": [{id, reason}, ...] }
"""

from __future__ import annotations

import json
from typing import Any

from firebase_admin import firestore
from firebase_functions import https_fn

from .. import firebase_app as _app  # noqa: F401
from ..storage_utils import upload_ticket
from .auth import KAPSO_API_KEY, require_api_key


def _bad_request(message: str) -> https_fn.Response:
    return https_fn.Response(
        json.dumps({"error": message}),
        status=400,
        headers={"Content-Type": "application/json"},
    )


@https_fn.on_request(
    region="us-central1",
    max_instances=2,
    memory=512,
    timeout_sec=300,
    secrets=[KAPSO_API_KEY],
)
def migrar_archivos(req: https_fn.Request) -> https_fn.Response:
    auth_error = require_api_key(req)
    if auth_error is not None:
        return auth_error

    if req.method != "POST":
        return _bad_request("method_not_allowed")

    body = req.get_json(silent=True) or {}
    try:
        limit = int(body.get("limit") or 50)
    except (TypeError, ValueError):
        limit = 50
    dry_run = bool(body.get("dry_run"))

    db = firestore.client()
    # Obtenemos todos los docs de registros que tengan Archivo_url y NO Archivo_path.
    # Firestore no permite where("field", "not exists"), así que filtramos en memoria.
    docs = list(db.collection("registros").stream())

    candidatos: list[Any] = []
    for doc in docs:
        d = doc.to_dict() or {}
        if d.get("Archivo_path"):
            continue
        url = d.get("Archivo_url") or ""
        if not url or not str(url).startswith("http"):
            continue
        candidatos.append(doc)
        if len(candidatos) >= limit:
            break

    migrados: list[str] = []
    errores: list[dict[str, str]] = []

    if not dry_run:
        for doc in candidatos:
            doc_id = doc.id
            data = doc.to_dict() or {}
            source_url = data.get("Archivo_url") or ""
            uploaded = upload_ticket(doc_id, source_url)
            if uploaded is None:
                errores.append({"id": doc_id, "reason": "upload_failed"})
                continue
            blob_path, signed = uploaded
            updates: dict[str, Any] = {
                "Archivo_path": blob_path,
                "Archivo_url_origen": source_url,
            }
            if signed:
                updates["Archivo_url"] = signed
            try:
                db.collection("registros").document(doc_id).update(updates)
            except Exception as exc:  # noqa: BLE001
                errores.append({"id": doc_id, "reason": f"firestore_update_failed: {exc}"})
                continue
            migrados.append(doc_id)

    return https_fn.Response(
        json.dumps(
            {
                "candidatos": len(candidatos),
                "migrados": len(migrados),
                "ids_migrados": migrados,
                "errores": errores,
                "dry_run": dry_run,
            }
        ),
        status=200,
        headers={"Content-Type": "application/json"},
    )
