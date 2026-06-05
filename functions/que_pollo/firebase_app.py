"""Inicialización singleton de firebase-admin para el codebase de Functions."""

from firebase_admin import initialize_app

app = initialize_app()
