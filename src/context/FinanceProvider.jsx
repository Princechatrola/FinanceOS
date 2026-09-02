import { useMemo, useState, useEffect, useCallback } from "react";
import FinanceContext from "./FinanceContext.js";
import { isItemActiveInMonth, parseSelectedMonth, isDateInMonth } from "../utils/monthLifecycle.js";
import { deriveCashFlowBreakdown, isDateInPeriod } from "../utils/cashFlowBreakdown.js";

// ============================================================
// DEFAULT MONTHLY FINANCE
// ============================================================

const createDefaultMonthlyFinance = () => ({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  income: 0,
  expenses: 0,
  updateDate: new Date().toISOString().split('T')[0],
  reminder: {
    enabled: true,
    options: [],
    channels: {
      email: true,
      sms: false,
    },
  },
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function nonNegative(value) {
  return Math.max(safeNumber(value), 0);
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

function getMonthYearFromDate(dateValue) {
  if (!dateValue) {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }

  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

function addMonthsToDate(dateValue, months) {
  let date = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
  if (Number.isNaN(date.getTime())) date = new Date();

  const originalDay = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + Number(months || 0));

  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDay));

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getLiabilityBalance(liability) {
  if (!liability) return 0;
  const status = normalizeStatus(liability.status);
  if (["closed", "completed", "paid", "settled"].includes(status)) return 0;

  const currentBalance = firstDefined(
    liability.outstandingAmount,
    liability.remainingAmount,
    liability.balance
  );

  if (currentBalance !== undefined) return nonNegative(currentBalance);

  return nonNegative(
    firstDefined(liability.originalAmount, liability.loanAmount, liability.amount)
  );
}

function getLiabilityMonthlyPayment(liability) {
  return nonNegative(
    firstDefined(liability?.monthlyPayment, liability?.emi, liability?.monthlyEMI)
  );
}

function calculateLoanCompletion(liability = {}, balanceOverride) {
  const balance =
    balanceOverride !== undefined
      ? nonNegative(balanceOverride)
      : getLiabilityBalance(liability);

  const monthlyPayment = getLiabilityMonthlyPayment(liability);

  if (balance <= 0) {
    return {
      remainingPayments: 0,
      estimatedCompletionDate:
        liability.closedDate ||
        liability.closedAt?.slice?.(0, 10) ||
        new Date().toISOString().slice(0, 10),
    };
  }

  if (monthlyPayment <= 0) {
    return { remainingPayments: null, estimatedCompletionDate: null };
  }

  const remainingPayments = Math.ceil(balance / monthlyPayment);
  const baseDate = firstDefined(
    liability.nextPaymentDate,
    liability.nextDueDate,
    liability.dueDate,
    liability.startDate,
    new Date().toISOString().slice(0, 10)
  );

  const estimatedCompletionDate = addMonthsToDate(
    baseDate,
    Math.max(remainingPayments - 1, 0)
  );

  return { remainingPayments, estimatedCompletionDate };
}

function getGoalAvailableFund(goal) {
  if (!goal) return 0;
  if (goal.availableGoalFund !== undefined) return nonNegative(goal.availableGoalFund);

  const contributed = nonNegative(
    firstDefined(goal.totalContributed, goal.savedAmount, goal.alreadySaved)
  );
  const withdrawn = nonNegative(goal.totalWithdrawn);
  return Math.max(contributed - withdrawn, 0);
}

function getInvestmentCurrentValue(investment) {
  if (!investment) return 0;
  const status = normalizeStatus(investment.status);
  if (status === "closed" || status === "redeemed") return 0;

  if (status === "matured") {
    return nonNegative(
      firstDefined(
        investment.maturityValue,
        investment.currentValue,
        investment.maturityAmount,
        investment.principalAmount,
        investment.amount,
        investment.investedAmount
      )
    );
  }

  return nonNegative(
    firstDefined(
      investment.currentValue,
      investment.principalAmount,
      investment.amount,
      investment.investedAmount
    )
  );
}

// ============================================================
// FINANCE PROVIDER COMPONENT
// ============================================================

function FinanceProvider({ children }) {
  const [userData, setUserData] = useState(() => {
    try {
      const localUser = localStorage.getItem("financeos_user");
      if (localUser) return JSON.parse(localUser);

      const sessionUser = sessionStorage.getItem("financeos_user");
      if (sessionUser) return JSON.parse(sessionUser);

      return null;
    } catch (error) {
      console.error("Unable to load logged-in FinanceOS user:", error);
      return null;
    }
  });

  const [monthlyFinance, setMonthlyFinance] = useState(createDefaultMonthlyFinance);
  const [monthlyHistory, setMonthlyHistory] = useState([]);
  const [additionalIncomeTransactions, setAdditionalIncomeTransactions] = useState([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [savingGoals, setSavingGoals] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [insurancePolicies, setInsurancePolicies] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [netWorthSnapshots, setNetWorthSnapshots] = useState(() => {
    try {
      const saved = localStorage.getItem("financeos_networth_snapshots");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [notifications, setNotifications] = useState([]);
  const [userReminders, setUserReminders] = useState([]);

  // AI Suggestion State
  const [latestAISuggestion, setLatestAISuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Selected Dashboard View Month State (?month=YYYY-MM)
  const [selectedMonth, setSelectedMonthState] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        if (window.location?.search) {
          const params = new URLSearchParams(window.location.search);
          const mParam = params.get("month") || params.get("returnMonth");
          if (mParam && /^\d{4}-\d{1,2}$/.test(mParam)) {
            const [y, m] = mParam.split("-");
            return `${y}-${String(m).padStart(2, "0")}`;
          }
        }
        const saved = sessionStorage.getItem("financeos_selected_month");
        if (saved && /^\d{4}-\d{1,2}$/.test(saved)) {
          const [y, m] = saved.split("-");
          return `${y}-${String(m).padStart(2, "0")}`;
        }
      }
    } catch (e) {}
    return "";
  });

  // Sidebar Collapsed State (User-Side)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        return localStorage.getItem("financeos_sidebar_collapsed") === "true";
      }
    } catch (e) {}
    return false;
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("financeos_sidebar_collapsed", String(next));
      } catch (e) {}
      return next;
    });
  };

  const setSelectedMonth = (monthStr) => {
    try {
      if (monthStr && /^\d{4}-\d{1,2}$/.test(monthStr)) {
        const [y, m] = monthStr.split("-");
        const formatted = `${y}-${String(m).padStart(2, "0")}`;
        setSelectedMonthState(formatted);
        sessionStorage.setItem("financeos_selected_month", formatted);
      } else {
        setSelectedMonthState("");
        sessionStorage.removeItem("financeos_selected_month");
      }
    } catch (e) {}
  };

  // ==========================================================
  // DATA LOADERS
  // ==========================================================

  const getInitialPeriod = () => {
    try {
      if (typeof window !== "undefined") {
        if (window.location?.search) {
          const params = new URLSearchParams(window.location.search);
          const mParam = params.get("month") || params.get("returnMonth");
          if (mParam && /^\d{4}-\d{1,2}$/.test(mParam)) {
            const [y, m] = mParam.split("-");
            return { year: Number(y), month: Number(m) };
          }
        }
        const saved = sessionStorage.getItem("financeos_selected_month");
        if (saved && /^\d{4}-\d{1,2}$/.test(saved)) {
          const [y, m] = saved.split("-");
          return { year: Number(y), month: Number(m) };
        }
      }
    } catch (e) {}
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  };

  const loadMonthFinance = useCallback(async (targetYear, targetMonth) => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");
      if (!token) return;

      const init = getInitialPeriod();
      const year = Number(targetYear) || init.year;
      const month = Number(targetMonth) || init.month;

      if (year && month) {
        const formatted = `${year}-${String(month).padStart(2, "0")}`;
        setSelectedMonthState(formatted);
        try {
          sessionStorage.setItem("financeos_selected_month", formatted);
        } catch (e) {}
      }

      const response = await fetch(
        `http://localhost:5000/api/monthly-finance/${year}/${month}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!data.success) return;

      if (data.finance) {
        const finance = data.finance;
        const opening =
          finance.openingBalance !== undefined
            ? finance.openingBalance
            : (finance.cashBalance || 0);

        setMonthlyFinance({
          year: finance.year,
          month: finance.month,
          income: finance.income,
          expenses: finance.expenses,
          cashBalance: opening,
          openingBalance: opening,
          closingBalance: finance.closingBalance,
          commitments: finance.commitments || 0,
          monthlySavings: finance.monthlySavings,
          updateDate: finance.updateDate,
          reminderEnabled: finance.reminderEnabled,
          emailNotification: finance.emailNotification,
          backendGoalAllocations: finance.goalAllocations || 0,
          calculationBreakdown: data.breakdown || data.calculationBreakdown || null,
          hasRecord: true,
        });
        setCashBalance(opening);
      } else {
        const opening = Number(data.carriedOpeningBalance || 0);
        setMonthlyFinance({
          year,
          month,
          income: 0,
          expenses: 0,
          cashBalance: opening,
          openingBalance: opening,
          closingBalance: opening,
          commitments: 0,
          monthlySavings: 0,
          updateDate: new Date(year, month - 1, 1).toISOString().split('T')[0],
          backendGoalAllocations: 0,
          calculationBreakdown: data.breakdown || data.calculationBreakdown || null,
          hasRecord: false,
        });
        setCashBalance(opening);
      }
    } catch (error) {
      console.error("Load Month Finance:", error);
    }
  }, []);

  const loadCurrentMonthFinance = (y, m) => {
    let year = Number(y);
    let month = Number(m);
    if (!year || !month) {
      const init = getInitialPeriod();
      year = init.year;
      month = init.month;
    }
    return loadMonthFinance(year, month);
  };

  const loadMonthlyHistory = async () => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/monthly-finance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.history)) {
        setMonthlyHistory(
          data.history.map((r) => {
            const opening =
              r.openingBalance !== undefined
                ? r.openingBalance
                : (r.cashBalance || 0);
            const savings =
              r.monthlySavings !== undefined
                ? r.monthlySavings
                : r.income - r.expenses;
            const comm = Number(r.commitments || 0);
            const closing =
              r.closingBalance !== undefined
                ? r.closingBalance
                : opening + savings - comm;

            return {
              month: r.month,
              year: r.year,
              baseIncome: r.income,
              income: r.income,
              expenses: r.expenses,
              savings,
              openingBalance: opening,
              cashBalance: opening,
              closingBalance: closing,
              commitments: comm,
              totalCommitments: comm,
              availableToAllocate: opening + savings - comm,
              updateDate: r.updateDate,
              updatedAt: r.updatedAt,
            };
          })
        );
      }
    } catch (error) {
      console.error("Load Monthly History:", error);
    }
  };

  const loadSavingGoals = async () => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/saving-goals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setSavingGoals(
          data.goals.map((goal) => ({
            ...goal,
            id: goal._id,
            targetAmount: goal.targetAmount,
            alreadySaved: goal.alreadySaved || 0,
            savedAmount: goal.currentAmount || 0,
            totalContributed: goal.currentAmount || 0,
            monthlyContribution: goal.monthlyContribution,
            status: goal.status,
          }))
        );
      }
    } catch (error) {
      console.error("Load Saving Goals:", error);
    }
  };

  const loadInvestments = async () => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");
      if (!token) return;

      const response = await fetch(
        `http://localhost:5000/api/investments?t=${Date.now()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load investments.");
      }

      const loadedInvestments = data.investments.map((investment) => ({
        ...investment,
        id: investment._id,
        amount: Number(investment.amount || 0),
        currentValue: Number(investment.currentValue ?? investment.amount ?? 0),
        monthlyContribution: Number(investment.monthlyContribution || 0),
        totalInterestReceived: Number(investment.totalInterestReceived || 0),
        sipContributions: Array.isArray(investment.sipContributions) ? investment.sipContributions : [],
      }));

      setInvestments(loadedInvestments);

      // Extract FD Interest transactions for dashboard
      const extractedIncome = [];
      loadedInvestments.forEach(inv => {
        if (Array.isArray(inv.interestTransactions)) {
          inv.interestTransactions.forEach(t => {
            extractedIncome.push({
              id: t.id || t._id || `fd-interest-${inv.id}-${t.date}`,
              type: "FD Interest",
              category: "Investment Income",
              amount: Number(t.amount),
              date: t.date,
              month: Number(t.month || new Date(t.date).getMonth() + 1),
              year: Number(t.year || new Date(t.date).getFullYear()),
              source: inv.name || inv.institution || "Fixed Deposit",
              investmentId: inv.id,
              referenceId: t.referenceId,
              note: t.note,
              createdAt: t.date
            });
          });
        }
      });
      setAdditionalIncomeTransactions(extractedIncome);
    } catch (error) {
      console.error("Load Investments:", error);
    }
  };

  const loadInsurances = async () => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/insurances", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!data.success || !data.insurances) return;

      const mappedInsurances = data.insurances.map((policy) => ({
        ...policy,
        id: policy._id,
        premium: policy.premiumAmount,
        monthlyPremium: policy.premiumAmount,
        monthlyEquivalent: calculateMonthlyEquivalent(policy.premiumAmount, policy.premiumFrequency),
      }));
      setInsurancePolicies(mappedInsurances);
    } catch (error) {
      console.error("Load Insurances:", error);
    }
  };

  const loadLiabilities = async () => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/liabilities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!data.success || !data.liabilities) return;

      const mappedLiabilities = data.liabilities.map((l) => ({
        ...l,
        id: l._id,
        emi: l.monthlyEMI,
        monthlyPayment: l.monthlyEMI,
      }));
      setLiabilities(mappedLiabilities);
    } catch (error) {
      console.error("Load Liabilities:", error);
    }
  };

  const loadUserReminders = async () => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/reminders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!data.success || !data.data) return;

      setUserReminders(data.data);
    } catch (error) {
      console.error("Load User Reminders:", error);
    }
  };

  const [userMessages, setUserMessages] = useState([]);

  const loadUserMessages = async () => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!data.success || !data.data) return;

      setUserMessages(data.data);

      data.data.forEach((msg) => {
        addNotification({
          id: msg.id,
          rawId: msg.rawId,
          type: "message",
          title: msg.title,
          message: msg.message,
          category: msg.category || "General",
          priority: msg.priority || "Normal",
          source: msg.source || "FinanceOS Admin",
          notificationType: "admin",
          date: msg.createdAt,
          createdAt: msg.createdAt,
          read: Boolean(msg.read),
          readAt: msg.readAt,
        });
      });
    } catch (error) {
      console.error("Load User Messages:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!userData) return;
      try {
        await loadCurrentMonthFinance();
        await loadMonthlyHistory();
        await loadSavingGoals();
        await loadInvestments();
        await loadInsurances();
        await loadLiabilities();
        await loadUserReminders();
        await loadUserMessages();
        await fetchLatestAISuggestion();
      } catch (error) {
        console.error("FinanceProvider: Failed to load finance data:", error);
      }
    };
    fetchData();

    const handleFocus = () => {
      if (userData) {
        loadUserMessages();
        loadUserReminders();
      }
    };
    window.addEventListener("focus", handleFocus);
    const interval = setInterval(handleFocus, 20000);
    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [userData]);

  // ==========================================================
  // INCOME CALCULATIONS & ACTIONS
  // ==========================================================

  const getAdditionalIncomeForMonth = (month, year) => {
    return additionalIncomeTransactions
      .filter(
        (t) => Number(t.month) === Number(month) && Number(t.year) === Number(year)
      )
      .reduce((total, t) => total + safeNumber(t.amount), 0);
  };

  const additionalIncome = useMemo(
    () => getAdditionalIncomeForMonth(monthlyFinance.month, monthlyFinance.year),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [additionalIncomeTransactions, monthlyFinance.month, monthlyFinance.year]
  );

  const baseMonthlyIncome = useMemo(
    () => nonNegative(monthlyFinance.income),
    [monthlyFinance.income]
  );

  const totalMonthlyIncome = useMemo(
    () => baseMonthlyIncome + additionalIncome,
    [baseMonthlyIncome, additionalIncome]
  );

  const recordAdditionalIncome = (incomeData = {}) => {
    const amount = safeNumber(incomeData.amount);
    if (amount <= 0) {
      return { success: false, message: "Enter a valid income amount." };
    }

    const date = incomeData.date || new Date().toISOString().slice(0, 10);
    const dateInfo = getMonthYearFromDate(date);
    const month = Number(incomeData.month ?? dateInfo.month);
    const year = Number(incomeData.year ?? dateInfo.year);

    if (month < 1 || month > 12 || !Number.isFinite(year)) {
      return { success: false, message: "Invalid income date." };
    }

    if (incomeData.referenceId) {
      const duplicate = additionalIncomeTransactions.some(
        (t) => t.referenceId === incomeData.referenceId
      );
      if (duplicate) {
        return { success: false, message: "This income transaction has already been recorded." };
      }
    }

    const transaction = {
      id: incomeData.id || createId("income"),
      type: incomeData.type || "Other Income",
      category: incomeData.category || "Additional Income",
      amount,
      date,
      month,
      year,
      source: incomeData.source || "",
      investmentId: incomeData.investmentId || null,
      referenceId: incomeData.referenceId || null,
      note: incomeData.note || "",
      createdAt: incomeData.createdAt || new Date().toISOString(),
    };

    setAdditionalIncomeTransactions((current) => [...current, transaction]);

    setMonthlyHistory((history) =>
      history.map((record) => {
        if (Number(record.month) !== month || Number(record.year) !== year) {
          return record;
        }

        const baseIncome =
          record.baseIncome !== undefined
            ? nonNegative(record.baseIncome)
            : Math.max(safeNumber(record.income) - safeNumber(record.additionalIncome), 0);

        const newAdditionalIncome = nonNegative(record.additionalIncome) + amount;
        const newTotalIncome = baseIncome + newAdditionalIncome;
        const expenses = nonNegative(record.expenses);
        const savings = newTotalIncome - expenses;
        const commitments = nonNegative(record.totalCommitments);

        return {
          ...record,
          baseIncome,
          additionalIncome: newAdditionalIncome,
          totalIncome: newTotalIncome,
          income: newTotalIncome,
          savings,
          availableToAllocate: cashBalance + savings - commitments,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    return { success: true, transaction, message: "Additional income recorded successfully." };
  };

  const deleteAdditionalIncomeTransaction = (id) => {
    const transaction = additionalIncomeTransactions.find((item) => item.id === id);
    if (!transaction) {
      return { success: false, message: "Income transaction not found." };
    }

    setAdditionalIncomeTransactions((current) => current.filter((item) => item.id !== id));

    setMonthlyHistory((history) =>
      history.map((record) => {
        if (
          Number(record.month) !== Number(transaction.month) ||
          Number(record.year) !== Number(transaction.year)
        ) {
          return record;
        }

        const baseIncome =
          record.baseIncome !== undefined
            ? nonNegative(record.baseIncome)
            : Math.max(safeNumber(record.income) - safeNumber(record.additionalIncome), 0);

        const newAdditionalIncome = Math.max(
          safeNumber(record.additionalIncome) - safeNumber(transaction.amount),
          0
        );
        const newTotalIncome = baseIncome + newAdditionalIncome;
        const expenses = nonNegative(record.expenses);
        const savings = newTotalIncome - expenses;
        const commitments = nonNegative(record.totalCommitments);

        return {
          ...record,
          baseIncome,
          additionalIncome: newAdditionalIncome,
          totalIncome: newTotalIncome,
          income: newTotalIncome,
          savings,
          availableToAllocate: cashBalance + savings - commitments,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    return { success: true, message: "Income transaction deleted." };
  };

  // ==========================================================
  // FD INTEREST ACTIONS
  // ==========================================================

  const recordFDInterest = async (investmentId, interestData = {}) => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      if (!token) {
        return { success: false, message: "Authentication token not found." };
      }

      const investment = investments.find((item) => item.id === investmentId);
      if (!investment) return { success: false, message: "Fixed deposit not found." };

      const investmentType = String(investment.type || "").trim().toLowerCase();
      if (investmentType !== "fixed deposit") {
        return { success: false, message: "Interest can only be recorded here for a fixed deposit." };
      }

      const interestMethod = String(investment.interestMethod || "").trim().toLowerCase();
      if (interestMethod === "cumulative") {
        return { success: false, message: "This is a cumulative FD. Interest remains inside the FD until maturity." };
      }

      if (normalizeStatus(investment.status) === "closed") {
        return { success: false, message: "Interest cannot be recorded for a closed FD." };
      }

      const amount = safeNumber(interestData.amount);
      if (amount <= 0) {
        return { success: false, message: "Enter the actual FD interest amount credited by the bank." };
      }

      const date = interestData.date || new Date().toISOString().slice(0, 10);
      const dateInfo = getMonthYearFromDate(date);
      const transactionMonth = Number(dateInfo.month);
      const transactionYear = Number(dateInfo.year);
      const referenceId = interestData.referenceId || `fd-interest-${investmentId}-${date}`;

      const duplicate = Array.isArray(investment.interestTransactions) && 
        investment.interestTransactions.some(
          (t) => Number(t.month) === transactionMonth && Number(t.year) === transactionYear
        );
      if (duplicate) {
        return { success: false, message: `FD interest for ${transactionMonth}/${transactionYear} has already been recorded.` };
      }

      const transaction = {
        id: createId("fd-interest"),
        type: "FD Interest",
        category: "Investment Income",
        amount,
        date,
        month: transactionMonth,
        year: transactionYear,
        source: investment.name || investment.institution || "Fixed Deposit",
        investmentId,
        referenceId,
        note: interestData.note || `Interest received from ${investment.name || "Fixed Deposit"}`,
        createdAt: new Date().toISOString(),
      };

      // API CALL TO BACKEND
      const response = await fetch(`http://localhost:5000/api/investments/${investmentId}/interest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(transaction),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to record FD interest.");
      }

      setAdditionalIncomeTransactions((current) => [...current, transaction]);

    setInvestments((current) =>
      current.map((item) => {
        if (item.id !== investmentId) return item;
        return {
          ...item,
          totalInterestReceived: safeNumber(item.totalInterestReceived) + amount,
          lastInterestReceivedAt: date,
          interestTransactions: [
            ...(Array.isArray(item.interestTransactions) ? item.interestTransactions : []),
            {
              id: transaction.id,
              amount,
              date,
              month: transactionMonth,
              year: transactionYear,
              referenceId,
              note: transaction.note,
              createdAt: transaction.createdAt,
            },
          ],
        };
      })
    );

    setMonthlyHistory((history) =>
      history.map((record) => {
        if (Number(record.month) !== transactionMonth || Number(record.year) !== transactionYear) {
          return record;
        }

        const baseIncome =
          record.baseIncome !== undefined
            ? nonNegative(record.baseIncome)
            : Math.max(safeNumber(record.income) - safeNumber(record.additionalIncome), 0);

        const newAdditionalIncome = nonNegative(record.additionalIncome) + amount;
        const newTotalIncome = baseIncome + newAdditionalIncome;
        const expenses = nonNegative(record.expenses);
        const savings = newTotalIncome - expenses;
        const commitments = nonNegative(record.totalCommitments);

        return {
          ...record,
          baseIncome,
          additionalIncome: newAdditionalIncome,
          totalIncome: newTotalIncome,
          income: newTotalIncome,
          expenses,
          savings,
          availableToAllocate: cashBalance + savings - commitments,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    setNetWorthSnapshots((snapshots) =>
      snapshots.map((snapshot) => {
        if (Number(snapshot.month) !== transactionMonth || Number(snapshot.year) !== transactionYear) {
          return snapshot;
        }

        const baseIncome =
          snapshot.baseIncome !== undefined
            ? nonNegative(snapshot.baseIncome)
            : Math.max(safeNumber(snapshot.income) - safeNumber(snapshot.additionalIncome), 0);

        const newAdditionalIncome = nonNegative(snapshot.additionalIncome) + amount;
        const newTotalIncome = baseIncome + newAdditionalIncome;
        const expenses = nonNegative(snapshot.expenses);
        const savings = newTotalIncome - expenses;
        const commitments = nonNegative(snapshot.totalCommitments);

        return {
          ...snapshot,
          baseIncome,
          additionalIncome: newAdditionalIncome,
          totalIncome: newTotalIncome,
          income: newTotalIncome,
          savings,
          availableToAllocate: cashBalance + savings - commitments,
          updatedAt: new Date().toISOString(),
        };
      })
    );

      return {
        success: true,
        transaction,
        message: `FD interest of ₹${amount.toLocaleString("en-US")} was added to ${transactionMonth}/${transactionYear} income.`,
      };
    } catch (error) {
      console.error("recordFDInterest Error:", error);
      return { success: false, message: error.message || "Failed to record FD interest." };
    }
  };

  // ==========================================================
  // ACTIVE COMPUTATIONS
  // ==========================================================
  // ACTIVE WORKING PERIOD & MONTH-AWARE ITEM LISTS
  // ==========================================================

  const activeWorkingPeriod = useMemo(() => {
    return parseSelectedMonth(selectedMonth);
  }, [selectedMonth]);

  // Visible items filtered strictly by creation/start & closure lifecycle
  const visibleSavingGoals = useMemo(
    () =>
      savingGoals.filter((g) =>
        isItemActiveInMonth(g, activeWorkingPeriod.year, activeWorkingPeriod.month)
      ),
    [savingGoals, activeWorkingPeriod.year, activeWorkingPeriod.month]
  );

  const visibleInvestments = useMemo(
    () =>
      investments.filter((i) =>
        isItemActiveInMonth(i, activeWorkingPeriod.year, activeWorkingPeriod.month)
      ),
    [investments, activeWorkingPeriod.year, activeWorkingPeriod.month]
  );

  const visibleInsurancePolicies = useMemo(
    () =>
      insurancePolicies.filter((p) =>
        isItemActiveInMonth(p, activeWorkingPeriod.year, activeWorkingPeriod.month)
      ),
    [insurancePolicies, activeWorkingPeriod.year, activeWorkingPeriod.month]
  );

  const visibleLiabilities = useMemo(
    () =>
      liabilities.filter((l) =>
        isItemActiveInMonth(l, activeWorkingPeriod.year, activeWorkingPeriod.month)
      ),
    [liabilities, activeWorkingPeriod.year, activeWorkingPeriod.month]
  );

  const activeSavingGoals = useMemo(
    () => visibleSavingGoals.filter((g) => normalizeStatus(g.status) === "active"),
    [visibleSavingGoals]
  );

  const activeInvestments = useMemo(
    () => investments.filter((i) => normalizeStatus(i.status) === "active"),
    [investments]
  );

  const activeInsurancePolicies = useMemo(
    () => insurancePolicies.filter((p) => normalizeStatus(p.status) === "active"),
    [insurancePolicies]
  );

  const activeLiabilities = useMemo(
    () =>
      liabilities.filter((l) => {
        const status = normalizeStatus(l.status);
        const balance = getLiabilityBalance(l);
        return balance > 0 && !["closed", "completed", "paid", "settled"].includes(status);
      }),
    [liabilities]
  );

  // ==========================================================
  // MONTHLY COMMITMENTS & BUDGETING
  // ==========================================================

  const goalMonthlyCommitment = useMemo(() => {
    const currentYear = activeWorkingPeriod.year;
    const currentMonth = activeWorkingPeriod.month;

    let actualContributionsThisMonth = 0;
    visibleSavingGoals.forEach((goal) => {
      const txs = Array.isArray(goal.contributions)
        ? goal.contributions
        : Array.isArray(goal.transactions)
        ? goal.transactions
        : [];

      if (txs.length > 0) {
        txs.forEach((tx) => {
          if (tx.type === "contribution" || !tx.type) {
            const txDate = tx.date ? new Date(tx.date) : (tx.createdAt ? new Date(tx.createdAt) : null);
            if (txDate && !isNaN(txDate.getTime())) {
              if (txDate.getFullYear() === currentYear && (txDate.getMonth() + 1) === currentMonth) {
                actualContributionsThisMonth += safeNumber(tx.amount);
              }
            }
          }
        });
      }
    });

    const backendAllocations = safeNumber(monthlyFinance.goalAllocations);
    return Math.max(actualContributionsThisMonth, backendAllocations);
  }, [visibleSavingGoals, activeWorkingPeriod.year, activeWorkingPeriod.month, monthlyFinance.goalAllocations]);

  const investmentMonthlyCommitment = useMemo(
    () =>
      visibleInvestments
        .filter((i) => normalizeStatus(i.status) === "active")
        .reduce(
          (total, i) =>
            total + nonNegative(firstDefined(i.monthlyContribution, i.monthlyAmount)),
          0
        ),
    [visibleInvestments]
  );

  const insuranceMonthlyCommitment = useMemo(
    () =>
      visibleInsurancePolicies
        .filter((p) => normalizeStatus(p.status) === "active")
        .reduce(
          (total, p) =>
            total + nonNegative(firstDefined(p.monthlyEquivalent, p.monthlyPremium)),
          0
        ),
    [visibleInsurancePolicies]
  );

  const liabilityMonthlyCommitment = useMemo(
    () =>
      visibleLiabilities
        .filter((l) => {
          const status = normalizeStatus(l.status);
          const balance = getLiabilityBalance(l);
          return balance > 0 && !["closed", "completed", "paid", "settled"].includes(status);
        })
        .reduce(
          (total, l) => total + getLiabilityMonthlyPayment(l),
          0
        ),
    [visibleLiabilities]
  );

  // ==========================================================
  // ACTUAL OUTFLOWS THIS MONTH (ONLY ACTUAL CASH DEDUCTED)
  // ==========================================================

  const actualInvestmentOutflow = useMemo(() => {
    const currentYear = activeWorkingPeriod.year;
    const currentMonth = activeWorkingPeriod.month;
    let sum = 0;
    visibleInvestments.forEach((inv) => {
      if (Array.isArray(inv.sipContributions)) {
        inv.sipContributions.forEach((sc) => {
          const scDate = sc.paidDate || sc.dueDate;
          if (isDateInPeriod(scDate, currentYear, currentMonth) && sc.status === "Paid") {
            sum += safeNumber(sc.amount);
          }
        });
      }
    });
    return sum;
  }, [visibleInvestments, activeWorkingPeriod.year, activeWorkingPeriod.month]);

  const actualGoalOutflow = useMemo(() => {
    const currentYear = activeWorkingPeriod.year;
    const currentMonth = activeWorkingPeriod.month;
    let sum = 0;
    visibleSavingGoals.forEach((goal) => {
      const txs = Array.isArray(goal.contributions)
        ? goal.contributions
        : Array.isArray(goal.transactions)
        ? goal.transactions
        : [];
      txs.forEach((tx) => {
        const txDate = tx.date || tx.createdAt;
        if (isDateInPeriod(txDate, currentYear, currentMonth)) {
          sum += safeNumber(tx.amount);
        }
      });
    });
    const backendAllocations = safeNumber(monthlyFinance.goalAllocations);
    return Math.max(sum, backendAllocations);
  }, [visibleSavingGoals, activeWorkingPeriod.year, activeWorkingPeriod.month, monthlyFinance.goalAllocations]);

  const actualInsuranceOutflow = useMemo(() => {
    const currentYear = activeWorkingPeriod.year;
    const currentMonth = activeWorkingPeriod.month;
    let sum = 0;
    visibleInsurancePolicies.forEach((ins) => {
      if (Array.isArray(ins.payments)) {
        ins.payments.forEach((p) => {
          const pDate = p.paidDate || p.dueDate || p.date;
          if (isDateInPeriod(pDate, currentYear, currentMonth) && (p.status === "Paid" || p.paid)) {
            sum += safeNumber(p.amount);
          }
        });
      }
    });
    return sum;
  }, [visibleInsurancePolicies, activeWorkingPeriod.year, activeWorkingPeriod.month]);

  const actualLiabilityOutflow = useMemo(() => {
    const currentYear = activeWorkingPeriod.year;
    const currentMonth = activeWorkingPeriod.month;
    let sum = 0;
    visibleLiabilities.forEach((liab) => {
      if (Array.isArray(liab.payments)) {
        liab.payments.forEach((p) => {
          const pDate = p.paidDate || p.dueDate || p.date;
          if (isDateInPeriod(pDate, currentYear, currentMonth) && (p.status === "Paid" || p.paid)) {
            sum += safeNumber(p.amount);
          }
        });
      }
    });
    return sum;
  }, [visibleLiabilities, activeWorkingPeriod.year, activeWorkingPeriod.month]);

  const totalActualOutflowCommitments = useMemo(() => {
    return (
      actualInvestmentOutflow +
      actualGoalOutflow +
      actualInsuranceOutflow +
      actualLiabilityOutflow
    );
  }, [
    actualInvestmentOutflow,
    actualGoalOutflow,
    actualInsuranceOutflow,
    actualLiabilityOutflow,
  ]);

  const totalPlannedMonthlyCommitments = useMemo(
    () =>
      goalMonthlyCommitment +
      investmentMonthlyCommitment +
      insuranceMonthlyCommitment +
      liabilityMonthlyCommitment,
    [
      goalMonthlyCommitment,
      investmentMonthlyCommitment,
      insuranceMonthlyCommitment,
      liabilityMonthlyCommitment,
    ]
  );

  const totalMonthlyCommitments = totalActualOutflowCommitments;

  const updateMonthlyFinance = (financeData = {}) => {
    setMonthlyFinance((current) => {
      const updated = {
        ...current,
        ...financeData,
        reminder: {
          ...current.reminder,
          ...(financeData.reminder || {}),
          channels: {
            ...current.reminder?.channels,
            ...(financeData.reminder?.channels || {}),
          },
        },
      };

      const month = Number(updated.month || new Date().getMonth() + 1);
      const year = Number(updated.year || new Date().getFullYear());
      const baseIncome = nonNegative(updated.income);
      const expenses = nonNegative(updated.expenses);
      const opening = nonNegative(
        updated.openingBalance !== undefined
          ? updated.openingBalance
          : updated.cashBalance
      );

      const monthAdditionalIncome = additionalIncomeTransactions
        .filter((t) => Number(t.month) === month && Number(t.year) === year)
        .reduce((total, t) => total + safeNumber(t.amount), 0);

      const totalIncome = baseIncome + monthAdditionalIncome;
      const savings = totalIncome - expenses;
      const currentTotalCommitments =
        goalMonthlyCommitment +
        investmentMonthlyCommitment +
        insuranceMonthlyCommitment +
        liabilityMonthlyCommitment;

      const computedClosing = opening + savings - currentTotalCommitments;

      setMonthlyHistory((history) => {
        const existingIndex = history.findIndex(
          (r) => Number(r.month) === month && Number(r.year) === year
        );

        const monthlyRecord = {
          month,
          year,
          baseIncome,
          additionalIncome: monthAdditionalIncome,
          totalIncome,
          income: totalIncome,
          expenses,
          savings,
          openingBalance: opening,
          cashBalance: opening,
          closingBalance: computedClosing,
          goalCommitment: goalMonthlyCommitment,
          investmentCommitment: investmentMonthlyCommitment,
          insuranceCommitment: insuranceMonthlyCommitment,
          liabilityCommitment: liabilityMonthlyCommitment,
          totalCommitments: currentTotalCommitments,
          availableToAllocate: opening + savings - currentTotalCommitments,
          updatedAt: new Date().toISOString(),
        };

        if (existingIndex !== -1) {
          return history.map((r, i) => (i === existingIndex ? { ...r, ...monthlyRecord } : r));
        }
        return [...history, monthlyRecord];
      });

      return {
        ...updated,
        month,
        year,
        income: baseIncome,
        expenses,
        openingBalance: opening,
        cashBalance: opening,
        closingBalance: computedClosing,
      };
    });
  };

  const openingBalance = useMemo(
    () =>
      nonNegative(
        monthlyFinance.openingBalance !== undefined
          ? monthlyFinance.openingBalance
          : monthlyFinance.cashBalance
      ),
    [monthlyFinance.openingBalance, monthlyFinance.cashBalance]
  );

  const monthlySavings = useMemo(
    () => totalMonthlyIncome - nonNegative(monthlyFinance.expenses),
    [totalMonthlyIncome, monthlyFinance.expenses]
  );

  const availableToAllocate = useMemo(
    () => openingBalance + monthlySavings - totalActualOutflowCommitments,
    [openingBalance, monthlySavings, totalActualOutflowCommitments]
  );

  const closingBalance = useMemo(
    () => openingBalance + monthlySavings - totalActualOutflowCommitments,
    [openingBalance, monthlySavings, totalActualOutflowCommitments]
  );

  // ==========================================================
  // REAL-TIME CASH FLOW BREAKDOWN (SINGLE CALCULATION ENGINE)
  // ==========================================================

  const cashFlowBreakdown = useMemo(() => {
    return deriveCashFlowBreakdown({
      monthlyFinance,
      previousMonthRecord: null,
      investments: visibleInvestments,
      savingGoals: visibleSavingGoals,
      insurancePolicies: visibleInsurancePolicies,
      liabilities: visibleLiabilities,
      additionalIncomes: additionalIncomeTransactions,
      selectedYear: activeWorkingPeriod.year,
      selectedMonth: activeWorkingPeriod.month,
      backendBreakdown: monthlyFinance.calculationBreakdown || null,
    });
  }, [
    monthlyFinance,
    visibleInvestments,
    visibleSavingGoals,
    visibleInsurancePolicies,
    visibleLiabilities,
    additionalIncomeTransactions,
    activeWorkingPeriod.year,
    activeWorkingPeriod.month,
  ]);

  const updateCashBalance = (amount) => {
    const value = safeNumber(amount);
    setCashBalance(value);
    setMonthlyFinance((curr) => ({
      ...curr,
      cashBalance: value,
      openingBalance: value,
    }));
    return true;
  };

  // ==========================================================
  // SAVING GOALS ACTIONS
  // ==========================================================

  const addSavingGoal = async (goal = {}) => {
    const targetAmount = nonNegative(firstDefined(goal.targetAmount, goal.amount));
    const initialSaved = nonNegative(firstDefined(goal.initialContribution, goal.savedAmount, goal.alreadySaved));
    const monthlyContribution = nonNegative(
      firstDefined(goal.monthlyContribution, goal.monthlyAllocation, goal.requiredMonthly)
    );

    const fundLocation = {
      type: goal.fundLocation?.type || goal.fundLocationType || "",
      institution: goal.fundLocation?.institution || goal.institution || "",
      label: goal.fundLocation?.label || goal.accountLabel || "",
      lastFour: goal.fundLocation?.lastFour || goal.lastFour || "",
    };

    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const payload = {
      goalName: goal.goalName || goal.name,
      category: goal.category || "Other",
      targetAmount,
      initialContribution: initialSaved,
      alreadySaved: initialSaved,
      currentAmount: initialSaved,
      monthlyContribution,
      startDate: goal.startDate || new Date().toISOString().slice(0, 10),
      targetDate: goal.targetDate,
      status: goal.status || "Active",
      notes: goal.notes || "",
      fundLocation,
      initialContributionDate: goal.initialContributionDate || goal.startDate,
      initialContributionSource: goal.initialContributionSource || "Existing Savings",
      reminder: goal.reminder,
    };

    const response = await fetch("http://localhost:5000/api/saving-goals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to save saving goal.");
    }

    const createdGoal = {
      ...data.goal,
      id: data.goal._id,
      savedAmount: data.goal.currentAmount || 0,
      totalContributed: data.goal.currentAmount || 0,
      alreadySaved: data.goal.alreadySaved || 0,
    };

    setSavingGoals((current) => [createdGoal, ...current]);
    await loadCurrentMonthFinance();

    return createdGoal;
  };

  const updateSavingGoal = async (id, updates = {}) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const response = await fetch(`http://localhost:5000/api/saving-goals/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to update saving goal.");
    }

    const updatedGoal = {
      ...data.goal,
      id: data.goal._id,
      savedAmount: data.goal.currentAmount || 0,
      totalContributed: data.goal.currentAmount || 0,
    };

    setSavingGoals((current) =>
      current.map((g) => (g.id === id || g._id === id ? updatedGoal : g))
    );

    return updatedGoal;
  };

  const deleteSavingGoal = async (id) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const response = await fetch(`http://localhost:5000/api/saving-goals/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to delete saving goal.");
    }

    setSavingGoals((current) =>
      current.filter((goal) => goal.id !== id && goal._id !== id)
    );

    await loadCurrentMonthFinance();
  };

  const updateGoalFundLocation = async (id, location = {}) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const response = await fetch(`http://localhost:5000/api/saving-goals/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fundLocation: location }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to update fund location.");
    }

    const updatedGoal = {
      ...data.goal,
      id: data.goal._id,
      savedAmount: data.goal.currentAmount || 0,
      totalContributed: data.goal.currentAmount || 0,
    };

    setSavingGoals((current) =>
      current.map((goal) =>
        goal.id === id || goal._id === id ? updatedGoal : goal
      )
    );

    return updatedGoal;
  };

  const addGoalContribution = async (id, contributionData) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const response = await fetch(
      `http://localhost:5000/api/saving-goals/${id}/contribution`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: contributionData.amount,
          date: contributionData.date,
          selectedMonth: contributionData.selectedMonth || selectedMonth || activeWorkingPeriod.iso,
          source: contributionData.source || "Monthly Savings",
          note: contributionData.note || "",
          paymentDetails: contributionData.paymentDetails || {},
          fundLocation: contributionData.fundLocation,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to add contribution.");
    }

    const updatedGoal = {
      ...data.goal,
      id: data.goal._id,
      savedAmount: data.goal.currentAmount || 0,
      totalContributed: data.goal.currentAmount || 0,
    };

    setSavingGoals((current) =>
      current.map((goal) =>
        goal.id === id || goal._id === id
          ? updatedGoal
          : goal
      )
    );

    // Immediately reload working month finance to synchronize Available to Allocate in real time
    await loadMonthFinance(activeWorkingPeriod.year, activeWorkingPeriod.month);

    return updatedGoal;
  };

  const updateGoalContribution = async (goalId, contributionId, updateData) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const response = await fetch(
      `http://localhost:5000/api/saving-goals/${goalId}/contribution/${contributionId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      }
    );

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to update contribution.");
    }

    const updatedGoal = {
      ...data.goal,
      id: data.goal._id,
      savedAmount: data.goal.currentAmount || 0,
      totalContributed: data.goal.currentAmount || 0,
    };

    setSavingGoals((current) =>
      current.map((g) => (g.id === goalId || g._id === goalId ? updatedGoal : g))
    );

    await loadCurrentMonthFinance();
    return updatedGoal;
  };

  const deleteGoalContribution = async (goalId, contributionId) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const response = await fetch(
      `http://localhost:5000/api/saving-goals/${goalId}/contribution/${contributionId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to delete contribution.");
    }

    const updatedGoal = {
      ...data.goal,
      id: data.goal._id,
      savedAmount: data.goal.currentAmount || 0,
      totalContributed: data.goal.currentAmount || 0,
    };

    setSavingGoals((current) =>
      current.map((g) => (g.id === goalId || g._id === goalId ? updatedGoal : g))
    );

    await loadCurrentMonthFinance();
    return updatedGoal;
  };

  const withdrawGoalFunds = async (id, withdrawalData) => {
    const data = typeof withdrawalData === "object" ? withdrawalData : { amount: withdrawalData };
    const withdrawal = safeNumber(data?.amount);

    if (withdrawal <= 0) {
      return { success: false, message: "Enter a valid withdrawal amount." };
    }

    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const response = await fetch(`http://localhost:5000/api/saving-goals/${id}/withdraw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: withdrawal,
        date: data.date || new Date().toISOString().slice(0, 10),
        purpose: data.purpose || "Goal fund used",
        note: data.note || "",
      }),
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.message || "Failed to withdraw funds.");
    }

    const updatedGoal = {
      ...resData.goal,
      id: resData.goal._id,
      savedAmount: resData.goal.currentAmount || 0,
      totalContributed: resData.goal.currentAmount || 0,
    };

    setSavingGoals((current) =>
      current.map((g) => (g.id === id || g._id === id ? updatedGoal : g))
    );

    return { success: true, goal: updatedGoal };
  };

  const settleSavingGoal = (id) => {
    let result = { success: false, message: "Saving goal not found." };

    setSavingGoals((current) =>
      current.map((goal) => {
        if (goal.id !== id) return goal;

        const target = nonNegative(goal.targetAmount);
        const contributed = nonNegative(firstDefined(goal.totalContributed, goal.savedAmount));

        if (target > 0 && contributed < target) {
          result = { success: false, message: "The saving goal has not been completed yet." };
          return goal;
        }

        result = { success: true, message: "Saving goal settled successfully." };

        return {
          ...goal,
          status: "Settled",
          monthlyContribution: 0,
          monthlyAllocation: 0,
          settledAt: new Date().toISOString(),
          settlementAction: "Keep Saved",
        };
      })
    );

    return result;
  };

  // ==========================================================
  // INVESTMENT ACTIONS
  // ==========================================================

  const addInvestment = async (investment = {}) => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      if (!token) {
        return { success: false, message: "Authentication token not found." };
      }

      const amount = nonNegative(firstDefined(investment.amount, investment.investedAmount));
      if (amount <= 0) {
        return { success: false, message: "Investment amount must be greater than 0." };
      }

      const isFD = String(investment.type || "").trim().toLowerCase() === "fixed deposit";

      const investmentData = {
        name: investment.name,
        type: investment.type,
        amount,
        paymentSource: investment.paymentSource || undefined,
        paymentSourceDetails: {
          bankName: investment.paymentSourceDetails?.bankName || "",
          accountLast4: investment.paymentSourceDetails?.accountLast4 || "",
          upiId: investment.paymentSourceDetails?.upiId || "",
          otherDetails: investment.paymentSourceDetails?.otherDetails || "",
        },
        contributionType: investment.contributionType || "Recurring",
        frequency: investment.frequency || null,
        monthlyContribution: isFD
          ? 0
          : nonNegative(
              firstDefined(investment.monthlyContribution, investment.monthlyAmount)
            ),
        startDate: investment.startDate || null,
        nextContributionDate: investment.nextContributionDate || null,
        maturityDate: investment.maturityDate || null,
        status: investment.status || "Active",
        institution: investment.institution || "",
        principalAmount: isFD
          ? nonNegative(firstDefined(investment.principalAmount, amount))
          : undefined,
        interestRate: isFD ? nonNegative(investment.interestRate) : undefined,
        interestMethod: isFD ? investment.interestMethod || "Payout" : undefined,
        interestPayoutFrequency: isFD ? investment.interestPayoutFrequency || null : undefined,
        compoundingFrequency: isFD ? investment.compoundingFrequency || null : undefined,
        estimatedInterest: isFD ? nonNegative(investment.estimatedInterest) : 0,
        estimatedAnnualInterest: isFD ? nonNegative(investment.estimatedAnnualInterest) : 0,
        estimatedInterestPerPayout: isFD ? nonNegative(investment.estimatedInterestPerPayout) : 0,
        estimatedMaturityAmount: isFD ? nonNegative(investment.estimatedMaturityAmount) : 0,
        totalInterestReceived: isFD ? nonNegative(investment.totalInterestReceived) : 0,
        interestTransactions:
          isFD && Array.isArray(investment.interestTransactions)
            ? investment.interestTransactions
            : [],
        reminder: investment.reminder || undefined,
        maturityReminder: investment.maturityReminder || undefined,
      };

      const response = await fetch("http://localhost:5000/api/investments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(investmentData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save investment.");
      }

      const savedInvestment = {
        ...data.investment,
        id: data.investment._id,
        amount: Number(data.investment.amount || 0),
        currentValue: Number(data.investment.amount || 0),
        monthlyContribution: Number(data.investment.monthlyContribution || 0),
        totalInterestReceived: Number(data.investment.totalInterestReceived || 0),
        sipContributions: Array.isArray(data.investment.sipContributions) ? data.investment.sipContributions : [],
      };

      setInvestments((current) => [...current, savedInvestment]);

      return {
        success: true,
        message: "Investment added successfully.",
        investment: savedInvestment,
      };
    } catch (error) {
      console.error("Add Investment:", error);
      return { success: false, message: error.message || "Failed to add investment." };
    }
  };

  // ==========================================================
  // SIP CONTRIBUTIONS
  // ==========================================================

  const getSIPContributions = async (investmentId) => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      if (!token) {
        return {
          success: false,
          message: "Authentication token not found.",
          contributions: [],
        };
      }

      const response = await fetch(
        `http://localhost:5000/api/investments/${investmentId}/contributions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch SIP contributions.");
      }

      return {
        success: true,
        contributions: data.contributions || [],
      };
    } catch (error) {
      console.error("Get SIP Contributions:", error);
      return {
        success: false,
        message: error.message || "Failed to fetch SIP contributions.",
        contributions: [],
      };
    }
  };

  const addSIPContribution = async (investmentId, contributionData = {}) => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      if (!token) {
        return {
          success: false,
          message: "Authentication token not found.",
        };
      }

      const payload = {
        ...contributionData,
        selectedMonth: contributionData.selectedMonth || selectedMonth || activeWorkingPeriod.iso,
      };

      const response = await fetch(
        `http://localhost:5000/api/investments/${investmentId}/contributions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add SIP contribution.");
      }

      await loadInvestments();
      await loadMonthFinance(activeWorkingPeriod.year, activeWorkingPeriod.month);

      return {
        success: true,
        contribution: data.contribution,
        investment: data.investment,
        message: data.message || "SIP contribution recorded successfully.",
      };
    } catch (error) {
      console.error("Add SIP Contribution:", error);
      return {
        success: false,
        message: error.message || "Failed to add SIP contribution.",
      };
    }
  };

  const updateSIPContribution = async (investmentId, contributionId, updates = {}) => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      if (!token) {
        return {
          success: false,
          message: "Authentication token not found.",
        };
      }

      const contributionData = { ...updates };
      if (updates.amount !== undefined) {
        contributionData.amount = nonNegative(updates.amount);
      }

      const response = await fetch(
        `http://localhost:5000/api/investments/${investmentId}/contributions/${contributionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(contributionData),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update SIP contribution.");
      }

      await loadInvestments();

      return {
        success: true,
        contribution: data.contribution,
        investment: data.investment,
        message: data.message || "SIP contribution updated successfully.",
      };
    } catch (error) {
      console.error("Update SIP Contribution:", error);
      return {
        success: false,
        message: error.message || "Failed to update SIP contribution.",
      };
    }
  };

  const updateInvestment = async (id, updates = {}) => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      if (!token) {
        return { success: false, message: "Authentication token not found." };
      }

      const investmentData = {
        ...updates,
        ...(updates.amount !== undefined && { amount: nonNegative(updates.amount) }),
        ...(updates.currentValue !== undefined && { currentValue: nonNegative(updates.currentValue) }),
        ...(updates.monthlyContribution !== undefined && {
          monthlyContribution: nonNegative(updates.monthlyContribution),
        }),
      };

      const response = await fetch(`http://localhost:5000/api/investments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(investmentData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update investment.");
      }

      const updatedInvestment = {
        ...data.investment,
        id: data.investment._id,
        amount: Number(data.investment.amount || 0),
        currentValue: Number(data.investment.currentValue ?? data.investment.amount ?? 0),
        monthlyContribution: Number(data.investment.monthlyContribution || 0),
        totalInterestReceived: Number(data.investment.totalInterestReceived || 0),
        sipContributions: Array.isArray(data.investment.sipContributions) ? data.investment.sipContributions : [],
      };

      setInvestments((current) =>
        current.map((investment) => (investment.id === id ? updatedInvestment : investment))
      );

      return {
        success: true,
        message: "Investment updated successfully.",
        investment: updatedInvestment,
      };
    } catch (error) {
      console.error("Update Investment:", error);
      return { success: false, message: error.message || "Failed to update investment." };
    }
  };

  const updateInvestmentStatus = async (id, status) => {
    try {
      const result = await updateInvestment(id, { status });

      if (!result?.success) {
        return {
          success: false,
          message: result?.message || "Failed to update investment status.",
        };
      }

      return {
        success: true,
        message: `Investment status changed to ${status}.`,
        investment: result.investment,
      };
    } catch (error) {
      console.error("Update Investment Status:", error);
      return {
        success: false,
        message: error.message || "Failed to update investment status.",
      };
    }
  };

  const deleteInvestment = async (id) => {
    try {
      const investmentId = id;
      if (!investmentId) return { success: false, message: "Invalid investment ID." };

      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      if (!token) return { success: false, message: "Authentication token not found." };

      const response = await fetch(`http://localhost:5000/api/investments/${investmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete investment.");
      }

      setInvestments((current) =>
        current.filter(
          (investment) =>
            String(investment.id ?? investment._id) !== String(investmentId)
        )
      );

      setAdditionalIncomeTransactions((current) =>
        current.filter((transaction) => Number(transaction.investmentId) !== investmentId)
      );

      return { success: true, message: "Investment deleted successfully." };
    } catch (error) {
      console.error("Delete Investment:", error);
      return { success: false, message: error.message || "Failed to delete investment." };
    }
  };

  const getInvestmentMaturityValue = (investment) => {
    if (!investment) return 0;
    const isFD = String(investment.type || "").trim().toLowerCase() === "fixed deposit";
    const interestMethod = String(investment.interestMethod || "").trim().toLowerCase();

    if (isFD && interestMethod === "cumulative") {
      return nonNegative(
        firstDefined(
          investment.maturityAmount,
          investment.estimatedMaturityAmount,
          investment.currentValue,
          investment.amount
        )
      );
    }

    if (isFD) {
      return nonNegative(
        firstDefined(investment.maturityAmount, investment.principalAmount, investment.amount)
      );
    }

    return nonNegative(
      firstDefined(investment.maturityAmount, investment.currentValue, investment.amount)
    );
  };

  const handleInvestmentMaturity = async (id, action = "mature") => {
    try {
      const investment = investments.find((item) => item.id === id);
      if (!investment) return { success: false, message: "Investment not found." };

      const normalizedAction = String(action).trim().toLowerCase();
      const maturityValue = getInvestmentMaturityValue(investment);

      if (normalizedAction === "mature") {
        const result = await updateInvestment(id, {
          status: "Matured",
          monthlyContribution: 0,
        });

        if (!result?.success) return result;

        setInvestments((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "Matured",
                  monthlyContribution: 0,
                  maturedAt: new Date().toISOString(),
                  maturityValue,
                  currentValue: maturityValue,
                }
              : item
          )
        );

        return {
          success: true,
          message: "Investment marked as matured.",
          investment: result.investment,
        };
      }

      if (normalizedAction === "close") {
        const result = await updateInvestment(id, {
          status: "Closed",
          monthlyContribution: 0,
        });

        if (!result?.success) return result;

        setInvestments((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "Closed",
                  monthlyContribution: 0,
                  closedAt: new Date().toISOString(),
                  currentValue: 0,
                }
              : item
          )
        );

        return {
          success: true,
          message: "Investment closed successfully.",
          investment: result.investment,
        };
      }

      return { success: false, message: "Invalid investment maturity action." };
    } catch (error) {
      console.error("Handle Investment Maturity:", error);
      return { success: false, message: error.message || "Failed to update investment maturity status." };
    }
  };

  const submitInvestmentMaturityAction = async (id, maturityData) => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      if (!token) return { success: false, message: "Authentication token not found." };

      const response = await fetch(`http://localhost:5000/api/investments/${id}/maturity-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(maturityData),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to process maturity action.");
      }

      setInvestments((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "Matured",
                maturedAt: new Date().toISOString(),
                currentValue: maturityData.maturityAmount || item.currentValue,
                monthlyContribution: 0,
              }
            : item
        )
      );

      return { success: true, message: "Maturity action processed successfully." };
    } catch (error) {
      console.error("Submit Investment Maturity Action:", error);
      return { success: false, message: error.message || "Failed to process maturity action." };
    }
  };

  const renewInvestment = async (id, renewalData = {}) => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      if (!token) return { success: false, message: "Authentication token not found." };

      const response = await fetch(`http://localhost:5000/api/investments/${id}/renew`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(renewalData),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to renew investment.");
      }

      const renewedInvestment = {
        ...data.investment,
        id: data.investment._id,
        amount: Number(data.investment.amount || 0),
        currentValue: Number(data.investment.currentValue ?? data.investment.amount ?? 0),
        monthlyContribution: Number(data.investment.monthlyContribution || 0),
        totalInterestReceived: Number(data.investment.totalInterestReceived || 0),
        sipContributions: Array.isArray(data.investment.sipContributions) ? data.investment.sipContributions : [],
      };

      setInvestments((current) => [...current, renewedInvestment]);

      return {
        success: true,
        message: "Investment renewed successfully.",
        investment: renewedInvestment,
      };
    } catch (error) {
      console.error("Renew Investment:", error);
      return { success: false, message: error.message || "Failed to renew investment." };
    }
  };

  // ==========================================================
  // INSURANCE ACTIONS
  // ==========================================================

  const addInsurancePolicy = async (policy = {}) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const newPolicy = {
      ...policy,
      type: policy.type || "Life Insurance",
      name: policy.name,
      policyNumber: policy.policyNumber || "",
      provider: policy.provider || "",
      premiumAmount: nonNegative(policy.premium || policy.premiumAmount),
      premiumFrequency: policy.premiumFrequency || "Yearly",
      coverageAmount: nonNegative(policy.coverageAmount),
      startDate: policy.startDate,
      endDate: policy.endDate,
      maturityDate: policy.maturityDate,
      renewalDate: policy.renewalDate,
      status: policy.status || "Active",
      metadata: policy.metadata || {},
      reminder: policy.reminder || { enabled: false, daysBefore: 7 },
    };

    const response = await fetch("http://localhost:5000/api/insurances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newPolicy),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to save insurance.");
    }

    setInsurancePolicies((current) => [
      ...current,
      {
        ...data.insurance,
        id: data.insurance._id,
        premium: data.insurance.premiumAmount,
        monthlyPremium: data.insurance.premiumAmount, // This might need calculation based on frequency
        monthlyEquivalent: calculateMonthlyEquivalent(data.insurance.premiumAmount, data.insurance.premiumFrequency),
      },
    ]);

    return data.insurance;
  };

  const updateInsurancePolicy = async (id, updates = {}) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const response = await fetch(`http://localhost:5000/api/insurances/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to update insurance.");
    }

    setInsurancePolicies((current) =>
      current.map((policy) => {
        if (policy.id !== id && policy._id !== id) return policy;
        return {
          ...policy,
          ...data.insurance,
          id: data.insurance._id,
          premium: data.insurance.premiumAmount,
          monthlyEquivalent: calculateMonthlyEquivalent(data.insurance.premiumAmount, data.insurance.premiumFrequency),
        };
      })
    );
  };

  const deleteInsurancePolicy = async (id) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const response = await fetch(`http://localhost:5000/api/insurances/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to delete insurance.");
    }

    setInsurancePolicies((current) => current.filter((policy) => policy.id !== id && policy._id !== id));
  };
  
  function calculateMonthlyEquivalent(amount, frequency) {
    if (!amount) return 0;
    switch (frequency) {
      case "Monthly": return amount;
      case "Quarterly": return amount / 3;
      case "Half-Yearly": return amount / 6;
      case "Yearly": return amount / 12;
      default: return 0;
    }
  }

  const addInsurancePayment = async (id, paymentData) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const payload = {
      ...(typeof paymentData === "object" ? paymentData : { amount: paymentData }),
      selectedMonth: (typeof paymentData === "object" && paymentData.selectedMonth) || selectedMonth || activeWorkingPeriod.iso,
    };

    const response = await fetch(`http://localhost:5000/api/insurances/${id}/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to record payment.");
    }

    setInsurancePolicies((current) =>
      current.map((policy) => {
        if (policy.id !== id && policy._id !== id) return policy;
        return {
          ...policy,
          ...data.insurance,
          id: data.insurance._id,
          premium: data.insurance.premiumAmount,
          monthlyPremium: data.insurance.premiumAmount,
          monthlyEquivalent: calculateMonthlyEquivalent(data.insurance.premiumAmount, data.insurance.premiumFrequency),
        };
      })
    );

    await loadMonthFinance(activeWorkingPeriod.year, activeWorkingPeriod.month);

    return data.payment;
  };

  const renewInsurance = async (id, renewalData) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const response = await fetch(`http://localhost:5000/api/insurances/${id}/renew`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(renewalData),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to renew insurance.");
    }

    setInsurancePolicies((current) => {
      const updated = current.map((policy) => {
        if (policy.id !== id && policy._id !== id) return policy;
        return {
          ...policy,
          ...data.oldPolicy,
          id: data.oldPolicy._id,
          premium: data.oldPolicy.premiumAmount,
          monthlyPremium: data.oldPolicy.premiumAmount,
          monthlyEquivalent: calculateMonthlyEquivalent(data.oldPolicy.premiumAmount, data.oldPolicy.premiumFrequency),
        };
      });

      return [
        ...updated,
        {
          ...data.insurance,
          id: data.insurance._id,
          premium: data.insurance.premiumAmount,
          monthlyPremium: data.insurance.premiumAmount,
          monthlyEquivalent: calculateMonthlyEquivalent(data.insurance.premiumAmount, data.insurance.premiumFrequency),
        }
      ];
    });

    return data.insurance;
  };

  const recordInsuranceMaturity = async (id, maturityData) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const response = await fetch(`http://localhost:5000/api/insurances/${id}/maturity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(maturityData),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to record maturity.");
    }

    setInsurancePolicies((current) =>
      current.map((policy) => {
        if (policy.id !== id && policy._id !== id) return policy;
        return {
          ...policy,
          ...data.insurance,
          id: data.insurance._id,
          premium: data.insurance.premiumAmount,
          monthlyPremium: data.insurance.premiumAmount,
          monthlyEquivalent: calculateMonthlyEquivalent(data.insurance.premiumAmount, data.insurance.premiumFrequency),
        };
      })
    );

    return data.insurance;
  };

  const updateInsuranceStatus = async (id, status) => {
    return updateInsurancePolicy(id, { status });
  };

  // ==========================================================
  // LIABILITY ACTIONS
  // ==========================================================

  const addLiability = async (liability = {}) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const originalAmount = Number(liability.originalAmount || liability.principalAmount || 0);
    const remainingAmount = liability.remainingAmount !== undefined ? Number(liability.remainingAmount) : originalAmount;
    const monthlyEMI = Number(liability.monthlyEMI || 0);

    const payload = {
      ...liability,
      originalAmount,
      remainingAmount,
      monthlyEMI,
      status: liability.status || "Active",
    };

    const response = await fetch("http://localhost:5000/api/liabilities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to save liability.");
    }

    const mapped = {
      ...data.liability,
      id: data.liability._id,
      emi: data.liability.monthlyEMI,
      monthlyPayment: data.liability.monthlyEMI,
    };

    setLiabilities((current) => [...current, mapped]);
    return mapped;
  };

  const updateLiability = async (id, updates = {}) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const response = await fetch(`http://localhost:5000/api/liabilities/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to update liability.");
    }

    const mapped = {
      ...data.liability,
      id: data.liability._id,
      emi: data.liability.monthlyEMI,
      monthlyPayment: data.liability.monthlyEMI,
    };

    setLiabilities((current) =>
      current.map((l) => (l.id === id || l._id === id ? mapped : l))
    );

    return mapped;
  };

  const deleteLiability = async (id) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const response = await fetch(`http://localhost:5000/api/liabilities/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to delete liability.");
    }

    setLiabilities((current) => current.filter((l) => l.id !== id && l._id !== id));
  };

  const recordLiabilityPayment = async (id, paymentData = {}) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const baseData = typeof paymentData === "object" ? paymentData : { amount: paymentData };
    const dataPayload = {
      ...baseData,
      selectedMonth: baseData.selectedMonth || selectedMonth || activeWorkingPeriod.iso,
    };

    const response = await fetch(`http://localhost:5000/api/liabilities/${id}/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dataPayload),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to record payment.");
    }

    const mapped = {
      ...data.liability,
      id: data.liability._id,
      emi: data.liability.monthlyEMI,
      monthlyPayment: data.liability.monthlyEMI,
    };

    setLiabilities((current) =>
      current.map((l) => (l.id === id || l._id === id ? mapped : l))
    );

    await loadMonthFinance(activeWorkingPeriod.year, activeWorkingPeriod.month);

    return { success: true, liability: mapped, payment: data.payment };
  };

  const updateLiabilityStatus = async (id, status) => {
    return updateLiability(id, { status });
  };

  // ==========================================================
  // AI ADVISER ACTIONS (GEMINI + MONGODB)
  // ==========================================================

  // Fetch latest stored AI recommendation from MongoDB without calling Gemini
  const fetchLatestAISuggestion = async () => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");
      if (!token) return null;

      const response = await fetch("http://localhost:5000/api/ai/latest", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setLatestAISuggestion(data.data);
        return data.data;
      }
      return null;
    } catch (error) {
      console.error("Fetch Latest AI Suggestion Error:", error);
      return null;
    }
  };

  // Generate new AI recommendation (Gemini + latest MongoDB financial data)
  const generateAISuggestion = async (options = {}) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");
      if (!token) {
        throw new Error("You must be logged in to get AI suggestions.");
      }

      const payload = {
        context: options.context || "plans_commitments",
        targetItem: options.targetItem || null,
        selectedMonth: options.selectedMonth || selectedMonth || undefined,
        ...options,
      };

      const response = await fetch("http://localhost:5000/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to generate AI suggestion.");
      }

      setLatestAISuggestion(data.data);
      return data.data;
    } catch (error) {
      console.error("Generate AI Suggestion Error:", error);
      setAiError(error.message || "Failed to generate AI suggestion.");
      throw error;
    } finally {
      setAiLoading(false);
    }
  };

  // ==========================================================
  // ASSETS & NET WORTH COMPUTATIONS
  // ==========================================================

  const totalInvestmentValue = useMemo(
    () => investments.reduce((total, i) => total + getInvestmentCurrentValue(i), 0),
    [investments]
  );

  const totalGoalFundValue = useMemo(
    () => savingGoals.reduce((total, g) => total + getGoalAvailableFund(g), 0),
    [savingGoals]
  );

  const accumulatedMonthlySavings = useMemo(
    () =>
      monthlyHistory.reduce(
        (total, record) =>
          total +
          safeNumber(
            record.savings !== undefined
              ? record.savings
              : safeNumber(record.income) - safeNumber(record.expenses)
          ),
        0
      ),
    [monthlyHistory]
  );

  const cashAllocatedToGoals = totalGoalFundValue;
  const cashAllocatedToInvestments = useMemo(
    () =>
      investments.reduce(
        (total, i) =>
          total + nonNegative(firstDefined(i.principalAmount, i.amount, i.investedAmount)),
        0
      ),
    [investments]
  );

  const currentCashBalance = useMemo(
    () =>
      Math.max(
        nonNegative(cashBalance) +
          accumulatedMonthlySavings -
          cashAllocatedToGoals -
          cashAllocatedToInvestments,
        0
      ),
    [cashBalance, accumulatedMonthlySavings, cashAllocatedToGoals, cashAllocatedToInvestments]
  );

  const totalAssets = useMemo(
    () => currentCashBalance + totalInvestmentValue + totalGoalFundValue,
    [currentCashBalance, totalInvestmentValue, totalGoalFundValue]
  );

  const totalLiabilities = useMemo(
    () => liabilities.reduce((total, l) => total + getLiabilityBalance(l), 0),
    [liabilities]
  );

  const netWorth = useMemo(() => totalAssets - totalLiabilities, [totalAssets, totalLiabilities]);

  const saveNetWorthSnapshot = (snapshotData = {}) => {
    const month = Number(snapshotData.month ?? monthlyFinance.month);
    const year = Number(snapshotData.year ?? monthlyFinance.year);
    const baseIncome = nonNegative(firstDefined(snapshotData.baseIncome, monthlyFinance.income));
    const monthAdditionalIncome =
      snapshotData.additionalIncome !== undefined
        ? nonNegative(snapshotData.additionalIncome)
        : getAdditionalIncomeForMonth(month, year);
    const totalIncome =
      snapshotData.totalIncome !== undefined
        ? nonNegative(snapshotData.totalIncome)
        : baseIncome + monthAdditionalIncome;
    const expenses = nonNegative(firstDefined(snapshotData.expenses, monthlyFinance.expenses));
    const savings =
      snapshotData.savings !== undefined
        ? safeNumber(snapshotData.savings)
        : totalIncome - expenses;

    const snapshotGoalCommitment =
      snapshotData.goalCommitment !== undefined
        ? nonNegative(snapshotData.goalCommitment)
        : goalMonthlyCommitment;
    const snapshotInvestmentCommitment =
      snapshotData.investmentCommitment !== undefined
        ? nonNegative(snapshotData.investmentCommitment)
        : investmentMonthlyCommitment;
    const snapshotInsuranceCommitment =
      snapshotData.insuranceCommitment !== undefined
        ? nonNegative(snapshotData.insuranceCommitment)
        : insuranceMonthlyCommitment;
    const snapshotLiabilityCommitment =
      snapshotData.liabilityCommitment !== undefined
        ? nonNegative(snapshotData.liabilityCommitment)
        : liabilityMonthlyCommitment;
    const snapshotTotalCommitments =
      snapshotData.totalCommitments !== undefined
        ? nonNegative(snapshotData.totalCommitments)
        : snapshotGoalCommitment +
          snapshotInvestmentCommitment +
          snapshotInsuranceCommitment +
          snapshotLiabilityCommitment;

    const snapshotAssets =
      snapshotData.totalAssets !== undefined ? nonNegative(snapshotData.totalAssets) : totalAssets;
    const snapshotLiabilities =
      snapshotData.totalLiabilities !== undefined
        ? nonNegative(snapshotData.totalLiabilities)
        : totalLiabilities;
    const snapshotNetWorth = snapshotAssets - snapshotLiabilities;

    const snapshot = {
      id: snapshotData.id || createId("snapshot"),
      month,
      year,
      baseIncome,
      additionalIncome: monthAdditionalIncome,
      totalIncome,
      income: totalIncome,
      expenses,
      savings,
      goalCommitment: snapshotGoalCommitment,
      investmentCommitment: snapshotInvestmentCommitment,
      insuranceCommitment: snapshotInsuranceCommitment,
      liabilityCommitment: snapshotLiabilityCommitment,
      totalCommitments: snapshotTotalCommitments,
      availableToAllocate:
        snapshotData.availableToAllocate !== undefined
          ? safeNumber(snapshotData.availableToAllocate)
          : cashBalance + savings - snapshotTotalCommitments,
      totalAssets: snapshotAssets,
      totalLiabilities: snapshotLiabilities,
      netWorth: snapshotNetWorth,
      createdAt: snapshotData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNetWorthSnapshots((current) => {
      const existingIndex = current.findIndex(
        (item) => Number(item.month) === month && Number(item.year) === year
      );
      let updated;
      if (existingIndex !== -1) {
        updated = current.map((item, index) =>
          index === existingIndex ? { ...item, ...snapshot, id: item.id || snapshot.id } : item
        );
      } else {
        updated = [...current, snapshot];
      }
      try {
        localStorage.setItem("financeos_networth_snapshots", JSON.stringify(updated));
      } catch (e) {
        console.warn("Unable to persist net worth snapshots:", e);
      }
      return updated;
    });

    return snapshot;
  };

  // ==========================================================
  // FD CALCULATION HELPERS
  // ==========================================================

  const calculateFDAnnualInterest = (investment) => {
    if (!investment) return 0;
    const principal = nonNegative(firstDefined(investment.principalAmount, investment.amount));
    const rate = nonNegative(investment.interestRate);
    return (principal * rate) / 100;
  };

  const calculateFDInterestPerPayout = (investment) => {
    const annualInterest = calculateFDAnnualInterest(investment);
    const frequency = String(investment?.interestPayoutFrequency || "").trim().toLowerCase();

    if (frequency === "monthly") return annualInterest / 12;
    if (frequency === "quarterly") return annualInterest / 4;
    if (["half yearly", "half-yearly", "halfyearly"].includes(frequency)) return annualInterest / 2;
    return annualInterest;
  };

  const totalFDInterestReceived = useMemo(
    () =>
      additionalIncomeTransactions
        .filter((t) => String(t.type || "").trim().toLowerCase() === "fd interest")
        .reduce((total, t) => total + safeNumber(t.amount), 0),
    [additionalIncomeTransactions]
  );

  // ==========================================================
  // FINANCIAL HEALTH METRICS
  // ==========================================================

  const savingsRate = useMemo(
    () => (totalMonthlyIncome > 0 ? (monthlySavings / totalMonthlyIncome) * 100 : 0),
    [monthlySavings, totalMonthlyIncome]
  );

  const expenseRatio = useMemo(
    () =>
      totalMonthlyIncome > 0
        ? (nonNegative(monthlyFinance.expenses) / totalMonthlyIncome) * 100
        : 0,
    [monthlyFinance.expenses, totalMonthlyIncome]
  );

  const commitmentRatio = useMemo(
    () => (totalMonthlyIncome > 0 ? (totalMonthlyCommitments / totalMonthlyIncome) * 100 : 0),
    [totalMonthlyCommitments, totalMonthlyIncome]
  );

  const financialHealthScore = useMemo(() => {
    if (totalMonthlyIncome <= 0) return 0;
    let score = 100;

    if (expenseRatio > 80) score -= 35;
    else if (expenseRatio > 70) score -= 25;
    else if (expenseRatio > 60) score -= 15;
    else if (expenseRatio > 50) score -= 8;

    if (commitmentRatio > 50) score -= 30;
    else if (commitmentRatio > 40) score -= 20;
    else if (commitmentRatio > 30) score -= 12;
    else if (commitmentRatio > 20) score -= 5;

    if (savingsRate < 0) score -= 35;
    else if (savingsRate < 10) score -= 20;
    else if (savingsRate < 20) score -= 10;
    else if (savingsRate >= 30) score += 5;

    if (availableToAllocate < 0) score -= 20;

    return Math.min(Math.max(Math.round(score), 0), 100);
  }, [totalMonthlyIncome, expenseRatio, commitmentRatio, savingsRate, availableToAllocate]);

  const financialHealthLabel = useMemo(() => {
    if (financialHealthScore >= 80) return "Excellent";
    if (financialHealthScore >= 65) return "Good";
    if (financialHealthScore >= 50) return "Fair";
    if (financialHealthScore >= 35) return "Needs Attention";
    return "High Risk";
  }, [financialHealthScore]);

  const reportYears = useMemo(() => {
    const years = [
      new Date().getFullYear(),
      Number(monthlyFinance.year),
      ...monthlyHistory.map((r) => Number(r.year)),
      ...netWorthSnapshots.map((s) => Number(s.year)),
    ];
    return [...new Set(years.filter((y) => Number.isFinite(y) && y > 0))].sort((a, b) => b - a);
  }, [monthlyFinance.year, monthlyHistory, netWorthSnapshots]);

  // ==========================================================
  // UNIFIED NET WORTH HISTORY (FROM MONGODB HISTORY + SNAPSHOTS)
  // ==========================================================
  const netWorthHistory = useMemo(() => {
    const combinedMap = new Map();

    // 1. Synthesize historical net worth from MongoDB monthly finance records
    (monthlyHistory || []).forEach((record) => {
      const m = Number(record.month);
      const y = Number(record.year);
      if (!m || !y) return;
      const key = `${y}-${String(m).padStart(2, "0")}`;

      const cash = nonNegative(
        record.closingBalance !== undefined
          ? record.closingBalance
          : (record.cashBalance || 0)
      );
      const assets = cash + totalInvestmentValue + totalGoalFundValue;
      const nw = assets - totalLiabilities;

      combinedMap.set(key, {
        id: `derived-${key}`,
        month: m,
        year: y,
        income: record.income || 0,
        expenses: record.expenses || 0,
        savings: record.savings || 0,
        cashBalance: cash,
        totalAssets: assets,
        totalLiabilities,
        netWorth: nw,
        createdAt: record.createdAt || new Date(y, m - 1, 1).toISOString(),
      });
    });

    // 2. Overlay explicit snapshots (higher fidelity if present)
    (netWorthSnapshots || []).forEach((s) => {
      const m = Number(s.month);
      const y = Number(s.year);
      if (!m || !y) return;
      const key = `${y}-${String(m).padStart(2, "0")}`;
      combinedMap.set(key, s);
    });

    // 3. If current month has recorded data, ensure it appears
    if (
      monthlyFinance?.year &&
      monthlyFinance?.month &&
      (monthlyFinance.income > 0 ||
        monthlyFinance.expenses > 0 ||
        monthlyFinance.cashBalance > 0 ||
        monthlyFinance.hasRecord)
    ) {
      const m = Number(monthlyFinance.month);
      const y = Number(monthlyFinance.year);
      const key = `${y}-${String(m).padStart(2, "0")}`;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, {
          id: `current-${key}`,
          month: m,
          year: y,
          income: monthlyFinance.income || 0,
          expenses: monthlyFinance.expenses || 0,
          savings: monthlySavings || 0,
          cashBalance: currentCashBalance,
          totalAssets,
          totalLiabilities,
          netWorth,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return Array.from(combinedMap.values()).sort((a, b) => {
      const keyA = Number(a.year) * 12 + Number(a.month);
      const keyB = Number(b.year) * 12 + Number(b.month);
      return keyA - keyB;
    });
  }, [
    netWorthSnapshots,
    monthlyHistory,
    monthlyFinance,
    monthlySavings,
    currentCashBalance,
    totalAssets,
    totalLiabilities,
    netWorth,
    totalInvestmentValue,
    totalGoalFundValue,
  ]);

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  const addNotification = (notificationData = {}) => {
    const notification = {
      ...notificationData,
      id: notificationData.id || createId("notification"),
      type: notificationData.type || "general",
      category: notificationData.category || "System",
      title: notificationData.title || "Notification",
      message: notificationData.message || "",
      source: notificationData.source || "system",
      sourceId: notificationData.sourceId || null,
      date: notificationData.date || new Date().toISOString(),
      read: Boolean(notificationData.read),
      createdAt: notificationData.createdAt || new Date().toISOString(),
    };

    setNotifications((current) => {
      if (current.some((item) => item.id === notification.id)) return current;
      return [notification, ...current];
    });

    return notification;
  };

  const markNotificationAsRead = async (id) => {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    if (String(id).startsWith("msg-")) {
      try {
        const token =
          localStorage.getItem("financeos_token") ||
          sessionStorage.getItem("financeos_token");
        if (token) {
          await fetch(`http://localhost:5000/api/messages/${id}/read`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        }
      } catch (err) {
        console.error("Failed to mark message read on backend:", err);
      }
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");
      if (token) {
        await fetch(`http://localhost:5000/api/messages/mark-all-read`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Failed to mark all messages read on backend:", err);
    }
  };

  const deleteNotification = (id) => {
    setNotifications((current) => current.filter((n) => n.id !== id));
  };

  const clearNotifications = () => setNotifications([]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = {
    userData,
    setUserData,

    // Selected Dashboard View Month
    selectedMonth,
    setSelectedMonth,

    // Monthly Finance
    monthlyFinance,
    updateMonthlyFinance,
    loadMonthFinance,
    loadCurrentMonthFinance,
    loadMonthlyHistory,
    monthlyHistory,
    openingBalance,
    closingBalance,
    baseMonthlyIncome,
    additionalIncome,
    totalMonthlyIncome,
    monthlySavings,
    availableToAllocate,

    // Additional Income
    additionalIncomeTransactions,
    recordAdditionalIncome,
    deleteAdditionalIncomeTransaction,
    getAdditionalIncomeForMonth,

    // FD
    recordFDInterest,
    calculateFDAnnualInterest,
    calculateFDInterestPerPayout,
    totalFDInterestReceived,

    // Cash
    cashBalance,
    updateCashBalance,
    accumulatedMonthlySavings,
    currentCashBalance,

    // Saving Goals
    savingGoals,
    visibleSavingGoals,
    activeSavingGoals,
    addSavingGoal,
    updateSavingGoal,
    deleteSavingGoal,
    addGoalContribution,
    updateGoalContribution,
    deleteGoalContribution,
    withdrawGoalFunds,
    settleSavingGoal,
    updateGoalFundLocation,
    goalMonthlyCommitment,

    // Investments
    investments,
    visibleInvestments,
    activeInvestments,
    addInvestment,
    updateInvestment,
    updateInvestmentStatus,
    deleteInvestment,

    // SIP Contributions
    getSIPContributions,
    addSIPContribution,
    updateSIPContribution,

    // Investment Maturity
    handleInvestmentMaturity,
    renewInvestment,
    submitInvestmentMaturityAction,
    getInvestmentMaturityValue,

    investmentMonthlyCommitment,
    totalInvestmentValue,

    // Insurance
    insurancePolicies,
    visibleInsurancePolicies,
    activeInsurancePolicies,
    addInsurancePolicy,
    updateInsurancePolicy,
    deleteInsurancePolicy,
    insuranceMonthlyCommitment,
    addInsurancePayment,
    renewInsurance,
    recordInsuranceMaturity,
    updateInsuranceStatus,

    // Liabilities
    liabilities,
    visibleLiabilities,
    activeLiabilities,
    addLiability,
    updateLiability,
    deleteLiability,
    recordLiabilityPayment,
    liabilityMonthlyCommitment,
    updateLiabilityStatus,

    // Commitments & Outflows
    totalMonthlyCommitments,
    totalActualOutflowCommitments,
    totalPlannedMonthlyCommitments,
    actualInvestmentOutflow,
    actualGoalOutflow,
    actualInsuranceOutflow,
    actualLiabilityOutflow,
    cashFlowBreakdown,

    // Assets / Liabilities / Net Worth
    totalGoalFundValue,
    totalAssets,
    totalLiabilities,
    totalOutstandingLiabilities: totalLiabilities,
    totalCashSavings: currentCashBalance,
    netWorth,

    // Reports
    netWorthSnapshots,
    netWorthHistory,
    saveNetWorthSnapshot,
    reportYears,

    // Financial Health
    savingsRate,
    expenseRatio,
    commitmentRatio,
    financialHealthScore,
    financialHealthLabel,

    // Notifications
    notifications,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearNotifications,
    unreadNotificationCount,

    // User Messages & Reminders
    userMessages,
    loadUserMessages,
    userReminders,
    loadUserReminders,

    // Sidebar UI State
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,

    // AI Adviser
    latestAISuggestion,
    aiLoading,
    aiError,
    fetchLatestAISuggestion,
    generateAISuggestion,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export default FinanceProvider;