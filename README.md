# TechTime Nexus

A full-stack web application for creating, managing, and sending time capsules via email. Users can register, create capsules, schedule reminders, and view analytics. The project is organized into `backend` and `frontend` folders.

## Features

- User authentication (login/register)
- Create and manage time capsules
- Schedule email reminders
- Analytics dashboard
- GitHub integration for capsules
- Modern React frontend

## Project Structure

```
backend/
  app.js, server.js, db.js, models/, controllers/, routes/, services/, utils/
frontend/
  src/, public/, build/
```

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- npm or yarn

### Backend Setup

1. Navigate to the backend folder:
   ```powershell
   cd backend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the backend server:
   ```powershell
   node server.js
   ```

### Frontend Setup

1. Navigate to the frontend folder:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the frontend development server:
   ```powershell
   npm start
   ```

## Configuration

- Backend config files are in `backend/config/`
- Update email, database, and GitHub settings as needed

## Scripts

- `npm start` (frontend): Runs React app
- `node server.js` (backend): Starts Express server

## Technologies Used

- Backend: Node.js, Express, SQLite, Passport.js
- Frontend: React, CSS
- Email: Nodemailer
- Scheduling: node-cron

## License

MIT

## Author

[akanksha9688](https://github.com/akanksha9688)
