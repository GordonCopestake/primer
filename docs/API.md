# API.md

## Approach

Use REST + OpenAPI for the MVP. Keep the contract typed and generated where practical.

## Namespaces

- `/auth/*`
- `/households/*`
- `/children/*`
- `/consent/*`
- `/learner-states/*`
- `/curriculum/*`
- `/sessions/*`
- `/stories/*`
- `/homework/*`
- `/safety/*`
- `/privacy/*`
- `/reports/*`

## Core endpoints

- `POST /households`
- `POST /children`
- `GET /children/:id/home`
- `POST /children/:id/baseline-assessment/start`
- `POST /consent/parental`
- `POST /sessions`
- `POST /sessions/:id/turns`
- `POST /sessions/:id/complete`
- `POST /homework/parse`
- `GET /reports/children/:id/progress`
- `GET /safety/events`
- `POST /safety/events/:id/review`
- `GET /privacy/children/:id/export`
- `POST /privacy/children/:id/delete`
- `POST /stories`
