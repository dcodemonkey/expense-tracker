# Ledger Admin

A Streamlit admin/ops console for the expense-tracker platform. It authenticates
against the existing FastAPI JWT backend and is **admin-only** — logging in with a
non-admin account is refused.

## Features

- Login gate (email + password) that verifies `role == "admin"` via `/auth/me`.
- **Overview** — platform stats as metric cards plus an income-vs-expense bar chart.
- **Users** — all users in a table, with a per-user transactions drill-down.
- **Parsed messages** — filterable table (processed state, user id) with a reparse action.
- **Transactions** — browse any user's transactions.

## Configuration

| Env var        | Default                              | Description                    |
| -------------- | ------------------------------------ | ------------------------------ |
| `API_BASE_URL` | `http://localhost:8000/api/v1`       | Base URL of the backend API.   |

The account you log in with must have the `admin` role. Admins are promoted on
backend startup from the `ADMIN_EMAILS` env var on the **backend** service.

## Run locally

```bash
cd admin
pip install -r requirements.txt
# Point at your running backend if it isn't on localhost:8000
export API_BASE_URL=http://localhost:8000/api/v1
streamlit run app.py
```

Open http://localhost:8501.

## Run via docker-compose

From the repository root:

```bash
docker compose up admin
```

This builds `./admin`, exposes it on http://localhost:8501, and talks to the
`backend` service internally at `http://backend:8000/api/v1`. Ensure the email you
log in with is listed in the backend service's `ADMIN_EMAILS` so it is promoted to
admin on startup.
