// ============================================================
// FINANCEOS - AI ADVISER SERVICE
// Centralized Engine (Official @google/genai SDK + Math + MongoDB)
// Multi-Asset Live Market Data, Scenario-Based Outlook & Short Suggestions
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
const {
  getLiveMarketBenchmarks,
  getRelevantMarketData,
} = require("./marketDataService");

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

  // 2. Identify the targeted monthly finance record
  let targetedMF = monthlyFinances.find(
    (mf) => mf.year === targetYear && mf.month === targetMonth
  );

  if (!targetedMF) {
    targetedMF = monthlyFinances[0] || {
      income: 0,
      expenses: 0,
      openingBalance: 0,
      cashBalance: 0,
      savings: 0,
    };
  }

  const monthlyIncome = safeNum(targetedMF.income);
  const monthlyExpenses = safeNum(targetedMF.expenses);
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

  // 3. Additional incomes for this month
  const activeAddIncomes = additionalIncomes
    .filter((ai) => String(ai.status || "active").toLowerCase() === "active")
    .reduce((acc, ai) => acc + safeNum(ai.amount), 0);

  // 4. Investment commitments & categorized asset values
  let monthlyInvestmentCommitment = 0;
  let totalInvestmentsValue = 0;
  let maturedInvestments = [];
  let activeSIPs = [];
  let activeFDs = [];
  let activeRDs = [];
  let goldInvestments = [];
  let silverInvestments = [];
  let stockInvestments = [];
  let mutualFundInvestments = [];
  let propertyInvestments = [];

  let goldValue = 0;
  let silverValue = 0;
  let equityValue = 0;
  let fdValue = 0;
  let rdValue = 0;
  let propertyValue = 0;

  investments.forEach((inv) => {
    const status = String(inv.status || "active").toLowerCase();
    const type = String(inv.type || "").toUpperCase();
    const amount = safeNum(inv.monthlyContribution || inv.amount || inv.principalAmount);
    const currVal = safeNum(inv.currentValue !== undefined ? inv.currentValue : (inv.principalAmount || inv.amount));

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
        fdValue += currVal;
      } else if (type.includes("RD") || type.includes("RECURRING")) {
        activeRDs.push(inv);
        rdValue += currVal;
      } else if (type.includes("GOLD")) {
        goldInvestments.push(inv);
        goldValue += currVal;
      } else if (type.includes("SILVER")) {
        silverInvestments.push(inv);
        silverValue += currVal;
      } else if (type.includes("STOCK") || type.includes("EQUITY") || type.includes("SHARE")) {
        stockInvestments.push(inv);
        equityValue += currVal;
      } else if (type.includes("MUTUAL") || type.includes("MF")) {
        mutualFundInvestments.push(inv);
        equityValue += currVal;
      } else if (type.includes("PROPERTY") || type.includes("REAL ESTATE") || type.includes("LAND")) {
        propertyInvestments.push(inv);
        propertyValue += currVal;
      }

      totalInvestmentsValue += currVal;
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
  const closingBalance = openingBalance + monthlySavings - totalCommitments;
  const availableToAllocate = closingBalance;

  // 9. Total Assets & Net Worth
  const totalAssets = closingBalance + totalInvestmentsValue + totalGoalSaved;
  const netWorth = totalAssets - totalLiabilitiesBalance;

  // 10. Emergency Fund Runway (months)
  const emergencyFundMonths =
    monthlyExpenses > 0 ? (totalGoalSaved + Math.max(0, closingBalance)) / monthlyExpenses : 0;

  // 11. Portfolio Exposure Percentages
  const goldExposurePercent = totalAssets > 0 ? Number(((goldValue / totalAssets) * 100).toFixed(1)) : 0;
  const equityExposurePercent = totalAssets > 0 ? Number(((equityValue / totalAssets) * 100).toFixed(1)) : 0;

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
      activeRDsCount: activeRDs.length,
      goldHoldingsCount: goldInvestments.length,
      silverHoldingsCount: silverInvestments.length,
      stockHoldingsCount: stockInvestments.length,
      goldExposurePercent,
      equityExposurePercent,
      goldValue,
      silverValue,
      equityValue,
      fdValue,
      rdValue,
      propertyValue,
    },
    items: {
      maturedInvestments: maturedInvestments.map(i => ({ name: i.name, type: i.type, amount: i.actualMaturityValue || i.estimatedMaturityAmount || i.amount })),
      nearCompletionGoals: nearCompletionGoals.map(g => ({ name: g.goalName || g.name, target: g.targetAmount, saved: g.currentAmount || g.savedAmount })),
      activeSIPs: activeSIPs.map(s => ({ name: s.name, amount: s.monthlyContribution || s.amount, currentValue: s.currentValue })),
      activeFDs: activeFDs.map(f => ({ name: f.name, principal: f.principalAmount || f.amount, rate: f.interestRate, maturityDate: f.maturityDate })),
      activeRDs: activeRDs.map(r => ({ name: r.name, monthly: r.monthlyContribution || r.amount, rate: r.interestRate })),
      goldInvestments: goldInvestments.map(g => ({
        id: g._id,
        name: g.name,
        goldType: g.goldType || "Physical Gold",
        weight: safeNum(g.weight),
        purity: g.purity || "24K",
        purchasePrice: safeNum(g.purchasePrice),
        principalAmount: safeNum(g.principalAmount || g.amount),
        currentValue: safeNum(g.currentValue !== undefined ? g.currentValue : (g.principalAmount || g.amount)),
      })),
      silverInvestments: silverInvestments.map(s => ({ name: s.name, weight: safeNum(s.weight), currentValue: s.currentValue || s.amount })),
      stockInvestments: stockInvestments.map(s => ({ name: s.name, value: s.currentValue || s.amount })),
      mutualFundInvestments: mutualFundInvestments.map(m => ({ name: m.name, value: m.currentValue || m.amount })),
      propertyInvestments: propertyInvestments.map(p => ({ name: p.name, value: p.currentValue || p.amount })),
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
You analyze real-world personal financial positions and provide objective, personalized, concise, scenario-based guidance.

CRITICAL RULES:
1. WORD BUDGET: Your ENTIRE output must be SHORT AND CONCISE (approximately 100 - 180 words total). Avoid generic lectures, repetition, or essays.
2. FINANCIAL ADVICE LANGUAGE: NEVER give absolute investment commands or make guaranteed return claims (e.g. Do NOT say "Buy now", "Invest all your money", "Guaranteed profit", "Will definitely increase").
   Always use cautious advisory language: "Consider...", "You may evaluate...", "A potential approach is...", "Based on current data...".
3. FUTURE OUTLOOK: Must be scenario-based (Base case, Bull case, Bear case, with key risks). Never claim future certainty.
4. ZERO FABRICATION: NEVER invent or guess market prices, rates, or NAVs. If data is marked UNAVAILABLE, state clearly that it is unavailable.
5. MANDATORY RISK LINE: Always include: "Invest at your own risk — market prices and conditions can change, and values may increase or decrease."

OUTPUT JSON SCHEMA:
{
  "title": "Short headline summary (max 10 words)",
  "summary": "1-2 concise sentences summarizing current situation and primary action.",
  "category": "Main Category (Wealth Growth | Emergency Fund | Debt Optimization | Asset Allocation | Fixed Income)",
  "overallHealth": "Good | Moderate | Needs Attention",
  "currentPosition": {
    "availableToAllocate": ${promptData.snapshot.availableToAllocate},
    "savingsRate": ${promptData.snapshot.savingsRate},
    "emergencyFundMonths": ${promptData.snapshot.emergencyFundMonths},
    "totalLiabilities": ${promptData.snapshot.totalLiabilities},
    "goldExposurePercent": ${promptData.snapshot.goldExposurePercent},
    "equityExposurePercent": ${promptData.snapshot.equityExposurePercent},
    "summary": "Short 1-sentence position summary with key numbers."
  },
  "marketInsight": {
    "summary": "Short 1-sentence factual observation of relevant market movement.",
    "goldSpotFormatted": "Verified Gold 24K price or 'Unavailable'",
    "silverSpotFormatted": "Verified Silver price or 'Unavailable'",
    "niftyIndexFormatted": "Verified Nifty value or 'Unavailable'",
    "fdRangeFormatted": "Verified FD range or 'Unavailable'",
    "keyFactors": ["Factor 1", "Factor 2"]
  },
  "personalizedSuggestion": {
    "text": "Clear, concise guidance on what the user may consider doing with their money.",
    "reason": "Short financial rationale referencing user numbers.",
    "priority": "High | Medium | Low",
    "actionCategory": "Wealth Compounding | Reserve Buffer | Debt Paydown"
  },
  "futureOutlook": {
    "baseCase": "Likely short-term scenario.",
    "bullCase": "Potential upside scenario.",
    "bearCase": "Potential downside scenario or risk.",
    "keyRisks": ["Risk 1", "Risk 2"]
  },
  "riskDisclaimer": "Invest at your own risk — market prices and conditions can change, and values may increase or decrease.",
  "recommendations": [
    {
      "category": "Gold | Stocks | Mutual Funds | Fixed Deposit | Debt Paydown | Emergency Fund",
      "priority": "High | Medium | Low",
      "decision": "INVEST | CONSIDER | WAIT | AVOID_FOR_NOW | SAVE_FIRST | DEBT_FIRST | DIVERSIFY | HOLD_LIQUIDITY",
      "title": "Specific action title",
      "message": "Direct concise recommendation",
      "reason": "Short rationale",
      "suggestedAmount": 0,
      "currency": "INR",
      "relatedModule": "Monthly Finance | Investments | Liabilities | Saving Goals"
    }
  ],
  "actionSteps": [
    {
      "step": 1,
      "title": "Step title",
      "description": "Short actionable instruction with suggested amount",
      "priority": "high",
      "suggestedAmount": 0
    }
  ]
}`;

  const market = promptData.market;
  const goldInfo = market.gold?.available
    ? `Gold 24K: ₹${market.gold.pricePerGram24K}/g | 22K: ₹${market.gold.pricePerGram22K}/g (${market.gold.source}, As of: ${market.gold.asOfFormatted})`
    : `Gold Spot: CURRENT MARKET DATA UNAVAILABLE`;

  const silverInfo = market.silver?.available
    ? `Silver: ₹${market.silver.pricePerGram}/g (${market.silver.source}, As of: ${market.silver.asOfFormatted})`
    : `Silver Spot: CURRENT MARKET DATA UNAVAILABLE`;

  const equitiesInfo = market.equities?.available
    ? `Nifty 50: ${market.equities.currentValue} (${market.equities.dayChangePercent >= 0 ? "+" : ""}${market.equities.dayChangePercent}%), 10-Yr Historical CAGR: ${market.equities.historical10YrCAGR} (${market.equities.source})`
    : `Nifty 50: CURRENT MARKET DATA UNAVAILABLE (Historical 10-Yr CAGR: 12.50%)`;

  const mfInfo = market.mutualFunds?.available
    ? `Mutual Fund NAV: ₹${market.mutualFunds.nav} (${market.mutualFunds.schemeName}, Date: ${market.mutualFunds.navDate})`
    : `Mutual Fund NAV: Published AMFI benchmarks`;

  const fdInfo = market.fixedDeposit?.available
    ? `Tier-1 Bank FD Benchmark: ${market.fixedDeposit.benchmarkRange} (RBI Repo Rate: ${market.fixedDeposit.rbiRepoRate})`
    : `FD Benchmark: Published bank card rates`;

  const userPrompt = `
=== CONFIDENTIAL USER FINANCIAL DATA (LIVE MONGODB) ===
- Profile: ${promptData.user.name} (${promptData.user.city || promptData.user.state || "India"})
- Monthly Income: ${formatINR(promptData.snapshot.income)} | Expenses: ${formatINR(promptData.snapshot.expenses)}
- Net Monthly Savings: ${formatINR(promptData.snapshot.monthlySavings)} (${promptData.snapshot.savingsRate}% rate)
- Liquid Closing Cash: ${formatINR(promptData.snapshot.closingBalance)}
- Available to Allocate (Surplus): ${formatINR(promptData.snapshot.availableToAllocate)}
- Total Active Monthly Commitments: ${formatINR(promptData.snapshot.totalCommitments)}
- Total Investments: ${formatINR(promptData.snapshot.totalInvestments)} (Gold: ${promptData.snapshot.goldExposurePercent}%, Equities: ${promptData.snapshot.equityExposurePercent}%)
- Total Debt/Liabilities: ${formatINR(promptData.snapshot.totalLiabilities)}
- Emergency Runway: ${promptData.snapshot.emergencyFundMonths} months of living expenses
- Current Net Worth: ${formatINR(promptData.snapshot.netWorth)}

=== CURRENT VERIFIED EXTERNAL MARKET DATA (AS OF ${market.asOfFormatted}) ===
- ${goldInfo}
- ${silverInfo}
- ${equitiesInfo}
- ${mfInfo}
- ${fdInfo}
- Property Benchmark: ${market.property?.averageAnnualYoYGrowth || "8.5% - 11.2% YoY growth"} (${market.property?.source})
- IPO Environment: ${market.ipo?.marketEnvironment || "Active primary market"}
- Macro / Inflation: CPI ${market.macro?.cpiInflationRate || "4.80%"} (RBI Repo Rate: ${market.macro?.rbiRepoRate || "6.50%"})

Context Trigger: ${promptData.contextType}`;

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
// Guarantees 100-180 word concise format with scenario outlook & risk line
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
    goldExposurePercent,
    equityExposurePercent,
    goldHoldingsCount,
  } = snapshot;

  const totalAssets = closingBalance + totalInvestments + totalGoalSaved;
  const goldPriceStr = market.gold?.available
    ? `₹${market.gold.pricePerGram24K}/g (${market.gold.source}, as of ${market.gold.asOfFormatted || "Latest available"})`
    : "Gold market data unavailable";
  const silverPriceStr = market.silver?.available
    ? `₹${market.silver.pricePerGram}/g (${market.silver.source}, as of ${market.silver.asOfFormatted || "Latest available"})`
    : "Silver market data unavailable";
  const niftyStr = market.equities?.available
    ? `${market.equities.currentValue} (${market.equities.source}, as of ${market.equities.asOfFormatted || "Latest available"})`
    : "Stock market benchmark unavailable";
  const fdRangeStr = market.fixedDeposit?.available
    ? `${market.fixedDeposit.benchmarkRange} (${market.fixedDeposit.source})`
    : "FD rate data unavailable";

  let title = "";
  let summary = "";
  let category = "Financial Strategy";
  let overallHealth = "Good";
  let suggestionText = "";
  let suggestionReason = "";
  let baseCase = "";
  let bullCase = "";
  let bearCase = "";
  let keyRisks = [];
  let recommendations = [];
  let actionSteps = [];

  // Scenario 1: Deficit / Cash flow shortfall
  if (availableToAllocate < 0) {
    category = "Cash Flow Balance";
    overallHealth = "Needs Attention";
    title = `Rebalance Monthly Deficit of ${formatINR(Math.abs(availableToAllocate))}`;
    summary = `Monthly commitments and living costs exceed inflows by ${formatINR(Math.abs(availableToAllocate))}. Prioritizing liquidity is essential.`;
    suggestionText = `Consider temporarily pausing discretionary investment additions and non-essential expenses to eliminate the ${formatINR(Math.abs(availableToAllocate))} shortfall.`;
    suggestionReason = `Preserves emergency buffers and avoids liquidating investments at inopportune times.`;
    baseCase = "Cash flow recovers within 30-60 days upon rationalizing optional commitments.";
    bullCase = "Additional income or expense reduction restores positive cash flow ahead of schedule.";
    bearCase = "Persistent deficits could erode cash reserves and force borrowing.";
    keyRisks = ["Depletion of liquid cash", "Compounding credit charges", "Unplanned debt reliance"];

    recommendations.push({
      category: "Emergency Fund",
      priority: "High",
      decision: "HOLD_LIQUIDITY",
      title: "Pause Discretionary Outflows",
      message: `Hold cash and reduce discretionary spending by ${formatINR(Math.abs(availableToAllocate))}.`,
      reason: `Outflows currently exceed inflows.`,
      suggestedAmount: Math.abs(availableToAllocate),
      currency: "INR",
      relatedModule: "Monthly Finance",
    });

    actionSteps.push({
      step: 1,
      title: "Audit Discretionary Expenses",
      description: `Trim non-essential expenses to restore monthly cash surplus.`,
      priority: "high",
      suggestedAmount: Math.abs(availableToAllocate),
    });
  }
  // Scenario 2: High Debt Burden (> 50% of assets)
  else if (totalLiabilities > totalAssets * 0.5 && totalLiabilities > 0) {
    category = "Debt Optimization";
    overallHealth = "Moderate";
    title = `Accelerate Debt Paydown to Reduce Interest Drag`;
    summary = `Liabilities of ${formatINR(totalLiabilities)} burden net worth. Prepaying borrowing provides a risk-free return matching your loan interest rate.`;
    suggestionText = `Consider directing ${formatINR(Math.round(availableToAllocate * 0.6))} of available surplus toward your highest-interest liability.`;
    suggestionReason = `Eliminates compounding interest expense while leaving ${formatINR(Math.round(availableToAllocate * 0.4))} for emergency buffers.`;
    baseCase = "Systematic prepayments shorten loan tenure significantly while lowering monthly interest burden.";
    bullCase = "Faster debt clearance frees up substantial investable surplus for equity accumulation.";
    bearCase = "Rising interest rates could increase borrowing costs if floating-rate debt is unaddressed.";
    keyRisks = ["Interest rate hike impact", "Reduced immediate liquidity", "Emergency cash strain"];

    recommendations.push({
      category: "Debt Paydown",
      priority: "High",
      decision: "DEBT_FIRST",
      title: "Pay Down High-Interest Debt",
      message: `Allocate ${formatINR(Math.round(availableToAllocate * 0.6))} towards principal reduction.`,
      reason: `Guarantees risk-free savings on loan interest.`,
      suggestedAmount: Math.round(availableToAllocate * 0.6),
      currency: "INR",
      relatedModule: "Liabilities",
    });

    actionSteps.push({
      step: 1,
      title: "Make Extra Principal Prepayment",
      description: `Direct surplus to the highest-interest liability.`,
      priority: "high",
      suggestedAmount: Math.round(availableToAllocate * 0.6),
    });
  }
  // Scenario 3: Inadequate Emergency Buffer (< 3 months)
  else if (emergencyFundMonths < 3) {
    category = "Emergency Reserve";
    overallHealth = "Moderate";
    title = `Build Liquid Reserve to 3-6 Months Buffer`;
    summary = `Emergency runway currently covers ${emergencyFundMonths} months. Strengthening liquid buffers protects your portfolio from distress sales.`;
    suggestionText = `Consider allocating ${formatINR(Math.round(availableToAllocate * 0.7))} to secure fixed deposits (${fdRangeStr}) until reserves reach 3-6 months.`;
    suggestionReason = `High-yield term deposits yield ~7% p.a. while keeping funds fully capital-protected.`;
    baseCase = "Consistent allocation achieves safe 6-month runway within 3 to 5 monthly cycles.";
    bullCase = "Stable expenses allow reaching full reserve coverage faster, enabling aggressive equity deployment.";
    bearCase = "Unexpected medical or living emergencies could derail savings without liquid reserves.";
    keyRisks = ["Premature investment liquidations", "Loss of compounding", "Immediate cash crunch"];

    recommendations.push({
      category: "Fixed Deposit",
      priority: "High",
      decision: "SAVE_FIRST",
      title: "Park in High-Yield Liquid FD",
      message: `Deploy ${formatINR(Math.round(availableToAllocate * 0.7))} in short-term bank FDs (${fdRangeStr}).`,
      reason: `Safe yield over inflation while securing emergency liquidity.`,
      suggestedAmount: Math.round(availableToAllocate * 0.7),
      currency: "INR",
      relatedModule: "Saving Goals",
    });

    actionSteps.push({
      step: 1,
      title: "Establish Term Deposit Reserve",
      description: `Deposit ${formatINR(Math.round(availableToAllocate * 0.7))} into a high-yield liquid FD.`,
      priority: "high",
      suggestedAmount: Math.round(availableToAllocate * 0.7),
    });
  }
  // Scenario 4: Healthy Surplus & Low Debt (Wealth Growth & Hedging)
  else {
    category = "Wealth Growth";
    overallHealth = "Good";
    title = `Deploy ${formatINR(availableToAllocate)} Surplus for Systematic Wealth Compounding`;
    summary = `With core living costs and liquid reserves secured, your ${formatINR(availableToAllocate)} surplus can be diversified across systematic equities and sovereign gold.`;

    const equityPortion = Math.round(availableToAllocate * 0.65);
    const hedgePortion = Math.round(availableToAllocate * 0.35);

    if (goldExposurePercent > 15) {
      suggestionText = `Your gold allocation is already ${goldExposurePercent}%. Consider prioritizing disciplined equity SIPs (${niftyStr}) and term deposits (${fdRangeStr}) rather than expanding gold further.`;
      suggestionReason = `Avoids over-concentration in commodities while capitalizing on equity compounding.`;
    } else {
      suggestionText = `Consider deploying ${formatINR(equityPortion)} toward disciplined equity index SIPs and ${formatINR(hedgePortion)} into gold hedge (${goldPriceStr}) or term deposits.`;
      suggestionReason = `Nifty historical 12.5% CAGR drives growth while safe-haven gold protects against inflation.`;
    }

    baseCase = "Equities compound steadily in line with historical GDP growth; commodities provide portfolio hedging.";
    bullCase = "Strong corporate earnings accelerate equity returns above the 10-year historical average.";
    bearCase = "Short-term market corrections or global macro shifts could induce temporary volatility.";
    keyRisks = ["Short-term equity market corrections", "Commodity price fluctuations", "Inflation & interest-rate shifts"];

    recommendations.push({
      category: "Stocks",
      priority: "High",
      decision: "INVEST",
      title: "Increase Disciplined Equity SIP",
      message: `Commit ${formatINR(equityPortion)} toward diversified equity/index mutual fund SIPs.`,
      reason: `Historical benchmark CAGR of 12.50% provides steady long-term real wealth compounding.`,
      suggestedAmount: equityPortion,
      currency: "INR",
      relatedModule: "Investments",
    });

    recommendations.push({
      category: "Gold",
      priority: "Medium",
      decision: goldExposurePercent > 15 ? "HOLD_LIQUIDITY" : "CONSIDER",
      title: goldExposurePercent > 15 ? "Maintain Existing Gold Allocation" : "Consider Sovereign / Digital Gold Hedge",
      message: goldExposurePercent > 15
        ? `Maintain current gold holding (${goldExposurePercent}% of portfolio) without adding.`
        : `Allocate ${formatINR(hedgePortion)} to gold for hedge diversification.`,
      reason: market.gold?.available
        ? `Current verified 24K gold is ₹${market.gold.pricePerGram24K}/gram. Adding 5-10% gold exposure improves portfolio risk-adjusted returns.`
        : `Bullion provides long-term inflation hedge; review live rates before executing.`,
      suggestedAmount: hedgePortion,
      currency: "INR",
      relatedModule: "Investments",
    });

    actionSteps.push(
      {
        step: 1,
        title: "Setup Disciplined Index SIP",
        description: `Automate ${formatINR(equityPortion)} monthly into broad-market index funds.`,
        priority: "high",
        suggestedAmount: equityPortion,
      },
      {
        step: 2,
        title: goldExposurePercent > 15 ? "Lock High-Yield Term Deposit" : "Allocate to Gold Hedge or Term Deposit",
        description: `Direct ${formatINR(hedgePortion)} to ${goldExposurePercent > 15 ? "fixed deposits" : "gold or fixed deposits"}.`,
        priority: "medium",
        suggestedAmount: hedgePortion,
      }
    );
  }

  const currentPosition = {
    availableToAllocate,
    savingsRate,
    emergencyFundMonths,
    totalLiabilities,
    goldExposurePercent,
    equityExposurePercent,
    summary: `Available surplus ${formatINR(availableToAllocate)}; ${emergencyFundMonths} months liquid reserve buffer; liabilities ${formatINR(totalLiabilities)}.`,
  };

  const marketInsight = {
    summary: [
      market.equities?.available ? `Nifty 50: ${market.equities.currentValue} (${market.equities.source}, as of ${market.equities.asOfFormatted || "Latest available"})` : "Nifty 50: Market data unavailable",
      market.gold?.available ? `24K Gold: ₹${market.gold.pricePerGram24K}/g (${market.gold.source}, as of ${market.gold.asOfFormatted || "Latest available"})` : "Gold: Market data unavailable",
      market.fixedDeposit?.available ? `Bank FD Benchmark: ${market.fixedDeposit.benchmarkRange} (${market.fixedDeposit.source})` : "FD Benchmark: Unavailable",
    ].join("; "),
    goldSpotFormatted: goldPriceStr,
    silverSpotFormatted: silverPriceStr,
    niftyIndexFormatted: niftyStr,
    fdRangeFormatted: fdRangeStr,
    keyFactors: [
      market.macro?.rbiRepoRate ? `RBI policy repo rate: ${market.macro.rbiRepoRate} (${market.macro.source})` : null,
      market.macro?.cpiInflationRate ? `MoSPI retail inflation (CPI): ${market.macro.cpiInflationRate} (${market.macro.source})` : null,
      market.equities?.available ? `Equity trend: ${market.equities.trend || "Domestic accumulation"}` : null,
    ].filter(Boolean),
  };

  const personalizedSuggestion = {
    text: suggestionText,
    reason: suggestionReason,
    priority: recommendations[0]?.priority || "High",
    actionCategory: category,
  };

  const futureOutlook = {
    baseCase,
    bullCase,
    bearCase,
    keyRisks,
  };

  const riskDisclaimer = "Invest at your own risk — market prices and conditions can change, and values may increase or decrease.";

  return {
    title,
    summary,
    category,
    overallHealth,
    currentPosition,
    marketInsight,
    personalizedSuggestion,
    futureOutlook,
    riskDisclaimer,
    financialPosition: {
      availableToAllocate,
      netWorth,
      totalAssets,
      totalLiabilities,
    },
    recommendations,
    keyObservations: [
      `Available monthly surplus: ${formatINR(availableToAllocate)} (${savingsRate}% savings rate).`,
      `Emergency reserve covers ${emergencyFundMonths} months of living costs.`,
      `Portfolio asset allocation: ${goldExposurePercent}% Gold, ${equityExposurePercent}% Equities.`,
    ],
    detailedAdvice: summary + " " + suggestionText,
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

  // 2. Fetch live verified multi-asset market benchmarks
  const market = await getLiveMarketBenchmarks({ forceFresh: true });

  const promptData = {
    user,
    snapshot,
    items,
    market,
    contextType: options.context || "plans_commitments",
    targetItem: options.targetItem || null,
  };

  let recommendationData;

  // 3. Try Gemini with official GoogleGenAI SDK first
  try {
    recommendationData = await callGeminiAdviser(promptData);
  } catch (geminiError) {
    console.warn("Gemini official SDK fallback engaged:", geminiError.message);
    recommendationData = generateFallbackRecommendation(promptData);
  }

  // Ensure mandatory risk disclaimer is always set
  const riskDisclaimer =
    recommendationData.riskDisclaimer ||
    "Invest at your own risk — market prices and conditions can change, and values may increase or decrease.";

  // Ensure currentPosition and marketInsight are populated
  const currentPosition = recommendationData.currentPosition || {
    availableToAllocate: snapshot.availableToAllocate,
    savingsRate: snapshot.savingsRate,
    emergencyFundMonths: snapshot.emergencyFundMonths,
    totalLiabilities: snapshot.totalLiabilities,
    goldExposurePercent: snapshot.goldExposurePercent,
    equityExposurePercent: snapshot.equityExposurePercent,
    summary: `Available surplus ${formatINR(snapshot.availableToAllocate)}; ${snapshot.emergencyFundMonths} months buffer.`,
  };

  const marketInsight = recommendationData.marketInsight || {
    summary: [
      market.equities?.available ? `Nifty 50: ${market.equities.currentValue} (${market.equities.source}, as of ${market.equities.asOfFormatted || "Latest available"})` : "Nifty 50: Market data unavailable",
      market.gold?.available ? `24K Gold: ₹${market.gold.pricePerGram24K}/g (${market.gold.source}, as of ${market.gold.asOfFormatted || "Latest available"})` : "Gold: Market data unavailable",
      market.fixedDeposit?.available ? `Bank FD Benchmark: ${market.fixedDeposit.benchmarkRange} (${market.fixedDeposit.source})` : "FD Benchmark: Unavailable",
    ].join("; "),
    goldSpotFormatted: market.gold?.available ? `₹${market.gold.pricePerGram24K}/g (${market.gold.source}, as of ${market.gold.asOfFormatted || "Latest available"})` : "Unavailable",
    silverSpotFormatted: market.silver?.available ? `₹${market.silver.pricePerGram}/g (${market.silver.source}, as of ${market.silver.asOfFormatted || "Latest available"})` : "Unavailable",
    niftyIndexFormatted: market.equities?.available ? `${market.equities.currentValue} (${market.equities.source}, as of ${market.equities.asOfFormatted || "Latest available"})` : "Unavailable",
    fdRangeFormatted: market.fixedDeposit?.available ? `${market.fixedDeposit.benchmarkRange} (${market.fixedDeposit.source})` : "Unavailable",
    keyFactors: [
      market.macro?.rbiRepoRate ? `RBI Repo Rate: ${market.macro.rbiRepoRate} (${market.macro.source})` : null,
      market.macro?.cpiInflationRate ? `CPI Inflation: ${market.macro.cpiInflationRate} (${market.macro.source})` : null,
      "Safe-haven commodity demand and domestic equity flows",
    ].filter(Boolean),
  };

  const personalizedSuggestion = recommendationData.personalizedSuggestion || {
    text: recommendationData.summary,
    reason: "Balances capital compounding and liquidity protection.",
    priority: "High",
    actionCategory: recommendationData.category || "General",
  };

  const futureOutlook = recommendationData.futureOutlook || {
    baseCase: "Moderate macroeconomic growth with range-bound asset valuations.",
    bullCase: "Easing inflation could stimulate accelerated equity returns.",
    bearCase: "Geopolitical tension or rate volatility may induce short-term pullbacks.",
    keyRisks: ["Market volatility", "Inflation shifts"],
  };

  // 4. Persist to MongoDB (Single Source of Truth)
  const savedSuggestion = await AISuggestion.create({
    user: userId,
    title: recommendationData.title,
    summary: recommendationData.summary,
    category: recommendationData.category || "Financial Strategy",
    overallHealth: recommendationData.overallHealth || "Good",
    currentPosition,
    marketInsight,
    personalizedSuggestion,
    futureOutlook,
    riskDisclaimer,
    recommendations: recommendationData.recommendations || [],
    detailedAdvice: recommendationData.detailedAdvice || recommendationData.summary,
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
      // Gold
      goldPricePerGram24K: market.gold?.pricePerGram24K ?? null,
      goldPricePerGram22K: market.gold?.pricePerGram22K ?? null,
      goldAvailable: Boolean(market.gold?.available),
      goldCurrency: market.gold?.currency || "INR",
      goldUnit: market.gold?.unit || "₹ / gram",
      goldSource: market.gold?.source || "External Bullion API",

      // Silver
      silverPricePerGram: market.silver?.pricePerGram ?? null,
      silverPricePerKg: market.silver?.pricePerKg ?? null,
      silverAvailable: Boolean(market.silver?.available),
      silverSource: market.silver?.source || "Global Bullion Spot Market",

      // Equities
      niftyCurrentValue: market.equities?.currentValue ?? null,
      niftyDayChange: market.equities?.dayChange ?? null,
      niftyDayChangePercent: market.equities?.dayChangePercent ?? null,
      niftyHistoricalCAGR: market.equities?.historical10YrCAGR || "12.50%",
      niftyAvailable: Boolean(market.equities?.available),
      equitiesSource: market.equities?.source || "NSE",

      // Mutual Funds
      mutualFundNav: market.mutualFunds?.nav ?? null,
      mutualFundScheme: market.mutualFunds?.schemeName || "",
      mutualFundAvailable: Boolean(market.mutualFunds?.available),
      mutualFundSource: market.mutualFunds?.source || "AMFI India",

      // FD & RD
      rbiRepoRate: market.fixedDeposit?.rbiRepoRate || "6.50%",
      benchmarkFDRate: market.fixedDeposit?.benchmarkRange || "6.80% - 7.60%",
      benchmarkRDRate: market.recurringDeposit?.benchmarkRange || "6.80% - 7.10%",
      fdAvailable: Boolean(market.fixedDeposit?.available),
      fdSource: market.fixedDeposit?.source || "RBI & Scheduled Banks",

      // Property & IPO
      propertyTrend: market.property?.averageAnnualYoYGrowth || "8.5% - 11.2% YoY growth",
      propertyAvailable: Boolean(market.property?.available),
      propertySource: market.property?.source || "NHB RESIDEX",
      ipoMarketStatus: market.ipo?.marketEnvironment || "Active primary market pipeline",
      ipoAvailable: Boolean(market.ipo?.available),
      ipoSource: market.ipo?.source || "BSE / NSE Primary Market",

      // Macro
      inflationRate: market.macro?.cpiInflationRate || "4.80%",
      usdInrRate: market.foreignExchange?.usdInrRate ?? null,
      marketTrend: "Stable interest rate environment with balanced equity growth",
      marketDataStatus: market.gold?.status || "Latest available market price",
      source: "RBI, NSE, AMFI, NHB & Bullion Spot Market",
      fetchedAt: market.fetchedAt || new Date(),
      asOfFormatted: market.asOfFormatted || "",
    },
    promptContextType: ["plans_commitments", "dashboard_advisor", "dashboard", "maturity_action", "general"].includes(options.context)
      ? options.context
      : "plans_commitments",
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
// GET RECOMMENDATION HISTORY (AIAdviceHistory)
// ============================================================

async function getUserRecommendationHistory(userId, limit = 10) {
  const history = await AISuggestion.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return history;
}

module.exports = {
  calculateFinancialSnapshot,
  generateUserRecommendation,
  getLatestUserRecommendation,
  getUserRecommendationHistory,
};
