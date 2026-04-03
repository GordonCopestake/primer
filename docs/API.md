# API.md

## Approach

Use REST + OpenAPI for the MVP. Keep the contract typed and generated where practical.

## Namespaces

- `/auth/*`
- `/households/*`
- `/children/*`
- `/learner-states/*`
- `/curriculum/*`
- `/sessions/*`
- `/stories/*`
- `/homework/*`
- `/safety/*`
- `/reports/*`

## Core endpoints

- `POST /households`
- `POST /children`
- `GET /children/:id/home`
- `POST /children/:id/baseline-assessment/start`
- `POST /sessions`
- `POST /sessions/:id/turns`
- `POST /sessions/:id/complete`
- `POST /homework/parse`
- `GET /reports/children/:id/progress`
- `GET /safety/events`
- `POST /safety/events/:id/review`
