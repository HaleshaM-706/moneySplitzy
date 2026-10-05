## Architecture Overview

System components (monorepo): mobile app (React Native), API (NestJS), Postgres, Redis, FCM.

```mermaid
flowchart LR
  Mobile[Mobile App (React Native)] -->|REST / Websocket| API[API (NestJS)]
  API --> Postgres[(Postgres + Prisma)]
  API --> Redis[(Redis)]
  API --> FCM[(Firebase Cloud Messaging)]
```

Design: modular monolith for API, feature-based folders, shared packages for types and split logic.
