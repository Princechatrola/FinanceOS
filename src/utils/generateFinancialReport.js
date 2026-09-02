// ============================================================
// FINANCEOS - DURATION-SPECIFIC PDF FINANCIAL REPORT GENERATOR
// ============================================================

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function safeNum(val, defaultVal = 0) {
  const n = Number(val);
  return Number.isFinite(n) ? n : defaultVal;
}

function fmtINR(val) {
  if (val === null || val === undefined || val === "") return "—";
  const n = Number(val);
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "Rs. 0";
  const sign = n < 0 ? "-" : "";
  return `${sign}Rs. ${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function fmtPct(val) {
  if (val === null || val === undefined || val === "") return "N/A";
  const n = Number(val);
  if (!Number.isFinite(n)) return "N/A";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function ensureSpace(doc, currentY, requiredHeight = 40) {
  if (currentY + requiredHeight > 275) {
    doc.addPage();
    return 20;
  }
  return currentY;
}

// ============================================================
// MAIN PDF GENERATOR EXPORT
// ============================================================
export function generateFinancialReport(reportData) {
  if (!reportData) return;

  const {
    header = {},
    financialSummary = {},
    netWorthSummary = {},
    financialHealth = {},
    monthDetails = [],
    plansLifecycle = {},
    plans = {},
    transactionsLedger = [],
    insights = [],
    suggestions = [],
  } = reportData;

  const duration = header.duration || "monthly";
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 18;

  // ------------------------------------------------------------
  // BRAND HEADER
  // ------------------------------------------------------------
  doc.setFillColor(24, 57, 44); // Brand Dark Green #18392c
  doc.rect(0, 0, pageWidth, 24, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("FinanceOS", 14, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(207, 229, 197); // #cfe5c5
  const durationTitleMap = {
    monthly: "MONTHLY FINANCIAL STATEMENT",
    quarterly: "QUARTERLY FINANCIAL PERFORMANCE REPORT",
    halfYear: "HALF-YEARLY FINANCIAL AUDIT",
    yearly: "ANNUAL FINANCIAL STATEMENT & REVIEW",
  };
  doc.text(durationTitleMap[duration] || "FINANCIAL REPORT", pageWidth - 14, 15, { align: "right" });

  currentY = 32;

  // ------------------------------------------------------------
  // REPORT META INFO
  // ------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(24, 57, 44);
  doc.text(header.periodLabel || "Financial Report", 14, currentY);

  currentY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`Period: ${header.periodRangeLabel || "—"}  |  Client: ${header.userName || "User"} (${header.userEmail || ""})`, 14, currentY);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}`, pageWidth - 14, currentY, { align: "right" });

  currentY += 7;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  // ------------------------------------------------------------
  // SECTION 1: EXECUTIVE FINANCIAL SUMMARY & HEALTH
  // ------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(24, 57, 44);
  doc.text("1. Executive Financial Summary & Score", 14, currentY);
  currentY += 4;

  const totalIn = safeNum(financialSummary.totalIncome);
  const totalExp = safeNum(financialSummary.totalExpenses);
  const totalSav = totalIn - totalExp;
  const savRate = totalIn > 0 ? (totalSav / totalIn) * 100 : 0;

  const summaryRows = [
    [
      "Opening Cash Balance", fmtINR(financialSummary.openingBalance),
      "Total Income (Inflow)", fmtINR(financialSummary.totalIncome),
    ],
    [
      "Total Living Expenses", fmtINR(financialSummary.totalExpenses),
      "Net Period Savings", fmtINR(totalSav),
    ],
    [
      "Savings Rate (%)", fmtPct(savRate),
      "Investment Contributions", fmtINR(financialSummary.totalInvestmentContributionsPeriod),
    ],
    [
      "Insurance Premiums Paid", fmtINR(financialSummary.totalInsurancePremiumsPeriod),
      "Liability / Debt Payments", fmtINR(financialSummary.totalLiabilityPaymentsPeriod),
    ],
    [
      "Saving Goal Deposits", fmtINR(financialSummary.totalGoalContributionsPeriod),
      "Available to Allocate", fmtINR(financialSummary.availableToAllocate),
    ],
    [
      "Ending Liquid Balance", fmtINR(financialSummary.closingBalance),
      "Period Net Worth", fmtINR(netWorthSummary.closingNetWorth),
    ],
    [
      "Financial Health Score",
      financialHealth.score !== null && financialHealth.score !== undefined
        ? `${financialHealth.score} / 100 (${financialHealth.status || "Fair"})`
        : "—",
      "Net Worth Movement",
      fmtPct(netWorthSummary.netWorthChangePct),
    ],
  ];

  if (duration !== "monthly") {
    summaryRows.push([
      "Monthly Average Income", fmtINR(financialSummary.avgMonthlyIncome),
      "Monthly Average Expenses", fmtINR(financialSummary.avgMonthlyExpenses),
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    body: summaryRows,
    theme: "plain",
    styles: {
      fontSize: 8,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [100, 116, 139], width: 45 },
      1: { fontStyle: "bold", textColor: [24, 57, 44], width: 45 },
      2: { fontStyle: "bold", textColor: [100, 116, 139], width: 45 },
      3: { fontStyle: "bold", textColor: [24, 57, 44], width: 45 },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = doc.lastAutoTable.finalY + 7;

  // ------------------------------------------------------------
  // SECTION 2: DURATION CASH FLOW MATRIX
  // ------------------------------------------------------------
  currentY = ensureSpace(doc, currentY, 45);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(24, 57, 44);

  if (duration === "monthly") {
    doc.text("2. How Available to Allocate Was Calculated", 14, currentY);
    currentY += 4;

    const cb = reportData.calculationBreakdown || {};
    const ob = cb.openingBalance || {};
    const infl = cb.inflow || {};
    const outf = cb.outflows || {};
    const fundsBefore = cb.fundsBeforeOutflows !== undefined ? cb.fundsBeforeOutflows : (safeNum(financialSummary.openingBalance) + safeNum(financialSummary.totalIncome));
    const invAmt = outf.investments !== undefined ? outf.investments : financialSummary.totalInvestmentContributionsPeriod;
    const goalAmt = outf.goalContributions !== undefined ? outf.goalContributions : financialSummary.totalGoalContributionsPeriod;
    const insAmt = outf.insurancePayments !== undefined ? outf.insurancePayments : financialSummary.totalInsurancePremiumsPeriod;
    const liabAmt = outf.liabilityPayments !== undefined ? outf.liabilityPayments : financialSummary.totalLiabilityPaymentsPeriod;
    const expAmt = outf.expenses !== undefined ? outf.expenses : financialSummary.totalExpenses;
    const availAmt = cb.availableToAllocate !== undefined ? cb.availableToAllocate : financialSummary.availableToAllocate;

    const sourceDesc = ob.sourceDescription || (ob.previousMonthLabel ? `Carried forward from ${ob.previousMonthLabel} closing` : "Initial starting balance");

    const calculationRows = [
      ["Opening / Existing Balance", fmtINR(ob.amount || financialSummary.openingBalance), `Source: ${sourceDesc}`],
      ["+ Total Monthly Inflow", `+ ${fmtINR(infl.totalIncome || financialSummary.totalIncome)}`, "Base salary + additional earnings"],
      ["= Total Funds Available Before Outflows", fmtINR(fundsBefore), "Opening Balance + Monthly Inflow"],
      ["− Living Expenses", expAmt > 0 ? `− ${fmtINR(expAmt)}` : "—", "Essential monthly operating costs"],
      ["− Investment Contributions", invAmt > 0 ? `− ${fmtINR(invAmt)}` : "— No contribution recorded", "Actual SIP / RD deposits recorded"],
      ["− Saving Goal Contributions", goalAmt > 0 ? `− ${fmtINR(goalAmt)}` : "— No contribution recorded", "Actual goal allocations deposited"],
      ["− Insurance Premiums Paid", insAmt > 0 ? `− ${fmtINR(insAmt)}` : "— No payment recorded", "Actual premiums paid this month"],
      ["− Liability / EMI Payments", liabAmt > 0 ? `− ${fmtINR(liabAmt)}` : "— No payment recorded", "Actual loan EMI & debt servicing paid"],
      ["= Available to Allocate (Ending Liquid Balance)", fmtINR(availAmt), "Funds Before Outflows − Total Actual Outflows"],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [["Calculation Step", "Amount", "Details & Provenance"]],
      body: calculationRows,
      theme: "striped",
      headStyles: { fillColor: [49, 92, 70], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 1.8 },
      columnStyles: {
        0: { fontStyle: "bold", width: 60 },
        1: { fontStyle: "bold", textColor: [24, 57, 44], width: 35 },
        2: { textColor: [100, 116, 139], width: 85 },
      },
      margin: { left: 14, right: 14 },
    });
    currentY = doc.lastAutoTable.finalY + 4;

    // Natural language explanation
    if (cb.explanation) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(50, 75, 60);
      const splitText = doc.splitTextToSize(`Summary: ${cb.explanation}`, 180);
      doc.text(splitText, 14, currentY);
      currentY += splitText.length * 3.5 + 4;
    }

  } else {
    const titleText = duration === "quarterly"
      ? "2. Quarterly Month-by-Month Performance Grid"
      : duration === "halfYear"
      ? "2. Half-Yearly Financial Trajectory Matrix"
      : "2. Annual 12-Month Historical Financial Matrix";

    doc.text(titleText, 14, currentY);
    currentY += 4;

    const gridHeaders = ["Month", "Income", "Expenses", "Savings", "Investments", "Goals", "Liabilities", "Closing"];
    const gridRows = monthDetails.map((m) => [
      m.monthName,
      m.totalIncome > 0 ? fmtINR(m.totalIncome) : "—",
      m.expenses > 0 ? fmtINR(m.expenses) : "—",
      m.hasRecord || m.totalIncome > 0 ? fmtINR(m.savings) : "—",
      m.investmentCommitments > 0 ? fmtINR(m.investmentCommitments) : "—",
      m.goalAllocations > 0 ? fmtINR(m.goalAllocations) : "—",
      m.liabilityCommitments > 0 ? fmtINR(m.liabilityCommitments) : "—",
      m.hasRecord || m.closingBalance > 0 ? fmtINR(m.closingBalance) : "—",
    ]);

    gridRows.push([
      "Total Period",
      fmtINR(financialSummary.totalIncome),
      fmtINR(financialSummary.totalExpenses),
      fmtINR(totalSav),
      fmtINR(financialSummary.totalInvestmentContributionsPeriod),
      fmtINR(financialSummary.totalGoalContributionsPeriod),
      fmtINR(financialSummary.totalLiabilityPaymentsPeriod),
      fmtINR(financialSummary.closingBalance),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [gridHeaders],
      body: gridRows,
      theme: "grid",
      headStyles: { fillColor: [49, 92, 70], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      columnStyles: {
        0: { fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
    });
    currentY = doc.lastAutoTable.finalY + 7;
  }

  // ------------------------------------------------------------
  // SECTION 3: NET WORTH TIMELINE & BREAKDOWN
  // ------------------------------------------------------------
  currentY = ensureSpace(doc, currentY, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(24, 57, 44);
  doc.text("3. Net Worth Progression", 14, currentY);
  currentY += 4;

  const nwPoints = netWorthSummary.history || [];
  if (nwPoints.length > 0) {
    const nwHeaders = ["Period / Month", "Cash Balance", "Total Assets", "Total Liabilities", "Net Worth"];
    const nwRows = nwPoints.map((pt) => [
      pt.monthName || pt.shortLabel,
      fmtINR(pt.cashBalance),
      fmtINR(pt.assets),
      fmtINR(pt.liabilities),
      fmtINR(pt.netWorth),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [nwHeaders],
      body: nwRows,
      theme: "striped",
      headStyles: { fillColor: [24, 57, 44], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      margin: { left: 14, right: 14 },
    });
    currentY = doc.lastAutoTable.finalY + 7;
  }

  // ------------------------------------------------------------
  // SECTION 4: PLANS CREATED / STARTED & MATURITIES
  // ------------------------------------------------------------
  currentY = ensureSpace(doc, currentY, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(24, 57, 44);
  doc.text("4. Plan Lifecycles & Scheduled Events", 14, currentY);
  currentY += 4;

  const createdList = plansLifecycle.plansCreatedThisPeriod || [];
  const startedList = plansLifecycle.plansStartedThisPeriod || [];
  const matList = plansLifecycle.maturitiesInPeriod || [];
  const upcomingList = plansLifecycle.upcomingFutureEvents || [];

  const lifecycleRows = [];
  createdList.forEach((c) => {
    lifecycleRows.push([c.name, c.type, "Created in Period", new Date(c.createdDate).toLocaleDateString("en-IN"), "Activated"]);
  });
  startedList.forEach((s) => {
    lifecycleRows.push([s.name, s.type, "Started in Period", new Date(s.startDate).toLocaleDateString("en-IN"), "Ongoing"]);
  });
  matList.forEach((m) => {
    lifecycleRows.push([m.name, m.type, m.event, new Date(m.eventDate).toLocaleDateString("en-IN"), fmtINR(m.actualAmount || m.expectedAmount)]);
  });
  upcomingList.slice(0, 4).forEach((u) => {
    lifecycleRows.push([u.name, u.type, u.event, new Date(u.eventDate).toLocaleDateString("en-IN"), fmtINR(u.expectedAmount)]);
  });

  if (lifecycleRows.length === 0) {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("No new plan creation, inception, or maturity events recorded in this period.", 14, currentY);
    currentY += 6;
  } else {
    autoTable(doc, {
      startY: currentY,
      head: [["Item Name", "Category / Type", "Lifecycle Event", "Date", "Details / Value"]],
      body: lifecycleRows,
      theme: "plain",
      headStyles: { fillColor: [240, 245, 238], textColor: [24, 57, 44], fontStyle: "bold", fontSize: 7.5 },
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      margin: { left: 14, right: 14 },
    });
    currentY = doc.lastAutoTable.finalY + 7;
  }

  // ------------------------------------------------------------
  // SECTION 5: FINANCIAL ITEMS DETAIL TABLES
  // ------------------------------------------------------------
  // 5A. Investments
  const invList = plans.investments || [];
  if (invList.length > 0) {
    currentY = ensureSpace(doc, currentY, 35);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(49, 92, 70);
    doc.text("Investments & Systematic Plans (SIP, FD, RD, Gold, Stocks)", 14, currentY);
    currentY += 3;

    const invRows = invList.map((inv) => [
      inv.name,
      inv.type,
      inv.startDate ? new Date(inv.startDate).toLocaleDateString("en-IN") : "—",
      inv.periodContributed > 0 ? fmtINR(inv.periodContributed) : "—",
      fmtINR(inv.currentValue),
      inv.status || "Active",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Asset Name", "Type", "Start Date", "Period Contribution", "Current Valuation", "Status"]],
      body: invRows,
      theme: "plain",
      headStyles: { fillColor: [240, 245, 238], textColor: [24, 57, 44], fontStyle: "bold", fontSize: 7.5 },
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      margin: { left: 14, right: 14 },
    });
    currentY = doc.lastAutoTable.finalY + 6;
  }

  // 5B. Saving Goals
  const goalList = plans.savingGoals || [];
  if (goalList.length > 0) {
    currentY = ensureSpace(doc, currentY, 35);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(49, 92, 70);
    doc.text("Dedicated Saving Goals", 14, currentY);
    currentY += 3;

    const goalRows = goalList.map((g) => [
      g.name,
      fmtINR(g.targetAmount),
      g.periodContributed > 0 ? fmtINR(g.periodContributed) : "—",
      fmtINR(g.totalSaved),
      `${g.progressPercentage}%`,
      fmtINR(g.remainingAmount),
      g.status || "Active",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Goal Name", "Target", "Period Contribution", "Total Saved", "Progress", "Remaining", "Status"]],
      body: goalRows,
      theme: "plain",
      headStyles: { fillColor: [240, 245, 238], textColor: [24, 57, 44], fontStyle: "bold", fontSize: 7.5 },
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      margin: { left: 14, right: 14 },
    });
    currentY = doc.lastAutoTable.finalY + 6;
  }

  // 5C. Liabilities & Loans
  const liabList = plans.liabilities || [];
  if (liabList.length > 0) {
    currentY = ensureSpace(doc, currentY, 35);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(49, 92, 70);
    doc.text("Liabilities & Loan Servicing", 14, currentY);
    currentY += 3;

    const liabRows = liabList.map((l) => [
      l.name,
      l.type,
      fmtINR(l.principalAmount),
      l.periodPaid > 0 ? fmtINR(l.periodPaid) : "—",
      l.periodPrincipal > 0 ? fmtINR(l.periodPrincipal) : "—",
      l.periodInterest > 0 ? fmtINR(l.periodInterest) : "—",
      fmtINR(l.remainingAmount),
      l.status || "Active",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Liability Name", "Type", "Principal", "Period Paid", "Principal Paid", "Interest Paid", "Outstanding", "Status"]],
      body: liabRows,
      theme: "plain",
      headStyles: { fillColor: [240, 245, 238], textColor: [24, 57, 44], fontStyle: "bold", fontSize: 7.5 },
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      margin: { left: 14, right: 14 },
    });
    currentY = doc.lastAutoTable.finalY + 6;
  }

  // ------------------------------------------------------------
  // SECTION 6: STRATEGIC INSIGHTS & SUGGESTIONS
  // ------------------------------------------------------------
  currentY = ensureSpace(doc, currentY, 35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(24, 57, 44);
  doc.text("5. Strategic Insights & Financial Guidance", 14, currentY);
  currentY += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  if (insights.length === 0 && suggestions.length === 0) {
    doc.text("No strategic advisories recorded for this period.", 14, currentY);
    currentY += 6;
  } else {
    insights.forEach((ins) => {
      currentY = ensureSpace(doc, currentY, 10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(24, 57, 44);
      doc.text(`* ${typeof ins === "string" ? ins : ins.title || ins.description}`, 14, currentY);
      currentY += 5;
    });

    suggestions.forEach((sug) => {
      currentY = ensureSpace(doc, currentY, 10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(49, 92, 70);
      const splitSug = doc.splitTextToSize(`Recommendation: ${sug}`, pageWidth - 32);
      doc.text(splitSug, 14, currentY);
      currentY += splitSug.length * 4;
    });
  }

  // ------------------------------------------------------------
  // FOOTER (ALL PAGES)
  // ------------------------------------------------------------
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text("FinanceOS — Confidential Financial Intelligence Statement", 14, 288);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, 288, { align: "right" });
  }

  const filename = `FinanceOS_${duration.toUpperCase()}_Report_${header.year || new Date().getFullYear()}_${Date.now()}.pdf`;
  doc.save(filename);
}