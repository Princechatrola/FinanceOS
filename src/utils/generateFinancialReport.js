// ============================================================
// FINANCEOS - PDF FINANCIAL REPORT GENERATOR
// ============================================================
//
// UPDATED DATA FLOW:
//
// Reports.jsx
//     ↓
// reportRecords
// reportData
// commitmentSummary
// financialPosition
//     ↓
// generateFinancialReport()
//     ↓
// PDF
//
// IMPORTANT:
//
// Commitment values shown in the PDF now come from the SAME
// calculated values used by Reports.jsx.
//
// Financial Position also uses the corrected:
// Assets - Liabilities = Net Worth
//
// ============================================================


import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


// ============================================================
// MONTHS
// ============================================================

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];


// ============================================================
// SAFE NUMBER
// ============================================================

function safeNumber(value) {

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;

}


// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(value) {

  const number =
    safeNumber(value);

  if (number === 0) return "-";

  const sign =
    number < 0
      ? "-"
      : "";


  return `${sign}Rs. ${Math.abs(number).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  )}`;

}


// ============================================================
// FORMAT PERCENTAGE
// ============================================================

function formatPercentage(value) {

  const number =
    safeNumber(value);

  return `${number.toFixed(1)}%`;

}


// ============================================================
// SAFE TEXT
// ============================================================

function safeText(
  value,
  fallback = "-"
) {

  const text =
    String(
      value ?? ""
    ).trim();

  return text || fallback;

}


// ============================================================
// ENSURE SPACE
// ============================================================

function ensureSpace(
  doc,
  currentY,
  requiredHeight = 50
) {

  if (
    currentY +
      requiredHeight >
    275
  ) {

    doc.addPage();

    return 20;

  }

  return currentY;

}


// ============================================================
// ADD TABLE
// ============================================================

function addTable(
  doc,
  {
    headers,
    rows,
    startY,
  }
) {

  // Filter out rows where all value columns (index > 0) are 0 or empty
  const filteredRows = rows.filter(row => {
    if (!Array.isArray(row) || row.length <= 1) return true;
    
    // Check if there is at least one non-zero, non-blank value
    const hasData = row.slice(1).some(val => {
      const v = String(val).trim().toLowerCase();
      // Values that are considered "zero" or "blank"
      const isZeroOrBlank = v === "" || v === "-" || v === "0" || v === "rs. 0" || v === "rs. 0.00" || v === "0.0%" || v === "0%";
      return !isZeroOrBlank;
    });
    
    return hasData;
  });

  // If no rows are left after filtering, don't render the table
  if (filteredRows.length === 0) {
    return startY;
  }

  autoTable(
    doc,
    {

      startY,

      head: [
        headers,
      ],

      body: filteredRows,

      theme: "grid",

      margin: {
        left: 14,
        right: 14,
        bottom: 18,
      },

      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        overflow: "linebreak",
      },

      headStyles: {

        fillColor: [
          49,
          92,
          70,
        ],

        textColor: [
          255,
          255,
          255,
        ],

        fontStyle:
          "bold",

      },

    }
  );


  return (
    doc.lastAutoTable
      ?.finalY ||
    startY
  );

}


// ============================================================
// CASH FLOW CHART
// ============================================================

function addCashFlowChart(
  doc,
  {
    income,
    expenses,
    savings,
    commitments,
    remainingBalance,
    startY,
  }
) {

  let currentY =
    ensureSpace(
      doc,
      startY,
      75
    );


  // ==========================================================
  // TITLE
  // ==========================================================

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(11);

  doc.text(
    "Cash Flow Overview",
    14,
    currentY
  );


  currentY += 8;


  // ==========================================================
  // CHART DATA
  // ==========================================================

  const items = [

    {
      label: "Income",
      value:
        safeNumber(
          income
        ),
    },

    {
      label: "Expenses",
      value:
        safeNumber(
          expenses
        ),
    },

    {
      label: "Savings",
      value:
        safeNumber(
          savings
        ),
    },

    {
      label: "Commitments",
      value:
        safeNumber(
          commitments
        ),
    },

    {
      label: "Remaining",
      value:
        safeNumber(
          remainingBalance
        ),
    },

  ];


  const maxValue =
    Math.max(
      ...items.map(
        (item) =>
          Math.abs(
            item.value
          )
      ),
      1
    );


  const labelX = 14;

  const barX = 48;

  const maxBarWidth = 90;

  const valueX = 143;

  const barHeight = 6;

  const rowHeight = 11;


  // ==========================================================
  // DRAW BARS
  // ==========================================================

  items.forEach(
    (
      item,
      index
    ) => {

      const y =
        currentY +
        index *
          rowHeight;


      const width =
        (
          Math.abs(
            item.value
          ) /
          maxValue
        ) *
        maxBarWidth;


      // ======================================================
      // LABEL
      // ======================================================

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(8);

      doc.text(
        item.label,
        labelX,
        y + 5
      );


      // ======================================================
      // BACKGROUND BAR
      // ======================================================

      doc.setFillColor(
        238,
        242,
        235
      );

      doc.roundedRect(
        barX,
        y,
        maxBarWidth,
        barHeight,
        1,
        1,
        "F"
      );


      // ======================================================
      // VALUE BAR
      // ======================================================

      if (
        item.value >= 0
      ) {

        doc.setFillColor(
          49,
          92,
          70
        );

      } else {

        doc.setFillColor(
          190,
          60,
          60
        );

      }


      if (
        Math.abs(
          item.value
        ) > 0
      ) {

        doc.roundedRect(
          barX,
          y,
          Math.max(
            width,
            0.5
          ),
          barHeight,
          1,
          1,
          "F"
        );

      }


      // ======================================================
      // VALUE
      // ======================================================

      doc.text(
        formatMoney(
          item.value
        ),
        valueX,
        y + 5
      );

    }
  );


  return (
    currentY +
    items.length *
      rowHeight +
    4
  );

}


// ============================================================
// MONTHLY REMAINING BALANCE TREND
// ============================================================

function addMonthlyTrendChart(
  doc,
  records,
  startY
) {

  if (
    !Array.isArray(records) ||
    records.length < 2
  ) {

    return startY;

  }


  let currentY =
    ensureSpace(
      doc,
      startY,
      75
    );


  // ==========================================================
  // TITLE
  // ==========================================================

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(11);

  doc.text(
    "Monthly Remaining Balance Trend",
    14,
    currentY
  );


  currentY += 10;


  // ==========================================================
  // CHART DIMENSIONS
  // ==========================================================

  const chartX = 20;

  const chartY =
    currentY;

  const chartWidth = 170;

  const chartHeight = 45;


  // ==========================================================
  // VALUES
  // ==========================================================

  const values =
    records.map(
      (record) =>
        safeNumber(
          record
            ?.availableToAllocate ??
          record
            ?.remainingBalance
        )
    );


  const maxValue =
    Math.max(
      ...values,
      0
    );


  const minValue =
    Math.min(
      ...values,
      0
    );


  const range =
    maxValue -
      minValue ||
    1;


  // ==========================================================
  // BORDER
  // ==========================================================

  doc.setDrawColor(
    210,
    218,
    207
  );

  doc.rect(
    chartX,
    chartY,
    chartWidth,
    chartHeight
  );


  // ==========================================================
  // ZERO LINE
  // ==========================================================

  const zeroY =
    chartY +
    chartHeight -
    (
      (
        0 -
        minValue
      ) /
      range
    ) *
      chartHeight;


  doc.setDrawColor(
    225,
    230,
    222
  );

  doc.line(
    chartX,
    zeroY,
    chartX +
      chartWidth,
    zeroY
  );


  // ==========================================================
  // POINTS
  // ==========================================================

  const points =
    records.map(
      (
        record,
        index
      ) => {

        const value =
          safeNumber(
            record
              ?.availableToAllocate ??
            record
              ?.remainingBalance
          );


        const x =
          chartX +
          (
            index /
            (
              records.length -
              1
            )
          ) *
            chartWidth;


        const y =
          chartY +
          chartHeight -
          (
            (
              value -
              minValue
            ) /
            range
          ) *
            chartHeight;


        return {
          x,
          y,
          value,
          record,
        };

      }
    );


  // ==========================================================
  // DRAW TREND LINE
  // ==========================================================

  doc.setDrawColor(
    49,
    92,
    70
  );


  for (
    let index = 1;
    index < points.length;
    index += 1
  ) {

    doc.line(
      points[index - 1].x,
      points[index - 1].y,
      points[index].x,
      points[index].y
    );

  }


  // ==========================================================
  // POINTS + LABELS
  // ==========================================================

  points.forEach(
    (point) => {

      doc.setFillColor(
        49,
        92,
        70
      );


      doc.circle(
        point.x,
        point.y,
        1.4,
        "F"
      );


      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(6);


      const month =
        MONTHS[
          safeNumber(
            point.record
              ?.month
          ) - 1
        ];


      const label =
        month
          ? month.slice(
              0,
              3
            )
          : String(
              point.record
                ?.month ??
              ""
            );


      doc.text(
        label,
        point.x,
        chartY +
          chartHeight +
          5,
        {
          align:
            "center",
        }
      );

    }
  );


  return (
    chartY +
    chartHeight +
    12
  );

}


// ============================================================
// NET WORTH TREND CHART
// ============================================================

function addNetWorthTrendChart(doc, records, startY) {
  if (!Array.isArray(records) || records.length < 2) return startY;

  let currentY = ensureSpace(doc, startY, 75);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Net Worth Trend", 14, currentY);

  currentY += 10;

  const chartX = 20;
  const chartY = currentY;
  const chartWidth = 170;
  const chartHeight = 45;

  const values = records.map((record) => {
    const assets = safeNumber(record?.totalAssets);
    const liabilities = safeNumber(record?.totalLiabilities ?? record?.liabilities);
    return assets - liabilities;
  });

  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  doc.setDrawColor(210, 218, 207);
  doc.rect(chartX, chartY, chartWidth, chartHeight);

  const zeroY = chartY + chartHeight - ((0 - minValue) / range) * chartHeight;
  doc.setDrawColor(225, 230, 222);
  doc.line(chartX, zeroY, chartX + chartWidth, zeroY);

  const points = records.map((record, index) => {
    const assets = safeNumber(record?.totalAssets);
    const liabilities = safeNumber(record?.totalLiabilities ?? record?.liabilities);
    const value = assets - liabilities;
    const x = chartX + (index / (records.length - 1)) * chartWidth;
    const y = chartY + chartHeight - ((value - minValue) / range) * chartHeight;
    return { x, y, value, record };
  });

  doc.setDrawColor(49, 92, 70);
  for (let index = 1; index < points.length; index += 1) {
    doc.line(points[index - 1].x, points[index - 1].y, points[index].x, points[index].y);
  }

  points.forEach((point) => {
    doc.setFillColor(49, 92, 70);
    doc.circle(point.x, point.y, 1.4, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    const month = MONTHS[safeNumber(point.record?.month) - 1];
    const label = month ? month.slice(0, 3) : String(point.record?.month ?? "");
    doc.text(label, point.x, chartY + chartHeight + 5, { align: "center" });
  });

  return chartY + chartHeight + 12;
}

// ============================================================
// SUGGESTIONS
// ============================================================

function addSuggestions(doc, data, startY) {
  let currentY = ensureSpace(doc, startY, 50);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Financial Insights & Suggestions", 14, currentY);

  currentY += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  const income = safeNumber(data.reportData?.totalIncome);
  const savings = safeNumber(data.reportData?.totalSavings);
  const liabilities = safeNumber(data.financialPosition?.totalLiabilities);
  const assets = safeNumber(data.financialPosition?.totalAssets);
  const insuranceMonthly = safeNumber(data.commitmentSummary?.insurance);

  const suggestions = [];

  // Savings Rule: Aim for 20% savings
  if (income > 0) {
    const savingsRate = savings / income;
    if (savingsRate < 0.2) {
      suggestions.push(`• Your savings rate is ${(savingsRate * 100).toFixed(1)}%. Consider aiming for at least 20% of your income.`);
    } else {
      suggestions.push(`• Great job! Your savings rate is ${(savingsRate * 100).toFixed(1)}%, which is healthy.`);
    }
  }

  // Debt Rule: Liabilities should ideally be less than 40% of income/assets
  if (assets > 0) {
    const debtRatio = liabilities / assets;
    if (debtRatio > 1) {
      suggestions.push(`• Your liabilities exceed your assets. Prioritize paying down high-interest debt to improve your net worth.`);
    } else if (debtRatio > 0.4) {
      suggestions.push(`• Your debt-to-asset ratio is ${(debtRatio * 100).toFixed(1)}%. You might want to prioritize paying down high-interest liabilities.`);
    }
  }

  if (insuranceMonthly === 0) {
    suggestions.push(`• You have no active insurance commitments. Consider getting health and life insurance to protect your net worth.`);
  }

  if (suggestions.length === 0) {
    suggestions.push(`• Your finances look well balanced based on the current data.`);
  }

  suggestions.forEach(suggestion => {
    const lines = doc.splitTextToSize(suggestion, 180);
    currentY = ensureSpace(doc, currentY, lines.length * 5);
    doc.text(lines, 14, currentY);
    currentY += (lines.length * 5) + 2;
  });

  doc.setTextColor(0, 0, 0); // reset
  return currentY;
}


// ============================================================
// GENERATE FINANCIAL REPORT
// ============================================================

export function generateFinancialReport({

  // ==========================================================
  // USER
  // ==========================================================

  userName =
    "FinanceOS User",

  userEmail = "",

  userId = "",


  // ==========================================================
  // REPORT
  // ==========================================================

  reportTitle =
    "Financial Report",

  reportType =
    "monthly",

  selectedYear,

  expectedMonths = 1,


  // ==========================================================
  // HISTORY
  // ==========================================================

  reportRecords = [],


  // ==========================================================
  // CALCULATED REPORT DATA
  // ==========================================================

  reportData = {},


  // ==========================================================
  // CURRENT FINANCIAL RECORDS
  // ==========================================================

  savingGoals = [],

  investments = [],

  insurancePolicies = [],

  liabilities = [],


  // ==========================================================
  // CORRECTED DATA FROM REPORTS.JSX
  // ==========================================================

  commitmentSummary = {},

  financialPosition = {},

}) {


  // ==========================================================
  // CREATE PDF
  // ==========================================================

  const doc =
    new jsPDF({
      orientation:
        "portrait",
      unit:
        "mm",
      format:
        "a4",
    });


  // ==========================================================
  // SAFE ARRAYS
  // ==========================================================

  const records =
    Array.isArray(
      reportRecords
    )
      ? reportRecords
      : [];


  const goals =
    Array.isArray(
      savingGoals
    )
      ? savingGoals
      : [];


  const investmentRecords =
    Array.isArray(
      investments
    )
      ? investments
      : [];


  const insuranceRecords =
    Array.isArray(
      insurancePolicies
    )
      ? insurancePolicies
      : [];


  const liabilityRecords =
    Array.isArray(
      liabilities
    )
      ? liabilities
      : [];


  // ==========================================================
  // REPORT TOTALS
  // ==========================================================

  const totals =
    reportData?.totals ||
    {};


  // ==========================================================
  // CORRECT COMMITMENT VALUES
  // ==========================================================
  //
  // First preference:
  // commitmentSummary from Reports.jsx
  //
  // Fallback:
  // reportData.totals
  //
  // ==========================================================

  const goalCommitment =
    safeNumber(
      commitmentSummary
        ?.savingGoals ??
      totals
        ?.goalCommitment
    );


  const investmentCommitment =
    safeNumber(
      commitmentSummary
        ?.investments ??
      totals
        ?.investmentCommitment
    );


  const insuranceCommitment =
    safeNumber(
      commitmentSummary
        ?.insurance ??
      totals
        ?.insuranceCommitment
    );


  const liabilityCommitment =
    safeNumber(
      commitmentSummary
        ?.liabilities ??
      totals
        ?.liabilityCommitment
    );


  // ==========================================================
  // TOTAL COMMITMENTS
  // ==========================================================
  //
  // Recalculate instead of trusting a stale total.
  //
  // ==========================================================

  const calculatedTotalCommitments =
    goalCommitment +
    investmentCommitment +
    insuranceCommitment +
    liabilityCommitment;


  const totalCommitments =
    calculatedTotalCommitments;


  // ==========================================================
  // TOTAL INCOME
  // ==========================================================

  const totalIncome =
    safeNumber(
      totals?.income
    );


  // ==========================================================
  // TOTAL EXPENSES
  // ==========================================================

  const totalExpenses =
    safeNumber(
      totals?.expenses
    );


  // ==========================================================
  // TOTAL SAVINGS
  // ==========================================================

  const totalSavings =
    safeNumber(
      totals?.savings
    );


  // ==========================================================
  // REMAINING BALANCE
  // ==========================================================
  //
  // Main rule:
  //
  // Savings - Commitments
  //
  // ==========================================================

  const calculatedRemainingBalance =
    totalSavings -
    totalCommitments;


  const remainingBalance =
    Number.isFinite(
      calculatedRemainingBalance
    )
      ? calculatedRemainingBalance
      : safeNumber(
          totals
            ?.remainingBalance ??
          totals
            ?.available
        );


  // ==========================================================
  // AVERAGE REMAINING BALANCE
  // ==========================================================

  const actualMonths =
    safeNumber(
      reportData?.count
    ) ||
    records.length;


  const averageRemainingBalance =
    actualMonths > 0
      ? remainingBalance /
        actualMonths
      : 0;


  // ==========================================================
  // CORRECT FINANCIAL POSITION
  // ==========================================================

  const totalAssets =
    safeNumber(
      financialPosition
        ?.totalAssets ??
      reportData
        ?.totalAssets
    );


  const totalLiabilities =
    safeNumber(
      financialPosition
        ?.totalLiabilities ??
      reportData
        ?.totalLiabilities
    );


  // ==========================================================
  // NET WORTH
  // ==========================================================
  //
  // ALWAYS:
  //
  // Assets - Liabilities
  //
  // ==========================================================

  const netWorth =
    totalAssets -
    totalLiabilities;


  // ==========================================================
  // RATIOS
  // ==========================================================

  const savingsRate =
    totalIncome > 0

      ? (
          totalSavings /
          totalIncome
        ) * 100

      : 0;


  const expenseRatio =
    totalIncome > 0

      ? (
          totalExpenses /
          totalIncome
        ) * 100

      : 0;


  const commitmentRatio =
    totalIncome > 0

      ? (
          totalCommitments /
          totalIncome
        ) * 100

      : 0;


  const remainingBalanceRatio =
    totalIncome > 0

      ? (
          remainingBalance /
          totalIncome
        ) * 100

      : 0;


  // ==========================================================
  // AVERAGES
  // ==========================================================

  const averageIncome =
    actualMonths > 0
      ? totalIncome /
        actualMonths
      : 0;


  const averageExpenses =
    actualMonths > 0
      ? totalExpenses /
        actualMonths
      : 0;


  const averageSavings =
    actualMonths > 0
      ? totalSavings /
        actualMonths
      : 0;


  const averageCommitments =
    actualMonths > 0
      ? totalCommitments /
        actualMonths
      : 0;


  // ==========================================================
  // REPORT TYPE LABEL
  // ==========================================================

  let reportTypeLabel =
    "Monthly Report";


  if (
    reportType ===
    "quarterly"
  ) {

    reportTypeLabel =
      "Quarterly Report";

  }


  if (
    reportType ===
    "halfYear"
  ) {

    reportTypeLabel =
      "6-Month Report";

  }


  if (
    reportType ===
    "yearly"
  ) {

    reportTypeLabel =
      "Yearly Report";

  }


  // ==========================================================
  // HEADER
  // ==========================================================

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(20);

  doc.text(
    "FinanceOS",
    14,
    18
  );


  doc.setFontSize(14);

  doc.text(
    "Financial Report",
    14,
    28
  );


  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(10);

  doc.text(
    safeText(
      reportTitle
    ),
    14,
    36
  );


  doc.setFontSize(8);

  doc.text(
    reportTypeLabel,
    14,
    42
  );


  // ==========================================================
  // USER DETAILS
  // ==========================================================

  doc.text(
    `User: ${safeText(
      userName,
      "FinanceOS User"
    )}`,
    14,
    48
  );


  let headerY = 53;


  if (
    String(
      userEmail || ""
    ).trim()
  ) {

    doc.text(
      `Email: ${userEmail}`,
      14,
      headerY
    );

    headerY += 5;

  }

  if (
    String(
      userId || ""
    ).trim()
  ) {

    doc.text(
      `User ID: ${userId}`,
      14,
      headerY
    );

    headerY += 5;

  }


  // ==========================================================
  // GENERATED DATE
  // ==========================================================

  doc.text(
    `Generated: ${new Date().toLocaleDateString(
      "en-IN"
    )}`,
    14,
    headerY
  );


  headerY += 5;


  // ==========================================================
  // DATA COUNT
  // ==========================================================

  doc.text(
    `Data available: ${actualMonths} of ${expectedMonths} month${
      Number(
        expectedMonths
      ) === 1
        ? ""
        : "s"
    }`,
    14,
    headerY
  );


  let currentY =
    headerY + 8;


  // ==========================================================
  // FINANCIAL SUMMARY
  // ==========================================================

  currentY =
    addTable(
      doc,
      {

        startY:
          currentY,

        headers: [
          "Financial Summary",
          "Amount",
        ],

        rows: [

          [
            "Total Income",
            formatMoney(
              totalIncome
            ),
          ],

          [
            "Total Expenses",
            formatMoney(
              totalExpenses
            ),
          ],

          [
            "Total Savings",
            formatMoney(
              totalSavings
            ),
          ],

          [
            "Total Commitments",
            formatMoney(
              totalCommitments
            ),
          ],

          [
            "Remaining Balance",
            formatMoney(
              remainingBalance
            ),
          ],

        ],

      }
    );


  // ==========================================================
  // CASH FLOW CHART
  // ==========================================================

  currentY =
    addCashFlowChart(
      doc,
      {

        startY:
          currentY + 10,

        income:
          totalIncome,

        expenses:
          totalExpenses,

        savings:
          totalSavings,

        commitments:
          totalCommitments,

        remainingBalance,

      }
    );


  // ==========================================================
  // MONTHLY AVERAGES
  // ==========================================================

  if (
    actualMonths > 1
  ) {

    currentY =
      addTable(
        doc,
        {

          startY:
            currentY + 8,

          headers: [
            "Monthly Average",
            "Amount",
          ],

          rows: [

            [
              "Average Income",
              formatMoney(
                averageIncome
              ),
            ],

            [
              "Average Expenses",
              formatMoney(
                averageExpenses
              ),
            ],

            [
              "Average Savings",
              formatMoney(
                averageSavings
              ),
            ],

            [
              "Average Commitments",
              formatMoney(
                averageCommitments
              ),
            ],

            [
              "Average Remaining Balance",
              formatMoney(
                averageRemainingBalance
              ),
            ],

          ],

        }
      );

  }


  // ==========================================================
  // FINANCIAL RATIOS
  // ==========================================================

  currentY =
    addTable(
      doc,
      {

        startY:
          currentY + 8,

        headers: [
          "Financial Ratio",
          "Value",
        ],

        rows: [

          [
            "Savings Rate",
            formatPercentage(
              savingsRate
            ),
          ],

          [
            "Expense Ratio",
            formatPercentage(
              expenseRatio
            ),
          ],

          [
            "Commitment Ratio",
            formatPercentage(
              commitmentRatio
            ),
          ],

          [
            "Remaining Balance Ratio",
            formatPercentage(
              remainingBalanceRatio
            ),
          ],

        ],

      }
    );


  // ==========================================================
  // COMMITMENT BREAKDOWN
  // ==========================================================

  currentY =
    addTable(
      doc,
      {

        startY:
          currentY + 8,

        headers: [
          "Commitment",
          "Amount",
        ],

        rows: [

          [
            "Saving Goals",
            formatMoney(
              goalCommitment
            ),
          ],

          [
            "Investments",
            formatMoney(
              investmentCommitment
            ),
          ],

          [
            "Insurance",
            formatMoney(
              insuranceCommitment
            ),
          ],

          [
            "Loan / EMI",
            formatMoney(
              liabilityCommitment
            ),
          ],

          [
            "Total Commitments",
            formatMoney(
              totalCommitments
            ),
          ],

        ],

      }
    );


  // ==========================================================
  // FINANCIAL POSITION
  // ==========================================================

  currentY =
    addTable(
      doc,
      {

        startY:
          currentY + 8,

        headers: [
          "Financial Position",
          "Amount",
        ],

        rows: [

          [
            "Total Assets",
            formatMoney(
              totalAssets
            ),
          ],

          [
            "Outstanding Liabilities",
            formatMoney(
              totalLiabilities
            ),
          ],

          [
            "Net Worth",
            formatMoney(
              netWorth
            ),
          ],

        ],

      }
    );
      // ==========================================================
  // NET WORTH MOVEMENT
  // ==========================================================

  if (
    actualMonths > 1
  ) {

    const startingNetWorth =
      safeNumber(
        reportData
          ?.startingNetWorth
      );


    const endingNetWorth =
      safeNumber(
        reportData
          ?.endingNetWorth
      );


    const netWorthChange =
      endingNetWorth -
      startingNetWorth;


    const netWorthChangePercent =
      startingNetWorth !== 0

        ? (
            netWorthChange /
            Math.abs(
              startingNetWorth
            )
          ) * 100

        : 0;


    currentY =
      addTable(
        doc,
        {

          startY:
            currentY + 8,

          headers: [
            "Net Worth Movement",
            "Value",
          ],

          rows: [

            [
              "Starting Net Worth",
              formatMoney(
                startingNetWorth
              ),
            ],

            [
              "Ending Net Worth",
              formatMoney(
                endingNetWorth
              ),
            ],

            [
              "Change",
              formatMoney(
                netWorthChange
              ),
            ],

            [
              "Change Percentage",
              formatPercentage(
                netWorthChangePercent
              ),
            ],

          ],

        }
      );

  }


  // ==========================================================
  // MONTHLY REMAINING BALANCE TREND
  // ==========================================================

  if (
    records.length > 1
  ) {

    currentY =
      addMonthlyTrendChart(
        doc,
        records,
        currentY + 10
      );

  }


  // ==========================================================
  // NET WORTH TREND CHART
  // ==========================================================

  if (
    records.length > 1
  ) {

    currentY =
      addNetWorthTrendChart(
        doc,
        records,
        currentY + 10
      );

  }


  // ==========================================================
  // MONTHLY BREAKDOWN
  // ==========================================================

  if (
    records.length > 0
  ) {

    currentY =
      addTable(
        doc,
        {

          startY:
            currentY + 8,

          headers: [
            "Month",
            "Income",
            "Expenses",
            "Savings",
            "Commitments",
            "Remaining",
            "Net Worth",
          ],

          rows:
            records.map(
              (record) => {

                const monthName =
                  MONTHS[
                    safeNumber(
                      record
                        ?.month
                    ) - 1
                  ] ||
                  `Month ${
                    record?.month ??
                    ""
                  }`;


                // ============================================
                // MONTH VALUES
                // ============================================

                const recordIncome =
                  safeNumber(
                    record
                      ?.income
                  );


                const recordExpenses =
                  safeNumber(
                    record
                      ?.expenses
                  );


                const recordSavings =
                  safeNumber(
                    record
                      ?.monthlySavings ??
                    (
                      recordIncome -
                      recordExpenses
                    )
                  );


                const recordGoalCommitment =
                  safeNumber(
                    record
                      ?.goalCommitment
                  );


                const recordInvestmentCommitment =
                  safeNumber(
                    record
                      ?.investmentCommitment
                  );


                const recordInsuranceCommitment =
                  safeNumber(
                    record
                      ?.insuranceCommitment
                  );


                const recordLiabilityCommitment =
                  safeNumber(
                    record
                      ?.liabilityCommitment
                  );


                // ============================================
                // RECALCULATE MONTH COMMITMENTS
                // ============================================

                const recordTotalCommitments =
                  recordGoalCommitment +
                  recordInvestmentCommitment +
                  recordInsuranceCommitment +
                  recordLiabilityCommitment;


                // ============================================
                // REMAINING BALANCE
                // ============================================

                const recordRemaining =
                  recordSavings -
                  recordTotalCommitments;


                // ============================================
                // NET WORTH
                // ============================================

                const recordAssets =
                  safeNumber(
                    record
                      ?.totalAssets
                  );


                const recordLiabilities =
                  safeNumber(
                    record
                      ?.totalLiabilities ??
                    record
                      ?.liabilities
                  );


                const recordNetWorth =
                  recordAssets -
                  recordLiabilities;


                return [

                  `${monthName} ${
                    record?.year ||
                    ""
                  }`,

                  formatMoney(
                    recordIncome
                  ),

                  formatMoney(
                    recordExpenses
                  ),

                  formatMoney(
                    recordSavings
                  ),

                  formatMoney(
                    recordTotalCommitments
                  ),

                  formatMoney(
                    recordRemaining
                  ),

                  formatMoney(
                    recordNetWorth
                  ),

                ];

              }
            ),

        }
      );

  }


  // ==========================================================
  // SAVING GOALS
  // ==========================================================

  if (
    goals.length > 0
  ) {

    currentY =
      addTable(
        doc,
        {

          startY:
            currentY + 8,

          headers: [
            "Saving Goal",
            "Target",
            "Contributed",
            "Monthly",
            "Status",
          ],

          rows:
            goals.map(
              (goal) => [

                safeText(
                  goal?.name,
                  "Saving Goal"
                ),


                formatMoney(
                  goal
                    ?.targetAmount ??
                  goal
                    ?.amount
                ),


                formatMoney(
                  goal
                    ?.totalContributed ??
                  goal
                    ?.savedAmount ??
                  goal
                    ?.alreadySaved
                ),


                formatMoney(
                  goal
                    ?.monthlyContribution ??
                  goal
                    ?.monthlyAllocation ??
                  goal
                    ?.requiredMonthly
                ),


                safeText(
                  goal?.status,
                  "Active"
                ),

              ]
            ),

        }
      );

  }


  // ==========================================================
  // INVESTMENTS
  // ==========================================================

  if (
    investmentRecords.length > 0
  ) {

    currentY =
      addTable(
        doc,
        {

          startY:
            currentY + 8,

          headers: [
            "Investment",
            "Current Value",
            "Monthly",
            "Status",
          ],

          rows:
            investmentRecords.map(
              (investment) => {

                // ============================================
                // INVESTMENT VALUE
                // ============================================

                const currentValue =
                  safeNumber(

                    investment
                      ?.currentValue ??

                    investment
                      ?.maturityAmount ??

                    investment
                      ?.amount ??

                    investment
                      ?.investedAmount

                  );


                // ============================================
                // MONTHLY INVESTMENT
                // ============================================
                //
                // FD may correctly be 0 here when it is a
                // one-time investment.
                //
                // ============================================

                const monthlyContribution =
                  safeNumber(

                    investment
                      ?.monthlyContribution ??

                    investment
                      ?.monthlyAmount ??

                    investment
                      ?.sipAmount ??

                    investment
                      ?.installmentAmount

                  );


                return [

                  safeText(
                    investment?.name ||
                    investment?.type,
                    "Investment"
                  ),


                  formatMoney(
                    currentValue
                  ),


                  formatMoney(
                    monthlyContribution
                  ),


                  safeText(
                    investment?.status,
                    "Active"
                  ),

                ];

              }
            ),

        }
      );

  }


  // ==========================================================
  // INSURANCE
  // ==========================================================

  if (
    insuranceRecords.length > 0
  ) {

    currentY =
      addTable(
        doc,
        {

          startY:
            currentY + 8,

          headers: [
            "Insurance",
            "Premium",
            "Frequency",
            "Monthly Equivalent",
            "Status",
          ],

          rows:
            insuranceRecords.map(
              (policy) => {

                const premium =
                  safeNumber(

                    policy
                      ?.premiumAmount ??

                    policy
                      ?.premium ??

                    policy
                      ?.monthlyPremium ??

                    policy
                      ?.amount

                  );


                const frequency =
                  safeText(

                    policy
                      ?.premiumFrequency ||

                    policy
                      ?.frequency,

                    "Monthly"

                  );


                // ============================================
                // MONTHLY EQUIVALENT
                // ============================================

                const normalizedFrequency =
                  String(
                    frequency
                  )
                    .trim()
                    .toLowerCase();


                let monthlyEquivalent =
                  premium;


                if (
                  normalizedFrequency ===
                    "yearly" ||
                  normalizedFrequency ===
                    "annual" ||
                  normalizedFrequency ===
                    "annually"
                ) {

                  monthlyEquivalent =
                    premium / 12;

                } else if (
                  normalizedFrequency ===
                    "half-yearly" ||
                  normalizedFrequency ===
                    "half yearly" ||
                  normalizedFrequency ===
                    "semiannual" ||
                  normalizedFrequency ===
                    "semi-annual"
                ) {

                  monthlyEquivalent =
                    premium / 6;

                } else if (
                  normalizedFrequency ===
                    "quarterly"
                ) {

                  monthlyEquivalent =
                    premium / 3;

                } else if (
                  normalizedFrequency ===
                    "weekly"
                ) {

                  monthlyEquivalent =
                    (
                      premium *
                      52
                    ) / 12;

                }


                return [

                  safeText(
                    policy?.name ||
                    policy?.type,
                    "Insurance"
                  ),


                  formatMoney(
                    premium
                  ),


                  frequency,


                  formatMoney(
                    monthlyEquivalent
                  ),


                  safeText(
                    policy?.status,
                    "Active"
                  ),

                ];

              }
            ),

        }
      );

  }


  // ==========================================================
  // LIABILITIES
  // ==========================================================

  if (
    liabilityRecords.length > 0
  ) {

    currentY =
      addTable(
        doc,
        {

          startY:
            currentY + 8,

          headers: [
            "Liability",
            "Outstanding",
            "Monthly EMI",
            "Status",
          ],

          rows:
            liabilityRecords.map(
              (liability) => {

                // ============================================
                // OUTSTANDING AMOUNT
                // ============================================

                const outstanding =
                  safeNumber(

                    liability
                      ?.remainingAmount ??

                    liability
                      ?.outstandingAmount ??

                    liability
                      ?.outstandingBalance ??

                    liability
                      ?.balance

                  );


                // ============================================
                // MONTHLY EMI
                // ============================================

                const monthlyEmi =
                  safeNumber(

                    liability
                      ?.monthlyPayment ??

                    liability
                      ?.monthlyEMI ??

                    liability
                      ?.monthlyEmi ??

                    liability
                      ?.emi

                  );


                return [

                  safeText(
                    liability?.name ||
                    liability?.type,
                    "Liability"
                  ),


                  formatMoney(
                    outstanding
                  ),


                  formatMoney(
                    monthlyEmi
                  ),


                  safeText(
                    liability?.status,
                    "Active"
                  ),

                ];

              }
            ),

        }
      );

  }


  // ==========================================================
  // FINANCIAL SUGGESTIONS
  // ==========================================================

  currentY =
    addSuggestions(
      doc,
      {
        reportData,
        financialPosition,
        commitmentSummary,
      },
      currentY + 10
    );


  // ==========================================================
  // REPORT INFORMATION
  // ==========================================================

  if (
    actualMonths <
    safeNumber(
      expectedMonths
    )
  ) {

    addTable(
      doc,
      {

        startY:
          currentY + 8,

        headers: [
          "Report Information",
        ],

        rows: [

          [
            `Partial report: ${actualMonths} of ${expectedMonths} months contain saved financial data. Calculations use only the available records.`,
          ],

        ],

      }
    );

  }


  // ==========================================================
  // PAGE NUMBERS
  // ==========================================================

  const totalPages =
    doc.getNumberOfPages();


  for (
    let page = 1;
    page <= totalPages;
    page += 1
  ) {

    doc.setPage(
      page
    );


    doc.setFont(
      "helvetica",
      "normal"
    );


    doc.setFontSize(8);


    doc.text(
      `FinanceOS Financial Report | Page ${page} of ${totalPages}`,
      14,
      290
    );

  }


  // ==========================================================
  // SAFE FILE TITLE
  // ==========================================================

  const safeTitle =
    String(
      reportTitle ||
      "Financial-Report"
    )

      .replace(
        /[^a-zA-Z0-9]+/g,
        "-"
      )

      .replace(
        /^-+|-+$/g,
        ""
      );


  // ==========================================================
  // YEAR
  // ==========================================================

  const year =
    safeNumber(
      selectedYear
    );


  // ==========================================================
  // FILE NAME
  // ==========================================================

  const fileName =
    `FinanceOS-${safeTitle}${
      year > 0 &&
      !safeTitle.includes(
        String(year)
      )
        ? `-${year}`
        : ""
    }.pdf`;


  // ==========================================================
  // DOWNLOAD PDF
  // ==========================================================

  doc.save(
    fileName
  );

}