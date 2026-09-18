# FinanceOS Project Cleanup Plan & Inventory

Pre-cleanup snapshot and dependency analysis for `D:\FinanceOS-main\FinanceOS_Code`.

---

## 1. Environment Files Inventory (.env)

| Environment File Path | Scope | Status | Action | Notes |
|---|---|---|---|---|
| `D:\FinanceOS-main\FinanceOS_Code\backend\.env` | Authoritative Backend | CONFIGURED (PORT, MONGO_URI, JWT_SECRET, EMAIL_USER, EMAIL_PASSWORD, NODE_ENV, SHOW_OTP_IN_TERMINAL, DEV_AUTH_BYPASS) | **KEEP** | Actively loaded by `server.js` and all backend controllers/services. Zero secrets exposed. |
| `D:\FinanceOS-main\FinanceOS_Code\.env.example` | Root Template | Reference template | **KEEP** | Helpful template for environment variables. |
| `D:\FinanceOS-main\FinanceOS_Code\backend\.env.example` | Backend Template | Reference template | **KEEP** | Standard backend environment reference. |
| `D:\FinanceOS\FinanceOS_Code\backend\.env` | Old/Duplicate Project | Stale copy | **OUT OF SCOPE / PRESERVE** | Located in obsolete duplicate project (`D:\FinanceOS`), NOT touched per safety rules. |

*Finding: In `D:\FinanceOS-main\FinanceOS_Code`, there is only ONE active `.env` file (`backend\.env`). The frontend does not use or need a `.env` file because all `/api` requests are routed dynamically through the Vite reverse proxy.*

---

## 2. Safe to Delete (Verified Unused)

| File / Directory Path | Category | Reason / Reference Check | Safe to Delete? |
|---|---|---|---|
| `test_ai_adviser_complete.cjs` | Root Debug Script | One-time test script for AI adviser. Not referenced by package.json, build, or runtime. | **SAFE** |
| `test_dashboard_month_selector.cjs` | Root Debug Script | One-time test script for month selector. Unreferenced. | **SAFE** |
| `test_fetch_report_api.cjs` | Root Debug Script | One-time test script for reports API. Unreferenced. | **SAFE** |
| `test_global_month_and_rich_details.cjs` | Root Debug Script | One-time test script for rich details. Unreferenced. | **SAFE** |
| `test_live_commitment_status.cjs` | Root Debug Script | One-time test script for live status. Unreferenced. | **SAFE** |
| `test_preserve_month_navigation.cjs` | Root Debug Script | One-time test script for month nav. Unreferenced. | **SAFE** |
| `test_reports_health_sidebar_complete.cjs` | Root Debug Script | One-time test script for sidebar. Unreferenced. | **SAFE** |
| `test_strict_month_visibility_actions.cjs` | Root Debug Script | One-time test script for visibility actions. Unreferenced. | **SAFE** |
| `src/data/dashboardData.js` | Obsolete Mock Data | Self-documented temporary initial mock data used before MongoDB was connected. Zero imports in `src/`. | **SAFE** |
| `backend/screenshots/` (and subfiles) | Test Output Artifacts | Automated screenshot outputs from old subagent runs. Not part of source or build. | **SAFE** |
| `backend/tests/test_imap_mailbox.cjs` | Ad-hoc IMAP Test | One-time raw TLS IMAP debugging script. Unreferenced. | **SAFE** |

---

## 3. Keep (Essential to Application & Regressions)

| File / Directory Path | Category | Reason to Keep |
|---|---|---|
| `backend/server.js` | Core Backend Entrypoint | Main Express application entrypoint. |
| `backend/controllers/*` (all 13 controllers) | Core Controllers | All controllers are mounted in `routes/*` and handle active API routes. |
| `backend/models/*` (all 13 models) | Core Mongoose Models | Core data schemas for User, Activity, Investment, Liability, Reminder, etc. |
| `backend/routes/*` (all 13 routes) | Core API Routes | All mounted in `server.js`. |
| `backend/services/*` (all 5 services) | Core Backend Services | EmailService, SchedulerService, AIAdviserService, PersonalizationService, MarketDataService. |
| `backend/middleware/*` (all 2 middleware) | Core Middleware | authMiddleware and adminMiddleware. |
| `backend/utils/activityLogger.js` | Core Utility | Used by controllers for activity audit logging. |
| `backend/utils/cashFlowBreakdown.js` | Core Utility | Financial math engine for income/expenses/available cash. |
| `backend/utils/cleanupLegacySms.js` | Core Utility | Startup database sanitizer. |
| `backend/utils/dueDateSchedule.js` | Core Utility | Schedule generator for recurring due dates. |
| `backend/utils/migrateDueDates.js` | Core Utility | Startup migration logic. |
| `backend/utils/monthLifecycle.js` | Core Utility | Month progression and carry-forward calculation. |
| `backend/utils/reminderSync.js` | Core Utility | Syncs investments/liabilities with reminders. |
| `backend/utils/emailService.js` | Backward-compat wrapper | Legacy re-export of `services/emailService.js`. |
| `backend/utils/schedulerService.js` | Backward-compat wrapper | Legacy re-export of `services/schedulerService.js`. |
| `backend/utils/sendEmail.js` | Backward-compat wrapper | Legacy re-export of `sendOTPEmail`. |
| `backend/utils/testCashFlowBreakdown.js` | Unit Regression Test | High-value, fast unit test suite (8/8 passing) verifying cash flow arithmetic. |
| `backend/utils/testDueDateSystem.js` | Unit Regression Test | High-value, fast unit test suite (10/10 passing) verifying recurring due date math. |
| `backend/createAdmin.js` | Admin CLI Tool | Explicitly documented in `README.md` for initializing admin account. |
| `backend/data/` | MongoDB Database Store | WiredTiger local database data directory. NEVER delete. |
| `backend/tests/*` (core regression suite) | Regression Suites | High-value regression suites (OTP lifecycle, calculations, admin isolation, scheduler). |
| `src/pages/*` (all 27 pages) | Core Frontend Pages | All routed in `src/App.jsx`. |
| `src/components/*` (all components) | Core Frontend Components | UI components used across the platform. |
| `src/context/*` (all context files) | State Management | FinanceProvider & hooks. |
| `src/utils/*` (all utilities) | Core Client Utilities | Calculations, reports, formatting, health scoring. |
| `src/App.jsx`, `src/main.jsx`, `src/index.css` | Frontend Root | React application root and styles. |
| `public/`, `src/assets/` | Static Assets | Logos, icons, and visual branding. |
| `FinanceOS_*_Data_Dictionary.pdf` | Documentation | Core architectural data dictionaries. |
| `README.md`, `eslint.config.js`, `vite.config.js` | Project Configuration | Project documentation, linter, and Vite config. |

---

## 4. Uncertain / Manual Review

| Item | Category | Evaluation | Decision |
|---|---|---|---|
| Frontend `package.json` unused deps (`bcrypt`, `cors`, `dotenv`, `jsonwebtoken`, `nodemailer`, `puppeteer-core`) | Dependencies | These are backend libraries mistakenly listed in frontend `package.json` during early project initialization. Since removing them requires rewriting package-lock.json and risks subtle native module rebuild issues on Windows, we will evaluate whether removing them is completely safe or if leaving them causes zero harm. | Safe to remove if build succeeds without them. |

---

## 5. Verification Protocol
1. Remove confirmed unused files.
2. Run `npm.cmd run build` for frontend.
3. Validate backend startup on port 5000.
4. Execute core regression tests:
   - Backend health endpoint (`/api/health`)
   - Send OTP & Verify OTP
   - Cash flow arithmetic unit tests
   - Due date calculation unit tests
   - User & Admin authentication
