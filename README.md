# FinanceOS — Personal Finance Organization System

**FinanceOS** is a comprehensive personal wealth and financial management platform designed to help individuals plan, organize, track, and optimize their personal finances with precision and data privacy.

---

## Key Features

### 1. User Platform
- **Authentication & Security**: Email OTP-based secure authentication, JWT session persistence, strict user-level data isolation, and unauthorized route protection.
- **Financial Dashboard**: Real-time snapshot of Income, Expenses, Available to Allocate liquidity, Net Worth, Financial Health Score, and recurring commitments.
- **Monthly Finance**: Complete cash flow tracking, opening balance carry-forward, categorized expenses, and month-to-month calculation breakdowns.
- **Saving Goals**: Target amounts, contribution schedules, automated progress bars, withdrawal records, and funding source tracking.
- **Investment Portfolio**: Tracking for Mutual Funds, SIPs, Fixed Deposits (FD), Recurring Deposits (RD), Gold, Stocks, and other assets with maturity tracking and interest payouts.
- **Insurance Management**: Policy tracking for Term/Life (LIC), Health, Vehicle, and Home insurance with premium frequencies, renewal reminders, and maturity handling.
- **Liabilities & Debt**: EMI amortization tracking for Home Loans, Personal Loans, Vehicle Loans, Education Loans, and Credit Cards with payoff tracking.
- **Plans & Commitments**: Recurring payment schedules, due dates, commitment lifecycle management, and dynamic AI-powered financial suggestions.
- **Financial Calendar**: Interactive monthly financial event calendar consolidating due dates, maturity events, and reminders for the authenticated user.
- **Reminders & Notifications**: Automated notification engine supporting **Email** and **In-App** alerts. *(SMS notifications are completely disabled)*.
- **Reports & Analytics**: Monthly, Quarterly, Half-yearly, and Yearly analytical reports with balance progression, asset vs. liability charts, and PDF export.
- **AI Financial Adviser**: Powered by Google Gemini and deterministic financial health engine analyzing real user data to provide personalized, objective recommendations.

### 2. Admin Platform
- **Admin Dashboard**: System-wide statistics, active/inactive user counts, financial metrics, and activity monitoring.
- **User Management**: Search, filter, inspect, activate, deactivate, and manage access permissions for registered accounts.
- **User Deep-Dive**: Strict user-scoped inspection of financial portfolios, audit logs, and reports without cross-user data leakage.
- **Admin Messages**: Personalized and broadcast in-app and email announcements with variable templating.
- **Admin Reminders**: System-wide reminder monitoring and dispatch status review.

---

## Technology Stack

- **Frontend**: React 19, Vite, React Router 7, Tailwind CSS, Lucide Icons, React Icons, jsPDF
- **Backend**: Node.js, Express 5, Mongoose 9 (MongoDB), JSON Web Tokens (JWT), Nodemailer
- **AI Engine**: Google GenAI SDK (`@google/genai`) with deterministic financial fallback analysis

---

## Project Structure

```text
FinanceOS/
├── backend/
│   ├── controllers/      # Route logic for auth, finance, admin, etc.
│   ├── middleware/       # JWT auth & admin authorization guards
│   ├── models/           # Mongoose schemas (User, Investment, Liability, etc.)
│   ├── routes/           # Express API route definitions
│   ├── services/         # AI Adviser & personalization services
│   ├── tests/            # Automated verification test suites
│   ├── utils/            # Email, scheduler, and reminder sync utilities
│   ├── .env.example      # Backend environment variable template
│   ├── createAdmin.js    # CLI utility to create initial admin
│   ├── package.json      # Backend dependencies
│   └── server.js         # Main Express backend entrypoint
│
├── public/               # Static web assets
├── src/
│   ├── assets/           # UI media & image assets
│   ├── components/       # Reusable UI components & modals
│   ├── context/          # FinanceContext & centralized state
│   ├── pages/            # User & Admin application pages
│   ├── utils/            # Formatting & date scheduling utilities
│   ├── App.jsx           # Root router & protected route configuration
│   └── main.jsx          # React DOM entrypoint
│
├── .env.example          # Root environment reference
├── .gitignore            # Git exclusion rules
├── package.json          # Frontend dependencies
├── vite.config.js        # Vite & API proxy configuration
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Princechatrola/FinanceOS.git
cd FinanceOS
```

---

### Step 2: Backend Setup
1. Navigate to the `backend` directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create your `.env` configuration from the template:
   ```bash
   cp .env.example .env
   ```

3. Configure your environment variables in `backend/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/financeos
   JWT_SECRET=your_secure_jwt_random_secret_here
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_gmail_app_password
   ADMIN_EMAIL=admin@financeos.com
   GEMINI_API_KEY=your_gemini_api_key
   NODE_ENV=development
   ```
   > **Note**: `EMAIL_USER`, `EMAIL_PASSWORD`, and `GEMINI_API_KEY` are optional for local development. If email credentials are omitted, In-App notifications remain fully functional. If Gemini API key is omitted, the built-in deterministic math engine generates financial advice.

4. (Optional) Initialize the Default Administrator Account:
   ```bash
   node createAdmin.js
   ```

5. Start the backend server:
   ```bash
   npm run dev
   # Server starts on http://localhost:5000
   ```

---

### Step 3: Frontend Setup
1. Open a new terminal in the project root (`FinanceOS_Code`):
   ```bash
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   # App runs on http://localhost:5173
   ```

3. Build for production:
   ```bash
   npm run build
   ```

---

## Notification Policy

FinanceOS supports **ONLY** two delivery channels:
1. **Email Notifications**: Sent to the user's verified email address.
2. **In-App Notifications**: Displayed dynamically within the notification bell and calendar.

**SMS notifications are not supported.** Any API payload attempting to supply SMS parameters is rejected with HTTP 400.

---

## Security & Data Isolation

- **Zero Secrets in Git**: Local database directories (`backend/data/`), test screenshots, and `.env` files are strictly excluded from version control via `.gitignore`.
- **JWT Authorization**: Every protected API route enforces valid JSON Web Tokens.
- **Strict User Scoping**: All financial records, commitments, reminders, and reports are filtered strictly by `req.user.id`. Users cannot view or modify another user's financial assets.
- **Admin Verification**: Administrative endpoints (`/api/admin/*`) require both authentication and an authorized `admin` role.
