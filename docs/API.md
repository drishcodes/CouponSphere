# API Overview

Base path: `/api/v1`

OpenAPI JSON is served at `/api/v1/docs`.

## Core Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /coupons`
- `POST /coupons`
- `POST /coupons/:id/claim`
- `POST /coupons/:id/redeem`
- `GET /campaigns`
- `POST /campaigns`
- `GET /analytics/overview`
- `GET /fraud/logs`
- `POST /fraud/blacklist`
- `GET /wallet`
- `GET /notifications`
- `GET /admin/audit-logs`

All protected endpoints require `Authorization: Bearer <accessToken>`.

