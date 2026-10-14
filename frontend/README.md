# InnoBridge frontend

React + Vite client for the student innovation platform. It provides separate student and mentor workspaces.

## Run locally

1. Start MongoDB on `127.0.0.1:27017`.
2. In `../backend`, install dependencies and set `JWT_SECRET` in `.env`, then run `node server.js` (port `5000`).
3. Copy `.env.example` to `.env` if your backend uses a different origin.
4. Install dependencies and start the frontend:

   ```sh
   npm install
   npm run dev
   ```

## Frontend workflows

- Students: register, discover and publish ideas, manage idea visibility, create teams, add teammates, post progress, discover mentors, send guidance requests, review feedback, get recommendations, and manage notifications.
- Mentors: register or log in, review and respond to guidance requests, browse student teams, leave rated feedback, and manage notifications.

## Backend routes used

Student and mentor authentication, ideas, privacy, mentors, guidance requests, teams, team members, progress, feedback, notifications, and recommendations. The student-owned ideas endpoint is `GET /api/student/ideas` and returns the signed-in student's public and private ideas.
