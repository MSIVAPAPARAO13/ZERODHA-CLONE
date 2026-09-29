# Project Walkthrough

Welcome to the TradeFlow SaaS (Zerodha Clone) codebase. This document serves as a guide to understanding the repository, running the application locally, and navigating the MVP-1 architectural improvements.

## 1. Project Overview
This repository contains a full-stack MERN application representing a simulated trading and portfolio intelligence platform.
The project is divided into two main directories:
- **`backend/`**: A Node.js + Express REST API backed by MongoDB.
- **`dashboard/`**: A React (CRA) frontend application simulating the user's trading dashboard.

## 2. Prerequisites
To run this application locally, you need:
- **Node.js** (v18+ recommended)
- **MongoDB** running locally on port `27017` (or you can update the `.env` file to point to a MongoDB Atlas cluster).

## 3. How to Run the Application

### Starting the Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Ensure dependencies are installed:
   ```bash
   npm install
   ```
3. Ensure you have a `.env` file. (Copy `.env.example` to `.env` if you haven't already):
   ```bash
   cp .env.example .env
   ```
4. Start the server:
   ```bash
   npm start
   ```
   *The backend will run on `http://localhost:3002`.*

### Starting the Frontend
1. Open a new terminal tab and navigate to the frontend directory:
   ```bash
   cd dashboard
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   *The frontend will run on `http://localhost:3000` (or `3001` if port 3000 is occupied).*

---

## 4. MVP-1 Architecture Highlights

During MVP-1, the application was transformed from a monolithic prototype into a structured, production-ready foundation.

### Backend Structure
- **`config/db.js`**: Handles the connection to MongoDB safely.
- **`models/`**: Defines the Mongoose schemas (`HoldingsModel`, `PositionsModel`, `OrdersModel`). Schemas and Models were consolidated here to ensure a single source of truth.
- **`routes/`**: Contains the API endpoint definitions (e.g., `/api/v1/orders/new`).
- **`controllers/`**: Contains the logic executed when a route is hit (e.g., `createOrder`).
- **`validators/orderValidator.js`**: Uses `Joi` to validate incoming requests before they reach the controller. This prevents malicious or malformed data from entering the database.
- **`middleware/errorHandler.js`**: A centralized error catcher that ensures all API failures return a standardized JSON structure.

### Frontend Structure
- **`services/api.js`**: A centralized Axios client configured with the backend's `baseURL`. This intercepts responses and errors globally, decoupling component logic from raw HTTP requests.
- **Improved Components**: Components like `Holdings.js` and `BuyActionWindow.js` now utilize loading states, disabled submission buttons, and render Empty States when no data is present.
- **Toast Notifications**: Powered by `react-hot-toast`, the application provides modern, non-intrusive feedback (e.g., "Order placed successfully!").

## 5. Testing the Implementation
Once both servers are running, you can test the MVP-1 foundation:

1. **Test the Loading States**: Throttling your network in the browser dev tools and visiting the "Holdings" or "Positions" tabs will reveal smooth "Loading..." text rather than a blank screen.
2. **Test Empty States**: If your local database is empty, the Holdings and Positions tables will display friendly "No holdings yet" messages.
3. **Test Validation**: Try submitting an order via a tool like Postman to `POST /api/v1/orders/new` with a negative quantity. You will receive a structured 400 Bad Request error from the Joi validator.
4. **Test the Order UI**: Open the dashboard, interact with the watchlist, and trigger a "Buy" order. Notice the form disables during submission and a Toast notification appears upon success.

## 6. Where to go next?
Check `docs/ROADMAP.md` for the sequence of future MVPs. The next immediate step (MVP-2) will introduce real user Authentication and Authorization using JWTs to isolate portfolio data per user.
