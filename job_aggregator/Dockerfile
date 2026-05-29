FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PIP_DEFAULT_TIMEOUT=600
ENV PIP_RETRIES=5

COPY requirements.txt requirements-ml.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir -r requirements-ml.txt

# spaCy English model (resume NER)
RUN python -m spacy download en_core_web_sm

COPY app ./app
COPY main.py ./

# File uploads (resume parse) — small layer; avoids rebuilding ML deps when only this is missing
RUN pip install --no-cache-dir "python-multipart>=0.0.9"

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
