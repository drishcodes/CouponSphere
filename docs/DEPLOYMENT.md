# Deployment Guide

## Frontend: Vercel

1. Set root directory to `client`.
2. Add `VITE_API_URL=https://api.your-domain.com/api/v1`.
3. Build command: `npm run build`.
4. Output directory: `dist`.

## Backend: Render, Railway, AWS, GCP, or Azure

1. Deploy `server` as a Node service.
2. Provision MongoDB Atlas and Redis.
3. Set all variables from `server/.env.example`.
4. Point `FRAUD_SERVICE_URL` at the Java fraud service.

## Docker VPS

```bash
docker-compose up --build -d
```

Put TLS in front of NGINX using your cloud load balancer or Certbot. Static assets are CDN-ready after the Vite build.

## S3-Compatible Storage

Set `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`. The backend storage adapter is provider-neutral and supports AWS S3, Cloudflare R2, MinIO, and DigitalOcean Spaces.

## Monitoring

Ship structured JSON logs from the API and fraud service to CloudWatch, Datadog, Grafana Loki, or OpenTelemetry collectors. Use `/api/v1/health` and `/actuator/health` for uptime checks.

