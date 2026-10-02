# Orbit Calculator

A responsive React + TypeScript calculator backed by a small Go REST API. Arithmetic and validation live in the backend; the browser handles input editing and presentation.

## Requirements

- Go 1.22+
- Node.js 20+ and npm

## Run locally

In one terminal:

```sh
cd backend
go run ./cmd/server
```

The API listens on `http://localhost:8080`. In a second terminal:

```sh
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). Set `VITE_API_URL` if the API is hosted somewhere other than `http://localhost:8080`.

## API

`POST /api/calculate` accepts JSON and returns the calculated numeric result:

```sh
curl -s http://localhost:8080/api/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"add","a":12,"b":5}'
# {"result":17}
```

Supported operations: `add`, `subtract`, `multiply`, `divide`, `power`, `sqrt`, and `percent`. Binary operations take `a` and `b`; square root takes `a`; percent returns `a * b / 100`. Invalid JSON, missing values, unknown operations, division by zero, negative square roots, and non-finite results return a JSON error with an appropriate 4xx status.

`GET /health` returns `{"status":"ok"}`.

## Tests and coverage

```sh
cd backend && go test ./... -cover
cd frontend && npm install && npm test -- --run
```

The backend tests cover operations, validation, and HTTP behavior. Frontend tests cover calculator interaction and API failure handling. Coverage can be reported for the backend with `go test ./... -coverprofile=coverage.out && go tool cover -func=coverage.out`; Vitest prints frontend coverage when run with `npm run test:coverage`.

## Design notes

- The API is stateless and keeps all arithmetic rules in a small pure function, making it easy to test without a database or framework.
- The endpoint accepts one operation request at a time; this keeps the contract explicit and avoids duplicating arithmetic semantics in the UI.
- The frontend uses a typed API client and separate display/input state. It does not evaluate user-entered strings as code.
- Floating point results use IEEE-754 numbers, appropriate for a general-purpose calculator UI; this is not intended for financial decimal arithmetic.
- Same-origin deployment can reverse proxy `/api` to Go. Local Vite development proxies that path to port 8080.

## AI prompt

“Build a full-stack calculator with a React TypeScript responsive frontend and Go REST backend. Include add, subtract, multiply, divide, power, square root, and percentage; validate bad input and division by zero; write unit tests for both layers; document setup, API examples, and design assumptions. Keep arithmetic on the backend and use a clean, maintainable interface.”
