import { useMemo, useState, useEffect } from "react";

// ============================================================
// FINANCEOS - FINANCE PROVIDER
// COMPLETE CORRECTED VERSION
// PART 1 OF 2
// ============================================================

import FinanceContext from "./FinanceContext.js";


// ============================================================
// DEFAULT MONTHLY FINANCE
// ============================================================

const createDefaultMonthlyFinance = () => ({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),

  // Base monthly income only.
  income: 0,

  expenses: 0,

  updateDay: 5,

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
// CREATE UNIQUE ID
// ============================================================

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}


// ============================================================
// SAFE NUMBER
// ============================================================

function safeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}


// ============================================================
// NON-NEGATIVE NUMBER
// ============================================================

function nonNegative(value) {
  return Math.max(
    safeNumber(value),
    0
  );
}


// ============================================================
// NORMALIZE STATUS
// ============================================================

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase();
}


// ============================================================
// FIRST DEFINED VALUE
// ============================================================

function firstDefined(...values) {

  for (const value of values) {

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }

  }

  return undefined;
}


// ============================================================
// DATE -> MONTH / YEAR
// ============================================================

function getMonthYearFromDate(dateValue) {

  if (!dateValue) {

    const now = new Date();

    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  }


  const date = new Date(
    `${dateValue}T00:00:00`
  );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    const now = new Date();

    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  }


  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}


// ============================================================
// ADD MONTHS TO DATE
// ============================================================

function addMonthsToDate(
  dateValue,
  months
) {

  let date;


  if (dateValue) {

    date = new Date(
      `${dateValue}T00:00:00`
    );

  } else {

    date = new Date();

  }


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    date = new Date();
  }


  const originalDay =
    date.getDate();


  date.setDate(1);

  date.setMonth(
    date.getMonth() +
    Number(months || 0)
  );


  const lastDay =
    new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();


  date.setDate(
    Math.min(
      originalDay,
      lastDay
    )
  );


  return [
    date.getFullYear(),

    String(
      date.getMonth() + 1
    ).padStart(2, "0"),

    String(
      date.getDate()
    ).padStart(2, "0"),

  ].join("-");
}


// ============================================================
// LIABILITY OUTSTANDING BALANCE
// ============================================================

function getLiabilityBalance(
  liability
) {

  if (!liability) {
    return 0;
  }


  const status =
    normalizeStatus(
      liability.status
    );


  if (
    status === "closed" ||
    status === "completed" ||
    status === "paid" ||
    status === "settled"
  ) {
    return 0;
  }


  const currentBalance =
    firstDefined(
      liability.outstandingAmount,
      liability.remainingAmount,
      liability.balance
    );


  if (
    currentBalance !== undefined
  ) {

    return nonNegative(
      currentBalance
    );
  }


  return nonNegative(
    firstDefined(
      liability.originalAmount,
      liability.loanAmount,
      liability.amount
    )
  );
}


// ============================================================
// LIABILITY MONTHLY PAYMENT
// ============================================================

function getLiabilityMonthlyPayment(
  liability
) {

  return nonNegative(
    firstDefined(
      liability?.monthlyPayment,
      liability?.emi,
      liability?.monthlyEMI
    )
  );
}


// ============================================================
// CALCULATE LOAN COMPLETION
// ============================================================

function calculateLoanCompletion(
  liability = {},
  balanceOverride
) {

  const balance =
    balanceOverride !== undefined

      ? nonNegative(
          balanceOverride
        )

      : getLiabilityBalance(
          liability
        );


  const monthlyPayment =
    getLiabilityMonthlyPayment(
      liability
    );


  if (balance <= 0) {

    return {
      remainingPayments: 0,

      estimatedCompletionDate:
        liability.closedDate ||
        liability.closedAt?.slice?.(0, 10) ||
        new Date()
          .toISOString()
          .slice(0, 10),
    };
  }


  if (monthlyPayment <= 0) {

    return {
      remainingPayments: null,
      estimatedCompletionDate: null,
    };
  }


  const remainingPayments =
    Math.ceil(
      balance /
      monthlyPayment
    );


  const baseDate =
    firstDefined(
      liability.nextPaymentDate,
      liability.nextDueDate,
      liability.dueDate,
      liability.startDate,
      new Date()
        .toISOString()
        .slice(0, 10)
    );


  const estimatedCompletionDate =
    addMonthsToDate(
      baseDate,
      Math.max(
        remainingPayments - 1,
        0
      )
    );


  return {
    remainingPayments,
    estimatedCompletionDate,
  };
}


// ============================================================
// GOAL AVAILABLE FUND
// ============================================================

function getGoalAvailableFund(
  goal
) {

  if (!goal) {
    return 0;
  }


  if (
    goal.availableGoalFund !== undefined
  ) {

    return nonNegative(
      goal.availableGoalFund
    );
  }


  const contributed =
    nonNegative(
      firstDefined(
        goal.totalContributed,
        goal.savedAmount,
        goal.alreadySaved
      )
    );


  const withdrawn =
    nonNegative(
      goal.totalWithdrawn
    );


  return Math.max(
    contributed - withdrawn,
    0
  );
}


// ============================================================
// INVESTMENT CURRENT ASSET VALUE
// ============================================================

function getInvestmentCurrentValue(
  investment
) {

  if (!investment) {
    return 0;
  }


  const status =
    normalizeStatus(
      investment.status
    );


  if (
    status === "closed" ||
    status === "redeemed"
  ) {
    return 0;
  }


  if (
    status === "matured"
  ) {

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
// FINANCE PROVIDER
// ============================================================

function FinanceProvider({
  children,
}) {


  // ==========================================================
  // STATES
  // ==========================================================

  const [userData, setUserData] = useState(() => {
    try {
      const localUser =
        localStorage.getItem("financeos_user");

      if (localUser) {
        return JSON.parse(localUser);
      }

      const sessionUser =
        sessionStorage.getItem("financeos_user");

      if (sessionUser) {
        return JSON.parse(sessionUser);
      }

      return null;
    } catch (error) {
      console.error(
        "Unable to load logged-in FinanceOS user:",
        error
      );

      return null;
    }
  });


  const [
    monthlyFinance,
    setMonthlyFinance,
  ] = useState(
    createDefaultMonthlyFinance
  );


  const [
    monthlyHistory,
    setMonthlyHistory,
  ] = useState([]);


  const [
    additionalIncomeTransactions,
    setAdditionalIncomeTransactions,
  ] = useState([]);


  const [
    cashBalance,
    setCashBalance,
  ] = useState(0);


  const [
    savingGoals,
    setSavingGoals,
  ] = useState([]);


  const [
    investments,
    setInvestments,
  ] = useState([]);


  const [
    insurancePolicies,
    setInsurancePolicies,
  ] = useState([]);


  const [
    liabilities,
    setLiabilities,
  ] = useState([]);


  const [
    netWorthSnapshots,
    setNetWorthSnapshots,
  ] = useState([]);

  // ============================================================
  // LOAD CURRENT MONTH FINANCE
  // ============================================================

  const loadCurrentMonthFinance = async () => {
    console.log("loadCurrentMonthFinance called");
    try {

      const token = localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      if (!token) return;

      const today = new Date();

      const year = today.getFullYear();

      const month = today.getMonth() + 1;
      console.log("Fetching:", year, month);
      const response = await fetch(

        `http://localhost:5000/api/monthly-finance/${year}/${month}`,

        {

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

      );

      const data = await response.json();

      if (!data.success || !data.finance) return;

      const finance = data.finance;

      setMonthlyFinance({

        year: finance.year,

        month: finance.month,

        income: finance.income,

        expenses: finance.expenses,

        cashBalance: finance.cashBalance,

        updateDay: finance.updateDay,

        reminderEnabled: finance.reminderEnabled,

        emailNotification: finance.emailNotification,

        smsNotification: finance.smsNotification,

      });

      setCashBalance(finance.cashBalance);

    } catch (error) {

      console.error("Load Monthly Finance:", error);

    }

  };


  // ============================================================
  // LOAD SAVING GOALS
  // ============================================================

  const loadSavingGoals = async () => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      if (!token) return;

      const response = await fetch(
        "http://localhost:5000/api/saving-goals",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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


  // ============================================================
  // LOAD INVESTMENTS
  // ============================================================

  const loadInvestments = async () => {
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      if (!token) return;

      const response = await fetch

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load investments."
        );
      }

      setInvestments(
        data.investments.map((investment) => ({
          ...investment,

          id: investment._id,

          amount: Number(investment.amount || 0),

          currentValue: Number(
            investment.currentValue ??
            investment.amount ??
            0
          ),

          monthlyContribution: Number(
            investment.monthlyContribution || 0
          ),

          totalInterestReceived: Number(
            investment.totalInterestReceived || 0
          ),
        }))
      );

    } catch (error) {

      console.error(
        "Load Investments:",
        error
      );

    }
  };


  // ============================================================
  // LOAD FINANCEOS DATA AFTER LOGIN
  // ============================================================

  useEffect(() => {

    const fetchData = async () => {

      if (!userData) {
        return;
      }

      try {

        console.log(
          "FinanceProvider: Loading user finance data..."
        );

        await loadCurrentMonthFinance();

        await loadSavingGoals();

        await loadInvestments();

        console.log(
          "FinanceProvider: Finance data loaded successfully."
        );

      } catch (error) {

        console.error(
          "FinanceProvider: Failed to load finance data:",
          error
        );

      }

    };

    fetchData();

  }, [userData]);

  // ==========================================================
  // SHARED NOTIFICATIONS
  // ==========================================================

  const [
    notifications,
    setNotifications,
  ] = useState([]);


  // ==========================================================
  // ADDITIONAL INCOME FOR MONTH
  // ==========================================================

  const getAdditionalIncomeForMonth = (
    month,
    year
  ) => {

    return additionalIncomeTransactions

      .filter(
        (transaction) =>
          Number(
            transaction.month
          ) === Number(month) &&

          Number(
            transaction.year
          ) === Number(year)
      )

      .reduce(
        (
          total,
          transaction
        ) =>
          total +
          safeNumber(
            transaction.amount
          ),

        0
      );
  };


  // ==========================================================
  // CURRENT ADDITIONAL INCOME
  // ==========================================================

  const additionalIncome =
    useMemo(
      () =>
        getAdditionalIncomeForMonth(
          monthlyFinance.month,
          monthlyFinance.year
        ),

      [
        additionalIncomeTransactions,
        monthlyFinance.month,
        monthlyFinance.year,
      ]
    );


  // ==========================================================
  // BASE MONTHLY INCOME
  // ==========================================================

  const baseMonthlyIncome =
    useMemo(
      () =>
        nonNegative(
          monthlyFinance.income
        ),

      [
        monthlyFinance.income,
      ]
    );


  // ==========================================================
  // TOTAL MONTHLY INCOME
  // ==========================================================

  const totalMonthlyIncome =
    useMemo(
      () =>
        baseMonthlyIncome +
        additionalIncome,

      [
        baseMonthlyIncome,
        additionalIncome,
      ]
    );


  // ==========================================================
  // RECORD ADDITIONAL INCOME
  // ==========================================================

  const recordAdditionalIncome = (
    incomeData = {}
  ) => {

    const amount =
      safeNumber(
        incomeData.amount
      );


    if (amount <= 0) {

      return {
        success: false,
        message:
          "Enter a valid income amount.",
      };
    }


    const date =
      incomeData.date ||
      new Date()
        .toISOString()
        .slice(0, 10);


    const dateInfo =
      getMonthYearFromDate(
        date
      );


    const month =
      Number(
        incomeData.month ??
        dateInfo.month
      );


    const year =
      Number(
        incomeData.year ??
        dateInfo.year
      );


    if (
      month < 1 ||
      month > 12 ||
      !Number.isFinite(year)
    ) {

      return {
        success: false,
        message:
          "Invalid income date.",
      };
    }


    if (
      incomeData.referenceId
    ) {

      const duplicate =
        additionalIncomeTransactions.some(
          (transaction) =>
            transaction.referenceId ===
            incomeData.referenceId
        );


      if (duplicate) {

        return {
          success: false,
          message:
            "This income transaction has already been recorded.",
        };
      }
    }


    const transaction = {

      id:
        incomeData.id ||
        createId("income"),

      type:
        incomeData.type ||
        "Other Income",

      category:
        incomeData.category ||
        "Additional Income",

      amount,

      date,

      month,

      year,

      source:
        incomeData.source ||
        "",

      investmentId:
        incomeData.investmentId ||
        null,

      referenceId:
        incomeData.referenceId ||
        null,

      note:
        incomeData.note ||
        "",

      createdAt:
        incomeData.createdAt ||
        new Date().toISOString(),
    };


    setAdditionalIncomeTransactions(
      (current) => [
        ...current,
        transaction,
      ]
    );


    setMonthlyHistory(
      (history) =>
        history.map(
          (record) => {

            if (
              Number(record.month) !== month ||
              Number(record.year) !== year
            ) {
              return record;
            }


            const baseIncome =
              record.baseIncome !== undefined

                ? nonNegative(
                    record.baseIncome
                  )

                : Math.max(
                    safeNumber(
                      record.income
                    ) -
                    safeNumber(
                      record.additionalIncome
                    ),
                    0
                  );


            const newAdditionalIncome =
              nonNegative(
                record.additionalIncome
              ) +
              amount;


            const newTotalIncome =
              baseIncome +
              newAdditionalIncome;


            const expenses =
              nonNegative(
                record.expenses
              );


            const savings =
              newTotalIncome -
              expenses;


            const commitments =
              nonNegative(
                record.totalCommitments
              );


            return {
              ...record,

              baseIncome,

              additionalIncome:
                newAdditionalIncome,

              totalIncome:
                newTotalIncome,

              income:
                newTotalIncome,

              savings,

              availableToAllocate:
                cashBalance +
                savings -
                commitments,

              updatedAt:
                new Date().toISOString(),
            };
          }
        )
    );


    return {
      success: true,
      transaction,
      message:
        "Additional income recorded successfully.",
    };
  };


  // ==========================================================
  // DELETE ADDITIONAL INCOME
  // ==========================================================

  const deleteAdditionalIncomeTransaction = (
    id
  ) => {

    const transaction =
      additionalIncomeTransactions.find(
        (item) =>
          item.id === id
      );


    if (!transaction) {

      return {
        success: false,
        message:
          "Income transaction not found.",
      };
    }


    setAdditionalIncomeTransactions(
      (current) =>
        current.filter(
          (item) =>
            item.id !== id
        )
    );


    setMonthlyHistory(
      (history) =>
        history.map(
          (record) => {

            if (
              Number(record.month) !==
                Number(transaction.month) ||

              Number(record.year) !==
                Number(transaction.year)
            ) {
              return record;
            }


            const baseIncome =
              record.baseIncome !== undefined

                ? nonNegative(
                    record.baseIncome
                  )

                : Math.max(
                    safeNumber(
                      record.income
                    ) -
                    safeNumber(
                      record.additionalIncome
                    ),
                    0
                  );


            const newAdditionalIncome =
              Math.max(
                safeNumber(
                  record.additionalIncome
                ) -
                safeNumber(
                  transaction.amount
                ),
                0
              );


            const newTotalIncome =
              baseIncome +
              newAdditionalIncome;


            const expenses =
              nonNegative(
                record.expenses
              );


            const savings =
              newTotalIncome -
              expenses;


            const commitments =
              nonNegative(
                record.totalCommitments
              );


            return {
              ...record,

              baseIncome,

              additionalIncome:
                newAdditionalIncome,

              totalIncome:
                newTotalIncome,

              income:
                newTotalIncome,

              savings,

              availableToAllocate:
                cashBalance +
                savings -
                commitments,

              updatedAt:
                new Date().toISOString(),
            };
          }
        )
    );


    return {
      success: true,
      message:
        "Income transaction deleted.",
    };
  };


  // ==========================================================
  // RECORD FD INTEREST
  // ==========================================================

  const recordFDInterest = (
    investmentId,
    interestData = {}
  ) => {

    const investment =
      investments.find(
        (item) =>
          item.id === investmentId
      );


    if (!investment) {

      return {
        success: false,
        message:
          "Fixed deposit not found.",
      };
    }


    const investmentType =
      String(
        investment.type || ""
      )
        .trim()
        .toLowerCase();


    if (
      investmentType !==
      "fixed deposit"
    ) {

      return {
        success: false,
        message:
          "Interest can only be recorded here for a fixed deposit.",
      };
    }


    const interestMethod =
      String(
        investment.interestMethod ||
        ""
      )
        .trim()
        .toLowerCase();


    if (
      interestMethod ===
      "cumulative"
    ) {

      return {
        success: false,
        message:
          "This is a cumulative FD. Interest remains inside the FD until maturity.",
      };
    }


    if (
      normalizeStatus(
        investment.status
      ) === "closed"
    ) {

      return {
        success: false,
        message:
          "Interest cannot be recorded for a closed FD.",
      };
    }


    const amount =
      safeNumber(
        interestData.amount
      );


    if (amount <= 0) {

      return {
        success: false,
        message:
          "Enter the actual FD interest amount credited by the bank.",
      };
    }


    const date =
      interestData.date ||
      new Date()
        .toISOString()
        .slice(0, 10);


    const dateInfo =
      getMonthYearFromDate(
        date
      );


    const transactionMonth =
      Number(
        dateInfo.month
      );


    const transactionYear =
      Number(
        dateInfo.year
      );


    const referenceId =
      interestData.referenceId ||
      `fd-interest-${investmentId}-${date}`;


    const duplicate =
      additionalIncomeTransactions.some(
        (transaction) =>
          transaction.referenceId ===
          referenceId
      );


    if (duplicate) {

      return {
        success: false,
        message:
          "This FD interest payment has already been recorded.",
      };
    }


    const transaction = {

      id:
        createId(
          "fd-interest"
        ),

      type:
        "FD Interest",

      category:
        "Investment Income",

      amount,

      date,

      month:
        transactionMonth,

      year:
        transactionYear,

      source:
        investment.name ||
        investment.institution ||
        "Fixed Deposit",

      investmentId,

      referenceId,

      note:
        interestData.note ||
        `Interest received from ${
          investment.name ||
          "Fixed Deposit"
        }`,

      createdAt:
        new Date().toISOString(),
    };


    setAdditionalIncomeTransactions(
      (current) => [
        ...current,
        transaction,
      ]
    );


    setInvestments(
      (current) =>
        current.map(
          (item) => {

            if (
              item.id !== investmentId
            ) {
              return item;
            }


            return {
              ...item,

              totalInterestReceived:
                safeNumber(
                  item.totalInterestReceived
                ) +
                amount,

              lastInterestReceivedAt:
                date,

              interestTransactions: [
                ...(
                  Array.isArray(
                    item.interestTransactions
                  )
                    ? item.interestTransactions
                    : []
                ),

                {
                  id:
                    transaction.id,

                  amount,

                  date,

                  month:
                    transactionMonth,

                  year:
                    transactionYear,

                  referenceId,

                  note:
                    transaction.note,

                  createdAt:
                    transaction.createdAt,
                },
              ],
            };
          }
        )
    );


    setMonthlyHistory(
      (history) =>
        history.map(
          (record) => {

            if (
              Number(record.month) !==
                transactionMonth ||

              Number(record.year) !==
                transactionYear
            ) {
              return record;
            }


            const baseIncome =
              record.baseIncome !== undefined

                ? nonNegative(
                    record.baseIncome
                  )

                : Math.max(
                    safeNumber(
                      record.income
                    ) -
                    safeNumber(
                      record.additionalIncome
                    ),
                    0
                  );


            const newAdditionalIncome =
              nonNegative(
                record.additionalIncome
              ) +
              amount;


            const newTotalIncome =
              baseIncome +
              newAdditionalIncome;


            const expenses =
              nonNegative(
                record.expenses
              );


            const savings =
              newTotalIncome -
              expenses;


            const commitments =
              nonNegative(
                record.totalCommitments
              );


            return {
              ...record,

              baseIncome,

              additionalIncome:
                newAdditionalIncome,

              totalIncome:
                newTotalIncome,

              income:
                newTotalIncome,

              expenses,

              savings,

              availableToAllocate:
                cashBalance +
                savings -
                commitments,

              updatedAt:
                new Date().toISOString(),
            };
          }
        )
    );


    setNetWorthSnapshots(
      (snapshots) =>
        snapshots.map(
          (snapshot) => {

            if (
              Number(snapshot.month) !==
                transactionMonth ||

              Number(snapshot.year) !==
                transactionYear
            ) {
              return snapshot;
            }


            const baseIncome =
              snapshot.baseIncome !== undefined

                ? nonNegative(
                    snapshot.baseIncome
                  )

                : Math.max(
                    safeNumber(
                      snapshot.income
                    ) -
                    safeNumber(
                      snapshot.additionalIncome
                    ),
                    0
                  );


            const newAdditionalIncome =
              nonNegative(
                snapshot.additionalIncome
              ) +
              amount;


            const newTotalIncome =
              baseIncome +
              newAdditionalIncome;


            const expenses =
              nonNegative(
                snapshot.expenses
              );


            const savings =
              newTotalIncome -
              expenses;


            const commitments =
              nonNegative(
                snapshot.totalCommitments
              );


            return {
              ...snapshot,

              baseIncome,

              additionalIncome:
                newAdditionalIncome,

              totalIncome:
                newTotalIncome,

              income:
                newTotalIncome,

              savings,

              availableToAllocate:
                cashBalance +
                savings -
                commitments,

              updatedAt:
                new Date().toISOString(),
            };
          }
        )
    );


    return {
      success: true,

      transaction,

      message:
        `FD interest of ₹${amount.toLocaleString(
          "en-US"
        )} was added to ${transactionMonth}/${transactionYear} income.`,
    };
  };


  // ==========================================================
  // ACTIVE RECORDS
  // ==========================================================

  const activeSavingGoals =
    useMemo(
      () =>
        savingGoals.filter(
          (goal) =>
            normalizeStatus(
              goal.status
            ) === "active"
        ),

      [savingGoals]
    );


  const activeInvestments =
    useMemo(
      () =>
        investments.filter(
          (investment) =>
            normalizeStatus(
              investment.status
            ) === "active"
        ),

      [investments]
    );


  const activeInsurancePolicies =
    useMemo(
      () =>
        insurancePolicies.filter(
          (policy) =>
            normalizeStatus(
              policy.status
            ) === "active"
        ),

      [insurancePolicies]
    );


  const activeLiabilities =
    useMemo(
      () =>
        liabilities.filter(
          (liability) => {

            const status =
              normalizeStatus(
                liability.status
              );


            const balance =
              getLiabilityBalance(
                liability
              );


            return (
              balance > 0 &&
              status !== "closed" &&
              status !== "completed" &&
              status !== "paid" &&
              status !== "settled"
            );
          }
        ),

      [liabilities]
    );


  // ==========================================================
  // MONTHLY COMMITMENTS
  // ==========================================================

  const goalMonthlyCommitment =
    useMemo(
      () =>
        activeSavingGoals.reduce(
          (total, goal) =>
            total +
            nonNegative(
              firstDefined(
                goal.monthlyContribution,
                goal.monthlyAllocation,
                goal.requiredMonthly
              )
            ),

          0
        ),

      [activeSavingGoals]
    );


  const investmentMonthlyCommitment =
    useMemo(
      () =>
        activeInvestments.reduce(
          (
            total,
            investment
          ) =>
            total +
            nonNegative(
              firstDefined(
                investment.monthlyContribution,
                investment.monthlyAmount
              )
            ),

          0
        ),

      [activeInvestments]
    );


  const insuranceMonthlyCommitment =
    useMemo(
      () =>
        activeInsurancePolicies.reduce(
          (
            total,
            policy
          ) =>
            total +
            nonNegative(
              firstDefined(
                policy.monthlyEquivalent,
                policy.monthlyPremium
              )
            ),

          0
        ),

      [activeInsurancePolicies]
    );


  const liabilityMonthlyCommitment =
    useMemo(
      () =>
        activeLiabilities.reduce(
          (
            total,
            liability
          ) =>
            total +
            getLiabilityMonthlyPayment(
              liability
            ),

          0
        ),

      [activeLiabilities]
    );


  const totalMonthlyCommitments =
    useMemo(
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


  // ==========================================================
  // UPDATE MONTHLY FINANCE
  // ==========================================================

  const updateMonthlyFinance = (
    financeData = {}
  ) => {

    setMonthlyFinance(
      (current) => {

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


        const month =
          Number(
            updated.month ||
            new Date().getMonth() + 1
          );


        const year =
          Number(
            updated.year ||
            new Date().getFullYear()
          );


        const baseIncome =
          nonNegative(
            updated.income
          );


        const expenses =
          nonNegative(
            updated.expenses
          );


        const monthAdditionalIncome =
          additionalIncomeTransactions

            .filter(
              (transaction) =>
                Number(
                  transaction.month
                ) === month &&

                Number(
                  transaction.year
                ) === year
            )

            .reduce(
              (
                total,
                transaction
              ) =>
                total +
                safeNumber(
                  transaction.amount
                ),

              0
            );


        const totalIncome =
          baseIncome +
          monthAdditionalIncome;


        const savings =
          totalIncome -
          expenses;


        const currentTotalCommitments =
          goalMonthlyCommitment +
          investmentMonthlyCommitment +
          insuranceMonthlyCommitment +
          liabilityMonthlyCommitment;


        setMonthlyHistory(
          (history) => {

            const existingIndex =
              history.findIndex(
                (record) =>
                  Number(
                    record.month
                  ) === month &&

                  Number(
                    record.year
                  ) === year
              );


            const monthlyRecord = {

              month,
              year,

              baseIncome,

              additionalIncome:
                monthAdditionalIncome,

              totalIncome,

              income:
                totalIncome,

              expenses,

              savings,

              goalCommitment:
                goalMonthlyCommitment,

              investmentCommitment:
                investmentMonthlyCommitment,

              insuranceCommitment:
                insuranceMonthlyCommitment,

              liabilityCommitment:
                liabilityMonthlyCommitment,

              totalCommitments:
                currentTotalCommitments,

              availableToAllocate:
                cashBalance +
                savings -
                currentTotalCommitments,

              updatedAt:
                new Date().toISOString(),
            };


            if (
              existingIndex !== -1
            ) {

              return history.map(
                (
                  record,
                  index
                ) =>
                  index === existingIndex

                    ? {
                        ...record,
                        ...monthlyRecord,
                      }

                    : record
              );
            }


            return [
              ...history,
              monthlyRecord,
            ];
          }
        );


        return {
          ...updated,

          month,
          year,

          income:
            baseIncome,

          expenses,
        };
      }
    );
  };


  // ==========================================================
  // MONTHLY SAVINGS
  // ==========================================================

  const monthlySavings =
    useMemo(
      () =>
        totalMonthlyIncome -
        nonNegative(
          monthlyFinance.expenses
        ),

      [
        totalMonthlyIncome,
        monthlyFinance.expenses,
      ]
    );


  // ==========================================================
  // AVAILABLE TO ALLOCATE
  // ==========================================================

  const availableToAllocate = useMemo(() => {
    return Math.max(
      monthlySavings - totalMonthlyCommitments,
      0
    );
  }, [
    monthlySavings,
    totalMonthlyCommitments,
  ]);

  // ==========================================================
  // CASH
  // ==========================================================

  const updateCashBalance = (amount) => {

    const value = safeNumber(amount);

    console.log("Cash Balance Received:", value);

    setCashBalance(value);

    return true;

  };


  // ==========================================================
  // SAVING GOAL - ADD
  // ==========================================================

  const addSavingGoal = async (goal = {}) => 
    {

    const targetAmount =
      nonNegative(
        firstDefined(
          goal.targetAmount,
          goal.amount
        )
      );


    const initialSaved =
      nonNegative(
        firstDefined(
          goal.savedAmount,
          goal.alreadySaved
        )
      );


    const initialWithdrawn =
      nonNegative(
        goal.totalWithdrawn
      );


    const totalContributed =
      nonNegative(
        firstDefined(
          goal.totalContributed,
          initialSaved
        )
      );


    const availableGoalFund =
      Math.max(
        totalContributed -
        initialWithdrawn,
        0
      );


    const monthlyContribution =
      nonNegative(
        firstDefined(
          goal.monthlyContribution,
          goal.monthlyAllocation,
          goal.requiredMonthly
        )
      );


    const fundLocation = {

      type:
        goal.fundLocation?.type ||
        goal.fundLocationType ||
        "",

      institution:
        goal.fundLocation?.institution ||
        goal.institution ||
        "",

      label:
        goal.fundLocation?.label ||
        goal.accountLabel ||
        "",

      lastFour:
        goal.fundLocation?.lastFour ||
        goal.lastFour ||
        "",
    };


    const existingTransactions =
      Array.isArray(
        goal.transactions
      )
        ? goal.transactions
        : [];


    const hasInitialTransaction =
      existingTransactions.some(
        (transaction) =>
          transaction.type ===
          "contribution"
      );


    const transactions =
      initialSaved > 0 &&
      !hasInitialTransaction

        ? [
            ...existingTransactions,

            {
              id:
                createId(
                  "goal-transaction"
                ),

              type:
                "contribution",

              amount:
                initialSaved,

              date:
                goal.initialContributionDate ||
                goal.createdAt ||
                new Date()
                  .toISOString()
                  .slice(0, 10),

              source:
                goal.initialContributionSource ||
                "Existing Savings",

              note:
                "Initial saved amount",

              fundLocation: {
                ...fundLocation,
              },

              createdAt:
                new Date().toISOString(),
            },
          ]

        : existingTransactions;


    const goalReached =
      targetAmount > 0 &&
      totalContributed >=
        targetAmount;


    const newGoal = {
      ...goal,

      id:
        goal.id ||
        createId("goal"),

      targetAmount,

      savedAmount:
        totalContributed,

      totalContributed,

      totalWithdrawn:
        initialWithdrawn,

      availableGoalFund,

      monthlyContribution,

      monthlyAllocation:
        monthlyContribution,

      fundLocation,

      transactions,

      status:
        goal.status ||
        (
          goalReached
            ? "Completed"
            : "Active"
        ),

      achievedAt:
        goal.achievedAt ||
        (
          goalReached
            ? new Date().toISOString()
            : null
        ),

      createdAt:
        goal.createdAt ||
        new Date().toISOString(),
    };
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const response = await fetch(
      "http://localhost:5000/api/saving-goals",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goalName: newGoal.goalName,
          category: newGoal.category,

          targetAmount: newGoal.targetAmount,

          alreadySaved:
            newGoal.alreadySaved ??
            newGoal.savedAmount ??
            0,

          currentAmount:
            newGoal.currentAmount ??
            newGoal.savedAmount ??
            0,

          monthlyContribution: newGoal.monthlyContribution,

          startDate: newGoal.startDate,
          targetDate: newGoal.targetDate,
          status: newGoal.status,
          notes: newGoal.notes,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to save saving goal.");
    }

    setSavingGoals((current) => [
      ...current,
      {
        ...data.goal,
        id: data.goal._id,
        savedAmount: data.goal.currentAmount,
        totalContributed: data.goal.currentAmount,
        alreadySaved: data.goal.currentAmount,
      },
    ]);


    return data.goal;
  };


  // ==========================================================
  // SAVING GOAL - UPDATE
  // ==========================================================

  const updateSavingGoal = (
    id,
    updates = {}
  ) => {

    setSavingGoals(
      (current) =>
        current.map(
          (goal) => {

            if (
              goal.id !== id
            ) {
              return goal;
            }


            const targetAmount =
              updates.targetAmount !== undefined

                ? nonNegative(
                    updates.targetAmount
                  )

                : nonNegative(
                    goal.targetAmount
                  );


            const totalContributed =
              updates.totalContributed !== undefined

                ? nonNegative(
                    updates.totalContributed
                  )

                : updates.savedAmount !== undefined

                  ? nonNegative(
                      updates.savedAmount
                    )

                  : nonNegative(
                      firstDefined(
                        goal.totalContributed,
                        goal.savedAmount
                      )
                    );


            const totalWithdrawn =
              updates.totalWithdrawn !== undefined

                ? nonNegative(
                    updates.totalWithdrawn
                  )

                : nonNegative(
                    goal.totalWithdrawn
                  );


            const availableGoalFund =
              Math.max(
                totalContributed -
                totalWithdrawn,
                0
              );


            const monthlyContribution =
              updates.monthlyContribution !== undefined

                ? nonNegative(
                    updates.monthlyContribution
                  )

                : updates.monthlyAllocation !== undefined

                  ? nonNegative(
                      updates.monthlyAllocation
                    )

                  : nonNegative(
                      firstDefined(
                        goal.monthlyContribution,
                        goal.monthlyAllocation
                      )
                    );


            const goalReached =
              targetAmount > 0 &&
              totalContributed >=
                targetAmount;


            let status =
              updates.status ||
              goal.status ||
              "Active";


            const normalizedStatus =
              normalizeStatus(
                status
              );


            if (
              goalReached &&
              normalizedStatus !== "closed" &&
              normalizedStatus !== "settled"
            ) {
              status = "Completed";
            }


            return {
              ...goal,
              ...updates,

              targetAmount,

              savedAmount:
                totalContributed,

              totalContributed,

              totalWithdrawn,

              availableGoalFund,

              monthlyContribution,

              monthlyAllocation:
                monthlyContribution,

              status,

              achievedAt:
                goal.achievedAt ||
                (
                  goalReached
                    ? new Date().toISOString()
                    : null
                ),
            };
          }
        )
    );
  };


  // ==========================================================
  // SAVING GOAL - DELETE
  // ==========================================================

  const deleteSavingGoal = async (id) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const response = await fetch(
      `http://localhost:5000/api/saving-goals/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message);
    }

    setSavingGoals((current) =>
      current.filter(
        (goal) => goal.id !== id && goal._id !== id
      )
    );
  };


  // ==========================================================
  // UPDATE GOAL FUND LOCATION
  // ==========================================================

  const updateGoalFundLocation = (
    id,
    location = {}
  ) => {

    setSavingGoals(
      (current) =>
        current.map(
          (goal) =>
            goal.id === id

              ? {
                  ...goal,

                  fundLocation: {
                    ...goal.fundLocation,
                    ...location,
                  },
                }

              : goal
        )
    );
  };


  // ==========================================================
  // ADD GOAL CONTRIBUTION
  // ==========================================================

  const addGoalContribution = async (id, contributionData) => {
    const token =
      localStorage.getItem("financeos_token") ||
      sessionStorage.getItem("financeos_token");

    const response = await fetch(
      `http://localhost:5000/api/saving-goals/${id}/contribution`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: contributionData.amount,
          date: contributionData.date,
          source: contributionData.source,
          note: contributionData.note,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message);
    }

    setSavingGoals((current) =>
      current.map((goal) =>
        goal.id === id || goal._id === id
          ? {
              ...goal,
              ...data.goal,
              id: data.goal._id,
              savedAmount: data.goal.currentAmount,
            }
          : goal
      )
    );

    return data.goal;
  };


  // ==========================================================
  // WITHDRAW GOAL FUNDS
  // ==========================================================

  const withdrawGoalFunds = (
    id,
    withdrawalData
  ) => {

    const data =
      typeof withdrawalData ===
      "object"

        ? withdrawalData

        : {
            amount:
              withdrawalData,
          };


    const withdrawal =
      safeNumber(
        data?.amount
      );


    if (
      withdrawal <= 0
    ) {

      return {
        success: false,
        message:
          "Enter a valid withdrawal amount.",
      };
    }


    let result = {
      success: false,
      message:
        "Saving goal not found.",
    };


    setSavingGoals(
      (current) =>
        current.map(
          (goal) => {

            if (
              goal.id !== id
            ) {
              return goal;
            }


            const status =
              normalizeStatus(
                goal.status
              );


            if (
              status === "closed" ||
              status === "settled"
            ) {

              result = {
                success: false,
                message:
                  "This goal has already been settled or closed.",
              };

              return goal;
            }


            const totalContributed =
              nonNegative(
                firstDefined(
                  goal.totalContributed,
                  goal.savedAmount
                )
              );


            const totalWithdrawn =
              nonNegative(
                goal.totalWithdrawn
              );


            const availableFund =
              Math.max(
                totalContributed -
                totalWithdrawn,
                0
              );


            if (
              withdrawal >
              availableFund
            ) {

              result = {
                success: false,

                message:
                  `Only ₹${availableFund.toLocaleString(
                    "en-US"
                  )} is available in this goal.`,
              };

              return goal;
            }


            const newTotalWithdrawn =
              totalWithdrawn +
              withdrawal;


            const newAvailableFund =
              Math.max(
                totalContributed -
                newTotalWithdrawn,
                0
              );


            const transaction = {

              id:
                createId(
                  "goal-transaction"
                ),

              type:
                "withdrawal",

              amount:
                withdrawal,

              date:
                data.date ||
                new Date()
                  .toISOString()
                  .slice(0, 10),

              purpose:
                data.purpose ||
                goal.name ||
                "Goal fund used",

              note:
                data.note ||
                "",

              createdAt:
                new Date().toISOString(),
            };


            const goalReached =
              nonNegative(
                goal.targetAmount
              ) > 0 &&

              totalContributed >=
                nonNegative(
                  goal.targetAmount
                );


            const newStatus =
              goalReached &&
              newAvailableFund <= 0

                ? "Closed"

                : goalReached

                  ? "Completed"

                  : goal.status ||
                    "Active";


            result = {
              success: true,

              remainingFund:
                newAvailableFund,

              message:
                "Goal fund usage recorded successfully.",
            };


            return {
              ...goal,

              totalWithdrawn:
                newTotalWithdrawn,

              availableGoalFund:
                newAvailableFund,

              transactions: [
                ...(
                  Array.isArray(
                    goal.transactions
                  )
                    ? goal.transactions
                    : []
                ),

                transaction,
              ],

              status:
                newStatus,

              closedAt:
                newStatus === "Closed"

                  ? new Date().toISOString()

                  : goal.closedAt ||
                    null,
            };
          }
        )
    );


    return result;
  };


  // ==========================================================
  // SETTLE SAVING GOAL
  // ==========================================================

  const settleSavingGoal = (
    id
  ) => {

    let result = {
      success: false,
      message:
        "Saving goal not found.",
    };


    setSavingGoals(
      (current) =>
        current.map(
          (goal) => {

            if (
              goal.id !== id
            ) {
              return goal;
            }


            const target =
              nonNegative(
                goal.targetAmount
              );


            const contributed =
              nonNegative(
                firstDefined(
                  goal.totalContributed,
                  goal.savedAmount
                )
              );


            if (
              target > 0 &&
              contributed < target
            ) {

              result = {
                success: false,
                message:
                  "The saving goal has not been completed yet.",
              };

              return goal;
            }


            result = {
              success: true,
              message:
                "Saving goal settled successfully.",
            };


            return {
              ...goal,

              status:
                "Settled",

              monthlyContribution:
                0,

              monthlyAllocation:
                0,

              settledAt:
                new Date().toISOString(),

              settlementAction:
                "Keep Saved",
            };
          }
        )
    );


    return result;
  };


  // ==========================================================
  // INVESTMENT - ADD
  // ==========================================================

  const addInvestment = async (
    investment = {}
  ) => {

    try {

      // --------------------------------------------------------
      // GET AUTH TOKEN
      // --------------------------------------------------------

      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      if (!token) {
        return {
          success: false,
          message: "Authentication token not found.",
        };
      }

      // --------------------------------------------------------
      // AMOUNT
      // --------------------------------------------------------

      const amount =
        nonNegative(
          firstDefined(
            investment.amount,
            investment.investedAmount
          )
        );

      if (amount <= 0) {
        return {
          success: false,
          message: "Investment amount must be greater than 0.",
        };
      }

      // --------------------------------------------------------
      // INVESTMENT TYPE
      // --------------------------------------------------------

      const isFD =
        String(investment.type || "")
          .trim()
          .toLowerCase() ===
        "fixed deposit";

      // --------------------------------------------------------
      // PREPARE DATA FOR BACKEND
      // --------------------------------------------------------

      const investmentData = {

        name: investment.name,

        type: investment.type,

        amount,

        contributionType:
          investment.contributionType ||
          "Recurring",

        frequency:
          investment.frequency || null,

        monthlyContribution:
          isFD
            ? 0
            : nonNegative(
                firstDefined(
                  investment.monthlyContribution,
                  investment.monthlyAmount
                )
              ),

        startDate:
          investment.startDate || null,

        nextContributionDate:
          investment.nextContributionDate || null,

        maturityDate:
          investment.maturityDate || null,

        status:
          investment.status ||
          "Active",

        institution:
          investment.institution || "",

        principalAmount:
          isFD
            ? nonNegative(
                firstDefined(
                  investment.principalAmount,
                  amount
                )
              )
            : undefined,

        interestRate:
          isFD
            ? nonNegative(
                investment.interestRate
              )
            : undefined,

        interestMethod:
          isFD
            ? (
                investment.interestMethod ||
                "Payout"
              )
            : undefined,

        interestPayoutFrequency:
          isFD
            ? (
                investment.interestPayoutFrequency ||
                null
              )
            : undefined,

        compoundingFrequency:
          isFD
            ? (
                investment.compoundingFrequency ||
                null
              )
            : undefined,

        estimatedInterest:
          isFD
            ? nonNegative(
                investment.estimatedInterest
              )
            : 0,

        estimatedAnnualInterest:
          isFD
            ? nonNegative(
                investment.estimatedAnnualInterest
              )
            : 0,

        estimatedInterestPerPayout:
          isFD
            ? nonNegative(
                investment.estimatedInterestPerPayout
              )
            : 0,

        estimatedMaturityAmount:
          isFD
            ? nonNegative(
                investment.estimatedMaturityAmount
              )
            : 0,

        totalInterestReceived:
          isFD
            ? nonNegative(
                investment.totalInterestReceived
              )
            : 0,

        interestTransactions:
          isFD &&
          Array.isArray(
            investment.interestTransactions
          )
            ? investment.interestTransactions
            : [],

        reminder:
          investment.reminder || undefined,

        maturityReminder:
          investment.maturityReminder ||
          undefined,

      };

      // --------------------------------------------------------
      // SAVE TO MONGODB
      // --------------------------------------------------------

      const response = await fetch(
        "http://localhost:5000/api/investments",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body:
            JSON.stringify(
              investmentData
            ),
        }
      );

      const data =
        await response.json();

      // --------------------------------------------------------
      // HANDLE API ERROR
      // --------------------------------------------------------

      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.message ||
          "Failed to save investment."
        );

      }

      // --------------------------------------------------------
      // ADD DATABASE RECORD TO STATE
      // --------------------------------------------------------

      const savedInvestment = {

        ...data.investment,

        id:
          data.investment._id,

        amount:
          Number(
            data.investment.amount || 0
          ),

        currentValue:
          Number(
            data.investment.amount || 0
          ),

        monthlyContribution:
          Number(
            data.investment.monthlyContribution || 0
          ),

        totalInterestReceived:
          Number(
            data.investment.totalInterestReceived || 0
          ),

      };

      setInvestments(
        (current) => [
          ...current,
          savedInvestment,
        ]
      );

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      return {
        success: true,

        message:
          "Investment added successfully.",

        investment:
          savedInvestment,
      };

    } catch (error) {

      console.error(
        "Add Investment:",
        error
      );

      return {
        success: false,

        message:
          error.message ||
          "Failed to add investment.",
      };

    }

  };


  // ==========================================================
  // INVESTMENT - UPDATE
  // ==========================================================

  const updateInvestment = async (
    id,
    updates = {}
  ) => {

    try {

      // --------------------------------------------------------
      // GET AUTH TOKEN
      // --------------------------------------------------------

      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      if (!token) {
        return {
          success: false,
          message: "Authentication token not found.",
        };
      }

      // --------------------------------------------------------
      // PREPARE UPDATE DATA
      // --------------------------------------------------------

      const investmentData = {
        ...updates,

        ...(updates.amount !== undefined && {
          amount: nonNegative(
            updates.amount
          ),
        }),

        ...(updates.currentValue !== undefined && {
          currentValue: nonNegative(
            updates.currentValue
          ),
        }),

        ...(updates.monthlyContribution !== undefined && {
          monthlyContribution:
            nonNegative(
              updates.monthlyContribution
            ),
        }),
      };

      // --------------------------------------------------------
      // UPDATE MONGODB
      // --------------------------------------------------------

      const response = await fetch(
        `http://localhost:5000/api/investments/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body:
            JSON.stringify(
              investmentData
            ),
        }
      );

      const data =
        await response.json();

      // --------------------------------------------------------
      // HANDLE API ERROR
      // --------------------------------------------------------

      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.message ||
          "Failed to update investment."
        );

      }

      // --------------------------------------------------------
      // UPDATE FRONTEND STATE
      // --------------------------------------------------------

      const updatedInvestment = {

        ...data.investment,

        id:
          data.investment._id,

        amount:
          Number(
            data.investment.amount || 0
          ),

        currentValue:
          Number(
            data.investment.currentValue ??
            data.investment.amount ??
            0
          ),

        monthlyContribution:
          Number(
            data.investment.monthlyContribution ||
            0
          ),

        totalInterestReceived:
          Number(
            data.investment.totalInterestReceived ||
            0
          ),
      };

      setInvestments(
        (current) =>
          current.map(
            (investment) =>
              investment.id === id
                ? updatedInvestment
                : investment
          )
      );

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      return {
        success: true,

        message:
          "Investment updated successfully.",

        investment:
          updatedInvestment,
      };

    } catch (error) {

      console.error(
        "Update Investment:",
        error
      );

      return {
        success: false,

        message:
          error.message ||
          "Failed to update investment.",
      };

    }

  };

  // ==========================================================
  // INVESTMENT - UPDATE STATUS
  // ==========================================================

  const updateInvestmentStatus = async (
    id,
    status
  ) => {

    try {

      const result =
        await updateInvestment(
          id,
          {
            status,
          }
        );

      if (!result?.success) {
        return {
          success: false,
          message:
            result?.message ||
            "Failed to update investment status.",
        };
      }

      return {
        success: true,
        message:
          `Investment status changed to ${status}.`,
        investment:
          result.investment,
      };

    } catch (error) {

      console.error(
        "Update Investment Status:",
        error
      );

      return {
        success: false,
        message:
          error.message ||
          "Failed to update investment status.",
      };

    }

  };

  // ==========================================================
  // INVESTMENT - DELETE
  // ==========================================================

  const deleteInvestment = async (id) => {

    try {

      // --------------------------------------------------------
      // VALIDATE INVESTMENT ID
      // --------------------------------------------------------

      const investmentId = id;

if (
  investmentId === undefined ||
  investmentId === null ||
  investmentId === ""
) {
  return {
    success: false,
    message: "Invalid investment ID.",
  };
}


      // --------------------------------------------------------
      // GET AUTH TOKEN
      // --------------------------------------------------------

      const token =
        localStorage.getItem(
          "financeos_token"
        ) ||
        sessionStorage.getItem(
          "financeos_token"
        );


      if (!token) {

        return {
          success: false,
          message:
            "Authentication token not found.",
        };
      }


      // --------------------------------------------------------
      // DELETE FROM MONGODB
      // --------------------------------------------------------

      const response =
        await fetch(
          `http://localhost:5000/api/investments/${investmentId}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      const data =
        await response.json();


      // --------------------------------------------------------
      // HANDLE API ERROR
      // --------------------------------------------------------

      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.message ||
          "Failed to delete investment."
        );
      }


      // --------------------------------------------------------
      // REMOVE FROM FRONTEND STATE
      // --------------------------------------------------------

     setInvestments(
  (current) =>
    current.filter(
      (investment) =>
        String(
          investment.id ??
          investment._id
        ) !== String(
          investmentId
        )
    )
);


      // --------------------------------------------------------
      // REMOVE RELATED TRANSACTIONS
      // --------------------------------------------------------

      setAdditionalIncomeTransactions(
        (current) =>
          current.filter(
            (transaction) =>
              Number(
                transaction.investmentId
              ) !== investmentId
          )
      );


      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      return {
        success: true,

        message:
          "Investment deleted successfully.",
      };


    } catch (error) {

      console.error(
        "Delete Investment:",
        error
      );

      return {
        success: false,

        message:
          error.message ||
          "Failed to delete investment.",
      };
    }
  };

  // ==========================================================
  // INVESTMENT MATURITY VALUE
  // ==========================================================

  const getInvestmentMaturityValue = (
    investment
  ) => {

    if (!investment) {
      return 0;
    }


    const isFD =
      String(
        investment.type || ""
      )
        .trim()
        .toLowerCase() ===
      "fixed deposit";


    const interestMethod =
      String(
        investment.interestMethod ||
        ""
      )
        .trim()
        .toLowerCase();


    if (
      isFD &&
      interestMethod === "cumulative"
    ) {

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
        firstDefined(
          investment.maturityAmount,
          investment.principalAmount,
          investment.amount
        )
      );
    }


    return nonNegative(
      firstDefined(
        investment.maturityAmount,
        investment.currentValue,
        investment.amount
      )
    );
  };

  // ==========================================================
  // INVESTMENT - HANDLE MATURITY
  // ==========================================================

  const handleInvestmentMaturity = async (
    id,
    action = "mature"
  ) => {

    try {

      // --------------------------------------------------------
      // FIND INVESTMENT
      // --------------------------------------------------------

      const investment =
        investments.find(
          (item) =>
            item.id === id
        );

      if (!investment) {
        return {
          success: false,
          message:
            "Investment not found.",
        };
      }

      // --------------------------------------------------------
      // NORMALIZE ACTION
      // --------------------------------------------------------

      const normalizedAction =
        String(action)
          .trim()
          .toLowerCase();

      // --------------------------------------------------------
      // MATURITY VALUE
      // --------------------------------------------------------

      const maturityValue =
        getInvestmentMaturityValue(
          investment
        );

      // --------------------------------------------------------
      // MARK AS MATURED
      // --------------------------------------------------------

      if (
        normalizedAction === "mature"
      ) {

        const result =
          await updateInvestment(
            id,
            {
              status: "Matured",
              monthlyContribution: 0,
            }
          );

        if (!result?.success) {
          return result;
        }

        // Add frontend-only maturity information
        setInvestments(
          (current) =>
            current.map(
              (item) =>
                item.id === id
                  ? {
                      ...item,

                      status: "Matured",

                      monthlyContribution: 0,

                      maturedAt:
                        new Date().toISOString(),

                      maturityValue,

                      currentValue:
                        maturityValue,
                    }
                  : item
            )
        );

        return {
          success: true,

          message:
            "Investment marked as matured.",

          investment:
            result.investment,
        };
      }

      // --------------------------------------------------------
      // CLOSE INVESTMENT
      // --------------------------------------------------------

      if (
        normalizedAction === "close"
      ) {

        const result =
          await updateInvestment(
            id,
            {
              status: "Closed",
              monthlyContribution: 0,
            }
          );

        if (!result?.success) {
          return result;
        }

        // Add frontend-only closed information
        setInvestments(
          (current) =>
            current.map(
              (item) =>
                item.id === id
                  ? {
                      ...item,

                      status: "Closed",

                      monthlyContribution: 0,

                      closedAt:
                        new Date().toISOString(),

                      currentValue: 0,
                    }
                  : item
            )
        );

        return {
          success: true,

          message:
            "Investment closed successfully.",

          investment:
            result.investment,
        };
      }

      // --------------------------------------------------------
      // INVALID ACTION
      // --------------------------------------------------------

      return {
        success: false,

        message:
          "Invalid investment maturity action.",
      };

    } catch (error) {

      console.error(
        "Handle Investment Maturity:",
        error
      );

      return {
        success: false,

        message:
          error.message ||
          "Failed to update investment maturity status.",
      };

    }

  };

  // ==========================================================
  // INVESTMENT - RENEW
  // ==========================================================

  const renewInvestment = async (
    id,
    renewalData = {}
  ) => {

    try {

      // --------------------------------------------------------
      // GET AUTH TOKEN
      // --------------------------------------------------------

      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      if (!token) {

        return {
          success: false,
          message: "Authentication token not found.",
        };

      }

      // --------------------------------------------------------
      // RENEW INVESTMENT
      // --------------------------------------------------------

      const response = await fetch(
        `http://localhost:5000/api/investments/${id}/renew`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body:
            JSON.stringify(
              renewalData
            ),
        }
      );

      // --------------------------------------------------------
      // READ RESPONSE
      // --------------------------------------------------------

      const data =
        await response.json();

      // --------------------------------------------------------
      // HANDLE API ERROR
      // --------------------------------------------------------

      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.message ||
          "Failed to renew investment."
        );

      }

      // --------------------------------------------------------
      // PREPARE NEW INVESTMENT
      // --------------------------------------------------------

      const renewedInvestment = {

        ...data.investment,

        id:
          data.investment._id,

        amount:
          Number(
            data.investment.amount || 0
          ),

        currentValue:
          Number(
            data.investment.currentValue ??
            data.investment.amount ??
            0
          ),

        monthlyContribution:
          Number(
            data.investment.monthlyContribution || 0
          ),

        totalInterestReceived:
          Number(
            data.investment.totalInterestReceived || 0
          ),

      };

      // --------------------------------------------------------
      // KEEP OLD MATURED INVESTMENT
      // ADD NEW ACTIVE INVESTMENT
      // --------------------------------------------------------

      setInvestments(
        (current) => [
          ...current,
          renewedInvestment,
        ]
      );

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      return {

        success: true,

        message:
          "Investment renewed successfully.",

        investment:
          renewedInvestment,

      };

    } catch (error) {

      console.error(
        "Renew Investment:",
        error
      );

      return {

        success: false,

        message:
          error.message ||
          "Failed to renew investment.",

      };

    }

  };

  // ==========================================================
  // INSURANCE - ADD
  // ==========================================================

  const addInsurancePolicy = (
    policy = {}
  ) => {

    const newPolicy = {
      ...policy,

      id:
        policy.id ||
        createId(
          "insurance"
        ),

      status:
        policy.status ||
        "Active",

      premium:
        nonNegative(
          policy.premium
        ),

      monthlyPremium:
        nonNegative(
          policy.monthlyPremium
        ),

      monthlyEquivalent:
        nonNegative(
          firstDefined(
            policy.monthlyEquivalent,
            policy.monthlyPremium
          )
        ),

      createdAt:
        policy.createdAt ||
        new Date().toISOString(),
    };


    setInsurancePolicies(
      (current) => [
        ...current,
        newPolicy,
      ]
    );


    return newPolicy;
  };


  // ==========================================================
  // INSURANCE - UPDATE
  // ==========================================================

  const updateInsurancePolicy = (
    id,
    updates = {}
  ) => {

    setInsurancePolicies(
      (current) =>
        current.map(
          (policy) => {

            if (
              policy.id !== id
            ) {
              return policy;
            }


            return {
              ...policy,
              ...updates,

              premium:
                updates.premium !== undefined

                  ? nonNegative(
                      updates.premium
                    )

                  : policy.premium,

              monthlyPremium:
                updates.monthlyPremium !== undefined

                  ? nonNegative(
                      updates.monthlyPremium
                    )

                  : policy.monthlyPremium,

              monthlyEquivalent:
                updates.monthlyEquivalent !== undefined

                  ? nonNegative(
                      updates.monthlyEquivalent
                    )

                  : policy.monthlyEquivalent,
            };
          }
        )
    );
  };


  // ==========================================================
  // INSURANCE - DELETE
  // ==========================================================

  const deleteInsurancePolicy = (
    id
  ) => {

    setInsurancePolicies(
      (current) =>
        current.filter(
          (policy) =>
            policy.id !== id
        )
    );
  };


  // ==========================================================
  // LIABILITY - ADD
  // ==========================================================

  const addLiability = (
    liability = {}
  ) => {

    const originalAmount =
      nonNegative(
        firstDefined(
          liability.originalAmount,
          liability.loanAmount,
          liability.amount,
          liability.outstandingAmount,
          liability.remainingAmount,
          liability.balance
        )
      );


    const outstandingAmount =
      nonNegative(
        firstDefined(
          liability.outstandingAmount,
          liability.remainingAmount,
          liability.balance,
          originalAmount
        )
      );


    const monthlyPayment =
      getLiabilityMonthlyPayment(
        liability
      );


    const baseLiability = {
      ...liability,

      id:
        liability.id ||
        createId(
          "liability"
        ),

      originalAmount,

      loanAmount:
        originalAmount,

      amount:
        originalAmount,

      outstandingAmount,

      remainingAmount:
        outstandingAmount,

      balance:
        outstandingAmount,

      monthlyPayment,

      emi:
        monthlyPayment,

      monthlyEMI:
        monthlyPayment,

      status:
        outstandingAmount > 0
          ? (
              liability.status &&
              ![
                "closed",
                "completed",
                "paid",
                "settled",
              ].includes(
                normalizeStatus(
                  liability.status
                )
              )

                ? liability.status

                : "Active"
            )

          : "Closed",

      payments:
        Array.isArray(
          liability.payments
        )
          ? liability.payments
          : [],

      createdAt:
      liability.createdAt || new Date().toISOString(),
    };


    const completion =
      calculateLoanCompletion(
        baseLiability,
        outstandingAmount
      );


    const newLiability = {
      ...baseLiability,

      remainingPayments:
        completion.remainingPayments,

      estimatedCompletionDate:
        completion.estimatedCompletionDate,
    };


    setLiabilities(
      (current) => [
        ...current,
        newLiability,
      ]
    );


    return newLiability;
  };


  // ==========================================================
  // LIABILITY - UPDATE
  // ==========================================================

  const updateLiability = (
    id,
    updates = {}
  ) => {

    let updatedResult =
      null;


    setLiabilities(
      (current) =>
        current.map(
          (liability) => {

            if (
              liability.id !== id
            ) {
              return liability;
            }


            const updated = {
              ...liability,
              ...updates,
            };


            const originalAmount =
              updates.originalAmount !== undefined ||
              updates.loanAmount !== undefined ||
              updates.amount !== undefined

                ? nonNegative(
                    firstDefined(
                      updates.originalAmount,
                      updates.loanAmount,
                      updates.amount
                    )
                  )

                : nonNegative(
                    firstDefined(
                      liability.originalAmount,
                      liability.loanAmount,
                      liability.amount
                    )
                  );


            updated.originalAmount =
              originalAmount;

            updated.loanAmount =
              originalAmount;

            updated.amount =
              originalAmount;


            let balance =
              getLiabilityBalance(
                liability
              );


            if (
              updates.outstandingAmount !== undefined ||
              updates.remainingAmount !== undefined ||
              updates.balance !== undefined
            ) {

              balance =
                nonNegative(
                  firstDefined(
                    updates.outstandingAmount,
                    updates.remainingAmount,
                    updates.balance
                  )
                );
            }


            updated.outstandingAmount =
              balance;

            updated.remainingAmount =
              balance;

            updated.balance =
              balance;


            let payment =
              getLiabilityMonthlyPayment(
                liability
              );


            if (
              updates.monthlyPayment !== undefined ||
              updates.emi !== undefined ||
              updates.monthlyEMI !== undefined
            ) {

              payment =
                nonNegative(
                  firstDefined(
                    updates.monthlyPayment,
                    updates.emi,
                    updates.monthlyEMI
                  )
                );
            }


            updated.monthlyPayment =
              payment;

            updated.emi =
              payment;

            updated.monthlyEMI =
              payment;


            if (
              balance <= 0
            ) {

              updated.status =
                "Closed";

              updated.closedAt =
                updated.closedAt ||
                new Date().toISOString();

            } else {

              const requestedStatus =
                normalizeStatus(
                  updates.status
                );


              if (
                !updates.status ||
                requestedStatus === "closed" ||
                requestedStatus === "completed" ||
                requestedStatus === "paid" ||
                requestedStatus === "settled"
              ) {

                updated.status =
                  "Active";
              }
            }


            const completion =
              calculateLoanCompletion(
                updated,
                balance
              );


            updated.remainingPayments =
              completion.remainingPayments;

            updated.estimatedCompletionDate =
              completion.estimatedCompletionDate;


            updatedResult =
              updated;


            return updated;
          }
        )
    );


    return updatedResult;
  };


  // ==========================================================
  // LIABILITY - DELETE
  // ==========================================================

  const deleteLiability = (
    id
  ) => {

    setLiabilities(
      (current) =>
        current.filter(
          (liability) =>
            liability.id !== id
        )
    );
  };


  // ==========================================================
  // LIABILITY - RECORD PAYMENT
  // ==========================================================

  const recordLiabilityPayment = (
    id,
    paymentData = {}
  ) => {

    const data =
      typeof paymentData ===
      "object"

        ? paymentData

        : {
            amount:
              paymentData,
          };


    const amount =
      nonNegative(
        data.amount
      );


    if (
      amount <= 0
    ) {

      return {
        success: false,
        message:
          "Enter a valid payment amount.",
      };
    }


    let result = {
      success: false,
      message:
        "Liability not found.",
    };


    setLiabilities(
      (current) =>
        current.map(
          (liability) => {

            if (
              liability.id !== id
            ) {
              return liability;
            }


            const currentBalance =
              getLiabilityBalance(
                liability
              );


            if (
              currentBalance <= 0
            ) {

              result = {
                success: false,
                message:
                  "This liability is already fully paid.",
              };

              return liability;
            }


            const actualPayment =
              Math.min(
                amount,
                currentBalance
              );


            const newBalance =
              Math.max(
                currentBalance -
                actualPayment,
                0
              );


            const paymentDate =
              data.date ||
              new Date()
                .toISOString()
                .slice(0, 10);


            const payment = {

              id:
                createId(
                  "liability-payment"
                ),

              amount:
                actualPayment,

              date:
                paymentDate,

              note:
                data.note ||
                "",

              balanceBefore:
                currentBalance,

              balanceAfter:
                newBalance,

              createdAt:
                new Date().toISOString(),
            };


            const nextPaymentDate =
              newBalance > 0

                ? addMonthsToDate(
                    paymentDate,
                    1
                  )

                : null;


            const temporaryUpdated = {
              ...liability,

              outstandingAmount:
                newBalance,

              remainingAmount:
                newBalance,

              balance:
                newBalance,

              nextPaymentDate:
                nextPaymentDate ||
                liability.nextPaymentDate,
            };


            const completion =
              calculateLoanCompletion(
                temporaryUpdated,
                newBalance
              );


            result = {
              success: true,

              amount:
                actualPayment,

              remainingAmount:
                newBalance,

              remainingPayments:
                completion.remainingPayments,

              estimatedCompletionDate:
                completion.estimatedCompletionDate,

              message:
                newBalance === 0

                  ? "Final payment recorded. Liability is now closed."

                  : "Payment recorded successfully.",
            };


            return {
              ...temporaryUpdated,

              payments: [
                ...(
                  Array.isArray(
                    liability.payments
                  )
                    ? liability.payments
                    : []
                ),

                payment,
              ],

              status:
                newBalance === 0
                  ? "Closed"
                  : "Active",

              monthlyPayment:
                newBalance === 0
                  ? 0
                  : getLiabilityMonthlyPayment(
                      liability
                    ),

              emi:
                newBalance === 0
                  ? 0
                  : getLiabilityMonthlyPayment(
                      liability
                    ),

              monthlyEMI:
                newBalance === 0
                  ? 0
                  : getLiabilityMonthlyPayment(
                      liability
                    ),

              remainingPayments:
                completion.remainingPayments,

              estimatedCompletionDate:
                completion.estimatedCompletionDate,

              lastPaymentDate:
                paymentDate,

              nextPaymentDate:
                newBalance > 0
                  ? nextPaymentDate
                  : null,

              closedAt:
                newBalance === 0

                  ? new Date().toISOString()

                  : liability.closedAt ||
                    null,
            };
          }
        )
    );


    return result;
  };


  // ==========================================================
  // TOTAL INVESTMENT VALUE
  // ==========================================================

  const totalInvestmentValue =
    useMemo(
      () =>
        investments.reduce(
          (
            total,
            investment
          ) =>
            total +
            getInvestmentCurrentValue(
              investment
            ),

          0
        ),

      [investments]
    );


  // ==========================================================
  // TOTAL GOAL FUND VALUE
  // ==========================================================

  const totalGoalFundValue =
    useMemo(
      () =>
        savingGoals.reduce(
          (
            total,
            goal
          ) =>
            total +
            getGoalAvailableFund(
              goal
            ),

          0
        ),

      [savingGoals]
    );


  // ==========================================================
  // ACCUMULATED MONTHLY SAVINGS
  // ==========================================================

  const accumulatedMonthlySavings =
    useMemo(
      () =>
        monthlyHistory.reduce(
          (total, record) =>
            total +
            safeNumber(
              record.savings !== undefined
                ? record.savings
                : safeNumber(record.income) -
                  safeNumber(record.expenses)
            ),
          0
        ),
      [monthlyHistory]
    );


  // ==========================================================
  // CASH TRANSFERRED TO GOALS / INVESTMENTS
  // ==========================================================

  const cashAllocatedToGoals =
    totalGoalFundValue;

  const cashAllocatedToInvestments =
    useMemo(
      () =>
        investments.reduce(
          (total, investment) =>
            total +
            nonNegative(
              firstDefined(
                investment.principalAmount,
                investment.amount,
                investment.investedAmount
              )
            ),
          0
        ),
      [investments]
    );


  // ==========================================================
  // CURRENT CASH
  // ==========================================================

  const currentCashBalance =
    useMemo(
      () =>
        Math.max(
          nonNegative(cashBalance) +
          accumulatedMonthlySavings -
          cashAllocatedToGoals -
          cashAllocatedToInvestments,
          0
        ),
      [
        cashBalance,
        accumulatedMonthlySavings,
        cashAllocatedToGoals,
        cashAllocatedToInvestments,
      ]
    );


  // ==========================================================
  // TOTAL ASSETS
  // ==========================================================

  const totalAssets =
    useMemo(
      () =>
        currentCashBalance +
        totalInvestmentValue +
        totalGoalFundValue,

      [
        currentCashBalance,
        totalInvestmentValue,
        totalGoalFundValue,
      ]
    );


  // ==========================================================
  // TOTAL LIABILITIES
  // ==========================================================

  const totalLiabilities =
    useMemo(
      () =>
        liabilities.reduce(
          (
            total,
            liability
          ) =>
            total +
            getLiabilityBalance(
              liability
            ),

          0
        ),

      [liabilities]
    );


  // ==========================================================
  // NET WORTH
  // ==========================================================

  const netWorth =
    useMemo(
      () =>
        totalAssets -
        totalLiabilities,

      [
        totalAssets,
        totalLiabilities,
      ]
    );


  // ==========================================================
  // SAVE NET WORTH SNAPSHOT
  // ==========================================================

  const saveNetWorthSnapshot = (
    snapshotData = {}
  ) => {

    const month =
      Number(

        snapshotData.month ??
        monthlyFinance.month
      );


    const year =
      Number(
        snapshotData.year ??
        monthlyFinance.year
      );


    const baseIncome =
      nonNegative(
        firstDefined(
          snapshotData.baseIncome,
          monthlyFinance.income
        )
      );


    const monthAdditionalIncome =
      snapshotData.additionalIncome !== undefined

        ? nonNegative(
            snapshotData.additionalIncome
          )

        : getAdditionalIncomeForMonth(
            month,
            year
          );


    const totalIncome =
      snapshotData.totalIncome !== undefined

        ? nonNegative(
            snapshotData.totalIncome
          )

        : baseIncome +
          monthAdditionalIncome;


    const expenses =
      nonNegative(
        firstDefined(
          snapshotData.expenses,
          monthlyFinance.expenses
        )
      );


    const savings =
      snapshotData.savings !== undefined

        ? safeNumber(
            snapshotData.savings
          )

        : totalIncome -
          expenses;


    const snapshotGoalCommitment =
      snapshotData.goalCommitment !== undefined

        ? nonNegative(
            snapshotData.goalCommitment
          )

        : goalMonthlyCommitment;


    const snapshotInvestmentCommitment =
      snapshotData.investmentCommitment !== undefined

        ? nonNegative(
            snapshotData.investmentCommitment
          )

        : investmentMonthlyCommitment;


    const snapshotInsuranceCommitment =
      snapshotData.insuranceCommitment !== undefined

        ? nonNegative(
            snapshotData.insuranceCommitment
          )

        : insuranceMonthlyCommitment;


    const snapshotLiabilityCommitment =
      snapshotData.liabilityCommitment !== undefined

        ? nonNegative(
            snapshotData.liabilityCommitment
          )

        : liabilityMonthlyCommitment;


    const snapshotTotalCommitments =
      snapshotData.totalCommitments !== undefined

        ? nonNegative(
            snapshotData.totalCommitments
          )

        : (
            snapshotGoalCommitment +
            snapshotInvestmentCommitment +
            snapshotInsuranceCommitment +
            snapshotLiabilityCommitment
          );


    const snapshotAssets =
      snapshotData.totalAssets !== undefined

        ? nonNegative(
            snapshotData.totalAssets
          )

        : totalAssets;


    const snapshotLiabilities =
      snapshotData.totalLiabilities !== undefined

        ? nonNegative(
            snapshotData.totalLiabilities
          )

        : totalLiabilities;


    const snapshotNetWorth =
      snapshotAssets -
      snapshotLiabilities;


    const snapshot = {

      id:
        snapshotData.id ||
        createId(
          "snapshot"
        ),

      month,
      year,

      baseIncome,

      additionalIncome:
        monthAdditionalIncome,

      totalIncome,

      income:
        totalIncome,

      expenses,

      savings,

      goalCommitment:
        snapshotGoalCommitment,

      investmentCommitment:
        snapshotInvestmentCommitment,

      insuranceCommitment:
        snapshotInsuranceCommitment,

      liabilityCommitment:
        snapshotLiabilityCommitment,

      totalCommitments:
        snapshotTotalCommitments,

      availableToAllocate:
        snapshotData.availableToAllocate !== undefined

          ? safeNumber(
              snapshotData.availableToAllocate
            )

          : cashBalance +
            savings -
            snapshotTotalCommitments,

      totalAssets:
        snapshotAssets,

      totalLiabilities:
        snapshotLiabilities,

      netWorth:
        snapshotNetWorth,

      createdAt:
        snapshotData.createdAt ||
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),
    };


    setNetWorthSnapshots(
      (current) => {

        const existingIndex =
          current.findIndex(
            (item) =>
              Number(
                item.month
              ) === month &&

              Number(
                item.year
              ) === year
          );


        if (
          existingIndex !== -1
        ) {

          return current.map(
            (
              item,
              index
            ) =>
              index === existingIndex

                ? {
                    ...item,
                    ...snapshot,

                    id:
                      item.id ||
                      snapshot.id,

                    createdAt:
                      item.createdAt ||
                      snapshot.createdAt,
                  }

                : item
          );
        }


        return [
          ...current,
          snapshot,
        ];
      }
    );


    return snapshot;
  };


  // ==========================================================
  // FD ANNUAL INTEREST
  // ==========================================================

  const calculateFDAnnualInterest = (
    investment
  ) => {

    if (!investment) {
      return 0;
    }


    const principal =
      nonNegative(
        firstDefined(
          investment.principalAmount,
          investment.amount
        )
      );


    const rate =
      nonNegative(
        investment.interestRate
      );


    return (
      principal *
      rate /
      100
    );
  };


  // ==========================================================
  // FD INTEREST PER PAYOUT
  // ==========================================================

  const calculateFDInterestPerPayout = (
    investment
  ) => {

    const annualInterest =
      calculateFDAnnualInterest(
        investment
      );


    const frequency =
      String(
        investment?.interestPayoutFrequency ||
        ""
      )
        .trim()
        .toLowerCase();


    if (
      frequency === "monthly"
    ) {
      return annualInterest / 12;
    }


    if (
      frequency === "quarterly"
    ) {
      return annualInterest / 4;
    }


    if (
      frequency === "half yearly" ||
      frequency === "half-yearly" ||
      frequency === "halfyearly"
    ) {
      return annualInterest / 2;
    }


    return annualInterest;
  };


  // ==========================================================
  // TOTAL FD INTEREST RECEIVED
  // ==========================================================

  const totalFDInterestReceived =
    useMemo(
      () =>
        additionalIncomeTransactions

          .filter(
            (transaction) =>
              String(
                transaction.type ||
                ""
              )
                .trim()
                .toLowerCase() ===
              "fd interest"
          )

          .reduce(
            (
              total,
              transaction
            ) =>
              total +
              safeNumber(
                transaction.amount
              ),

            0
          ),

      [
        additionalIncomeTransactions,
      ]
    );


  // ==========================================================
  // SAVINGS RATE
  // ==========================================================

  const savingsRate =
    useMemo(
      () =>
        totalMonthlyIncome > 0

          ? (
              monthlySavings /
              totalMonthlyIncome
            ) * 100

          : 0,

      [
        monthlySavings,
        totalMonthlyIncome,
      ]
    );


  // ==========================================================
  // EXPENSE RATIO
  // ==========================================================

  const expenseRatio =
    useMemo(
      () =>
        totalMonthlyIncome > 0

          ? (
              nonNegative(
                monthlyFinance.expenses
              ) /
              totalMonthlyIncome
            ) * 100

          : 0,

      [
        monthlyFinance.expenses,
        totalMonthlyIncome,
      ]
    );


  // ==========================================================
  // COMMITMENT RATIO
  // ==========================================================

  const commitmentRatio =
    useMemo(
      () =>
        totalMonthlyIncome > 0

          ? (
              totalMonthlyCommitments /
              totalMonthlyIncome
            ) * 100

          : 0,

      [
        totalMonthlyCommitments,
        totalMonthlyIncome,
      ]
    );


  // ==========================================================
  // FINANCIAL HEALTH SCORE
  // ==========================================================

  const financialHealthScore =
    useMemo(
      () => {

        if (
          totalMonthlyIncome <= 0
        ) {
          return 0;
        }


        let score = 100;


        if (
          expenseRatio > 80
        ) {
          score -= 35;

        } else if (
          expenseRatio > 70
        ) {
          score -= 25;

        } else if (
          expenseRatio > 60
        ) {
          score -= 15;

        } else if (
          expenseRatio > 50
        ) {
          score -= 8;
        }


        if (
          commitmentRatio > 50
        ) {
          score -= 30;

        } else if (
          commitmentRatio > 40
        ) {
          score -= 20;

        } else if (
          commitmentRatio > 30
        ) {
          score -= 12;

        } else if (
          commitmentRatio > 20
        ) {
          score -= 5;
        }


        if (
          savingsRate < 0
        ) {
          score -= 35;

        } else if (
          savingsRate < 10
        ) {
          score -= 20;

        } else if (
          savingsRate < 20
        ) {
          score -= 10;

        } else if (
          savingsRate >= 30
        ) {
          score += 5;
        }


        if (
          availableToAllocate < 0
        ) {
          score -= 20;
        }


        return Math.min(
          Math.max(
            Math.round(
              score
            ),
            0
          ),
          100
        );
      },

      [
        totalMonthlyIncome,
        expenseRatio,
        commitmentRatio,
        savingsRate,
        availableToAllocate,
      ]
    );


  // ==========================================================
  // FINANCIAL HEALTH LABEL
  // ==========================================================

  const financialHealthLabel =
    useMemo(
      () => {

        if (
          financialHealthScore >= 80
        ) {
          return "Excellent";
        }


        if (
          financialHealthScore >= 65
        ) {
          return "Good";
        }


        if (
          financialHealthScore >= 50
        ) {
          return "Fair";
        }


        if (
          financialHealthScore >= 35
        ) {
          return "Needs Attention";
        }


        return "High Risk";
      },

      [
        financialHealthScore,
      ]
    );


  // ==========================================================
  // REPORT YEARS
  // ==========================================================

  const reportYears =
    useMemo(
      () => {

        const years = [

          new Date()
            .getFullYear(),

          Number(
            monthlyFinance.year
          ),

          ...monthlyHistory.map(
            (record) =>
              Number(
                record.year
              )
          ),

          ...netWorthSnapshots.map(
            (snapshot) =>
              Number(
                snapshot.year
              )
          ),
        ];


        return [
          ...new Set(
            years.filter(
              (year) =>
                Number.isFinite(
                  year
                ) &&
                year > 0
            )
          ),
        ].sort(
          (a, b) =>
            b - a
        );
      },

      [
        monthlyFinance.year,
        monthlyHistory,
        netWorthSnapshots,
      ]
    );


  // ==========================================================
  // COMPATIBILITY ALIAS
  // ==========================================================

  const netWorthHistory =
    netWorthSnapshots;


  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  const addNotification = (
    notificationData = {}
  ) => {

    const notification = {
      ...notificationData,

      id:
        notificationData.id ||
        createId("notification"),

      type:
        notificationData.type ||
        "general",

      category:
        notificationData.category ||
        "System",

      title:
        notificationData.title ||
        "Notification",

      message:
        notificationData.message ||
        "",

      source:
        notificationData.source ||
        "system",

      sourceId:
        notificationData.sourceId ||
        null,

      date:
        notificationData.date ||
        new Date().toISOString(),

      read:
        Boolean(
          notificationData.read
        ),

      createdAt:
        notificationData.createdAt ||
        new Date().toISOString(),
    };


    setNotifications(
      (current) => {

        const exists =
          current.some(
            (item) =>
              item.id ===
              notification.id
          );


        if (exists) {
          return current;
        }


        return [
          notification,
          ...current,
        ];
      }
    );


    return notification;
  };


  const markNotificationAsRead = (
    id
  ) => {

    setNotifications(
      (current) =>
        current.map(
          (notification) =>
            notification.id === id
              ? {
                  ...notification,
                  read: true,
                }
              : notification
        )
    );
  };


  const markAllNotificationsAsRead =
    () => {

      setNotifications(
        (current) =>
          current.map(
            (notification) => ({
              ...notification,
              read: true,
            })
          )
      );
    };


  const deleteNotification = (
    id
  ) => {

    setNotifications(
      (current) =>
        current.filter(
          (notification) =>
            notification.id !== id
        )
    );
  };


  const clearNotifications = () => {
    setNotifications([]);
  };


  const unreadNotificationCount =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            !notification.read
        ).length,

      [
        notifications,
      ]
    );


  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = {

    userData,
    setUserData,

    // Monthly Finance
    monthlyFinance,
    updateMonthlyFinance,
    monthlyHistory,

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
    activeSavingGoals,

    addSavingGoal,
    updateSavingGoal,
    deleteSavingGoal,

    addGoalContribution,
    withdrawGoalFunds,
    settleSavingGoal,
    updateGoalFundLocation,

    goalMonthlyCommitment,


    // Investments
    investments,
    activeInvestments,

    addInvestment,
    updateInvestment,
    updateInvestmentStatus,
    deleteInvestment,

    handleInvestmentMaturity,
    renewInvestment,

    getInvestmentMaturityValue,

    investmentMonthlyCommitment,
    totalInvestmentValue,


    // Insurance
    insurancePolicies,
    activeInsurancePolicies,

    addInsurancePolicy,
    updateInsurancePolicy,
    deleteInsurancePolicy,

    insuranceMonthlyCommitment,


    // Liabilities
    liabilities,
    activeLiabilities,

    addLiability,
    updateLiability,
    deleteLiability,
    recordLiabilityPayment,

    liabilityMonthlyCommitment,


    // Commitments
    totalMonthlyCommitments,


    // Assets / Liabilities / Net Worth
    totalGoalFundValue,
    totalAssets,
    totalLiabilities,
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
  };


  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}


// ============================================================
// EXPORT
// ============================================================

export default FinanceProvider;