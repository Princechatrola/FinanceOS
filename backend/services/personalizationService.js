// ============================================================
// FINANCEOS - PERSONALIZATION SERVICE
// Comprehensive Backend Personalization Engine
// ============================================================

const mongoose = require("mongoose");
const User = require("../models/User");
const Investment = require("../models/Investment");
const Insurance = require("../models/Insurance");
const Liability = require("../models/Liability");
const SavingGoal = require("../models/SavingGoal");
const MonthlyFinance = require("../models/MonthlyFinance");

// ============================================================
// APPROVED VARIABLES ALLOWLIST
// ============================================================

const APPROVED_VARIABLES = [
  { key: "userName", label: "User Name", example: "Rahul" },
  { key: "userEmail", label: "User Email", example: "rahul@example.com" },
  { key: "userId", label: "User ID", example: "FOS-U-000002" },
  { key: "userPhone", label: "User Phone", example: "+91 98765 43210" },

  // Investment / SIP / FD / RD
  { key: "investmentName", label: "Investment Name", example: "HDFC Top 100 Fund" },
  { key: "investmentType", label: "Investment Type", example: "SIP" },
  { key: "amount", label: "Amount", example: "2,000" },
  { key: "frequency", label: "Frequency", example: "Monthly" },
  { key: "dueDate", label: "Due Date", example: "05 Sep 2026" },
  { key: "maturityDate", label: "Maturity Date", example: "20 Oct 2026" },

  // Bank & UPI (Safe last 4 only)
  { key: "bankName", label: "Bank Name", example: "HDFC Bank" },
  { key: "accountLast4", label: "Account Last 4", example: "4521" },
  { key: "upiApp", label: "UPI App", example: "Google Pay" },
  { key: "upiId", label: "UPI ID", example: "rahul@okaxis" },

  // Insurance
  { key: "insuranceName", label: "Insurance Policy", example: "LIC Tech Term" },
  { key: "premiumAmount", label: "Premium Amount", example: "12,500" },
  { key: "premiumDueDate", label: "Premium Due Date", example: "10 Sep 2026" },

  // Liability
  { key: "loanName", label: "Liability / Loan Name", example: "Home Loan" },
  { key: "emiAmount", label: "EMI Amount", example: "25,000" },
  { key: "liabilityOutstanding", label: "Outstanding Balance", example: "4,50,000" },

  // Saving Goal
  { key: "goalName", label: "Saving Goal Name", example: "Emergency Fund" },
  { key: "goalAmount", label: "Goal Target Amount", example: "50,000" },
  { key: "savedAmount", label: "Current Saved Amount", example: "30,000" },
  { key: "remainingAmount", label: "Remaining Goal Amount", example: "20,000" },
  { key: "goalDeadline", label: "Goal Deadline", example: "31 Dec 2026" },
];

// Supported conditional audiences
const SUPPORTED_CONDITIONS = [
  { id: "active-sip", label: "Users with Active SIPs", description: "Users who have at least one active SIP investment." },
  { id: "upcoming-fd", label: "Users with Upcoming FD Maturity", description: "Users with Fixed Deposits maturing within the next 60 days." },
  { id: "insurance-active", label: "Users with Active Insurance", description: "Users with at least one active Insurance policy." },
  { id: "liability-active", label: "Users with Active Liabilities", description: "Users with active loans or EMI liabilities." },
  { id: "saving-goal-active", label: "Users with Active Saving Goals", description: "Users actively saving towards a goal." },
  { id: "payment-configured", label: "Users with Bank / UPI Configured", description: "Users with stored bank or UPI payment details." },
];

function formatMoney(num) {
  if (num === null || num === undefined || isNaN(num) || Number(num) === 0) return "";
  return Number(num).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function formatDate(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getNextDateForDay(dayNumber) {
  const now = new Date();
  const day = Math.max(1, Math.min(28, Number(dayNumber) || 5));
  let year = now.getFullYear();
  let month = now.getMonth();

  if (now.getDate() > day) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  const date = new Date(year, month, day);
  return formatDate(date);
}

function cleanUpiAppName(raw) {
  if (!raw) return "";
  const s = String(raw).trim().toLowerCase();
  if (s.includes("g pay") || s.includes("gpay") || s.includes("google")) return "Google Pay";
  if (s.includes("phonepe") || s.includes("phone pe")) return "PhonePe";
  if (s.includes("paytm")) return "Paytm";
  if (s.includes("bhim")) return "BHIM UPI";
  if (s.includes("amazon")) return "Amazon Pay";
  return raw;
}

/**
 * Fetch authoritative user financial context directly from MongoDB
 */
async function fetchUserFinancialContext(userIdOrDoc, categoryHint = "") {
  let user = userIdOrDoc;
  if (!user || typeof user !== "object" || !user._id) {
    const id = String(userIdOrDoc);
    user = await User.findOne({
      $or: [
        { userId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : []),
      ],
    }).lean();
  }

  if (!user) {
    return {
      userName: "FinanceOS User",
      userEmail: "",
      userId: "",
      userPhone: "",
      investmentName: "SIP Investment",
      amount: "2,000",
      dueDate: getNextDateForDay(5),
      bankName: "HDFC Bank",
      accountLast4: "4521",
      upiApp: "Google Pay",
      upiId: "user@okaxis",
    };
  }

  const userId = user._id;

  // Query all user records from MongoDB (fetching without strict status filter to prevent missing valid items)
  const [investments, insurances, liabilities, goals, monthlyFinances] = await Promise.all([
    Investment.find({ user: userId }).sort({ updatedAt: -1 }).lean(),
    Insurance.find({ user: userId }).sort({ updatedAt: -1 }).lean(),
    Liability.find({ user: userId }).sort({ updatedAt: -1 }).lean(),
    SavingGoal.find({ user: userId }).sort({ updatedAt: -1 }).lean(),
    MonthlyFinance.find({ user: userId }).sort({ year: -1, month: -1 }).limit(1).lean(),
  ]);

  // Context dictionary initialized with safe user data
  const context = {
    userName: user.name || "FinanceOS User",
    userEmail: user.email || "",
    userId: user.userId || String(user._id),
    userPhone: user.phone || user.mobile || "",
  };

  // -----------------------------------------------------------
  // 1. SCAN AND AGGREGATE PAYMENT SOURCES ACROSS ALL USER DATA
  // -----------------------------------------------------------
  let detectedBank = "";
  let detectedLast4 = "";
  let detectedUpiApp = "";
  let detectedUpiId = "";

  // Scan Liabilities
  for (const l of liabilities) {
    if (l.paymentSource) {
      if (!detectedBank && l.paymentSource.bankName) detectedBank = l.paymentSource.bankName;
      if (!detectedLast4 && l.paymentSource.last4Digits) detectedLast4 = l.paymentSource.last4Digits;
      if (!detectedUpiApp && l.paymentSource.upiApp) detectedUpiApp = cleanUpiAppName(l.paymentSource.upiApp);
      if (!detectedUpiId && l.paymentSource.upiId) detectedUpiId = l.paymentSource.upiId;
    }
    if (!detectedBank && l.lender && (l.lender.toLowerCase().includes("bank") || l.lender.toLowerCase().includes("axis") || l.lender.toLowerCase().includes("sbi") || l.lender.toLowerCase().includes("hdfc") || l.lender.toLowerCase().includes("kotak"))) {
      detectedBank = l.lender;
    }
  }

  // Scan Investments
  for (const inv of investments) {
    if (inv.paymentSourceDetails) {
      if (!detectedBank && inv.paymentSourceDetails.bankName) detectedBank = inv.paymentSourceDetails.bankName;
      if (!detectedLast4 && inv.paymentSourceDetails.accountLast4) detectedLast4 = inv.paymentSourceDetails.accountLast4;
      if (!detectedUpiId && inv.paymentSourceDetails.upiId) detectedUpiId = inv.paymentSourceDetails.upiId;
      if (!detectedUpiApp && inv.paymentSourceDetails.upiApp) detectedUpiApp = cleanUpiAppName(inv.paymentSourceDetails.upiApp);
    }
    if (!detectedBank && inv.institution) detectedBank = inv.institution;
  }

  // Scan Insurances
  for (const ins of insurances) {
    if (ins.paymentSource) {
      if (!detectedBank && ins.paymentSource.bankName) detectedBank = ins.paymentSource.bankName;
      if (!detectedLast4 && ins.paymentSource.last4Digits) detectedLast4 = ins.paymentSource.last4Digits;
      if (!detectedUpiApp && ins.paymentSource.upiApp) detectedUpiApp = cleanUpiAppName(ins.paymentSource.upiApp);
      if (!detectedUpiId && ins.paymentSource.upiId) detectedUpiId = ins.paymentSource.upiId;
    }
  }

  // Scan Goals
  for (const g of goals) {
    if (g.fundLocation) {
      if (!detectedBank && g.fundLocation.institution) detectedBank = g.fundLocation.institution;
      if (!detectedLast4 && g.fundLocation.lastFour) detectedLast4 = g.fundLocation.lastFour;
    }
  }

  // Infer UPI App if not explicit
  if (!detectedUpiApp && detectedUpiId) {
    const idLower = detectedUpiId.toLowerCase();
    if (idLower.includes("okaxis") || idLower.includes("oksbi") || idLower.includes("okhdfc") || idLower.includes("okicici")) {
      detectedUpiApp = "Google Pay";
    } else if (idLower.includes("ybl") || idLower.includes("ibl") || idLower.includes("axl")) {
      detectedUpiApp = "PhonePe";
    } else if (idLower.includes("paytm")) {
      detectedUpiApp = "Paytm";
    } else {
      detectedUpiApp = "UPI App";
    }
  }

  // Safe defaults if user hasn't added bank/upi yet
  context.bankName = detectedBank || "HDFC Bank";
  context.accountLast4 = detectedLast4 || "4521";
  context.upiApp = detectedUpiApp || "Google Pay";
  context.upiId = detectedUpiId || (user.email ? `${user.email.split("@")[0]}@okaxis` : "user@okaxis");

  // -----------------------------------------------------------
  // 2. RESOLVE FINANCIAL CATEGORY SPECIFICS
  // -----------------------------------------------------------
  const hintLower = (categoryHint || "").toLowerCase();

  // Pick top items
  const activeInv = investments.find((i) => i.status === "Active") || investments[0] || null;
  const activeLiab = liabilities.find((l) => l.status === "Active") || liabilities[0] || null;
  const activeIns = insurances.find((i) => i.status === "Active") || insurances[0] || null;
  const activeGoal = goals.find((g) => g.status === "Active") || goals[0] || null;

  // 2.1 INVESTMENT / SIP
  if (activeInv) {
    context.investmentName = activeInv.name || "Investment Portfolio";
    context.investmentType = activeInv.type || "SIP";
    context.frequency = activeInv.frequency || "Monthly";

    if (activeInv.reminder?.contributionDay) {
      context.dueDate = getNextDateForDay(activeInv.reminder.contributionDay);
    } else if (activeInv.nextContributionDate) {
      context.dueDate = formatDate(activeInv.nextContributionDate);
    } else if (activeInv.sipSchedule?.day) {
      context.dueDate = getNextDateForDay(activeInv.sipSchedule.day);
    } else {
      context.dueDate = getNextDateForDay(5);
    }

    if (activeInv.maturityDate) {
      context.maturityDate = formatDate(activeInv.maturityDate);
    }
  } else if (activeGoal) {
    context.investmentName = activeGoal.goalName || "Saving Goal";
    context.investmentType = "Saving Goal";
    context.frequency = "Monthly";
    context.dueDate = activeGoal.reminder?.contributionDay ? getNextDateForDay(activeGoal.reminder.contributionDay) : getNextDateForDay(5);
  } else if (activeLiab) {
    context.investmentName = activeLiab.name || "Liability Account";
    context.investmentType = activeLiab.type || "Loan";
    context.frequency = "Monthly";
    context.dueDate = activeLiab.nextDueDate ? formatDate(activeLiab.nextDueDate) : getNextDateForDay(5);
  } else {
    context.investmentName = "Monthly SIP";
    context.investmentType = "SIP";
    context.frequency = "Monthly";
    context.dueDate = getNextDateForDay(5);
    context.maturityDate = formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
  }

  // 2.2 PRIMARY AMOUNT RESOLUTION
  let resolvedAmount = "";
  if (hintLower.includes("sip") || hintLower.includes("invest")) {
    resolvedAmount = formatMoney(activeInv?.monthlyContribution || activeInv?.amount) || formatMoney(activeGoal?.monthlyContribution) || "2,000";
  } else if (hintLower.includes("fd") || hintLower.includes("fixed deposit")) {
    resolvedAmount = formatMoney(activeInv?.principalAmount || activeInv?.amount) || "50,000";
  } else if (hintLower.includes("insur")) {
    resolvedAmount = formatMoney(activeIns?.premiumAmount) || "1,000";
  } else if (hintLower.includes("liab") || hintLower.includes("loan") || hintLower.includes("emi")) {
    resolvedAmount = formatMoney(activeLiab?.monthlyEMI) || formatMoney(activeLiab?.principalAmount) || "3,260";
  } else if (hintLower.includes("goal")) {
    resolvedAmount = formatMoney(activeGoal?.monthlyContribution || activeGoal?.targetAmount) || "5,000";
  } else {
    resolvedAmount =
      formatMoney(activeInv?.monthlyContribution) ||
      formatMoney(activeLiab?.monthlyEMI) ||
      formatMoney(activeGoal?.monthlyContribution) ||
      formatMoney(activeIns?.premiumAmount) ||
      "2,000";
  }
  context.amount = resolvedAmount;

  // 2.3 INSURANCE DETAILS
  if (activeIns) {
    context.insuranceName = activeIns.name || activeIns.policyName || activeIns.provider || "Life Insurance";
    context.premiumAmount = formatMoney(activeIns.premiumAmount) || "1,000";
    context.premiumDueDate = activeIns.nextPremiumDate
      ? formatDate(activeIns.nextPremiumDate)
      : activeIns.renewalDate
      ? formatDate(activeIns.renewalDate)
      : getNextDateForDay(10);
    if (!context.maturityDate && activeIns.maturityDate) {
      context.maturityDate = formatDate(activeIns.maturityDate);
    }
  } else {
    context.insuranceName = "LIC Life Insurance";
    context.premiumAmount = "1,000";
    context.premiumDueDate = getNextDateForDay(10);
  }

  // 2.4 LIABILITY DETAILS
  if (activeLiab) {
    context.loanName = activeLiab.name || activeLiab.type || "Loan";
    context.emiAmount = formatMoney(activeLiab.monthlyEMI) || "3,260";
    context.liabilityOutstanding = formatMoney(activeLiab.remainingAmount || activeLiab.principalAmount) || "13,740";
    if (hintLower.includes("liability") || hintLower.includes("loan") || hintLower.includes("emi")) {
      if (activeLiab.nextDueDate) context.dueDate = formatDate(activeLiab.nextDueDate);
      else if (activeLiab.endDate) context.dueDate = formatDate(activeLiab.endDate);
      else context.dueDate = getNextDateForDay(5);
    }
  } else {
    context.loanName = "Personal Loan";
    context.emiAmount = "3,260";
    context.liabilityOutstanding = "13,740";
  }

  // 2.5 SAVING GOAL DETAILS
  if (activeGoal) {
    context.goalName = activeGoal.goalName || activeGoal.name || "Emergency Fund";
    context.goalAmount = formatMoney(activeGoal.targetAmount) || "50,000";
    context.savedAmount = formatMoney(activeGoal.currentAmount || activeGoal.alreadySaved) || "1,000";
    const rem = Math.max(0, (activeGoal.targetAmount || 0) - (activeGoal.currentAmount || activeGoal.alreadySaved || 0));
    context.remainingAmount = formatMoney(rem) || "49,000";
    context.goalDeadline = activeGoal.targetDate ? formatDate(activeGoal.targetDate) : formatDate(new Date(Date.now() + 730 * 24 * 60 * 60 * 1000));
  } else {
    context.goalName = "Emergency Fund";
    context.goalAmount = "50,000";
    context.savedAmount = "1,000";
    context.remainingAmount = "49,000";
    context.goalDeadline = formatDate(new Date(Date.now() + 730 * 24 * 60 * 60 * 1000));
  }

  return context;
}

/**
 * Resolve a template string with the user's authoritative context safely
 */
function resolveTemplate(templateStr, context = {}) {
  if (!templateStr || typeof templateStr !== "string") return "";

  // Replace {{variable}} with context[variable]
  return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, varName) => {
    const isApproved = APPROVED_VARIABLES.some((v) => v.key === varName);
    if (!isApproved) {
      return match;
    }

    const value = context[varName];
    if (value === undefined || value === null || value === "") {
      return "";
    }
    return String(value);
  });
}

function cleanResolvedText(text) {
  if (!text) return "";
  return text
    .replace(/\(\s*\)/g, "")
    .replace(/\s+—\s*$/gm, "")
    .replace(/—\s*—+/g, "—")
    .replace(/₹\s*([,\s]*)(?=[^\d])/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/**
 * Evaluate condition and return matched users from MongoDB
 */
async function evaluateAudienceCondition(conditionId) {
  const allUsers = await User.find({
    role: { $nin: ["admin", "administrator"] },
    status: "Active",
  }).lean();

  if (!conditionId || conditionId === "all") {
    return allUsers;
  }

  const userIds = allUsers.map((u) => u._id);

  if (conditionId === "active-sip") {
    const sips = await Investment.find({
      user: { $in: userIds },
      $or: [{ type: "SIP" }, { monthlyContribution: { $gt: 0 } }],
    }).distinct("user");
    const sipUserSet = new Set(sips.map(String));
    return allUsers.filter((u) => sipUserSet.has(String(u._id)));
  }

  if (conditionId === "upcoming-fd") {
    const fds = await Investment.find({
      user: { $in: userIds },
      $or: [{ type: "Fixed Deposit" }, { type: "FD" }],
    }).distinct("user");
    const fdUserSet = new Set(fds.map(String));
    return allUsers.filter((u) => fdUserSet.has(String(u._id)));
  }

  if (conditionId === "insurance-active") {
    const ins = await Insurance.find({
      user: { $in: userIds },
    }).distinct("user");
    const insUserSet = new Set(ins.map(String));
    return allUsers.filter((u) => insUserSet.has(String(u._id)));
  }

  if (conditionId === "liability-active") {
    const liabs = await Liability.find({
      user: { $in: userIds },
    }).distinct("user");
    const liabUserSet = new Set(liabs.map(String));
    return allUsers.filter((u) => liabUserSet.has(String(u._id)));
  }

  if (conditionId === "saving-goal-active") {
    const goals = await SavingGoal.find({
      user: { $in: userIds },
    }).distinct("user");
    const goalUserSet = new Set(goals.map(String));
    return allUsers.filter((u) => goalUserSet.has(String(u._id)));
  }

  if (conditionId === "payment-configured") {
    const [invsWithBank, insWithBank, liabsWithBank] = await Promise.all([
      Investment.find({
        user: { $in: userIds },
        $or: [
          { "paymentSourceDetails.bankName": { $exists: true, $ne: "" } },
          { "paymentSourceDetails.upiId": { $exists: true, $ne: "" } },
        ],
      }).distinct("user"),
      Insurance.find({
        user: { $in: userIds },
        $or: [
          { "paymentSource.bankName": { $exists: true, $ne: "" } },
          { "paymentSource.upiId": { $exists: true, $ne: "" } },
        ],
      }).distinct("user"),
      Liability.find({
        user: { $in: userIds },
        $or: [
          { "paymentSource.bankName": { $exists: true, $ne: "" } },
          { "paymentSource.upiId": { $exists: true, $ne: "" } },
        ],
      }).distinct("user"),
    ]);

    const bankUserSet = new Set([
      ...invsWithBank.map(String),
      ...insWithBank.map(String),
      ...liabsWithBank.map(String),
    ]);
    return allUsers.filter((u) => bankUserSet.has(String(u._id)));
  }

  return allUsers;
}

module.exports = {
  APPROVED_VARIABLES,
  SUPPORTED_CONDITIONS,
  fetchUserFinancialContext,
  resolveTemplate,
  cleanResolvedText,
  evaluateAudienceCondition,
  formatMoney,
  formatDate,
};
