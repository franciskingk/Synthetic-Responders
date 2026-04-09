# Synthetic Research Lab Frontend

Next.js 14 TypeScript frontend for the Synthetic Research Lab platform.

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000)

## Project Structure

- `app/`: Next.js App Router pages
- `components/`: Reusable React components
- `lib/`: Utilities (API client, auth, validation, types)
- `styles/`: Global CSS

## Available Pages

- `/`: Landing page → redirect to login
- `/login`: Email/password + Google OAuth login
- `/register`: Sign up
- `/dashboard`: Dashboard (authenticated)
- `/personas`: List/create/edit personas
- `/surveys`: List/create/edit surveys
- `/simulations`: Run and view simulation results
