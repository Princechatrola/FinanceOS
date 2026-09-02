// ============================================================
// FINANCEOS - REPORT CONTROLLER (COMPREHENSIVE ANALYTICS ENGINE)
// ============================================================

const User = require("../models/User");
const MonthlyFinance = require("../models/MonthlyFinance");
const AdditionalIncome = require("../models/AdditionalIncome");
const Investment = require("../models/Investment");
const Insurance = require("../models/Insurance");
const Liability = require("../models/Liability");
const SavingGoal = require("../models/SavingGoal");

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Helper for safe numeric conversion
const safeNum = (val, defaultVal = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : defaultVal;
};

// ============================================================
// FINANCIAL HEALTH CALCULATION (Deterministic 0 - 100 Model)
// ============================================================
function computeFinancialHealthScore({ income, expenses, commitments, availableToAllocate }) {
  const safeIncome = Math.max(safeNum(income), 0);
  const safeExpenses = Math.max(safeNum(expenses), 0);
  const safeCommitments = Math.max(safeNum(commitments), 0);
  const safeAvailable = safeNum(availableToAllocate);

  if (safeIncome <= 0) {
    return {
      score: null,
      status: "No Data",
      level: "no-data",
      hasSufficientData: false,
      breakdown: {
        savingsScore: 0,
        expenseScore: 0,
        commitmentScore: 0,
        allocationScore: 0,
      },
      ratios: {
        savingsRate: 0,
        expenseRatio: 0,
        commitmentRatio: 0,
        allocationRatio: 0,
      },
      insights: ["Add your monthly income to calculate a meaningful financial health score."]
    };
  }

  const rawSavings = safeIncome - safeExpenses;
  const savingsRate = Math.round((rawSavings / safeIncome) * 100);
  const expenseRatio = Math.round((safeExpenses / safeIncome) * 100);
  const commitmentRatio = Math.round((safeCommitments / safeIncome) * 100);
  const allocationRatio = Math.round((safeAvailable / safeIncome) * 100);

  // 1. Savings Health Score (Max 30)
  let savingsScore = 0;
  if (savingsRate >= 30) savingsScore = 30;
  else if (savingsRate >= 25) savingsScore = 27;
  else if (savingsRate >= 20) savingsScore = 24;
  else if (savingsRate >= 15) savingsScore = 20;
  else if (savingsRate >= 10) savingsScore = 15;
  else if (savingsRate >= 5) savingsScore = 8;
  else if (savingsRate >= 0) savingsScore = 3;
  else savingsScore = 0;

  // 2. Expense Control Score (Max 25)
  let expenseScore = 0;
  if (expenseRatio <= 50) expenseScore = 25;
  else if (expenseRatio <= 60) expenseScore = 22;
  else if (expenseRatio <= 70) expenseScore = 18;
  else if (expenseRatio <= 80) expenseScore = 13;
  else if (expenseRatio <= 90) expenseScore = 7;
  else if (expenseRatio <= 100) expenseScore = 3;
  else expenseScore = 0;

  // 3. Commitment Load Score (Max 25)
  let commitmentScore = 0;
  if (commitmentRatio <= 20) commitmentScore = 25;
  else if (commitmentRatio <= 30) commitmentScore = 22;
  else if (commitmentRatio <= 40) commitmentScore = 18;
  else if (commitmentRatio <= 50) commitmentScore = 13;
  else if (commitmentRatio <= 60) commitmentScore = 7;
  else if (commitmentRatio <= 75) commitmentScore = 3;
  else commitmentScore = 0;

  // 4. Allocation Capacity Score (Max 20)
  let allocationScore = 0;
  if (allocationRatio >= 20) allocationScore = 20;
  else if (allocationRatio >= 15) allocationScore = 17;
  else if (allocationRatio >= 10) allocationScore = 14;
  else if (allocationRatio >= 5) allocationScore = 10;
  else if (allocationRatio >= 0) allocationScore = 5;
  else allocationScore = 0;

  const totalScore = savingsScore + expenseScore + commitmentScore + allocationScore;

  let status = "Fair";
  let level = "fair";
  if (totalScore >= 80) { status = "Excellent"; level = "excellent"; }
  else if (totalScore >= 65) { status = "Good"; level = "good"; }
  else if (totalScore >= 50) { status = "Fair"; level = "fair"; }
  else if (totalScore >= 35) { status = "Needs Attention"; level = "attention"; }
  else { status = "Critical"; level = "critical"; }

  const healthInsights = [];
  if (savingsRate >= 20) healthInsights.push("Your savings rate is robust relative to total income.");
  else if (savingsRate >= 10) healthInsights.push("Moderate savings rate; building a larger surplus will accelerate goal targets.");
  else healthInsights.push("Savings rate is narrow; review discretionary expenditures.");

  if (expenseRatio <= 60) healthInsights.push("Expense discipline is well-managed below 60% of income.");
  else if (expenseRatio > 80) healthInsights.push("Operational expenses consume over 80% of monthly inflow.");

  if (commitmentRatio <= 30) healthInsights.push("Recurring commitment burden is healthy and sustainable.");
  else if (commitmentRatio > 50) healthInsights.push("High recurring commitments restrict monthly allocation flexibility.");

  if (safeAvailable > 0) healthInsights.push(`Available allocation liquidity remains positive at ₹${safeAvailable.toLocaleString("en-IN")}.`);
  else healthInsights.push("Zero unallocated monthly liquidity; consider optimizing active commitments.");

  return {
    score: totalScore,
    status,
    level,
    hasSufficientData: true,
    breakdown: {
      savingsScore,
      expenseScore,
      commitmentScore,
      allocationScore,
    },
    ratios: {
      savingsRate,
      expenseRatio,
      commitmentRatio,
      allocationRatio,
    },
    insights: healthInsights,
  };
}

// ============================================================
// MAIN GET FINANCIAL REPORT HANDLER
// ============================================================
const getFinancialReport = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { duration = "monthly", year, month, quarter, half } = req.query;

    const user = await User.findById(userId).select("name email phone role");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const currentYearNum = Number(year) || new Date().getFullYear();
    let months = [];
    let periodLabel = "";
    let periodRangeLabel = "";

    if (duration === "monthly") {
      const m = Number(month) || (new Date().getMonth() + 1);
      months = [m];
      periodLabel = `${MONTH_NAMES[m - 1]} ${currentYearNum}`;
      periodRangeLabel = `${MONTH_NAMES[m - 1]} 1 — ${MONTH_NAMES[m - 1]} ${new Date(currentYearNum, m, 0).getDate()}, ${currentYearNum}`;
    } else if (duration === "quarterly") {
      const q = Number(quarter) || Math.ceil((new Date().getMonth() + 1) / 3);
      if (q === 1) months = [1, 2, 3];
      else if (q === 2) months = [4, 5, 6];
      else if (q === 3) months = [7, 8, 9];
      else months = [10, 11, 12];
      periodLabel = `Q${q} ${currentYearNum}`;
      periodRangeLabel = `${MONTH_NAMES[months[0] - 1]} — ${MONTH_NAMES[months[2] - 1]} ${currentYearNum}`;
    } else if (duration === "halfYear") {
      const h = Number(half) || (new Date().getMonth() + 1 <= 6 ? 1 : 2);
      months = h === 1 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12];
      periodLabel = `H${h} ${currentYearNum}`;
      periodRangeLabel = `${MONTH_NAMES[months[0] - 1]} — ${MONTH_NAMES[months[5] - 1]} ${currentYearNum}`;
    } else {
      // Yearly
      months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      periodLabel = `Year ${currentYearNum}`;
      periodRangeLabel = `January — December ${currentYearNum}`;
    }

    const startMonth = months[0];
    const endMonth = months[months.length - 1];
    const periodStartDate = new Date(Date.UTC(currentYearNum, startMonth - 1, 1, 0, 0, 0));
    const periodEndDate = new Date(Date.UTC(currentYearNum, endMonth, 0, 23, 59, 59, 999));

    // 1. Fetch MonthlyFinance records for period
    const monthlyFinanceRecords = await MonthlyFinance.find({
      user: userId,
      year: currentYearNum,
      month: { $in: months }
    }).sort({ month: 1 });

    // Find starting opening balance before the selected period
    let openingBalance = null;
    let prevRecord = null;
    if (startMonth > 1) {
      prevRecord = await MonthlyFinance.findOne({
        user: userId,
        year: currentYearNum,
        month: startMonth - 1
      });
    } else {
      prevRecord = await MonthlyFinance.findOne({
        user: userId,
        year: currentYearNum - 1,
        month: 12
      });
    }

    if (prevRecord) {
      openingBalance = safeNum(prevRecord.closingBalance !== undefined ? prevRecord.closingBalance : prevRecord.cashBalance);
    } else if (monthlyFinanceRecords.length > 0) {
      openingBalance = safeNum(monthlyFinanceRecords[0].openingBalance !== undefined ? monthlyFinanceRecords[0].openingBalance : monthlyFinanceRecords[0].cashBalance);
    } else {
      openingBalance = 0;
    }

    // 2. Fetch Additional Incomes
    const additionalIncomes = await AdditionalIncome.find({
      user: userId,
      year: currentYearNum,
      month: { $in: months }
    }).sort({ date: 1 });

    // 3. Fetch all financial items for the user
    const [allInvestments, allInsurances, allLiabilities, allSavingGoals] = await Promise.all([
      Investment.find({ user: userId }),
      Insurance.find({ user: userId }),
      Liability.find({ user: userId }),
      SavingGoal.find({ user: userId }),
    ]);

    // ============================================================
    // A. AGGREGATE MONTH-BY-MONTH CASH FLOW
    // ============================================================
    const monthDetails = months.map((m) => {
      const record = monthlyFinanceRecords.find((r) => r.month === m);
      const mIncomes = additionalIncomes.filter((ai) => ai.month === m);
      const addIncomeTotal = mIncomes.reduce((sum, ai) => sum + safeNum(ai.amount), 0);

      const baseIncome = record ? safeNum(record.income) : 0;
      const totalIncome = baseIncome + addIncomeTotal;
      const expenses = record ? safeNum(record.expenses) : 0;
      const savings = totalIncome - expenses;
      const opening = record ? safeNum(record.openingBalance !== undefined ? record.openingBalance : record.cashBalance) : 0;

      const goalAlloc = record ? safeNum(record.goalAllocations) : 0;
      const invCommit = record ? safeNum(record.investmentCommitments) : 0;
      const insCommit = record ? safeNum(record.insuranceCommitments) : 0;
      const liabCommit = record ? safeNum(record.liabilityCommitments) : 0;
      const totalCommitments = (goalAlloc + invCommit + insCommit + liabCommit) || (record ? safeNum(record.commitments) : 0);

      const closing = record ? safeNum(record.closingBalance) : (opening + savings - totalCommitments);
      const availableToAllocate = record ? safeNum(record.availableToAllocate) : (opening + savings - totalCommitments);

      // Month Health Score
      const mHealth = computeFinancialHealthScore({
        income: totalIncome,
        expenses,
        commitments: totalCommitments,
        availableToAllocate,
      });

      return {
        month: m,
        monthName: MONTH_NAMES[m - 1],
        shortLabel: MONTH_NAMES[m - 1].slice(0, 3),
        hasRecord: !!record,
        baseIncome,
        additionalIncome: addIncomeTotal,
        totalIncome,
        expenses,
        savings,
        openingBalance: opening,
        goalAllocations: goalAlloc,
        investmentCommitments: invCommit,
        insuranceCommitments: insCommit,
        liabilityCommitments: liabCommit,
        totalCommitments,
        closingBalance: closing,
        availableToAllocate,
        healthScore: mHealth.score,
        healthStatus: mHealth.status,
        updateDate: record ? record.updateDate : null,
      };
    });

    const totalIncome = monthDetails.reduce((sum, m) => sum + m.totalIncome, 0);
    const totalExpenses = monthDetails.reduce((sum, m) => sum + m.expenses, 0);
    const totalSavings = totalIncome - totalExpenses;
    const recordedMonthsCount = monthDetails.filter((m) => m.hasRecord || m.totalIncome > 0 || m.expenses > 0).length || 1;

    const avgMonthlyIncome = Math.round(totalIncome / (months.length || 1));
    const avgMonthlyExpenses = Math.round(totalExpenses / (months.length || 1));
    const avgMonthlySavings = Math.round(totalSavings / (months.length || 1));

    const lastRecordedMonth = [...monthDetails].reverse().find((m) => m.hasRecord) || monthDetails[monthDetails.length - 1];
    const closingBalance = lastRecordedMonth ? lastRecordedMonth.closingBalance : (openingBalance + totalSavings);
    const availableToAllocate = lastRecordedMonth ? lastRecordedMonth.availableToAllocate : (openingBalance + totalSavings);

    // ============================================================
    // B. FINANCIAL ACTIVITY LEDGER (Contributions, Payments, Inflows)
    // ============================================================
    const ledger = [];
    let totalInvestmentContributionsPeriod = 0;
    let totalInsurancePremiumsPeriod = 0;
    let totalLiabilityPaymentsPeriod = 0;
    let totalPrincipalPaidPeriod = 0;
    let totalInterestPaidPeriod = 0;
    let totalGoalContributionsPeriod = 0;

    // 1. Investments
    const investmentSummaries = allInvestments.map((inv) => {
      let periodContributed = 0;
      let periodExpected = 0;
      let periodInterestReceived = 0;

      if (Array.isArray(inv.sipContributions)) {
        inv.sipContributions.forEach((sc) => {
          const scDate = sc.paidDate ? new Date(sc.paidDate) : (sc.dueDate ? new Date(sc.dueDate) : null);
          if (scDate && scDate >= periodStartDate && scDate <= periodEndDate) {
            periodExpected += safeNum(sc.amount);
            if (sc.status === "Paid") {
              periodContributed += safeNum(sc.amount);
              ledger.push({
                date: sc.paidDate || sc.dueDate,
                dueDate: sc.dueDate,
                paidDate: sc.paidDate,
                category: "Investment",
                name: inv.name,
                type: inv.type || "SIP",
                description: `SIP Installment — ${inv.name}`,
                amount: safeNum(sc.amount),
                status: sc.status || "Paid",
                source: inv.autoPay?.bankName || "Bank Account",
              });
            }
          }
        });
      }

      if (Array.isArray(inv.transactions)) {
        inv.transactions.forEach((tx) => {
          const txDate = tx.date ? new Date(tx.date) : null;
          if (txDate && txDate >= periodStartDate && txDate <= periodEndDate) {
            if (tx.type === "Buy" || tx.type === "Additional Investment" || tx.type === "Contribution") {
              periodContributed += safeNum(tx.amount);
              ledger.push({
                date: tx.date,
                category: "Investment",
                name: inv.name,
                type: inv.type,
                description: `${tx.type} — ${inv.name}`,
                amount: safeNum(tx.amount),
                status: "Completed",
                source: "Direct",
              });
            }
          }
        });
      }

      if (Array.isArray(inv.interestTransactions)) {
        inv.interestTransactions.forEach((itx) => {
          const itxDate = itx.date ? new Date(itx.date) : null;
          if (itxDate && itxDate >= periodStartDate && itxDate <= periodEndDate) {
            periodInterestReceived += safeNum(itx.amount);
            ledger.push({
              date: itx.date,
              category: "Investment Interest",
              name: inv.name,
              type: "Fixed Deposit",
              description: `Interest Payout — ${inv.name}`,
              amount: safeNum(itx.amount),
              status: "Received",
              source: inv.institution || "Bank",
            });
          }
        });
      }

      totalInvestmentContributionsPeriod += periodContributed;

      return {
        id: inv._id,
        name: inv.name,
        type: inv.type,
        createdAt: inv.createdAt,
        startDate: inv.startDate || inv.createdAt,
        maturityDate: inv.maturityDate,
        status: inv.status || "Active",
        principalAmount: safeNum(inv.principalAmount || inv.amount),
        currentValue: safeNum(inv.currentValue !== undefined ? inv.currentValue : inv.amount),
        estimatedMaturityAmount: safeNum(inv.maturityAmount || inv.estimatedMaturityAmount),
        actualMaturityValue: safeNum(inv.actualMaturityValue),
        monthlyContribution: safeNum(inv.monthlyContribution || (inv.type === "SIP" ? inv.amount : 0)),
        dueDay: inv.dueDay || (inv.reminder && inv.reminder.contributionDay) || null,
        interestRate: safeNum(inv.interestRate),
        institution: inv.institution || inv.broker || inv.amc || "",
        periodContributed,
        periodExpected,
        periodInterestReceived,
        hasActivityInPeriod: periodContributed > 0 || periodInterestReceived > 0,
      };
    });

    // 2. Insurance
    const insuranceSummaries = allInsurances.map((ins) => {
      let periodPaid = 0;
      if (Array.isArray(ins.payments)) {
        ins.payments.forEach((p) => {
          const pDate = p.paidDate ? new Date(p.paidDate) : (p.date ? new Date(p.date) : null);
          if (pDate && pDate >= periodStartDate && pDate <= periodEndDate) {
            if (p.status === "Paid" || p.paid) {
              periodPaid += safeNum(p.amount);
              ledger.push({
                date: p.paidDate || p.dueDate || p.date,
                dueDate: p.dueDate,
                paidDate: p.paidDate,
                category: "Insurance",
                name: ins.name,
                type: ins.type,
                description: `Premium Payment — ${ins.name}`,
                amount: safeNum(p.amount),
                status: p.status || "Paid",
                source: ins.provider || "Insurer",
              });
            }
          }
        });
      }

      totalInsurancePremiumsPeriod += periodPaid;

      return {
        id: ins._id,
        name: ins.name,
        type: ins.type,
        provider: ins.provider,
        policyNumber: ins.policyNumber,
        coverageAmount: safeNum(ins.coverageAmount || ins.sumAssured),
        premiumAmount: safeNum(ins.premiumAmount),
        premiumFrequency: ins.premiumFrequency || "Month",
        premiumDueDay: ins.premiumDueDay || (ins.startDate ? new Date(ins.startDate).getDate() : null),
        createdAt: ins.createdAt,
        startDate: ins.startDate || ins.createdAt,
        endDate: ins.endDate,
        renewalDate: ins.renewalDate,
        maturityDate: ins.maturityDate,
        status: ins.status || "Active",
        periodPaid,
        hasActivityInPeriod: periodPaid > 0,
      };
    });

    // 3. Liabilities
    const liabilitySummaries = allLiabilities.map((liab) => {
      let periodPaid = 0;
      let periodPrincipal = 0;
      let periodInterest = 0;

      if (Array.isArray(liab.payments)) {
        liab.payments.forEach((p) => {
          const pDate = p.paidDate ? new Date(p.paidDate) : (p.date ? new Date(p.date) : null);
          if (pDate && pDate >= periodStartDate && pDate <= periodEndDate) {
            if (p.status === "Paid" || p.paid) {
              const pAmt = safeNum(p.amount);
              const princ = safeNum(p.principalComponent) || pAmt;
              const intC = safeNum(p.interestComponent);
              periodPaid += pAmt;
              periodPrincipal += princ;
              periodInterest += intC;

              ledger.push({
                date: p.paidDate || p.dueDate || p.date,
                dueDate: p.dueDate,
                paidDate: p.paidDate,
                category: "Liability",
                name: liab.name,
                type: liab.type,
                description: `${p.type || "EMI Payment"} — ${liab.name}`,
                amount: pAmt,
                principalComponent: princ,
                interestComponent: intC,
                status: p.status || "Paid",
                source: liab.lender || "Lender",
              });
            }
          }
        });
      }

      totalLiabilityPaymentsPeriod += periodPaid;
      totalPrincipalPaidPeriod += periodPrincipal;
      totalInterestPaidPeriod += periodInterest;

      return {
        id: liab._id,
        name: liab.name,
        type: liab.type,
        lender: liab.lender,
        principalAmount: safeNum(liab.principalAmount),
        remainingAmount: safeNum(liab.remainingAmount !== undefined ? liab.remainingAmount : liab.principalAmount),
        monthlyEMI: safeNum(liab.monthlyEMI || liab.minimumDue),
        interestRate: safeNum(liab.interestRate),
        createdAt: liab.createdAt,
        startDate: liab.startDate || liab.createdAt,
        nextDueDate: liab.nextDueDate,
        dueDay: liab.dueDay || (liab.nextDueDate ? new Date(liab.nextDueDate).getDate() : null),
        status: liab.status || "Active",
        periodPaid,
        periodPrincipal,
        periodInterest,
        hasActivityInPeriod: periodPaid > 0,
      };
    });

    // 4. Saving Goals
    const savingGoalSummaries = allSavingGoals.map((goal) => {
      let periodContributed = 0;
      if (Array.isArray(goal.contributions)) {
        goal.contributions.forEach((c) => {
          const cDate = c.date ? new Date(c.date) : (c.createdAt ? new Date(c.createdAt) : null);
          if (cDate && cDate >= periodStartDate && cDate <= periodEndDate) {
            periodContributed += safeNum(c.amount);
            ledger.push({
              date: c.date || c.createdAt,
              category: "Saving Goal",
              name: goal.goalName || goal.name,
              type: goal.category || "Saving Goal",
              description: `Contribution — ${goal.goalName || goal.name}`,
              amount: safeNum(c.amount),
              status: "Saved",
              source: c.source || "Monthly Savings",
            });
          }
        });
      }

      totalGoalContributionsPeriod += periodContributed;
      const targetAmount = safeNum(goal.targetAmount);
      const totalSaved = safeNum(goal.currentAmount || goal.savedAmount);
      const progressPercentage = targetAmount > 0 ? Math.min(100, Math.round((totalSaved / targetAmount) * 100)) : 0;
      const remainingAmount = Math.max(0, targetAmount - totalSaved);

      return {
        id: goal._id,
        name: goal.goalName || goal.name,
        category: goal.category,
        targetAmount,
        totalSaved,
        progressPercentage,
        remainingAmount,
        periodContributed,
        createdAt: goal.createdAt,
        startDate: goal.startDate || goal.createdAt,
        targetDate: goal.targetDate || goal.deadline,
        status: goal.status || "Active",
        hasActivityInPeriod: periodContributed > 0,
      };
    });

    // 5. Additional Incomes
    additionalIncomes.forEach((ai) => {
      ledger.push({
        date: ai.date || new Date(ai.year, ai.month - 1, 1),
        category: "Additional Income",
        name: ai.source || "Additional Income",
        type: "Income",
        description: ai.note ? `${ai.source} (${ai.note})` : ai.source,
        amount: safeNum(ai.amount),
        status: "Received",
        source: ai.source,
      });
    });

    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    // ============================================================
    // C. PLAN LIFECYCLE: CREATED, STARTED, MATURED & UPCOMING
    // ============================================================
    const plansCreatedThisPeriod = [];
    const plansStartedThisPeriod = [];
    const maturitiesInPeriod = [];
    const upcomingFutureEvents = [];

    // Helper to evaluate item dates
    const evaluateItemLifecycle = (item, category, name, type) => {
      const createdD = item.createdAt ? new Date(item.createdAt) : null;
      if (createdD && createdD >= periodStartDate && createdD <= periodEndDate) {
        plansCreatedThisPeriod.push({
          id: item._id,
          category,
          name,
          type,
          createdDate: item.createdAt,
          details: item.details || "",
        });
      }

      const startD = item.startDate ? new Date(item.startDate) : null;
      if (startD && startD >= periodStartDate && startD <= periodEndDate) {
        plansStartedThisPeriod.push({
          id: item._id,
          category,
          name,
          type,
          startDate: item.startDate,
          details: item.details || "",
        });
      }

      // Check maturity / expiry / renewal
      const matD = item.maturityDate ? new Date(item.maturityDate) : null;
      const renewD = item.renewalDate ? new Date(item.renewalDate) : null;
      const endD = item.endDate ? new Date(item.endDate) : null;
      const targetD = item.targetDate ? new Date(item.targetDate) : null;

      const eventDate = matD || renewD || endD || targetD;
      if (eventDate) {
        if (eventDate >= periodStartDate && eventDate <= periodEndDate) {
          maturitiesInPeriod.push({
            id: item._id,
            category,
            name,
            type,
            event: matD ? "Maturity" : (renewD ? "Renewal" : (targetD ? "Goal Target Deadline" : "Expiry")),
            eventDate,
            expectedAmount: safeNum(item.estimatedMaturityAmount || item.targetAmount || item.principalAmount),
            actualAmount: safeNum(item.actualMaturityValue || item.totalSaved),
            status: item.status || "Completed",
          });
        } else if (eventDate > periodEndDate) {
          const daysRemaining = Math.ceil((eventDate.getTime() - periodEndDate.getTime()) / (1000 * 60 * 60 * 24));
          const monthsRemaining = Math.max(1, Math.round(daysRemaining / 30));
          upcomingFutureEvents.push({
            id: item._id,
            category,
            name,
            type,
            event: matD ? `Upcoming Maturity — ${MONTH_NAMES[eventDate.getMonth()]} ${eventDate.getFullYear()}` : (renewD ? `Upcoming Renewal — ${MONTH_NAMES[eventDate.getMonth()]} ${eventDate.getFullYear()}` : `Upcoming Deadline — ${MONTH_NAMES[eventDate.getMonth()]} ${eventDate.getFullYear()}`),
            eventDate,
            expectedAmount: safeNum(item.estimatedMaturityAmount || item.targetAmount || item.principalAmount),
            daysRemaining,
            monthsRemaining,
            status: "Upcoming",
          });
        }
      }
    };

    allInvestments.forEach(i => evaluateItemLifecycle(i, "Investment", i.name, i.type));
    allInsurances.forEach(ins => evaluateItemLifecycle(ins, "Insurance", ins.name, ins.type));
    allLiabilities.forEach(l => evaluateItemLifecycle(l, "Liability", l.name, l.type));
    allSavingGoals.forEach(g => evaluateItemLifecycle(g, "Saving Goal", g.goalName || g.name, g.category));

    // ============================================================
    // D. NET WORTH CALCULATION & TIMELINE
    // ============================================================
    // Net Worth = Assets (Cash + Investments + Goal Funds) - Liabilities (Loans + Credit Cards)
    const totalInvestmentsVal = allInvestments.reduce((sum, i) => sum + safeNum(i.currentValue !== undefined ? i.currentValue : i.amount), 0);
    const totalGoalFundsVal = allSavingGoals.reduce((sum, g) => sum + safeNum(g.currentAmount || g.savedAmount), 0);
    const totalLiabilitiesVal = allLiabilities.reduce((sum, l) => sum + safeNum(l.remainingAmount !== undefined ? l.remainingAmount : l.principalAmount), 0);

    const closingTotalAssets = closingBalance + totalInvestmentsVal + totalGoalFundsVal;
    const closingNetWorth = closingTotalAssets - totalLiabilitiesVal;

    const openingTotalAssets = openingBalance + totalInvestmentsVal + totalGoalFundsVal;
    const openingNetWorth = openingTotalAssets - totalLiabilitiesVal;

    const netWorthChange = closingNetWorth - openingNetWorth;
    const netWorthChangePct = openingNetWorth !== 0 ? ((netWorthChange / Math.abs(openingNetWorth)) * 100).toFixed(1) : null;

    // Timeline matching duration points
    const netWorthPoints = months.map((m) => {
      const rec = monthlyFinanceRecords.find((r) => r.month === m);
      const mClosing = rec ? safeNum(rec.closingBalance) : (openingBalance + (totalSavings / months.length));
      const mAssets = mClosing + totalInvestmentsVal + totalGoalFundsVal;
      const mNetWorth = rec && rec.netWorth !== undefined && rec.netWorth !== null ? rec.netWorth : (mAssets - totalLiabilitiesVal);

      return {
        month: m,
        monthName: MONTH_NAMES[m - 1],
        shortLabel: MONTH_NAMES[m - 1].slice(0, 3),
        netWorth: mNetWorth,
        assets: mAssets,
        liabilities: totalLiabilitiesVal,
        cashBalance: mClosing,
        isRecorded: !!rec,
      };
    });

    // ============================================================
    // E. OVERALL FINANCIAL HEALTH EVALUATION
    // ============================================================
    const overallHealth = computeFinancialHealthScore({
      income: totalIncome,
      expenses: totalExpenses,
      commitments: totalInvestmentContributionsPeriod + totalInsurancePremiumsPeriod + totalLiabilityPaymentsPeriod + totalGoalContributionsPeriod,
      availableToAllocate,
    });

    // ============================================================
    // F. INSIGHTS & SUGGESTIONS
    // ============================================================
    const insights = [...overallHealth.insights];
    const suggestions = [];

    if (duration === "monthly") {
      if (totalSavings > 0) suggestions.push(`Your net monthly savings reached ₹${totalSavings.toLocaleString("en-IN")}. Consider directing unallocated cash into high-priority saving goals.`);
      if (availableToAllocate > 0) suggestions.push(`You maintain ₹${availableToAllocate.toLocaleString("en-IN")} in available allocation capacity for new investments or debt prepayments.`);
    } else if (duration === "quarterly") {
      suggestions.push(`Quarterly total cash savings of ₹${totalSavings.toLocaleString("en-IN")} supported ₹${totalInvestmentContributionsPeriod.toLocaleString("en-IN")} in investments.`);
      if (totalPrincipalPaidPeriod > 0) suggestions.push(`Liability principal reduced by ₹${totalPrincipalPaidPeriod.toLocaleString("en-IN")} during this quarter.`);
    } else if (duration === "halfYear") {
      suggestions.push(`Over this 6-month period, you committed ₹${(totalInvestmentContributionsPeriod + totalGoalContributionsPeriod).toLocaleString("en-IN")} toward wealth accumulation.`);
      if (totalLiabilityPaymentsPeriod > 0) suggestions.push(`Consolidated debt servicing accounted for ₹${totalLiabilityPaymentsPeriod.toLocaleString("en-IN")}.`);
    } else {
      // Yearly
      suggestions.push(`Annual income of ₹${totalIncome.toLocaleString("en-IN")} generated ₹${totalSavings.toLocaleString("en-IN")} in cumulative savings.`);
      suggestions.push("Evaluate year-end tax optimization, portfolio rebalancing, and emergency liquidity safeguards.");
    }

    // Future maturity suggestions
    if (upcomingFutureEvents.length > 0) {
      const nextMat = upcomingFutureEvents[0];
      suggestions.push(`${nextMat.name} has a scheduled ${nextMat.event} in ~${nextMat.monthsRemaining} month(s). Plan your liquidity strategy prior to execution.`);
    }

    const addIncomeSum = additionalIncomes.reduce((s, a) => s + safeNum(a.amount), 0);
    const totalActualOutflowsPeriod =
      totalExpenses +
      totalInvestmentContributionsPeriod +
      totalInsurancePremiumsPeriod +
      totalLiabilityPaymentsPeriod +
      totalGoalContributionsPeriod;

    const fundsBeforeOutflowsPeriod = openingBalance + totalIncome;
    const periodClosingBalance = fundsBeforeOutflowsPeriod - totalActualOutflowsPeriod;
    const periodAvailableToAllocate = periodClosingBalance;

    const fmtINR = (val) => `₹${Math.round(safeNum(val)).toLocaleString("en-IN")}`;

    let periodExplanation = "";
    if (prevRecord) {
      const prevLabel = `${MONTH_NAMES[(prevRecord.month || 1) - 1]} ${prevRecord.year}`;
      periodExplanation = `Your ${periodLabel} Available to Allocate is ${fmtINR(periodAvailableToAllocate)}. You started the period with ${fmtINR(openingBalance)} carried forward from ${prevLabel} closing balance, received ${fmtINR(totalIncome)} of total income, and had ${fmtINR(totalActualOutflowsPeriod)} of actual recorded cash outflows during the period.`;
    } else {
      periodExplanation = `Your ${periodLabel} Available to Allocate is ${fmtINR(periodAvailableToAllocate)}. You started with ${fmtINR(openingBalance)} in initial existing cash and savings, received ${fmtINR(totalIncome)} of total income, and had ${fmtINR(totalActualOutflowsPeriod)} of actual recorded cash outflows.`;
    }

    const calculationBreakdown = {
      periodLabel,
      openingBalance: {
        amount: openingBalance,
        sourceType: prevRecord ? "previous_month_closing" : "initial_setup",
        sourceDescription: prevRecord
          ? `Carried forward from ${MONTH_NAMES[(prevRecord.month || 1) - 1]} ${prevRecord.year} closing balance`
          : "Initial user-entered starting balance",
        previousMonth: prevRecord ? `${prevRecord.year}-${String(prevRecord.month).padStart(2, "0")}` : null,
        previousMonthLabel: prevRecord ? `${MONTH_NAMES[(prevRecord.month || 1) - 1]} ${prevRecord.year}` : null,
        previousMonthClosingBalance: prevRecord ? safeNum(prevRecord.closingBalance !== undefined ? prevRecord.closingBalance : prevRecord.cashBalance) : null,
      },
      inflow: {
        baseIncome: totalIncome - addIncomeSum,
        additionalIncome: addIncomeSum,
        totalIncome,
      },
      fundsBeforeOutflows: fundsBeforeOutflowsPeriod,
      outflows: {
        expenses: totalExpenses,
        investments: totalInvestmentContributionsPeriod,
        hasInvestments: totalInvestmentContributionsPeriod > 0,
        goalContributions: totalGoalContributionsPeriod,
        hasGoals: totalGoalContributionsPeriod > 0,
        insurancePayments: totalInsurancePremiumsPeriod,
        hasInsurance: totalInsurancePremiumsPeriod > 0,
        liabilityPayments: totalLiabilityPaymentsPeriod,
        hasLiabilities: totalLiabilityPaymentsPeriod > 0,
        other: 0,
        hasOther: false,
        totalActualOutflows: totalActualOutflowsPeriod,
      },
      closingBalance: periodClosingBalance,
      availableToAllocate: periodAvailableToAllocate,
      explanation: periodExplanation,
    };

    const hasAnyActivity = totalIncome > 0 || totalExpenses > 0 || totalInvestmentContributionsPeriod > 0 || totalGoalContributionsPeriod > 0 || totalLiabilityPaymentsPeriod > 0 || ledger.length > 0;

    return res.status(200).json({
      success: true,
      report: {
        header: {
          userName: user.name,
          userEmail: user.email,
          duration,
          year: currentYearNum,
          month: duration === "monthly" ? months[0] : null,
          quarter: duration === "quarterly" ? Number(quarter) || 1 : null,
          half: duration === "halfYear" ? Number(half) || 1 : null,
          periodLabel,
          periodRangeLabel,
          generatedAt: new Date().toISOString(),
        },
        hasAnyActivity,
        financialSummary: {
          openingBalance,
          totalIncome,
          totalExpenses,
          totalSavings,
          closingBalance: periodClosingBalance,
          availableToAllocate: periodAvailableToAllocate,
          avgMonthlyIncome,
          avgMonthlyExpenses,
          avgMonthlySavings,
          totalInvestmentContributionsPeriod,
          totalInsurancePremiumsPeriod,
          totalLiabilityPaymentsPeriod,
          totalPrincipalPaidPeriod,
          totalInterestPaidPeriod,
          totalGoalContributionsPeriod,
        },
        calculationBreakdown,
        netWorthSummary: {
          openingNetWorth,
          closingNetWorth,
          netWorthChange,
          netWorthChangePct,
          totalAssets: closingTotalAssets,
          totalLiabilities: totalLiabilitiesVal,
          history: netWorthPoints,
        },
        financialHealth: overallHealth,
        monthDetails,
        plansLifecycle: {
          plansCreatedThisPeriod,
          plansStartedThisPeriod,
          maturitiesInPeriod,
          upcomingFutureEvents,
          noMaturityMessage: maturitiesInPeriod.length === 0 ? "No maturity, renewal, or expiry activity in this period." : null,
        },
        plans: {
          investments: investmentSummaries,
          insurance: insuranceSummaries,
          liabilities: liabilitySummaries,
          savingGoals: savingGoalSummaries,
        },
        transactionsLedger: ledger,
        insights,
        suggestions,
      }
    });

  } catch (error) {
    console.error("Report Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate financial report."
    });
  }
};

module.exports = {
  getFinancialReport,
};
