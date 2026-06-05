"""Helpers de autenticación para endpoints HTTP llamados por Kapso."""

from __future__ import annotations

from firebase_functions import https_fn
from firebase_functions.params import SecretParam


KAPSO_API_KEY = SecretParam("KAPSO_TO_FIREBASE_KEY")


def require_api_key(req: https_fn.Request) -> https_fn.Response | None:
    received = req.headers.get("X-API-Key") or req.headers.get("x-api-key")
    if received and received == KAPSO_API_KEY.value:
        return None
    return https_fn.Response(
        '{"error":"unauthorized"}',
        status=401,
        headers={"Content-Type": "application/json"},
    )
