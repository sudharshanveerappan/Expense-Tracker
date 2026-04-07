# 💰 ExpenseAI — Full-Stack Expense Tracker

A full-stack AI-powered expense tracker with JWT authentication, CRUD operations, analytics charts, and budget tracking.

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React, Tailwind CSS, Recharts       |
| Backend   | Node.js, Express                    |
| Database  | MongoDB (Mongoose)                  |
| Auth      | JWT (JSON Web Tokens)               |

---

## Project Structure

```
susan/
├── backend/
│   ├── config/         # DB connection
│   ├── controllers/    # authController, expenseController, budgetController
│   ├── middleware/     # JWT auth middleware
│   ├── models/         # User, Expense, Budget schemas
│   ├── routes/         # auth, expenses, budgets
│   ├── .env            # Environment variables
│   └── server.js       # Entry point
│
└── frontend/
    ├── src/
    │   ├── api/        # Axios client + API calls
    │   ├── components/ # Navbar, ExpenseForm
    │   ├── context/    # AuthContext (global user state)
    │   └── pages/      # Dashboard, ExpensesPage, BudgetsPage, AuthPage
    └── .env            # REACT_APP_API_URL
```

---

## Prerequisites

- Node.js >= 16
- MongoDB running locally (or a MongoDB Atlas URI)

---

## Setup & Run

### 1. Backend

```bash
cd backend
npm install
```

Edit `backend/.env` if needed:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/expense-tracker
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

Start the server:
```bash
npm run dev      # development (nodemon)
npm start        # production
```

Backend runs at: `http://localhost:5000`

---

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

---

## API Endpoints

### Auth
| Method | Endpoint          | Description       |
|--------|-------------------|-------------------|
| POST   | /api/auth/signup  | Register user     |
| POST   | /api/auth/login   | Login user        |
| GET    | /api/auth/me      | Get current user  |

### Expenses (Protected)
| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | /api/expenses                   | List (filter + paginate) |
| POST   | /api/expenses                   | Create expense           |
| PUT    | /api/expenses/:id               | Update expense           |
| DELETE | /api/expenses/:id               | Delete expense           |
| GET    | /api/expenses/analytics         | Category + monthly data  |

### Budgets (Protected)
| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| GET    | /api/budgets      | Get budgets with spent   |
| POST   | /api/budgets      | Create or update budget  |
| DELETE | /api/budgets/:id  | Delete budget            |

---

## Features

- **Authentication** — Signup/Login with JWT, protected routes
- **Expense CRUD** — Amount, category, date, description, payment method
- **Filters** — Filter by category, date range, pagination
- **Dashboard Charts** — Pie chart (category breakdown) + Bar chart (monthly trend)
- **Budget Tracking** — Set per-category monthly budgets with visual progress bars
- **Responsive UI** — Clean Tailwind CSS design

---

## Environment Variables

### Backend (`backend/.env`)
| Variable    | Description                        |
|-------------|------------------------------------|
| PORT        | Server port (default: 5000)        |
| MONGO_URI   | MongoDB connection string          |
| JWT_SECRET  | Secret key for signing JWTs        |
| JWT_EXPIRE  | Token expiry (e.g. 7d)             |

### Frontend (`frontend/.env`)
| Variable            | Description              |
|---------------------|--------------------------|
| REACT_APP_API_URL   | Backend API base URL     |
