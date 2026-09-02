// ============================================================
// FINANCEOS - AI ADVISER SERVICE
// Centralized Engine (Official @google/genai SDK + Math + MongoDB)
// ============================================================

const { GoogleGenAI } = require("@google/genai");
const User = require("../models/User");
const MonthlyFinance = require("../models/MonthlyFinance");
const Investment = require("../models/Investment");
const Insurance = require("../models/Insurance");
const Liability = require("../models/Liability");
const SavingGoal = require("../models/SavingGoal");
const AdditionalIncome = require("../models/AdditionalIncome");
const AISuggestion = require("../models/AISuggestion");
const { getVerifiedMarketBenchmarks } = require("./marketDataService");

// ============================================================
// HELPER UTILITIES
// ============================================================

function safeNum(val, fallback = 0) {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

function formatINR(amount) {
  return "₹" + safeNum(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

// ============================================================
// CALCULATE USER FINANCIAL SNAPSHOT (SAFE & NORMALIZED)
// ============================================================

async function calculateFinancialSnapshot(userId, targetMonthStr = "") {
  let targetYear = new Date().getFullYear();
  let targetMonth = new Date().getMonth() + 1;

  if (targetMonthStr && /^\d{4}-\d{1,2}$/.test(targetMonthStr)) {
    const [y, m] = targetMonthStr.split("-").map(Number);
    if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) {
      targetYear = y;
      targetMonth = m;
    }
  }

  // 1. Fetch user data in parallel
  const [
    user,
    monthlyFinances,
    investments,
    insurances,
    liabilities,
    savingGoals,
    additionalIncomes,
  ] = await Promise.all([
    User.findById(userId).lean(),
    MonthlyFinance.find({ user: userId }).sort({ year: -1, month: -1 }).lean(),
    Investment.find({ user: userId }).lean(),
    Insurance.find({ user: userId }).lean(),
    Liability.find({ user: userId }).lean(),
    SavingGoal.find({ user: userId }).lean(),
    AdditionalIncome.find({ user: userId }).lean(),
  ]);

  // 2. Select targeted Monthly Finance or latest recorded
  const targetedMF = monthlyFinances.find(
    (mf) => mf.month === targetMonth && mf.year === targetYear
  ) || monthlyFinances[0] || {};

  const monthlyIncome = safeNum(targetedMF.income);
  const monthlyExpenses = safeNum(targetedMF.expenses);
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

  // 3. Additional Incomes (active for target period)
  const totalAdditionalIncome = additionalIncomes
    .filter((ai) => String(ai.status || "active").toLowerCase() === "active")
    .reduce((acc, ai) => acc + safeNum(ai.amount), 0);

  // 4. Investment commitments & assets
  let monthlyInvestmentCommitment = 0;
  let totalInvestmentsValue = 0;
  let maturedInvestments = [];
  let activeSIPs = [];
  let activeFDs = [];
  let goldInvestments = [];
  let stockInvestments = [];
  let mutualFundInvestments = [];

  investments.forEach((inv) => {
    const status = String(inv.status || "active").toLowerCase();
    const type = String(inv.type || "").toUpperCase();
    const amount = safeNum(inv.monthlyContribution || inv.amount || inv.principalAmount);

    if (status === "active") {
      if (type.includes("SIP") || inv.frequency === "Monthly" || inv.monthlyContribution > 0) {
        monthlyInvestmentCommitment += amount;
        activeSIPs.push(inv);
      } else if (inv.frequency === "Quarterly") {
        monthlyInvestmentCommitment += amount / 3;
      } else if (inv.frequency === "Yearly") {
        monthlyInvestmentCommitment += amount / 12;
      }

      if (type.includes("FD") || type.includes("FIXED")) {
        activeFDs.push(inv);
      } else if (type.includes("GOLD")) {
        goldInvestments.push(inv);
      } else if (type.includes("STOCK") || type.includes("EQUITY")) {
        stockInvestments.push(inv);
      } else if (type.includes("MUTUAL") || type.includes("MF")) {
        mutualFundInvestments.push(inv);
      }

      totalInvestmentsValue += safeNum(inv.currentValue !== undefined ? inv.currentValue : (inv.principalAmount || inv.amount));
    } else if (status === "matured" || status === "completed") {
      maturedInvestments.push(inv);
      totalInvestmentsValue += safeNum(inv.actualMaturityValue || inv.estimatedMaturityAmount || inv.amount);
    }
  });

  // 5. Insurance commitments
  let monthlyInsuranceCommitment = 0;
  let totalInsurancePremiums = 0;
  insurances.forEach((ins) => {
    const status = String(ins.status || "active").toLowerCase();
    const premium = safeNum(ins.premiumAmount || ins.monthlyPremium);
    const freq = String(ins.premiumFrequency || "Monthly").toLowerCase();

    if (status === "active") {
      totalInsurancePremiums += premium;
      if (freq === "yearly" || freq === "annual" || freq === "annually") {
        monthlyInsuranceCommitment += premium / 12;
      } else if (freq === "half-yearly" || freq === "semi-annual") {
        monthlyInsuranceCommitment += premium / 6;
      } else if (freq === "quarterly") {
        monthlyInsuranceCommitment += premium / 3;
      } else {
        monthlyInsuranceCommitment += premium;
      }
    }
  });

  // 6. Liabilities commitments & debt balance
  let monthlyLiabilityCommitment = 0;
  let totalLiabilitiesBalance = 0;
  liabilities.forEach((liab) => {
    const status = String(liab.status || "active").toLowerCase();
    if (status === "active") {
      monthlyLiabilityCommitment += safeNum(liab.monthlyEMI || liab.minimumDue || liab.minimumPayment);
      totalLiabilitiesBalance += safeNum(liab.remainingAmount !== undefined ? liab.remainingAmount : (liab.principalAmount || liab.totalAmount));
    }
  });

  // 7. Saving Goals & Accumulated funds
  let totalGoalSaved = 0;
  let monthlyGoalCommitment = 0;
  let nearCompletionGoals = [];
  savingGoals.forEach((g) => {
    const status = String(g.status || "active").toLowerCase();
    const target = safeNum(g.targetAmount);
    const saved = safeNum(g.currentAmount || g.savedAmount || g.totalContributed);
    const mContrib = safeNum(g.monthlyContribution);

    if (status === "active") {
      totalGoalSaved += saved;
      monthlyGoalCommitment += mContrib;
      if (target > 0 && saved / target >= 0.75 && saved < target) {
        nearCompletionGoals.push(g);
      }
    }
  });

  // 8. Aggregate commitments & available-to-allocate
  const totalCommitments =
    monthlyInvestmentCommitment +
    monthlyInsuranceCommitment +
    monthlyLiabilityCommitment +
    monthlyGoalCommitment;

  const openingBalance = safeNum(targetedMF.openingBalance !== undefined ? targetedMF.openingBalance : targetedMF.cashBalance);
  const closingBalance = targetedMF.closingBalance !== undefined ? safeNum(targetedMF.closingBalance) : (openingBalance + monthlySavings - totalCommitments);
  const availableToAllocate = targetedMF.availableToAllocate !== undefined ? safeNum(targetedMF.availableToAllocate) : closingBalance;

  // 9. Total Net Worth
  const totalAssets = closingBalance + totalInvestmentsValue + totalGoalSaved;
  const netWorth = totalAssets - totalLiabilitiesBalance;

  // 10. Emergency Fund Runway (months)
  const emergencyFundMonths =
    monthlyExpenses > 0 ? (totalGoalSaved + Math.max(0, closingBalance)) / monthlyExpenses : 0;

  return {
    user: {
      name: user?.name || "FinanceOS User",
      email: user?.email || "",
      city: user?.city || "",
      state: user?.state || "",
      currency: "INR (₹)",
    },
    snapshot: {
      targetPeriod: `${targetYear}-${String(targetMonth).padStart(2, "0")}`,
      targetPeriodLabel: `${targetYear} Month ${targetMonth}`,
      income: monthlyIncome,
      expenses: monthlyExpenses,
      monthlySavings,
      savingsRate: Number(savingsRate.toFixed(1)),
      openingBalance: Math.round(openingBalance),
      closingBalance: Math.round(closingBalance),
      totalCommitments: Math.round(totalCommitments),
      monthlyInvestmentCommitment: Math.round(monthlyInvestmentCommitment),
      monthlyInsuranceCommitment: Math.round(monthlyInsuranceCommitment),
      monthlyLiabilityCommitment: Math.round(monthlyLiabilityCommitment),
      monthlyGoalCommitment: Math.round(monthlyGoalCommitment),
      availableToAllocate: Math.round(availableToAllocate),
      totalInvestments: Math.round(totalInvestmentsValue),
      totalLiabilities: Math.round(totalLiabilitiesBalance),
      totalInsurancePremiums: Math.round(totalInsurancePremiums),
      totalGoalSaved: Math.round(totalGoalSaved),
      netWorth: Math.round(netWorth),
      emergencyFundMonths: Number(emergencyFundMonths.toFixed(1)),
      activeGoalsCount: savingGoals.filter((g) => g.status === "active").length,
      maturedInvestmentsCount: maturedInvestments.length,
      activeSIPsCount: activeSIPs.length,
      activeFDsCount: activeFDs.length,
      goldHoldingsCount: goldInvestments.length,
      stockHoldingsCount: stockInvestments.length,
    },
    items: {
      maturedInvestments: maturedInvestments.map(i => ({ name: i.name, type: i.type, amount: i.actualMaturityValue || i.estimatedMaturityAmount || i.amount })),
      nearCompletionGoals: nearCompletionGoals.map(g => ({ name: g.goalName || g.name, target: g.targetAmount, saved: g.currentAmount || g.savedAmount })),
      activeSIPs: activeSIPs.map(s => ({ name: s.name, amount: s.monthlyContribution || s.amount, currentValue: s.currentValue })),
      activeFDs: activeFDs.map(f => ({ name: f.name, principal: f.principalAmount || f.amount, rate: f.interestRate, maturityDate: f.maturityDate })),
      goldInvestments: goldInvestments.map(g => ({ name: g.name, value: g.currentValue || g.amount })),
      stockInvestments: stockInvestments.map(s => ({ name: s.name, value: s.currentValue || s.amount })),
      liabilities: liabilities.filter((l) => l.status === "active").map(l => ({ name: l.name, type: l.type, remaining: l.remainingAmount || l.principalAmount, emi: l.monthlyEMI, rate: l.interestRate })),
      insurances: insurances.filter((i) => i.status === "active").map(i => ({ name: i.name, type: i.type, coverage: i.coverageAmount, premium: i.premiumAmount })),
      savingGoals: savingGoals.filter((g) => g.status === "active").map(g => ({ name: g.goalName || g.name, target: g.targetAmount, saved: g.currentAmount || g.savedAmount, monthly: g.monthlyContribution })),
    },
  };
}

// ============================================================
// GEMINI API INVOCATION WITH OFFICIAL @google/genai SDK
// ============================================================

async function callGeminiAdviser(promptData) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "mock_or_empty") {
    throw new Error("GEMINI_API_KEY is not configured. Falling back to deterministic analysis engine.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const systemInstruction = `You are the FinanceOS Senior Financial Adviser.
You analyze real-world personal financial positions and provide objective, personalized, mathematically verified financial suggestions.

CRITICAL RULES:
1. NEVER invent or fabricate market prices, interest rates, returns, NAVs, or locations.
2. If real-world data is referenced, use the verified benchmarks provided below.
3. Recommendations must answer:
   - What should the user do with available money (Available to Allocate)?
   - Should they INVEST, CONSIDER, WAIT, AVOID FOR NOW, SAVE FIRST, PAY DEBT FIRST, DIVERSIFY, or KEEP LIQUID?
   - How to improve Net Worth (Assets minus Liabilities)?
4. If emergency fund is low (< 3 months of expenses) or debt burden is high, prioritize SAVE_FIRST or DEBT_FIRST over new volatile investments.
5. Provide actionable decisions from: ["INVEST", "CONSIDER", "WAIT", "AVOID_FOR_NOW", "SAVE_FIRST", "DEBT_FIRST", "DIVERSIFY", "REVIEW_EXISTING", "HOLD_LIQUIDITY", "INCREASE_EXISTING", "REDUCE_CONCENTRATION"].

OUTPUT SCHEMA (MUST BE PURE JSON):
{
  "title": "Short punchy headline summary (max 10 words)",
  "summary": "2-3 concise sentences summarizing current situation and primary action.",
  "category": "Main Category (e.g. Wealth Growth, Debt Optimization, Emergency Reserve, Gold Allocation, Fixed Income)",
  "overallHealth": "Good | Moderate | Needs Attention",
  "financialPosition": {
    "availableToAllocate": ${promptData.snapshot.availableToAllocate},
    "netWorth": ${promptData.snapshot.netWorth},
    "totalAssets": ${promptData.snapshot.totalInvestments + promptData.snapshot.totalGoalSaved + promptData.snapshot.closingBalance},
    "totalLiabilities": ${promptData.snapshot.totalLiabilities}
  },
  "recommendations": [
    {
      "category": "Gold | Stocks | Mutual Funds | Fixed Deposit | Debt Paydown | Emergency Fund | Net Worth Growth",
      "priority": "High | Medium | Low",
      "decision": "INVEST | CONSIDER | WAIT | AVOID_FOR_NOW | SAVE_FIRST | DEBT_FIRST | DIVERSIFY | REVIEW_EXISTING | HOLD_LIQUIDITY | INCREASE_EXISTING",
      "title": "Specific recommendation title",
      "message": "Direct message explaining what to do",
      "reason": "Detailed mathematical/financial rationale referencing user figures",
      "suggestedAction": "Suggested next step in FinanceOS (e.g., Review Saving Goals / Add SIP)",
      "suggestedAmount": 0,
      "currency": "INR",
      "relatedModule": "Investments | Liabilities | Saving Goals | Monthly Finance",
      "numericFacts": [
        {
          "label": "Fact name (e.g. Current 24K Gold Price / SBI 1-3 Yr FD Rate)",
          "value": "7450 or Rate",
          "unit": "₹ / gram or %",
          "source": "IBJA / RBI / NSE",
          "asOf": "${promptData.market.asOfFormatted}",
          "status": "Current / Verified"
        }
      ],
      "sources": [
        {
          "title": "Source name",
          "url": "https://...",
          "sourceType": "market-data | official | web"
        }
      ]
    }
  ],
  "keyObservations": [
    "Observation 1 with exact rupee numbers",
    "Observation 2 with commitment/surplus numbers",
    "Observation 3 with debt/asset ratio"
  ],
  "detailedAdvice": "2-3 paragraphs of strategic financial guidance.",
  "actionSteps": [
    {
      "step": 1,
      "title": "Step 1 title",
      "description": "Concrete action step with exact suggested rupee allocation",
      "priority": "high",
      "suggestedAmount": 5000
    }
  ]
}`;

  const userPrompt = `
Analyze the following user's verified financial snapshot and provide structured strategic recommendations:

User Profile:
- Name: ${promptData.user.name}
- Location: ${promptData.user.city || promptData.user.state || "India"}
- Analysis Period: ${promptData.snapshot.targetPeriod}

Financial Snapshot:
- Monthly Income: ${formatINR(promptData.snapshot.income)}
- Monthly Expenses: ${formatINR(promptData.snapshot.expenses)}
- Net Monthly Savings: ${formatINR(promptData.snapshot.monthlySavings)} (${promptData.snapshot.savingsRate}% savings rate)
- Liquid Closing Cash: ${formatINR(promptData.snapshot.closingBalance)}
- Available to Allocate (Unallocated Surplus): ${formatINR(promptData.snapshot.availableToAllocate)}
- Total Active Monthly Commitments: ${formatINR(promptData.snapshot.totalCommitments)}
  * SIP / RD Commitments: ${formatINR(promptData.snapshot.monthlyInvestmentCommitment)}
  * Insurance Premiums: ${formatINR(promptData.snapshot.monthlyInsuranceCommitment)}
  * Loan EMIs: ${formatINR(promptData.snapshot.monthlyLiabilityCommitment)}
  * Goal Deposits: ${formatINR(promptData.snapshot.monthlyGoalCommitment)}
- Total Active Investments Valuation: ${formatINR(promptData.snapshot.totalInvestments)}
- Total Outstanding Liabilities (Debt): ${formatINR(promptData.snapshot.totalLiabilities)}
- Total Saved in Dedicated Goals: ${formatINR(promptData.snapshot.totalGoalSaved)}
- Current Net Worth: ${formatINR(promptData.snapshot.netWorth)}
- Emergency Runway: ${promptData.snapshot.emergencyFundMonths} months of expenses
- Active Goals: ${promptData.snapshot.activeGoalsCount}
- Active SIPs: ${promptData.snapshot.activeSIPsCount}
- Active FDs: ${promptData.snapshot.activeFDsCount}
- Gold Holdings: ${promptData.snapshot.goldHoldingsCount}
- Stock Holdings: ${promptData.snapshot.stockHoldingsCount}

Current Verified Market Benchmarks (${promptData.market.asOfFormatted}):
- 24K Gold Price: ₹${promptData.market.gold.pricePerGram24K} / gram (Source: ${promptData.market.gold.source})
- 22K Gold Price: ₹${promptData.market.gold.pricePerGram22K} / gram
- RBI Policy Repo Rate: ${promptData.market.fixedDeposit.rbiRepoRate} (Source: ${promptData.market.fixedDeposit.source})
- Top Tier-1 Bank Term FD Rates: ${promptData.market.fixedDeposit.tier1BankRates}
- CPI Retail Inflation: ${promptData.market.inflation.cpiInflationRate} (Source: ${promptData.market.inflation.source})
- Nifty 10-Yr Historical CAGR: ${promptData.market.equities.niftyHistoricalCAGR} (Source: ${promptData.market.equities.source})
- USD/INR Reference: ₹${promptData.market.foreignExchange.usdInrRate}

Context Trigger: ${promptData.contextType}
${promptData.targetItem ? `Target Item Details: ${JSON.stringify(promptData.targetItem)}` : ""}`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const rawText = response.text;
  if (!rawText) throw new Error("Empty response returned from Gemini.");

  const parsed = JSON.parse(rawText);
  if (!parsed.title || !parsed.summary) {
    throw new Error("Gemini response missing required title or summary.");
  }

  return {
    ...parsed,
    modelUsed: modelName,
  };
}

// ============================================================
// DETERMINISTIC RULE-BASED CALCULATION ENGINE (FALLBACK)
// ============================================================

function generateFallbackRecommendation(promptData) {
  const { snapshot, items, market } = promptData;
  const {
    income,
    expenses,
    monthlySavings,
    savingsRate,
    availableToAllocate,
    totalLiabilities,
    totalInvestments,
    totalGoalSaved,
    closingBalance,
    netWorth,
    emergencyFundMonths,
    maturedInvestmentsCount,
    activeSIPsCount,
    goldHoldingsCount,
  } = snapshot;

  const totalAssets = closingBalance + totalInvestments + totalGoalSaved;
  let title = "";
  let summary = "";
  let category = "Financial Strategy";
  let overallHealth = "Good";
  let keyObservations = [];
  let detailedAdvice = "";
  let actionSteps = [];
  let recommendations = [];

  // Scenario 1: Cash flow shortfall
  if (availableToAllocate < 0) {
    category = "Cash Flow Balance";
    overallHealth = "Needs Attention";
    title = `Rebalance Monthly Deficit of ${formatINR(Math.abs(availableToAllocate))}`;
    summary = `Your committed monthly outflows and living expenses exceed monthly inflows by ${formatINR(Math.abs(availableToAllocate))}. Rebalancing cash flow is essential to protect accumulated assets.`;

    keyObservations = [
      `Monthly income of ${formatINR(income)} is outweighed by ${formatINR(expenses)} expenses + ${formatINR(snapshot.totalCommitments)} commitments.`,
      `Net monthly deficit: ${formatINR(Math.abs(availableToAllocate))}.`,
      `Outstanding liabilities stand at ${formatINR(totalLiabilities)}.`,
    ];

    detailedAdvice = `Operating at a monthly shortfall drains liquid buffers. Review voluntary commitments such as discretionary SIP amounts or non-essential subscriptions until cash flow stabilizes. Prioritize covering fixed obligations first.`;

    recommendations.push({
      category: "Debt Optimization",
      priority: "High",
      decision: "HOLD_LIQUIDITY",
      title: "Pause Discretionary Outflows",
      message: `Temporarily pause optional investment additions until monthly cash flow is positive.`,
      reason: `Monthly commitments exceed income by ${formatINR(Math.abs(availableToAllocate))}.`,
      suggestedAction: "Review Plans & Commitments",
      suggestedAmount: Math.abs(availableToAllocate),
      currency: "INR",
      relatedModule: "Plans & Commitments",
      numericFacts: [
        {
          label: "Current Deficit",
          value: Math.abs(availableToAllocate),
          unit: "INR",
          source: "FinanceOS Cash Flow Engine",
          asOf: market.asOfFormatted,
          status: "Verified",
        },
      ],
      sources: [
        { title: "FinanceOS Ledger", url: "/monthly-finance", sourceType: "official" },
      ],
    });

    actionSteps = [
      {
        step: 1,
        title: "Audit Discretionary Expenses",
        description: `Reduce living costs by at least ${formatINR(Math.abs(availableToAllocate))} this month.`,
        priority: "high",
        suggestedAmount: Math.abs(availableToAllocate),
      },
    ];
  }
  // Scenario 2: High Debt Burden (> 50% of assets or high EMI load)
  else if (totalLiabilities > totalAssets * 0.5 && totalLiabilities > 0) {
    category = "Debt Optimization";
    overallHealth = "Moderate";
    title = `Prioritize Liability Reduction to Accelerate Net Worth`;
    summary = `Your liabilities of ${formatINR(totalLiabilities)} represent a significant drag on net worth (${formatINR(netWorth)}). Prepaying high-cost loans produces an immediate risk-free return.`;

    keyObservations = [
      `Total debt of ${formatINR(totalLiabilities)} exceeds 50% of total assets (${formatINR(totalAssets)}).`,
      `Current monthly surplus available for allocation: ${formatINR(availableToAllocate)}.`,
      `Emergency fund covers ${emergencyFundMonths} months of expenses.`,
    ];

    detailedAdvice = `Loan prepayment guarantees a return equal to the loan's borrowing interest rate (often 8.5% - 14% p.a.). Applying a portion of your ${formatINR(availableToAllocate)} monthly available surplus directly to principal reduction will speed up debt elimination.`;

    recommendations.push({
      category: "Debt Paydown",
      priority: "High",
      decision: "DEBT_FIRST",
      title: "Accelerate Loan Principal Repayment",
      message: `Direct ${formatINR(Math.round(availableToAllocate * 0.6))} of available monthly funds towards principal reduction.`,
      reason: `Guarantees risk-free savings on compounding loan interest.`,
      suggestedAction: "Review Liabilities",
      suggestedAmount: Math.round(availableToAllocate * 0.6),
      currency: "INR",
      relatedModule: "Liabilities",
      numericFacts: [
        {
          label: "Total Debt Outstanding",
          value: totalLiabilities,
          unit: "INR",
          source: "FinanceOS Liabilities",
          asOf: market.asOfFormatted,
          status: "Verified",
        },
      ],
      sources: [
        { title: "Reserve Bank of India Lending Rates", url: "https://www.rbi.org.in", sourceType: "official" },
      ],
    });

    actionSteps = [
      {
        step: 1,
        title: "Make Extra Principal Prepayment",
        description: `Allocate ${formatINR(Math.round(availableToAllocate * 0.6))} toward your highest-interest liability.`,
        priority: "high",
        suggestedAmount: Math.round(availableToAllocate * 0.6),
      },
    ];
  }
  // Scenario 3: Low Emergency Fund
  else if (emergencyFundMonths < 3) {
    category = "Emergency Reserve";
    overallHealth = "Moderate";
    title = `Build Liquid Emergency Reserve to 3-6 Months`;
    summary = `Your liquid reserve covers ${emergencyFundMonths} months of living costs (${formatINR(expenses)}/mo). Building this buffer to at least 3 months protects you against unforeseen disruptions.`;

    keyObservations = [
      `Emergency reserve covers ${emergencyFundMonths} months (target: 3-6 months or ${formatINR(expenses * 3)}).`,
      `Available monthly allocation capacity: ${formatINR(availableToAllocate)}.`,
      `Benchmark bank FD rates offer ${market.fixedDeposit.tier1BankRates} for secure liquid parking.`,
    ];

    detailedAdvice = `Allocate 60-70% of available funds into high-yield liquid instruments (such as short-term FDs or dedicated savings goals) earning ~7.0% p.a. while maintaining instant liquidity.`;

    recommendations.push({
      category: "Emergency Fund",
      priority: "High",
      decision: "SAVE_FIRST",
      title: "Direct Surplus to Dedicated Emergency Fund",
      message: `Deposit ${formatINR(Math.round(availableToAllocate * 0.6))} into a dedicated liquid saving goal.`,
      reason: `Current emergency runway is only ${emergencyFundMonths} months of living expenses.`,
      suggestedAction: "Review Saving Goals",
      suggestedAmount: Math.round(availableToAllocate * 0.6),
      currency: "INR",
      relatedModule: "Saving Goals",
      numericFacts: [
        {
          label: "Top Bank 1-Yr FD Rate",
          value: market.fixedDeposit.tier1BankRates,
          unit: "%",
          source: market.fixedDeposit.source,
          asOf: market.asOfFormatted,
          status: "Current Official",
        },
      ],
      sources: [
        { title: market.fixedDeposit.source, url: market.fixedDeposit.sourceUrl, sourceType: "official" },
      ],
    });

    actionSteps = [
      {
        step: 1,
        title: "Allocate to Emergency Reserve Goal",
        description: `Deposit ${formatINR(Math.round(availableToAllocate * 0.6))} into an emergency fund goal.`,
        priority: "high",
        suggestedAmount: Math.round(availableToAllocate * 0.6),
      },
    ];
  }
  // Scenario 4: Surplus Allocation & Wealth Compounding
  else {
    category = "Wealth Growth";
    overallHealth = "Good";
    title = `Deploy ${formatINR(availableToAllocate)} Surplus for Systematic Wealth Compounding`;
    summary = `With core living expenses, liabilities, and emergency reserves secured, your ${formatINR(availableToAllocate)} available surplus can be diversified across systematic equity and sovereign gold.`;

    keyObservations = [
      `Healthy savings rate of ${savingsRate}% generates ${formatINR(availableToAllocate)} in monthly investable capacity.`,
      `Liquid buffer is healthy with ${emergencyFundMonths} months of expense coverage.`,
      `24K Gold benchmark is ₹${market.gold.pricePerGram24K}/g; equity CAGR benchmark is ${market.equities.niftyHistoricalCAGR}.`,
    ];

    detailedAdvice = `To achieve long-term capital appreciation and inflation-beating net worth growth (${market.inflation.cpiInflationRate} CPI), consider deploying ~65% into broad-market index/mutual fund SIPs and ~20% into digital/sovereign gold or Fixed Deposits.`;

    recommendations.push({
      category: "Mutual Funds",
      priority: "High",
      decision: "INVEST",
      title: "Increase Disciplined Equity SIP",
      message: `Commit ${formatINR(Math.round(availableToAllocate * 0.6))} toward diversified equity/index mutual fund SIPs.`,
      reason: `Historical benchmark CAGR of ${market.equities.niftyHistoricalCAGR} provides steady long-term real wealth compounding.`,
      suggestedAction: "Review Investments",
      suggestedAmount: Math.round(availableToAllocate * 0.6),
      currency: "INR",
      relatedModule: "Investments",
      numericFacts: [
        {
          label: "Nifty 50 Historical 10-Yr CAGR",
          value: market.equities.niftyHistoricalCAGR,
          unit: "%",
          source: market.equities.source,
          asOf: market.asOfFormatted,
          status: "Verified Benchmark",
        },
      ],
      sources: [
        { title: market.equities.source, url: market.equities.sourceUrl, sourceType: "official" },
      ],
    });

    if (goldHoldingsCount === 0) {
      recommendations.push({
        category: "Gold Allocation",
        priority: "Medium",
        decision: "CONSIDER",
        title: "Consider Sovereign / Digital Gold Hedge",
        message: `Allocate ${formatINR(Math.round(availableToAllocate * 0.2))} to gold for hedge diversification.`,
        reason: `Current verified 24K gold is ₹${market.gold.pricePerGram24K}/gram. Adding 5-10% gold exposure improves portfolio risk-adjusted returns.`,
        suggestedAction: "Review Investments",
        suggestedAmount: Math.round(availableToAllocate * 0.2),
        currency: "INR",
        relatedModule: "Investments",
        numericFacts: [
          {
            label: "24K Gold Price per Gram",
            value: market.gold.pricePerGram24K,
            unit: "₹ / gram",
            source: market.gold.source,
            asOf: market.asOfFormatted,
            status: "Current / Verified",
          },
        ],
        sources: [
          { title: market.gold.source, url: market.gold.sourceUrl, sourceType: "market-data" },
        ],
      });
    }

    actionSteps = [
      {
        step: 1,
        title: "Expand Index / Mutual Fund SIP",
        description: `Allocate ${formatINR(Math.round(availableToAllocate * 0.6))} into a broad-market SIP.`,
        priority: "high",
        suggestedAmount: Math.round(availableToAllocate * 0.6),
      },
      {
        step: 2,
        title: "Allocate to Gold or High-Yield Deposit",
        description: `Direct ${formatINR(Math.round(availableToAllocate * 0.25))} towards gold or a term deposit.`,
        priority: "medium",
        suggestedAmount: Math.round(availableToAllocate * 0.25),
      },
    ];
  }

  return {
    title,
    summary,
    category,
    overallHealth,
    financialPosition: {
      availableToAllocate,
      netWorth,
      totalAssets,
      totalLiabilities,
    },
    recommendations,
    keyObservations,
    detailedAdvice,
    actionSteps,
    modelUsed: "FinanceOS Deterministic Engine",
  };
}

// ============================================================
// MAIN GENERATION CONTROLLER ENTRY
// ============================================================

async function generateUserRecommendation(userId, options = {}) {
  // 1. Gather live MongoDB records & compute normalized snapshot
  const targetMonth = options.selectedMonth || "";
  const { user, snapshot, items } = await calculateFinancialSnapshot(userId, targetMonth);
  const market = getVerifiedMarketBenchmarks();

  const promptData = {
    user,
    snapshot,
    items,
    market,
    contextType: options.context || "plans_commitments",
    targetItem: options.targetItem || null,
  };

  let recommendationData;

  // 2. Try Gemini with official GoogleGenAI SDK first
  try {
    recommendationData = await callGeminiAdviser(promptData);
  } catch (geminiError) {
    console.warn("Gemini official SDK fallback engaged:", geminiError.message);
    recommendationData = generateFallbackRecommendation(promptData);
  }

  // 3. Persist to MongoDB (Single Source of Truth)
  const savedSuggestion = await AISuggestion.create({
    user: userId,
    title: recommendationData.title,
    summary: recommendationData.summary,
    category: recommendationData.category || "Financial Strategy",
    overallHealth: recommendationData.overallHealth || "Good",
    recommendations: recommendationData.recommendations || [],
    detailedAdvice: recommendationData.detailedAdvice || "",
    keyObservations: recommendationData.keyObservations || [],
    actionSteps: recommendationData.actionSteps || [],
    financialPosition: recommendationData.financialPosition || {
      availableToAllocate: snapshot.availableToAllocate,
      netWorth: snapshot.netWorth,
      totalAssets: snapshot.closingBalance + snapshot.totalInvestments + snapshot.totalGoalSaved,
      totalLiabilities: snapshot.totalLiabilities,
    },
    financialSnapshot: snapshot,
    externalContext: {
      goldPricePerGram24K: market.gold.pricePerGram24K,
      goldPricePerGram22K: market.gold.pricePerGram22K,
      rbiRepoRate: market.fixedDeposit.rbiRepoRate,
      benchmarkFDRate: market.fixedDeposit.tier1BankRates,
      inflationRate: market.inflation.cpiInflationRate,
      equityHistoricalCAGR: market.equities.niftyHistoricalCAGR,
      marketTrend: "Stable interest rate environment; balanced equity growth",
      source: "RBI, NSE & India Bullion Market",
      fetchedAt: market.fetchedAt,
      asOfFormatted: market.asOfFormatted,
    },
    promptContextType: options.context || "plans_commitments",
    selectedMonth: targetMonth,
    targetItemName: options.targetItem?.name || "",
    modelUsed: recommendationData.modelUsed || "gemini-2.5-flash",
    status: "active",
  });

  return savedSuggestion;
}

// ============================================================
// GET LATEST SAVED RECOMMENDATION (NO GEMINI CALL)
// ============================================================

async function getLatestUserRecommendation(userId) {
  const suggestion = await AISuggestion.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  return suggestion;
}

// ============================================================
// GET RECOMMENDATION HISTORY
// ============================================================

async function getUserRecommendationHistory(userId, limit = 10) {
  const suggestions = await AISuggestion.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return suggestions;
}

module.exports = {
  calculateFinancialSnapshot,
  generateUserRecommendation,
  getLatestUserRecommendation,
  getUserRecommendationHistory,
};
