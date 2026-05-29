"""MinIO (S3-compatible) object storage for resumes and attachments."""

from __future__ import annotations

import os
import uuid
from typing import BinaryIO

import boto3
from botocore.client import Config

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "workgraph")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "workgraph_minio_dev")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() in ("1", "true", "yes")
MINIO_BUCKET_RESUMES = os.getenv("MINIO_BUCKET_RESUMES", "resumes")


def _client():
    endpoint = MINIO_ENDPOINT if MINIO_ENDPOINT.startswith("http") else f"http://{MINIO_ENDPOINT}"
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def upload_resume(user_id: str, filename: str, body: BinaryIO, content_type: str) -> str:
    key = f"{user_id}/{uuid.uuid4().hex}_{filename}"
    client = _client()
    client.upload_fileobj(
        body,
        MINIO_BUCKET_RESUMES,
        key,
        ExtraArgs={"ContentType": content_type},
    )
    return f"{MINIO_BUCKET_RESUMES}/{key}"
