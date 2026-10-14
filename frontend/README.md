# InnoBridge frontend

React + Vite frontend for the InnoBridge student innovation platform.

## Run locally

1. Start the backend from `../backend` (it listens on port `5000`).
2. Copy `.env.example` to `.env` if your backend uses a different origin.
3. Install dependencies and start Vite:

   ```sh
   npm install
   npm run dev
   ```

The frontend connects to `GET /api/ideas`, `POST /api/ideas`, `POST /api/students`, and `POST /api/login`.
