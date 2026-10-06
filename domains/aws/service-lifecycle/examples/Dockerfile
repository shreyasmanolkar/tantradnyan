# Learning build: pin a reviewed base digest and hashed dependency lock for production.
FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
# Official RDS trust bundle; review changes/rebuild before CA rotation.
ADD https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /app/rds-ca.pem
RUN chmod 644 /app/rds-ca.pem
COPY api.py db_init.py cache_probe.py ./
USER 10001:10001
EXPOSE 8080
CMD ["python", "api.py"]
