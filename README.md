# Orbit Calculator

A responsive React + TypeScript calculator backed by a small Go REST API. Arithmetic and validation live in the backend; the browser handles input editing and presentation.

## Requirements

- Go 1.22+
- Node.js 20+ and npm

If you don't want to install Go and Node locally, use the Docker option below. Docker Desktop is the only local prerequisite for that path.

## Run locally

In one terminal:

```sh
cd backend
go run ./cmd/server
```

The API listens on `http://localhost:8080`. In a second terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). Set `VITE_API_URL` if the API is hosted somewhere other than `http://localhost:8080`.

## Run from a fresh clone with Docker

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), then run this from the repository root:

```sh
docker compose up --build
```

Open `http://localhost:8080`. The single root-level `Dockerfile` has separate build stages for the Go API and React frontend, and Compose runs them as two containers. Node and Go do not need to be installed on the host. Stop the app with `Ctrl+C` (or run `docker compose down` in another terminal).

## API

`POST /api/calculate` accepts JSON and returns the calculated numeric result:

```sh
curl -s http://localhost:8080/api/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"add","a":12,"b":5}'
# {"result":17}
```

Supported operations: `add`, `subtract`, `multiply`, `divide`, `power`, `sqrt`, and `percent`. Binary operations take `a` and `b`; square root takes `a`; percent returns `a * b / 100`. Each provided operand must be a JSON number within the inclusive range `-1,000,000,000,000` to `1,000,000,000,000`. The frontend displays this range and checks values before sending a request; the backend validates JSON field types and enforces the same limit. Invalid JSON, wrong field types, missing values, out-of-range operands, unknown operations, division by zero, negative square roots, and non-finite results return a JSON error with an appropriate 4xx status.

For example, an operand outside the supported range returns HTTP `400`:

```sh
curl -i http://localhost:8080/api/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"add","a":1000000000001,"b":1}'
# {"error":"operand must be between -1000000000000 and 1000000000000"}
```

Operands must be JSON numbers. A string operand such as `"a":"12"` returns HTTP `400` with `{"error":"field a must be a valid number"}`.

`GET /health` returns `{"status":"ok"}`.

## Logging

The Go API writes structured JSON logs to standard output. It logs the HTTP method, path, response status, and request duration, plus a startup or shutdown error message. Request bodies and calculator operands are not logged.

## Tests and coverage

Run both suites and generate the browsable coverage pages with Docker (no host Go or Node installation needed):

```sh
set -o pipefail
{
  docker compose --profile test run --build --rm backend-test &&
  docker compose --profile test run --build --rm frontend-test
} 2>&1 | tee coverage/test-results.txt
```

This writes test output to `coverage/test-results.txt` and creates browsable summaries at `coverage/backend/index.html` and `coverage/frontend/index.html`. The frontend report shows statements, branches, functions, and lines from Vitest. The backend uses the same table layout; Go provides statement and function coverage, while branch and line coverage are marked N/A because Go's standard profile does not collect those metrics. Each summary links to its detailed annotated report. Raw coverage data remains available at `coverage/backend/coverage.out` and `coverage/frontend/details/lcov.info`.

If Go and Node.js are already installed locally, run the suites directly:

```sh
(cd backend && go test -coverpkg=./internal/... -cover ./tests)
(cd frontend && npm ci && npm test -- --run)
```

## Design decisions and assumptions

- The API is stateless and keeps all arithmetic rules in a small pure function, making it easy to test without a database or framework.
- The endpoint accepts one operation request at a time; this keeps the contract explicit and avoids duplicating arithmetic semantics in the UI.
- The frontend uses a typed API client and separate display/input state. It does not evaluate user-entered strings as code.
- Operands are limited to ±1 trillion to bound inputs while staying below the exact integer range of `float64`; calculated results are separately checked for finiteness.
- The backend uses the Strategy pattern for arithmetic operations. A registry maps each operation name to a unary or binary strategy, so new operation behavior can be added without growing a central dispatch switch.
- Floating point results use IEEE-754 numbers, appropriate for a general-purpose calculator UI; this is not intended for financial decimal arithmetic.
- Same-origin deployment can reverse proxy `/api` to Go. Local Vite development proxies that path to port 8080.
- Docker Compose builds both services from the root `Dockerfile`. It runs the frontend behind Nginx, which serves the static production build and forwards `/api` and `/health` to the Go service on the private Compose network.

## AI assistance and some prompts i used

AI tools assisted with implementation and refinements. These are summaries of the prompts, not exact quotes:

- Set up Docker to build and run the application.
- Add request logging and use the Strategy pattern for calculator operations.
- Enforce an operand range in both the frontend and backend.
- Test cases with these expected checks:
  - Calculator logic: For add, subtract, multiply, divide, power, square root, and percent, assert that the returned result equals the expected value.
  - Invalid calculations: Assert that missing operands, unsupported operations, non-finite values, and operands outside the inclusive ±1 trillion range return the expected error. Assert that the boundary values themselves are accepted.
  - HTTP API: Assert that valid requests return HTTP 200 with a JSON result; malformed JSON, wrong field types, missing fields, extra fields, and out-of-range operands return HTTP 400 with a JSON error; division by zero and negative square roots return HTTP 422 with a JSON error.
  - Frontend: Assert that missing or out-of-range input displays a validation message without sending a calculation request; valid input sends the expected operation and operands and displays the returned result; API errors are displayed to the user.
 - Put each test in the appropriate backend or frontend test file. Don’t change application behavior unless a test exposes a bug.
- Organize the tests and create browsable coverage reports in almost similar format.
