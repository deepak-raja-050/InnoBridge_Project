# InnoBridge frontend

React + Vite frontend for the InnoBridge student innovation platform.

## Run locally

1. Start MongoDB on `127.0.0.1:27017`.
2. In `../backend`, install dependencies and set `JWT_SECRET` in `.env`, then run `node server.js` (port `5000`).
3. Copy `.env.example` to `.env` if your backend uses a different origin.
4. Install dependencies and start Vite:

   ```sh
   npm install
   npm run dev
   ```

The frontend connects to these backend routes:

- Student sign-up and login: `POST /api/students`, `POST /api/login`
- Idea discovery and publishing: `GET /api/ideas`, `POST /api/ideas`
- Mentors and guidance requests: `GET /api/mentors`, `POST /api/collaboration-requests`
- Teams and progress: `GET /api/student/teams`, `POST /api/teams`, `POST /api/team-members`, `GET /api/progress`, `POST /api/progress`
- Notifications: `GET /api/notifications`, `PUT /api/notifications/:notification_id/read`, `PUT /api/notifications/read-all`
