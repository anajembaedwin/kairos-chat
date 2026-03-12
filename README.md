# Kairos Chat

> A real-time 1-to-1 chat application

![CI](https://github.com/anajembaedwin/kairos-chat/actions/workflows/test.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-24-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)

---

## Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Set Up PostgreSQL](#3-set-up-postgresql)
  - [4. Configure Environment Variables](#4-configure-environment-variables)
  - [5. Run the Application](#5-run-the-application)
  - [6. Test the Chat](#6-test-the-chat)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [REST Endpoints](#rest-endpoints)
  - [Socket.io Events](#socketio-events)
- [Database Schema](#database-schema)
- [Running Tests](#running-tests)
- [Linting](#linting)
- [Building for Production](#building-for-production)
- [CI/CD Pipeline](#cicd-pipeline)
- [Known Limitations](#known-limitations)
- [Author](#author)

---

## Overview

Kairos Chat is a full-stack real-time messaging application where two users can send and receive messages instantly in a clean, responsive interface. It demonstrates mastery of WebSocket-based communication, RESTful API design, persistent data storage, and modern frontend development patterns.

The application supports:
- Persistent message history loaded on page mount
- Real-time bidirectional messaging via Socket.io
- Server-side validation and error handling
- Responsive mobile-first UI built with Tailwind CSS and shadcn/ui
- Full test coverage on critical paths (frontend + backend)
- Automated CI/CD pipeline via GitHub Actions

---

## Screenshots

### Login

![Login screen](assets/screenshots/login.png)

### Chat (User A)

![Chat screen (User A)](assets/screenshots/user-a-chat.png)

### Chat (User B)

![Chat screen (User B)](assets/screenshots/user-b-chat.png)

---

## Features

- Real-time 1-to-1 messaging with Socket.io
- Message persistence with PostgreSQL
- Load full message history on connect
- Auto-scroll to latest message
- Message bubbles with sender name and timestamp
- Connection status indicator (connected / connecting)
- Error banner for connection failures
- Loading state while fetching history
- Empty state when no messages exist
- Enter key to send messages
- Responsive layout (mobile-first)
- Server-side validation with 400 error responses
- Frontend and backend test suites with Jest
- GitHub Actions CI/CD pipeline

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | latest | UI component library |
| Socket.io-client | 4.x | Real-time WebSocket client |
| Vite | 5.x | Build tool and dev server |
| Lucide React | latest | Icon library |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 24 | JavaScript runtime |
| Express | 4.x | HTTP server framework |
| Socket.io | 4.x | Real-time WebSocket server |
| PostgreSQL | 15 | Relational database |
| pg | 8.x | PostgreSQL client for Node.js |
| dotenv | 16.x | Environment variable management |
| cors | 2.x | Cross-origin resource sharing |

### Testing

| Technology | Purpose |
|---|---|
| Jest | Test runner |
| React Testing Library | Frontend component testing |
| Supertest | HTTP endpoint testing |
| ts-jest | TypeScript support for Jest |

### DevOps

| Technology | Purpose |
|---|---|
| GitHub Actions | CI/CD pipeline |
| ESLint | Code linting |
| ts-node-dev | TypeScript hot-reload for development |

---

## Project Structure

```
kairos-chat/
├── .github/
│   └── workflows/
│       └── test.yml                  # GitHub Actions CI/CD pipeline
│
├── assets/
│   └── screenshots/                  # README screenshots
│       ├── login.png
│       ├── user-a-chat.png
│       └── user-b-chat.png
│
├── .vscode/
│   └── settings.json                 # Workspace editor settings
│
├── coverage/                         # Jest coverage output (generated)
│
├── src/                              # React frontend
│   ├── __tests__/                    # Frontend test suites
│   │   ├── App.test.tsx
│   │   ├── ChatScreen.test.tsx
│   │   ├── LoginScreen.test.tsx
│   │   ├── main.test.tsx
│   │   ├── MessageBubble.test.tsx
│   │   ├── socket.test.ts
│   │   ├── useChat.test.tsx
│   │   └── UserContext.test.tsx
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── scroll-area.tsx
│   │   ├── ChatScreen.tsx            # Main chat interface
│   │   ├── LoginScreen.tsx           # User selection screen
│   │   └── MessageBubble.tsx         # Individual message bubble
│   │
│   ├── context/
│   │   └── UserContext.tsx           # Global user state context
│   │
│   ├── hooks/
│   │   └── useChat.ts                # Socket.io + message state hook
│   │
│   ├── lib/
│   │   ├── socket.ts                 # Socket.io singleton instance
│   │   └── utils.ts                  # Tailwind class merge utility
│   │
│   ├── types/
│   │   └── index.ts                  # Shared TypeScript types
│   │
│   ├── App.tsx                       # Root app component
│   ├── index.css                     # Global styles + Tailwind directives
│   ├── main.tsx                      # React entry point
│   ├── setupTests.ts                 # Jest setup file
│   └── vite-env.d.ts                 # Vite environment type declarations
│
├── server/                           # Express backend
│   ├── coverage/                     # Jest coverage output (generated)
│   │
│   ├── src/
│   │   ├── __tests__/
│   │   │   ├── db.test.ts
│   │   │   ├── index.socket.test.ts
│   │   │   ├── messages.test.ts
│   │   │   └── start.test.ts
│   │   │
│   │   ├── db/
│   │   │   └── index.ts              # PostgreSQL pool + schema migration
│   │   │
│   │   ├── middleware/
│   │   │   └── validate.ts           # Request validation middleware
│   │   │
│   │   ├── routes/
│   │   │   └── messages.ts           # /api/messages route handlers
│   │   │
│   │   ├── index.ts                  # Express + Socket.io server entry point
│   │   └── types.ts                  # Backend types
│   │
│   ├── .env
│   ├── .eslintrc.json
│   ├── jest.config.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.json
│   └── tsconfig.test.json
│
├── .env                              # Frontend environment variables (git-ignored)
├── .env.example                      # Example environment variables
├── .eslintrc.json                    # ESLint config for frontend
├── .gitignore
├── index.html                        # Vite HTML entry point
├── jest.config.ts                    # Jest config for frontend
├── package-lock.json
├── package.json                      # Root package.json
├── postcss.config.js                 # PostCSS config
├── tailwind.config.js                # Tailwind CSS config
├── tsconfig.json                     # TypeScript config for frontend
├── tsconfig.jest.json                # TypeScript config for Jest
├── tsconfig.node.json                # TypeScript config for Vite
├── vite.config.ts                    # Vite config with proxy settings
└── README.md
```

---

## Prerequisites

Before you begin, make sure you have the following installed on your machine:

- **Node.js** v18 or higher — [Download here](https://nodejs.org/)
- **npm** v8 or higher (comes with Node.js)
- **PostgreSQL** v14 or higher — [Download here](https://www.postgresql.org/download/)
- **Git** — [Download here](https://git-scm.com/)

To verify your installations:

```bash
node --version
npm --version
psql --version
git --version
```

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/kairos-chat.git
cd kairos-chat
```

---

### 2. Install Dependencies

Install frontend and backend dependencies separately:

```bash
# Install frontend dependencies (from root)
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

---

### 3. Set Up PostgreSQL

Make sure your PostgreSQL server is running, then create the database.

**Option A — using psql CLI:**
```bash
psql -U postgres
```
```sql
CREATE DATABASE kairos_chat;
\q
```

**Option B — single command:**
```bash
psql -U postgres -c "CREATE DATABASE kairos_chat;"
```

**Option C — using pgAdmin:**
1. Open pgAdmin
2. Right-click **Databases** → **Create** → **Database**
3. Enter `kairos_chat` as the name and click **Save**

> The database tables are created automatically when the server starts via the `initDB()` function in `server/src/db/index.ts`. You do not need to run any migration scripts manually.

---

### 4. Configure Environment Variables

**Frontend** — create a `.env` file in the root directory:

```bash
# kairos-chat/.env
VITE_SERVER_URL=http://localhost:3001
```

**Backend** — create a `.env` file inside the `server/` directory:

```bash
# kairos-chat/server/.env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/kairos_chat
PORT=3001
CLIENT_URL=http://localhost:5173
```

> Replace `yourpassword` with your actual PostgreSQL password. If you have not set a password, try: `postgresql://postgres@localhost:5432/kairos_chat`

Refer to `.env.example` in the root for all required variables.

---

### 5. Run the Application

From the root directory, start both frontend and backend simultaneously:

```bash
npm run dev
```

Or run them in separate terminals:

```bash
# Terminal 1 — Frontend dev server
npm run dev:client
# Runs at http://localhost:5173

# Terminal 2 — Backend server
npm run dev:server
# Runs at http://localhost:3001
```

You should see the following in the backend terminal:

```
Database initialized
Server running on port 3001
```

The frontend will be available at `http://localhost:5173`.

To verify the backend is running, visit `http://localhost:3001/health` — you should see:

```json
{ "status": "ok" }
```

---

### 6. Test the Chat

1. Open `http://localhost:5173` in **two separate browser tabs** (or two different browsers)
2. In **Tab 1**, select **User A** and click **Enter Chat**
3. In **Tab 2**, select **User B** and click **Enter Chat**
4. Type a message in either tab and press **Enter** or click the **Send** button
5. The message will appear in **both tabs instantly** in real time
6. Reload either tab — the full message history will be restored from the database

---

## Environment Variables

### Root `.env` — Frontend

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_SERVER_URL` | Yes | Backend server URL for Socket.io connection | `http://localhost:3001` |

### `server/.env` — Backend

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/kairos_chat` |
| `PORT` | No | `3001` | Port the Express server listens on | `3001` |
| `CLIENT_URL` | Yes | — | Frontend URL used for CORS and Socket.io origins | `http://localhost:5173` |

---

## API Reference

### REST Endpoints

#### `GET /api/messages`

Returns all messages ordered by creation time ascending (oldest first).

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "sender": "User A",
    "text": "Hello!",
    "created_at": "2024-01-01T10:00:00.000Z"
  },
  {
    "id": 2,
    "sender": "User B",
    "text": "Hi there!",
    "created_at": "2024-01-01T10:00:05.000Z"
  }
]
```

**Response `500 Internal Server Error`:**
```json
{ "error": "Internal server error" }
```

---

#### `POST /api/messages`

Creates a new message and returns the created record with its generated ID.

**Request body:**
```json
{
  "sender": "User A",
  "text": "Hello!"
}
```

**Response `201 Created`:**
```json
{
  "id": 3,
  "sender": "User A",
  "text": "Hello!",
  "created_at": "2024-01-01T10:00:10.000Z"
}
```

**Response `400 Bad Request`** — missing or empty sender:
```json
{ "error": "sender is required and must be a non-empty string" }
```

**Response `400 Bad Request`** — missing or empty text:
```json
{ "error": "text is required and must be a non-empty string" }
```

**Response `500 Internal Server Error`:**
```json
{ "error": "Internal server error" }
```

---

#### `GET /health`

Health check endpoint to verify the server is running.

**Response `200 OK`:**
```json
{ "status": "ok" }
```

---

### Socket.io Events

#### Client → Server

| Event | Payload | Description |
|---|---|---|
| `sendMessage` | `{ sender: string, text: string }` | Sends a new message to the server to be saved and broadcast |

**Example:**
```js
socket.emit('sendMessage', { sender: 'User A', text: 'Hello!' })
```

---

#### Server → Client

| Event | Payload | Description |
|---|---|---|
| `message` | `{ id, sender, text, created_at }` | Broadcast to all connected clients when a new message is saved |
| `error` | `{ error: string }` | Emitted to the sender when validation or a database error occurs |

**Example:**
```js
socket.on('message', (message) => {
  console.log(message)
  // { id: 1, sender: 'User A', text: 'Hello!', created_at: '2024-01-01T10:00:00.000Z' }
})
```

---

## Database Schema

The schema is automatically applied on server startup.

```sql
CREATE TABLE IF NOT EXISTS messages (
  id         SERIAL PRIMARY KEY,
  sender     VARCHAR(100) NOT NULL,
  text       TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

| Column | Type | Description |
|---|---|---|
| `id` | SERIAL | Auto-incrementing primary key |
| `sender` | VARCHAR(100) | Username of the message sender |
| `text` | TEXT | Message content |
| `created_at` | TIMESTAMP | Time the message was created (defaults to now) |

---

## Running Tests

Run the full test suite (frontend + backend):

```bash
npm test
```

Run frontend tests only:

```bash
npm run test:client
```

Run backend tests only:

```bash
npm run test:server
```

### Frontend Test Coverage

| Test File | Tests |
|---|---|
| `MessageBubble.test.tsx` | Renders message text, sender name, timestamp, own bubble styles, other bubble styles |
| `LoginScreen.test.tsx` | Renders title, renders both users, button disabled by default, enables on selection, calls onLogin with correct user |
| `ChatScreen.test.tsx` | Renders user in header, renders Leave button, calls onLogout, loads message history, renders input, emits sendMessage on Enter, shows empty state |
| `App.test.tsx` | Shows login first then chat after login, logout triggers page reload |
| `UserContext.test.tsx` | useUser throws outside provider, provider stores and updates user |
| `useChat.test.tsx` | Connect/disconnect updates state, connect_error sets error, message event appends and clears error, sendMessage emits trimmed payload, fetch failure sets error |
| `main.test.tsx` | Boots React into #root |
| `socket.test.ts` | Initializes socket client from VITE_SERVER_URL with autoConnect disabled |

### Backend Test Coverage

| Test File | Tests |
|---|---|
| `messages.test.ts` | GET returns all messages, GET returns empty array, GET returns 500 on DB error, POST creates message, POST returns 400 on missing sender, POST returns 400 on missing text, POST returns 400 on empty sender, POST returns 400 on empty text, POST returns 500 on DB error, GET /health returns ok |
| `index.socket.test.ts` | Socket sendMessage validates payload and emits error, saves valid message and broadcasts, emits error on DB failure |
| `start.test.ts` | start initializes DB and listens, autoStart runs when main module matches |
| `db.test.ts` | Creates pg pool from DATABASE_URL, initDB runs schema creation query |

---

## Linting

```bash
# Lint frontend
npx eslint src --ext .ts,.tsx

# Lint backend
cd server && npx eslint src --ext .ts

# Lint both via root script
npm run lint
```

---

## Building for Production

Build the frontend for production:

```bash
npm run build
```

The compiled output will be in the `dist/` folder. To preview the production build locally:

```bash
npm run preview
```

Build and start the backend:

```bash
cd server && npm run build && npm start
```

---

## CI/CD Pipeline

This project uses **GitHub Actions** for continuous integration. The pipeline runs automatically on every push and pull request to the `main` branch.

### Pipeline Steps

| Step | Description |
|---|---|
| Checkout code | Clone the repository at the current commit |
| Setup Node.js 24 | Install the correct Node.js version with npm cache |
| Install root dependencies | `npm install` |
| Install server dependencies | `cd server && npm install` |
| Lint frontend | `npx eslint src --ext .ts,.tsx --max-warnings=0` |
| Lint server | `cd server && npx eslint src --ext .ts --max-warnings=0` |
| Run frontend tests | `npm run test:client` |
| Run server tests | `npm run test:server` |
| Build frontend | `npm run build` |

View the live pipeline status in the **Actions** tab of this repository.

---

## Known Limitations

- Only two hardcoded users are supported (User A and User B). A production implementation would include user registration, authentication, and JWT-based sessions.
- Messages are not paginated. For large message histories, pagination or infinite scroll would be recommended.
- No message deletion or editing functionality.
- Socket.io rooms are not used — all messages are broadcast globally. A multi-room implementation would use rooms to isolate conversations between different user pairs.
- No read receipts or typing indicators.

---

## Author

**Edwin Anajemba**
- GitHub: [@anajembaedwin](https://github.com/anajembaedwin)
- Email: anajembaedwin@gmail.com

---

*Built as part of the Kairos Nexus Full Stack Engineer technical assessment.*
