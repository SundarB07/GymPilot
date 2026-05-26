# GymPilot Monorepo 🏋️‍♂️✈️

Welcome to **GymPilot**, the ultimate cyber-themed assistant designed to help you generate, log, and optimize your workout routines and diet logs. 

This repository is organized as an **npm workspaces monorepo** containing two distinct modules: the frontend application and the backend/database administration layer.

---

## Directory Architecture

```
GymPilot/
├── package.json               # Root monorepo orchestration
├── README.md                  # System documentation
├── frontend/                  # React + Vite client application
│   ├── src/                   # Client components, contexts, and pages
│   ├── public/                # Public assets
│   ├── index.html             # Application entry template
│   ├── vite.config.js         # Vite bundler configuration (with Tailwind CSS v4)
│   ├── tailwind.config.js     # Legacy config (reference only)
│   ├── eslint.config.js       # Code quality configurations
│   ├── package.json           # Frontend dependencies
│   └── .env.local             # Client-side environment keys (Supabase)
└── backend/                   # Node.js + Express API & Database utilities
    ├── src/                   # Express backend server
    │   ├── server.js          # API endpoints and server listener
    │   └── config/            # Database credentials config
    ├── scripts/               # Administrative scripts
    │   └── seed.js            # Automated CSV exercises database seeder
    ├── data/                  # Static assets & seed documents
    │   ├── Comprehensive_Gym_Exercises_With_Difficulty.csv
    │   └── Comprehensive_Gym_Exercises.xlsx
    ├── supabase_schema.sql    # Database tables and RLS policies
    ├── package.json           # Backend dependencies
    └── .env                   # Server-side environment variables (secret keys)
```

---

## Installation & Setup

Ensure you have **Node.js** installed on your system.

### 1. Install All Dependencies
From the root directory, run the unified installer to fetch packages for the root, frontend, and backend simultaneously:
```bash
npm run install:all
```

### 2. Database Schema Setup
Apply the schema located at `backend/supabase_schema.sql` directly inside your **Supabase SQL Editor** to establish all required tables (profiles, exercises, workoutplans, workout_logs, dietlogs) and Row Level Security (RLS) policies.

### 3. Database Seeding (Loading Exercises)
To populate the `exercises` table with the comprehensive list of 72+ movements from the CSV file:
1. Open the [backend/.env](file:///c:/Users/hai2s/Desktop/Personal%20Projects/GymPilot/backend/.env) file.
2. Retrieve your **Service Role Key** (`service_role` secret) from your Supabase Dashboard under *Project Settings -> API*.
3. Add it to `backend/.env` under `SUPABASE_SERVICE_ROLE_KEY`. *(Note: This key is required because it has admin privileges to bypass Row Level Security and write to the database)*.
4. Run the seeder script from the root directory:
   ```bash
   npm run seed
   ```

---

## Execution Commands

You can run both platforms concurrently or operate them individually using the following commands:

| Command | Action |
|:---|:---|
| `npm run dev` | **Runs both Frontend and Backend concurrently** with synced console logs |
| `npm run dev:frontend` | Runs the Vite React dev server only (Port 5173) |
| `npm run dev:backend` | Runs the Express API backend dev server only (Port 5000) |
| `npm run seed` | Runs the database exercises seeder script |
| `npm run install:all` | Installs dependencies across the entire monorepo |

---
*Created with ❤️ for premium gym orchestration.*
