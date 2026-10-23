// ============================================================
// FINANCEOS — PLANS & COMMITMENTS FULL TYPE-BY-TYPE AUDIT TEST
// ============================================================

const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const MonthlyFinance = require("../models/MonthlyFinance");
const Investment = require("../models/Investment");
const Insurance = require("../models/Insurance");
const Liability = require("../models/Liability");
const { calculateMonthlyCashFlowBreakdown } = require("../utils/cashFlowBreakdown");

const BASE_URL = "http://localhost:5000";
const JWT_SECRET = process.env.JWT_SECRET || "financeos_secret_key_2026";

async function postJSON(url, body, token) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function putJSON(url, body, token) {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function getJSON(url, token) {
  const res = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function deleteJSON(url, token) {
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runAudit() {
  console.log("============================================================");
  console.log("STARTING COMPLETE TYPE-BY-TYPE PLANS & COMMITMENTS AUDIT");
  console.log("============================================================\n");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("[Setup] Connected to MongoDB.");

  const timestamp = Date.now();
  let userA, userB, tokenA, tokenB;

  try {
    // 1. CREATE ISOLATED USERS
    userA = await User.create({
      userId: `USR-AUDIT-A-${timestamp}`,
      name: "Audit User A",
      email: `audit_a_${timestamp}@financeos.test`,
      role: "user",
      status: "Active",
      emailVerified: true,
    });
    tokenA = jwt.sign(
      { id: userA._id.toString(), userId: userA.userId, email: userA.email, role: "user" },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    userB = await User.create({
      userId: `USR-AUDIT-B-${timestamp}`,
      name: "Audit User B",
      email: `audit_b_${timestamp}@financeos.test`,
      role: "user",
      status: "Active",
      emailVerified: true,
    });
    tokenB = jwt.sign(
      { id: userB._id.toString(), userId: userB.userId, email: userB.email, role: "user" },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Seed MonthlyFinance for active month (2026-09) with 100,000 income
    await MonthlyFinance.create({
      user: userA._id,
      month: 9,
      year: 2026,
      salaryIncome: 100000,
      additionalIncome: 0,
      totalIncome: 100000,
      needsExpenses: 20000,
      wantsExpenses: 10000,
      totalExpenses: 30000,
      savingsInvestments: 0,
      availableToAllocate: 70000,
    });

    console.log("[Setup] Seeded MonthlyFinance for 2026-09: Available to Allocate = 70,000\n");

    const auditResults = [];

    function recordTest(type, testName, passed, details = "") {
      auditResults.push({ type, testName, passed, details });
      const mark = passed ? "PASS" : "FAIL";
      console.log(`[${mark}] [${type}] ${testName} ${details ? `(${details})` : ""}`);
    }

    // ========================================================
    // 2. GOLD AUDIT — ALL 5 PURITIES + BANK ACCOUNT + WEIGHT
    // ========================================================
    console.log("\n--- AUDITING GOLD ---");
    const purities = ["24K / 999", "22K / 916", "18K", "14K", "9K"];
    for (const purity of purities) {
      const goldRes = await postJSON(
        `${BASE_URL}/api/investments`,
        {
          name: `Sovereign Gold ${purity}`,
          type: "Gold",
          contributionType: "One Time",
          amount: 15000,
          weight: 2.5,
          purity: purity,
          goldType: "Physical",
          startDate: "2026-09-01",
          paymentSourceDetails: {
            paymentMethod: "Bank Account",
            bankName: "State Bank of India",
            last4Digits: "5544",
          },
        },
        tokenA
      );

      const goldPassed = (goldRes.status === 200 || goldRes.status === 201) && goldRes.data.success && goldRes.data.investment.purity === purity;
      recordTest(
        "Gold",
        `Create Gold with Purity ${purity}`,
        goldPassed,
        goldPassed ? `ID: ${goldRes.data.investment._id}, purity=${goldRes.data.investment.purity}, weight=${goldRes.data.investment.weight}` : `Error: ${JSON.stringify(goldRes.data)}`
      );
    }

    // Test Gold Contribution with Bank Account
    const goldPlan = await Investment.findOne({ user: userA._id, type: "Gold" });
    const goldContribRes = await postJSON(
      `${BASE_URL}/api/investments/${goldPlan._id}/contributions`,
      {
        amount: 5000,
        paidDate: "2026-09-15",
        status: "Paid",
        weight: 0.8,
        paymentSource: {
          method: "Bank Account",
          bankName: "HDFC Bank",
          last4Digits: "1234",
        },
        note: "Added 0.8g gold installment",
        selectedMonth: "2026-09",
      },
      tokenA
    );

    const goldContribPassed = (goldContribRes.status === 200 || goldContribRes.status === 201) && goldContribRes.data.success;
    const updatedGold = await Investment.findById(goldPlan._id);
    const goldWeightPassed = updatedGold && updatedGold.weight >= 3.3; // 2.5 + 0.8 = 3.3
    recordTest(
      "Gold",
      "Record Gold Contribution via Bank Account & Weight update",
      goldContribPassed && goldWeightPassed,
      `Weight updated to ${updatedGold?.weight}g, Total amount: ₹${updatedGold?.amount}`
    );

    // ========================================================
    // 3. SIP AUDIT
    // ========================================================
    console.log("\n--- AUDITING SIP ---");
    const sipRes = await postJSON(
      `${BASE_URL}/api/investments`,
      {
        name: "Nifty 50 Index SIP",
        type: "SIP",
        contributionType: "Recurring",
        monthlyContribution: 5000,
        amount: 5000,
        dueDay: 12,
        startDate: "2026-09-01",
        maturityDate: "2029-09-01",
        estimatedMaturityAmount: 250000,
        paymentSourceDetails: {
          paymentMethod: "Bank Account",
          bankName: "ICICI Bank",
          last4Digits: "9876",
        },
      },
      tokenA
    );

    const sipCreated = (sipRes.status === 200 || sipRes.status === 201) && sipRes.data.success;
    const sipId = sipRes.data?.investment?._id;
    recordTest("SIP", "Create Recurring SIP with dueDay 12", sipCreated, `ID: ${sipId}, dueDay=${sipRes.data?.investment?.dueDay}`);

    // SIP Contribution with UPI
    const sipContribRes = await postJSON(
      `${BASE_URL}/api/investments/${sipId}/contributions`,
      {
        amount: 5000,
        paidDate: "2026-09-12",
        status: "Paid",
        paymentSource: {
          method: "UPI",
          upiId: "investor@okhdfcbank",
        },
        note: "Sept SIP installment",
        selectedMonth: "2026-09",
      },
      tokenA
    );
    const sipContribPassed = (sipContribRes.status === 200 || sipContribRes.status === 201) && sipContribRes.data.success;
    recordTest("SIP", "Record SIP Contribution via UPI", sipContribPassed, `Status: ${sipContribRes.status}`);

    // ========================================================
    // 4. MUTUAL FUND AUDIT
    // ========================================================
    console.log("\n--- AUDITING MUTUAL FUND ---");
    const mfRes = await postJSON(
      `${BASE_URL}/api/investments`,
      {
        name: "Parag Parikh Flexi Cap",
        type: "Mutual Fund",
        contributionType: "One Time",
        amount: 20000,
        schemeName: "Direct Growth Plan",
        units: 145.62,
        startDate: "2026-09-05",
        paymentSourceDetails: {
          paymentMethod: "Bank Account",
          bankName: "Axis Bank",
          last4Digits: "3322",
        },
      },
      tokenA
    );

    const mfCreated = (mfRes.status === 200 || mfRes.status === 201) && mfRes.data.success && mfRes.data.investment.schemeName === "Direct Growth Plan";
    const mfId = mfRes.data?.investment?._id;
    recordTest("Mutual Fund", "Create Mutual Fund with Scheme & Units", mfCreated, `ID: ${mfId}, units=${mfRes.data?.investment?.units}`);

    // Edit Mutual Fund
    const mfEditRes = await putJSON(
      `${BASE_URL}/api/investments/${mfId}`,
      {
        name: "Parag Parikh Flexi Cap Regular",
        schemeName: "Regular Growth Plan",
        units: 150.0,
      },
      tokenA
    );
    const mfEdited = mfEditRes.status === 200 && mfEditRes.data.success && mfEditRes.data.investment.schemeName === "Regular Growth Plan";
    recordTest("Mutual Fund", "Edit Mutual Fund Scheme & Units", mfEdited, `New scheme: ${mfEditRes.data?.investment?.schemeName}`);

    // Mutual Fund Additional Contribution
    const mfContribRes = await postJSON(
      `${BASE_URL}/api/investments/${mfId}/contributions`,
      {
        amount: 5000,
        paidDate: "2026-09-18",
        status: "Paid",
        units: 35.5,
        paymentSource: {
          method: "Cash",
        },
        selectedMonth: "2026-09",
      },
      tokenA
    );
    const updatedMF = await Investment.findById(mfId);
    const mfContribPassed = (mfContribRes.status === 200 || mfContribRes.status === 201) && updatedMF.units >= 185.5;
    recordTest("Mutual Fund", "Record Additional MF Investment with Unit increase", mfContribPassed, `Units now: ${updatedMF?.units}`);

    // ========================================================
    // 5. RECURRING DEPOSIT (RD) AUDIT
    // ========================================================
    console.log("\n--- AUDITING RECURRING DEPOSIT (RD) ---");
    const rdRes = await postJSON(
      `${BASE_URL}/api/investments`,
      {
        name: "HDFC 5-Year RD",
        type: "RD",
        contributionType: "Recurring",
        monthlyContribution: 4000,
        amount: 4000,
        dueDay: 18,
        interestRate: 7.2,
        startDate: "2026-09-01",
        maturityDate: "2031-09-01",
        maturityAmount: 300000,
        estimatedMaturityAmount: 300000,
        paymentSourceDetails: {
          paymentMethod: "Bank Account",
          bankName: "HDFC Bank",
          last4Digits: "9090",
        },
      },
      tokenA
    );

    const rdCreated = (rdRes.status === 200 || rdRes.status === 201) && rdRes.data.success;
    const rdId = rdRes.data?.investment?._id;
    recordTest("RD", "Create RD as Recurring with custom dueDay 18", rdCreated, `ID: ${rdId}, dueDay=${rdRes.data?.investment?.dueDay}`);

    // RD Contribution
    const rdContribRes = await postJSON(
      `${BASE_URL}/api/investments/${rdId}/contributions`,
      {
        amount: 4000,
        paidDate: "2026-09-18",
        status: "Paid",
        paymentSource: {
          method: "Bank Account",
          bankName: "HDFC Bank",
          last4Digits: "9090",
        },
        selectedMonth: "2026-09",
      },
      tokenA
    );
    const rdContribPassed = (rdContribRes.status === 200 || rdContribRes.status === 201) && rdContribRes.data.success;
    recordTest("RD", "Record RD Installment via Bank Account", rdContribPassed, `Status: ${rdContribRes.status}`);

    // ========================================================
    // 6. STOCKS AUDIT
    // ========================================================
    console.log("\n--- AUDITING STOCKS ---");
    const stockRes = await postJSON(
      `${BASE_URL}/api/investments`,
      {
        name: "Reliance Industries",
        type: "Stocks",
        contributionType: "One Time",
        amount: 30000,
        symbol: "RELIANCE",
        quantity: 10,
        purchasePrice: 3000,
        startDate: "2026-09-02",
        paymentSourceDetails: {
          paymentMethod: "UPI",
          upiId: "trader@okaxis",
        },
      },
      tokenA
    );

    const stockCreated = (stockRes.status === 200 || stockRes.status === 201) && stockRes.data.success && stockRes.data.investment.symbol === "RELIANCE";
    const stockId = stockRes.data?.investment?._id;
    recordTest("Stocks", "Create Stock holding (Symbol, Quantity, Buy Price)", stockCreated, `ID: ${stockId}, symbol=${stockRes.data?.investment?.symbol}`);

    // Stock Contribution / Additional Purchase
    const stockContribRes = await postJSON(
      `${BASE_URL}/api/investments/${stockId}/contributions`,
      {
        amount: 15000,
        paidDate: "2026-09-20",
        status: "Paid",
        quantity: 5,
        paymentSource: {
          method: "UPI",
          upiId: "trader@okaxis",
        },
        selectedMonth: "2026-09",
      },
      tokenA
    );
    const updatedStock = await Investment.findById(stockId);
    const stockContribPassed = (stockContribRes.status === 200 || stockContribRes.status === 201) && updatedStock.quantity === 15;
    recordTest("Stocks", "Add Stock Shares via Contribution", stockContribPassed, `Shares now: ${updatedStock?.quantity}`);

    // ========================================================
    // 7. FIXED DEPOSIT (FD) AUDIT
    // ========================================================
    console.log("\n--- AUDITING FIXED DEPOSIT ---");
    const fdRes = await postJSON(
      `${BASE_URL}/api/investments`,
      {
        name: "SBI 3-Year Fixed Deposit",
        type: "Fixed Deposit",
        contributionType: "One Time",
        principalAmount: 50000,
        amount: 50000,
        interestRate: 7.1,
        interestMethod: "Payout",
        interestPayoutFrequency: "Monthly",
        startDate: "2026-09-01",
        maturityDate: "2029-09-01",
        paymentSourceDetails: {
          paymentMethod: "Bank Account",
          bankName: "State Bank of India",
          last4Digits: "1122",
        },
      },
      tokenA
    );
    const fdCreated = (fdRes.status === 200 || fdRes.status === 201) && fdRes.data.success;
    const fdId = fdRes.data?.investment?._id;
    recordTest("Fixed Deposit", "Create Fixed Deposit with Payout option", fdCreated, `ID: ${fdId}`);

    // Record FD Interest
    const fdInterestRes = await postJSON(
      `${BASE_URL}/api/investments/${fdId}/interest`,
      {
        interestAmount: 295,
        payoutDate: "2026-09-20",
        destinationType: "Bank Account",
        bankName: "State Bank of India",
        accountLast4: "1122",
        note: "Monthly interest credited",
      },
      tokenA
    );
    const fdInterestPassed = (fdInterestRes.status === 200 || fdInterestRes.status === 201) && fdInterestRes.data.success;
    recordTest("Fixed Deposit", "Record FD Interest Payout", fdInterestPassed, `Status: ${fdInterestRes.status}`);

    // ========================================================
    // 8. INSURANCE AUDIT
    // ========================================================
    console.log("\n--- AUDITING INSURANCE ---");
    const insRes = await postJSON(
      `${BASE_URL}/api/insurances`,
      {
        policyName: "HDFC Life Term Insurance",
        insuranceType: "Term",
        provider: "HDFC Life",
        premiumAmount: 12000,
        paymentFrequency: "Yearly",
        coverageAmount: 10000000,
        policyStartDate: "2026-09-01",
        policyEndDate: "2056-09-01",
        premiumDueDate: "2026-09-25",
        status: "Active",
        paymentMethod: "Bank Account",
        bankName: "HDFC Bank",
        last4Digits: "4433",
      },
      tokenA
    );
    const insCreated = (insRes.status === 200 || insRes.status === 201) && insRes.data.success;
    const insId = insRes.data?.policy?._id || insRes.data?.insurance?._id || insRes.data?.insurancePolicy?._id;
    recordTest("Insurance", "Create Term Insurance with Bank Account payment", insCreated, `ID: ${insId}`);

    // Insurance status update
    const insStatusRes = await putJSON(
      `${BASE_URL}/api/insurances/${insId}`,
      { status: "Paused" },
      tokenA
    );
    const insStatusPassed = (insStatusRes.status === 200 || insStatusRes.status === 201) && insStatusRes.data.success;
    recordTest("Insurance", "Update Insurance Status (Pause)", insStatusPassed, `Status: ${insStatusRes.status}`);

    // ========================================================
    // 9. LIABILITY AUDIT
    // ========================================================
    console.log("\n--- AUDITING LIABILITIES ---");
    const liabRes = await postJSON(
      `${BASE_URL}/api/liabilities`,
      {
        title: "SBI Home Loan",
        liabilityType: "Home Loan",
        lenderName: "State Bank of India",
        totalLoanAmount: 2500000,
        monthlyEMI: 22000,
        interestRate: 8.5,
        remainingAmount: 2400000,
        startDate: "2026-09-01",
        paymentDueDay: 5,
        sourceMethod: "Bank Account",
        sourceBankName: "State Bank of India",
        sourceLast4: "5544",
      },
      tokenA
    );
    const liabCreated = (liabRes.status === 200 || liabRes.status === 201) && liabRes.data.success;
    const liabId = liabRes.data?.liability?._id;
    recordTest("Liabilities", "Create Home Loan with EMI & Bank details", liabCreated, `ID: ${liabId}`);

    // Record Liability Payment
    const liabPayRes = await postJSON(
      `${BASE_URL}/api/liabilities/${liabId}/payment`,
      {
        amount: 22000,
        paymentDate: "2026-09-05",
        method: "Bank Account",
        bankName: "State Bank of India",
        last4Digits: "5544",
        note: "September EMI paid",
      },
      tokenA
    );
    const updatedLiab = await Liability.findById(liabId);
    const liabPayPassed = (liabPayRes.status === 200 || liabPayRes.status === 201) && updatedLiab.remainingAmount === 2378000;
    recordTest("Liabilities", "Record EMI payment and deduct from outstanding balance", liabPayPassed, `Remaining now: ₹${updatedLiab?.remainingAmount}`);

    // ========================================================
    // 10. ISOLATION AUDIT (USER A vs USER B)
    // ========================================================
    console.log("\n--- AUDITING MULTI-USER ISOLATION ---");
    const userBInvestments = await getJSON(`${BASE_URL}/api/investments`, tokenB);
    const userBInsurance = await getJSON(`${BASE_URL}/api/insurances`, tokenB);
    const userBLiabilities = await getJSON(`${BASE_URL}/api/liabilities`, tokenB);

    const isIsolated =
      userBInvestments.data.investments.length === 0 &&
      (userBInsurance.data.policies || userBInsurance.data.insurancePolicies || []).length === 0 &&
      userBLiabilities.data.liabilities.length === 0;

    recordTest("Security & Isolation", "User B cannot view or access User A data", isIsolated, `User B investments count: ${userBInvestments.data.investments.length}`);

    // ========================================================
    // 11. CASH FLOW & AVAILABLE TO ALLOCATE AUDIT
    // ========================================================
    console.log("\n--- AUDITING AVAILABLE TO ALLOCATE IMPACT ---");
    const allUserAInvestments = await Investment.find({ user: userA._id });
    const allUserAInsurance = await Insurance.find({ user: userA._id });
    const allUserALiabilities = await Liability.find({ user: userA._id });
    const monthlyDoc = await MonthlyFinance.findOne({ user: userA._id, month: 9, year: 2026 });

    const breakdown = await calculateMonthlyCashFlowBreakdown({
      userId: userA._id,
      year: 2026,
      month: 9,
    });

    console.log("[CashFlow] Summary:", {
      totalIncome: breakdown.inflow.totalIncome,
      totalActualOutflows: breakdown.outflows.totalActualOutflows,
      investmentsPaid: breakdown.commitmentsContext.actualInvestmentContributions,
      liabilitiesPaid: breakdown.commitmentsContext.actualLiabilityPayments,
      availableToAllocate: breakdown.availableToAllocate,
    });

    const hasInvestmentsPaid = breakdown.commitmentsContext.actualInvestmentContributions > 0;
    const hasLiabilitiesPaid = breakdown.commitmentsContext.actualLiabilityPayments === 22000;
    const cashFlowCorrect = hasInvestmentsPaid && hasLiabilitiesPaid;

    recordTest(
      "Financial Engine",
      "Actual Paid Contributions & EMI counted in Cash Flow without double counting",
      cashFlowCorrect,
      `Investments paid: ₹${breakdown.commitmentsContext.actualInvestmentContributions}, Liabilities paid: ₹${breakdown.commitmentsContext.actualLiabilityPayments}`
    );

    // ========================================================
    // 12. CLEANUP TEST DATA
    // ========================================================
    await Investment.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Insurance.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Liability.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await MonthlyFinance.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    console.log("\n[Cleanup] All test data removed cleanly.");

    // ========================================================
    // SUMMARY
    // ========================================================
    console.log("\n============================================================");
    console.log("AUDIT RESULTS SUMMARY");
    console.log("============================================================");
    const passedCount = auditResults.filter((r) => r.passed).length;
    const totalCount = auditResults.length;
    console.log(`Total tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}\n`);

    if (passedCount === totalCount) {
      console.log(">>> ALL AUDIT TESTS PASSED WITH 100% SUCCESS <<<");
    } else {
      console.log(">>> SOME AUDIT TESTS FAILED. CHECK DETAILS ABOVE. <<<");
    }
  } catch (error) {
    console.error("[Audit Error]:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runAudit();
