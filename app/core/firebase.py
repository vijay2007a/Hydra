import os
import json
import logging
from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore import Client as FirestoreClient

from app.config import (
    FIREBASE_PROJECT_ID,
    FIREBASE_SERVICE_ACCOUNT_PATH,
    FIREBASE_SERVICE_ACCOUNT_JSON
)

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
        """Initializes Firebase Admin SDK using secure service account credentials or environment variables."""
        cert_path = FIREBASE_SERVICE_ACCOUNT_PATH
        cert_json_str = FIREBASE_SERVICE_ACCOUNT_JSON
        has_cert_file = bool(cert_path and os.path.exists(cert_path))
        has_cert_json = bool(cert_json_str and len(cert_json_str.strip()) > 10)

        try:
            # Delete existing default app if we need to re-initialize with new cert
            try:
                existing_app = firebase_admin.get_app()
                if (has_cert_file or has_cert_json) and self.init_mode not in ["service_account_cert", "service_account_env_json"]:
                    firebase_admin.delete_app(existing_app)
                elif self.app is not None and self.db is not None:
                    return
            except ValueError:
                pass

            if has_cert_json:
                # 1. Load credentials from environment variable (ideal for Render / Cloud deployments)
                try:
                    cert_dict = json.loads(cert_json_str)
                    cred = credentials.Certificate(cert_dict)
                    proj_id = cert_dict.get("project_id", FIREBASE_PROJECT_ID)
                    self.app = firebase_admin.initialize_app(cred, {
                        'projectId': proj_id
                    })
                    self.db = firestore.client(app=self.app)
                    self.is_initialized = True
                    self.init_mode = "service_account_env_json"
                    logger.info(f"Firebase Admin successfully initialized via environment variable JSON for project '{proj_id}'.")
                    return
                except Exception as e_json:
                    logger.error(f"Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON env var: {e_json}")

            if has_cert_file:
                # 2. Load credentials from local file path
                cred = credentials.Certificate(cert_path)
                self.app = firebase_admin.initialize_app(cred, {
                    'projectId': FIREBASE_PROJECT_ID
                })
                self.db = firestore.client(app=self.app)
                self.is_initialized = True
                self.init_mode = "service_account_cert"
                logger.info(f"Firebase Admin successfully initialized via service account file for project '{FIREBASE_PROJECT_ID}'.")
                return

            # Fallback
            logger.warning(
                f"Firebase service account not found at path '{cert_path}' or via FIREBASE_SERVICE_ACCOUNT_JSON. "
                f"Backend will operate in local fallback mode."
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
