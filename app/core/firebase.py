"""
Firebase Admin SDK and Firestore Initialization Module.
Safely manages Firebase connection without logging or exposing credentials.
"""
import os
import logging
from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore import Client as FirestoreClient

from app.config import FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT_PATH

logger = logging.getLogger("hydrocast.firebase")

class FirebaseManager:
    _instance = None

    def __init__(self):
        self.app: Optional[firebase_admin.App] = None
        self.db: Optional[FirestoreClient] = None
        self.is_initialized: bool = False
        self.init_mode: str = "none"

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = FirebaseManager()
            cls._instance.initialize()
        return cls._instance

    def initialize(self):
        """Initializes Firebase Admin SDK using secure service account credentials."""
        # 1. Check if service account certificate exists at configured path
        cert_path = FIREBASE_SERVICE_ACCOUNT_PATH
        has_cert_file = bool(cert_path and os.path.exists(cert_path))

        try:
            # Delete existing default app if we need to re-initialize with new cert
            try:
                existing_app = firebase_admin.get_app()
                if has_cert_file and self.init_mode != "service_account_cert":
                    firebase_admin.delete_app(existing_app)
                else:
                    self.app = existing_app
                    self.db = firestore.client(app=self.app)
                    self.is_initialized = True
                    return
            except ValueError:
                pass

            if has_cert_file:
                cred = credentials.Certificate(cert_path)
                self.app = firebase_admin.initialize_app(cred, {
                    'projectId': FIREBASE_PROJECT_ID
                })
                self.db = firestore.client(app=self.app)
                self.is_initialized = True
                self.init_mode = "service_account_cert"
                logger.info(f"Firebase Admin successfully initialized via service account for project '{FIREBASE_PROJECT_ID}'.")
            else:
                logger.warning(
                    f"Firebase service account file not found at '{cert_path}'. "
                    f"Place the service account JSON key at this path to connect to live Firestore."
                )
                self.is_initialized = False
                self.db = None
                self.init_mode = "unauthenticated"

        except Exception as e:
            logger.error(f"Firebase Admin initialization error: {e}")
            self.is_initialized = False
            self.db = None
            self.init_mode = "error"

    def get_firestore(self) -> Optional[FirestoreClient]:
        """Returns the Firestore client instance, re-attempting connection if key was added."""
        if not self.is_initialized or self.db is None:
            self.initialize()
        return self.db

    def is_connected(self) -> bool:
        """Checks if Firestore client is available."""
        if not self.is_initialized or self.db is None:
            self.initialize()
        return self.is_initialized and self.db is not None
