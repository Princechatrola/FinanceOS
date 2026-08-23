// ============================================================
// FINANCEOS - PLANS & COMMITMENTS
// ============================================================
//
// Handles:
// 1. Investments
// 2. Insurance Policies
// 3. Liabilities
// 4. Fixed Deposit Interest
//
// ============================================================

import { useState } from "react";

import {
  FiTrendingUp,
  FiShield,
  FiCreditCard,
  FiPlus,
  FiCalendar,
  FiPause,
  FiPlay,
  FiTrash2,
  FiCheckCircle,
  FiDollarSign,
  FiX,
  FiRefreshCw,
  FiShoppingBag,
  FiBarChart2,
  FiZap,
  FiList,
} from "react-icons/fi";


// ============================================================
// LAYOUT
// ============================================================

import Sidebar from "../components/layout/Sidebar.jsx";
import Topbar from "../components/layout/Topbar.jsx";


// ============================================================
// FORMS
// ============================================================

import PlanTypeSelector
  from "../components/plansCommitments/PlanTypeSelector.jsx";

import InvestmentForm
  from "../components/plansCommitments/InvestmentForm.jsx";

import InsuranceForm
  from "../components/plansCommitments/InsuranceForm.jsx";

import InsuranceDetailsModal
  from "../components/plansCommitments/InsuranceDetailsModal.jsx";

import LiabilityForm
  from "../components/plansCommitments/LiabilityForm.jsx";

import FDInterestModal
  from "../components/plansCommitments/FDInterestModal.jsx";

import SIPContributionModal
  from "../components/plansCommitments/SIPContributionModal.jsx";


// ============================================================
// CONTEXT
// ============================================================

import useFinance from "../context/useFinance.js";


// ============================================================
// MAIN COMPONENT
// ============================================================

function PlansCommitments() {

  // ==========================================================
  // CONTEXT
  // ==========================================================

  const {
    investments,
    insurancePolicies,
    liabilities,

    updateInvestmentStatus,
    deleteInvestment,
    renewInvestment,

    updateInsuranceStatus,
    deleteInsurancePolicy,

    recordLiabilityPayment,
    updateLiabilityStatus,
    deleteLiability,
  } = useFinance();

  // ==========================================================
  // SAFE ARRAYS
  // ==========================================================

  const investmentList =
    Array.isArray(investments)
      ? investments
      : [];

  const insuranceList =
    Array.isArray(insurancePolicies)
      ? insurancePolicies
      : [];

  const liabilityList =
    Array.isArray(liabilities)
      ? liabilities
      : [];


  // ==========================================================
  // MODAL STATES
  // ==========================================================

  const [
    showTypeSelector,
    setShowTypeSelector,
  ] = useState(false);

  const [
    selectedPlanType,
    setSelectedPlanType,
  ] = useState(null);

  const [
    paymentLiability,
    setPaymentLiability,
  ] = useState(null);

  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState("");

  const [
    paymentError,
    setPaymentError,
  ] = useState("");

  // FD selected for recording interest.
  const [
    interestInvestment,
    setInterestInvestment,
  ] = useState(null);

  // SIP selected for recording contribution.
  const [
    sipContributionInvestment,
    setSIPContributionInvestment,
  ] = useState(null);

  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [editingInsurance, setEditingInsurance] = useState(null);

  const selectedInsuranceData = selectedInsurance
    ? (insurancePolicies || []).find((p) => p._id === selectedInsurance._id || p.id === selectedInsurance.id)
    : null;

  // ==========================================================
  // INVESTMENT MATURITY ACTION
  // ==========================================================

  const [
    maturityInvestment,
    setMaturityInvestment,
  ] = useState(null);

  const [
    renewalMode,
    setRenewalMode,
  ] = useState(null);

  const [
    renewalAmount,
    setRenewalAmount,
  ] = useState("");

  const [
    renewalChangeMode,
    setRenewalChangeMode,
  ] = useState(false);

  const [
    renewalPaymentOption,
    setRenewalPaymentOption,
  ] = useState("same");

  const [
    renewalFrequency,
    setRenewalFrequency,
  ] = useState("");

  const [
    renewalMaturityDate,
    setRenewalMaturityDate,
  ] = useState("");

  const [
    renewalError,
    setRenewalError,
  ] = useState("");

  // ==========================================================
  // ACTIVE ITEMS
  // ==========================================================

  const activeInvestments =
    investmentList.filter(
      (investment) =>
        investment.status === "Active"
    );

  const activeInsurance =
    insuranceList.filter(
      (policy) =>
        policy.status === "Active"
    );

  const activeLiabilities =
    liabilityList.filter(
      (liability) =>
        liability.status === "Active"
    );


  // ==========================================================
  // MONTHLY INVESTMENT COMMITMENT
  // ==========================================================

  const monthlyInvestmentCommitment =
    activeInvestments.reduce(
      (total, investment) =>
        total +
        Number(
          investment.monthlyContribution ||
          0
        ),
      0
    );


  // ==========================================================
  // MONTHLY INSURANCE COMMITMENT
  // ==========================================================

  const monthlyInsuranceCommitment =
    activeInsurance.reduce(
      (total, policy) =>
        total +
        Number(
          policy.monthlyPremium ||
          0
        ),
      0
    );


  // ==========================================================
  // MONTHLY LIABILITY COMMITMENT
  // ==========================================================

  const monthlyLiabilityCommitment =
    activeLiabilities.reduce(
      (total, liability) =>
        total +
        Number(
          liability.monthlyEMI ||
          0
        ),
      0
    );


  // ==========================================================
  // TOTAL MONTHLY COMMITMENT
  // ==========================================================

  const totalMonthlyCommitments =
    monthlyInvestmentCommitment +
    monthlyInsuranceCommitment +
    monthlyLiabilityCommitment;


  // ==========================================================
  // FORMAT MONEY
  // ==========================================================

  const formatMoney = (amount) =>
    Number(
      amount || 0
    ).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    );


  // ==========================================================
  // MATURITY AMOUNT FOR DISPLAY
  // ==========================================================

  const maturityAmountForDisplay =
    maturityInvestment
      ? Number(
          maturityInvestment
            .estimatedMaturityAmount ||
          maturityInvestment
            .principalAmount ||
          maturityInvestment.amount ||
          0
        )
      : 0;


  // ==========================================================
  // PLAN SELECTOR
  // ==========================================================

  const openPlanSelector = () => {

    setSelectedPlanType(null);
    setShowTypeSelector(true);

  };


  const selectPlanType = (type) => {

    setShowTypeSelector(false);
    setSelectedPlanType(type);

  };


  const closeForm = () => {

    setSelectedPlanType(null);

  };


  // ==========================================================
  // DELETE INVESTMENT
  // ==========================================================

  const handleDeleteInvestment = async (
    investment
  ) => {

    console.log(
      "DELETE INVESTMENT OBJECT:",
      investment
    );

    console.log(
      "DELETE INVESTMENT ID:",
      investment?.id,
      investment?._id
    );

    const confirmed =
      window.confirm(
        `Delete "${investment.name}"? This action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }


    // --------------------------------------------------------
    // GET NUMERIC INVESTMENT ID
    // --------------------------------------------------------

    const investmentId =
      investment.id ??
      investment._id;


    // --------------------------------------------------------
    // VALIDATE ID
    // --------------------------------------------------------

    if (
      investmentId === undefined ||
      investmentId === null ||
      investmentId === ""
    ) {

      console.error(
        "Delete Investment: Missing ID",
        investment
      );

      alert(
        "Investment ID is missing."
      );

      return;
    }


    // --------------------------------------------------------
    // DELETE
    // --------------------------------------------------------

    const result =
      await deleteInvestment(
        investmentId
      );


    // --------------------------------------------------------
    // ERROR
    // --------------------------------------------------------

    if (
      !result?.success
    ) {

      alert(
        result?.message ||
        "Failed to delete investment."
      );

      return;
    }

  };


  // ==========================================================
  // DELETE INSURANCE
  // ==========================================================

  const handleDeleteInsurance = (
    policy
  ) => {

    const confirmed =
      window.confirm(
        `Delete "${policy.name}"? This action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    deleteInsurancePolicy(
      policy.id
    );

  };


  // ==========================================================
  // DELETE LIABILITY
  // ==========================================================

  const handleDeleteLiability = (
    liability
  ) => {

    const confirmed =
      window.confirm(
        `Delete "${liability.name}"? This action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    deleteLiability(
      liability.id
    );

  };


  // ==========================================================
  // OPEN LIABILITY PAYMENT MODAL
  // ==========================================================

  const openPaymentModal = (
    liability
  ) => {

    setPaymentLiability(
      liability
    );

    setPaymentAmount(
      liability.monthlyEMI
        ? String(
            liability.monthlyEMI
          )
        : ""
    );

    setPaymentError("");

  };


  // ==========================================================
  // CLOSE LIABILITY PAYMENT MODAL
  // ==========================================================

  const closePaymentModal = () => {

    setPaymentLiability(null);
    setPaymentAmount("");
    setPaymentError("");

  };


  // ==========================================================
  // RECORD LIABILITY PAYMENT
  // ==========================================================

  const handleRecordPayment = (
    event
  ) => {

    event.preventDefault();

    if (!paymentLiability) {
      return;
    }

    const amount =
      Number(
        paymentAmount
      );

    const remaining =
      Number(
        paymentLiability.remainingAmount ||
        0
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {

      setPaymentError(
        "Enter a valid payment amount."
      );

      return;

    }

    if (remaining <= 0) {

      setPaymentError(
        "This liability has already been completed."
      );

      return;

    }

    recordLiabilityPayment(
      paymentLiability.id,
      amount
    );

    closePaymentModal();

  };


  // ==========================================================
  // OPEN FD INTEREST MODAL
  // ==========================================================

  const openFDInterestModal = (
    investment
  ) => {

    setInterestInvestment(
      investment
    );

  };


  // ==========================================================
  // CLOSE FD INTEREST MODAL
  // ==========================================================

  const closeFDInterestModal = () => {

    setInterestInvestment(
      null
    );

  };


  // OPEN SIP CONTRIBUTION MODAL
  // ==========================================================

  const openSIPContributionModal = (
    investment
  ) => {
    setSIPContributionInvestment(
      investment
    );
  };


  // ==========================================================
  // CLOSE SIP CONTRIBUTION MODAL
  // ==========================================================

  const closeSIPContributionModal = () => {
    setSIPContributionInvestment(
      null
    );
  };


  // ==========================================================
  // OPEN MATURITY ACTION MODAL
  // ==========================================================

  const openMaturityActionModal = (
    investment
  ) => {

    setMaturityInvestment(
      investment
    );

  };


  // ==========================================================
  // CLOSE MATURITY ACTION MODAL
  // ==========================================================

  const closeMaturityActionModal = () => {

    setMaturityInvestment(
      null
    );

    setRenewalMode(
      null
    );

  };


  // ==========================================================
  // OPEN INVESTMENT RENEWAL FORM
  // ==========================================================

  const openRenewalForm = (mode) => {

    if (!maturityInvestment) {
      return;
    }

    const maturityAmount =
      Number(
        maturityInvestment.estimatedMaturityAmount ||
        maturityInvestment.principalAmount ||
        maturityInvestment.amount ||
        0
      );


    // --------------------------------------------------------
    // RENEWAL MODE
    // --------------------------------------------------------

    setRenewalMode(mode);


    // --------------------------------------------------------
    // DEFAULT AMOUNT
    // --------------------------------------------------------

    setRenewalAmount(
      String(maturityAmount)
    );


    // --------------------------------------------------------
    // START IN "SAME TERMS" MODE
    // --------------------------------------------------------

    setRenewalChangeMode(false);


    // --------------------------------------------------------
    // DEFAULT PAYMENT OPTION
    // --------------------------------------------------------

    setRenewalPaymentOption(
      "same"
    );


    // --------------------------------------------------------
    // EXISTING FREQUENCY
    // --------------------------------------------------------

    setRenewalFrequency(
      maturityInvestment.frequency ||
      ""
    );


    // --------------------------------------------------------
    // EXISTING MATURITY DATE
    // --------------------------------------------------------

    setRenewalMaturityDate(
      maturityInvestment.maturityDate
        ? String(
            maturityInvestment.maturityDate
          ).slice(0, 10)
        : ""
    );


    // --------------------------------------------------------
    // CLEAR ERROR
    // --------------------------------------------------------

    setRenewalError("");
  };


  // ==========================================================
  // CONFIRM INVESTMENT RENEWAL
  // ==========================================================

  const handleConfirmRenewal = async () => {

    if (!maturityInvestment) {
      return;
    }


    const maturityAmount =
      Number(
        maturityInvestment.estimatedMaturityAmount ||
        maturityInvestment.principalAmount ||
        maturityInvestment.amount ||
        0
      );


    const amount =
      Number(renewalAmount);


    // --------------------------------------------------------
    // VALIDATE RENEWAL AMOUNT
    // --------------------------------------------------------

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {

      setRenewalError(
        "Enter a valid renewal amount."
      );

      return;
    }


    if (
      amount > maturityAmount
    ) {

      setRenewalError(
        "Renewal amount cannot be greater than the maturity amount."
      );

      return;
    }


    // --------------------------------------------------------
    // VALIDATE PARTIAL RENEWAL
    // --------------------------------------------------------

    if (
      renewalMode === "partial" &&
      amount >= maturityAmount
    ) {

      setRenewalError(
        "For partial renewal, the renewal amount must be less than the maturity amount."
      );

      return;
    }


    // --------------------------------------------------------
    // VALIDATE CHANGED MATURITY DATE
    // --------------------------------------------------------

    if (
      renewalChangeMode &&
      !renewalMaturityDate
    ) {

      setRenewalError(
        "Select the new maturity date."
      );

      return;
    }


    setRenewalError("");


    // --------------------------------------------------------
    // PAYMENT SETTINGS
    // --------------------------------------------------------

    let contributionType =
      maturityInvestment.contributionType ||
      "Recurring";

    let frequency =
      maturityInvestment.frequency ||
      null;


    if (renewalChangeMode) {

      if (
        renewalPaymentOption ===
        "one-time"
      ) {

        contributionType =
          "One Time";

        frequency =
          null;

      }


      if (
        renewalPaymentOption ===
        "recurring"
      ) {

        contributionType =
          "Recurring";

        frequency =
          renewalFrequency ||
          maturityInvestment.frequency ||
          "Monthly";

      }

    }


    // --------------------------------------------------------
    // MATURITY DATE
    // --------------------------------------------------------

    const maturityDate =
      renewalChangeMode
        ? renewalMaturityDate
        : (
            maturityInvestment.maturityDate ||
            null
          );


    // --------------------------------------------------------
    // PREPARE RENEWAL DATA
    // --------------------------------------------------------

    const renewalData = {

      amount,

      principalAmount:
        amount,

      contributionType,

      frequency,

      maturityDate,

      status:
        "Active",

    };


    try {

      // ------------------------------------------------------
      // RENEW
      // ------------------------------------------------------

      const result =
        await renewInvestment(
          maturityInvestment.id,
          renewalData
        );


      if (!result?.success) {

        setRenewalError(
          result?.message ||
          "Failed to renew investment."
        );

        return;
      }


      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      setRenewalMode(null);

      setRenewalChangeMode(false);

      setRenewalAmount("");

      setRenewalPaymentOption(
        "same"
      );

      setRenewalFrequency("");

      setRenewalMaturityDate("");

      setRenewalError("");

      setMaturityInvestment(null);


    } catch (error) {

      console.error(
        "Confirm Renewal:",
        error
      );

      setRenewalError(
        error.message ||
        "Failed to renew investment."
      );

    }

  };


  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  const hasNoPlans =
    investmentList.length === 0 &&
    insuranceList.length === 0 &&
    liabilityList.length === 0;


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="min-h-screen bg-[#f6f8f4]">

      <Sidebar />


      <main className="ml-64 min-h-screen">

        <Topbar />


        <div className="px-8 py-6">

          {/* ==================================================
              HEADER
             ================================================== */}

          <div className="flex items-start justify-between gap-6">

            <div>

              <p className="text-sm font-medium text-[#5f7568]">
                FinanceOS
              </p>

              <h1 className="mt-1 text-2xl font-bold text-[#18392c]">
                Plans & Commitments
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Track and update your investments,
                insurance policies and liabilities.
              </p>

            </div>


            <button
              type="button"
              onClick={
                openPlanSelector
              }
              className="flex shrink-0 items-center gap-2 rounded-xl bg-[#18392c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#244c3b]"
            >

              <FiPlus />

              Add Plan / Commitment

            </button>

          </div>


          {/* ==================================================
              TOTAL MONTHLY COMMITMENTS
             ================================================== */}

          <div className="mt-7 rounded-2xl border border-[#dcebd4] bg-[#f4faef] p-5">

            <div className="flex items-center justify-between gap-5">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6c8b72]">
                  Monthly Financial Load
                </p>

                <h2 className="mt-1 text-base font-semibold text-[#18392c]">
                  Total Monthly Commitments
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Only active recurring commitments
                  are included.
                </p>

              </div>


              <div className="text-right">

                <p className="text-2xl font-bold text-[#315c46]">

                  ₹{formatMoney(
                    totalMonthlyCommitments
                  )}

                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  per month
                </p>

              </div>

            </div>

          </div>


          {/* ==================================================
              MONTHLY OVERVIEW
             ================================================== */}

          <div className="mt-7">

            <h2 className="text-base font-semibold text-[#18392c]">
              Monthly Overview
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Active recurring financial commitments.
            </p>


            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">

              <OverviewCard
                icon={
                  <FiTrendingUp />
                }
                title="Investments"
                amount={
                  monthlyInvestmentCommitment
                }
                count={
                  activeInvestments.length
                }
                description="monthly equivalent"
                formatMoney={
                  formatMoney
                }
              />


              <OverviewCard
                icon={
                  <FiShield />
                }
                title="Insurance"
                amount={
                  monthlyInsuranceCommitment
                }
                count={
                  activeInsurance.length
                }
                description="monthly premium equivalent"
                formatMoney={
                  formatMoney
                }
              />


              <OverviewCard
                icon={
                  <FiCreditCard />
                }
                title="Liabilities"
                amount={
                  monthlyLiabilityCommitment
                }
                count={
                  activeLiabilities.length
                }
                description="monthly EMI / payment"
                formatMoney={
                  formatMoney
                }
              />

            </div>

          </div>


          {/* ==================================================
              RECORDS
             ================================================== */}

          <div className="mt-7 rounded-2xl border border-[#e2e8dc] bg-white p-6">

            <h2 className="text-base font-semibold text-[#18392c]">
              Your Plans & Commitments
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Manage the financial plans you have added.
            </p>


            {hasNoPlans ? (

              <div className="mt-6 flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-[#dce5d7] bg-[#fafcf8] px-6 text-center">

                <FiTrendingUp className="text-2xl text-[#315c46]" />

                <h3 className="mt-4 text-sm font-semibold text-[#18392c]">
                  No plans or commitments yet
                </h3>

                <p className="mt-2 max-w-md text-xs leading-5 text-slate-400">
                  Add an investment, insurance policy
                  or liability when you have one.
                </p>

                <button
                  type="button"
                  onClick={
                    openPlanSelector
                  }
                  className="mt-5 flex items-center gap-2 rounded-xl border border-[#dce5d7] bg-white px-4 py-2.5 text-xs font-semibold text-[#315c46]"
                >

                  <FiPlus />

                  Add First Plan

                </button>

              </div>

            ) : (

              <div className="mt-7 space-y-9">


                {/* =============================================
                    INVESTMENTS
                   ============================================= */}

                {investmentList.length > 0 && (

                  <section>

                    <SectionTitle
                      icon={
                        <FiTrendingUp />
                      }
                      title="Investments"
                      count={
                        investmentList.length
                      }
                    />


                    <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">

                      {investmentList.map(
                        (investment) => (

                          <InvestmentCard
                            key={
                              investment.id
                            }
                            investment={
                              investment
                            }
                            formatMoney={
                              formatMoney
                            }
                            updateStatus={
                              updateInvestmentStatus
                            }
                            deleteItem={
                              handleDeleteInvestment
                            }
                            recordFDInterest={
                              openFDInterestModal
                            }
                            openMaturityActionModal={
                              openMaturityActionModal
                            }
                            recordSIPContribution={
                              openSIPContributionModal
                            }
                          />

                        )
                      )}

                    </div>

                  </section>

                )}


                {/* =============================================
                    INSURANCE
                   ============================================= */}

                {insuranceList.length > 0 && (

                  <section>

                    <SectionTitle
                      icon={
                        <FiShield />
                      }
                      title="Insurance"
                      count={
                        insuranceList.length
                      }
                    />


                    <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">

                      {insuranceList.map(
                        (policy) => (

                          <InsuranceCard
                            key={
                              policy.id
                            }
                            policy={
                              policy
                            }
                            formatMoney={
                              formatMoney
                            }
                            updateStatus={
                              updateInsuranceStatus
                            }
                            deleteItem={
                              handleDeleteInsurance
                            }
                            onViewDetails={() => setSelectedInsurance(policy)}
                          />

                        )
                      )}

                    </div>

                  </section>

                )}


                {/* =============================================
                    LIABILITIES
                   ============================================= */}

                {liabilityList.length > 0 && (

                  <section>

                    <SectionTitle
                      icon={
                        <FiCreditCard />
                      }
                      title="Liabilities"
                      count={
                        liabilityList.length
                      }
                    />


                    <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">

                      {liabilityList.map(
                        (liability) => (

                          <LiabilityCard
                            key={
                              liability.id
                            }
                            liability={
                              liability
                            }
                            formatMoney={
                              formatMoney
                            }
                            updateStatus={
                              updateLiabilityStatus
                            }
                            deleteItem={
                              handleDeleteLiability
                            }
                            recordPayment={
                              openPaymentModal
                            }
                          />

                        )
                      )}

                    </div>

                  </section>

                )}

              </div>

            )}

          </div>

        </div>

      </main>


      {/* ======================================================
          PLAN SELECTOR
         ====================================================== */}

      {showTypeSelector && (

        <PlanTypeSelector
          onClose={() =>
            setShowTypeSelector(false)
          }
          onSelect={
            selectPlanType
          }
        />

      )}


      {/* ======================================================
          INVESTMENT FORM
         ====================================================== */}

      {selectedPlanType ===
        "investment" && (

        <InvestmentForm
          onClose={
            closeForm
          }
          onSuccess={
            closeForm
          }
        />

      )}


      {/* ======================================================
          INSURANCE FORM (ADD & EDIT)
         ====================================================== */}

      {(selectedPlanType === "insurance" || editingInsurance) && (

        <InsuranceForm
          editingPolicy={editingInsurance}
          onClose={() => {
            closeForm();
            setEditingInsurance(null);
          }}
          onSuccess={() => {
            closeForm();
            setEditingInsurance(null);
            setSelectedInsurance(null);
          }}
        />

      )}

      {/* ======================================================
          INSURANCE DETAILS VIEW
         ====================================================== */}

      {selectedInsuranceData && (

        <InsuranceDetailsModal
          policy={selectedInsuranceData}
          onClose={() => setSelectedInsurance(null)}
          onEdit={() => {
            setEditingInsurance(selectedInsuranceData);
            setSelectedInsurance(null);
          }}
        />

      )}


      {/* ======================================================
          LIABILITY FORM
         ====================================================== */}

      {selectedPlanType ===
        "liability" && (

        <LiabilityForm
          onClose={
            closeForm
          }
          onSuccess={
            closeForm
          }
        />

      )}


      {/* ======================================================
          LIABILITY PAYMENT MODAL
         ====================================================== */}

      {paymentLiability && (

        <PaymentModal
          liability={
            paymentLiability
          }
          paymentAmount={
            paymentAmount
          }
          setPaymentAmount={
            setPaymentAmount
          }
          error={
            paymentError
          }
          formatMoney={
            formatMoney
          }
          onSubmit={
            handleRecordPayment
          }
          onClose={
            closePaymentModal
          }
        />

      )}


      {/* ======================================================
          FD INTEREST MODAL
         ====================================================== */}

      {interestInvestment && (

        <FDInterestModal
          investment={
            interestInvestment
          }
          onClose={
            closeFDInterestModal
          }
        />

      )}


      {/* ==========================================================
          SIP CONTRIBUTION MODAL
         ========================================================== */}

      {sipContributionInvestment && (

        <SIPContributionModal
          investment={
            sipContributionInvestment
          }
          onClose={
            closeSIPContributionModal
          }
        />

      )}


      {/* ==========================================================
          INVESTMENT MATURITY ACTION MODAL
      ========================================================== */}

      {maturityInvestment && (

        <div
          className="
            fixed inset-0 z-[9999]
            flex items-center justify-center
            bg-[#10251d]/60
            p-4 sm:p-6
          "
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeMaturityActionModal();
            }

          }}
        >

          {/* ======================================================
              MODAL CONTAINER
          ====================================================== */}

          <div
            className="
              flex
              max-h-[90vh]
              w-full
              max-w-4xl
              flex-col
              overflow-hidden
              rounded-3xl
              border
              border-[#dfe8dc]
              bg-[#f8faf7]
              shadow-[0_25px_70px_rgba(24,57,44,0.25)]
            "
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            {/* ====================================================
                HEADER
            ==================================================== */}

            <div
              className="
                shrink-0
                border-b
                border-[#dfe8dc]
                bg-gradient-to-r
                from-[#18392c]
                via-[#315c46]
                to-[#426d55]
                px-5
                py-5
                sm:px-7
              "
            >

              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-4
                "
              >

                {/* TITLE */}

                <div
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-4
                  "
                >

                  <div
                    className="
                      flex
                      h-12
                      w-12
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl
                      bg-white/15
                      text-white
                      ring-1
                      ring-white/20
                    "
                  >
                    <FiRefreshCw
                      size={21}
                    />
                  </div>


                  <div
                    className="
                      min-w-0
                    "
                  >

                    <p
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.18em]
                        text-[#dceadd]
                      "
                    >
                      FinanceOS
                    </p>

                    <h2
                      className="
                        mt-1
                        truncate
                        text-lg
                        font-bold
                        text-white
                        sm:text-xl
                      "
                    >
                      Investment Maturity
                    </h2>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-[#dceadd]
                      "
                    >
                      Decide what to do with your
                      maturity amount.
                    </p>

                  </div>

                </div>


                {/* CLOSE */}

                <button
                  type="button"
                  onClick={
                    closeMaturityActionModal
                  }
                  aria-label="Close maturity options"
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    text-white/80
                    transition
                    hover:bg-white/10
                    hover:text-white
                  "
                >
                  <FiX
                    size={19}
                  />
                </button>

              </div>

            </div>


            {/* ====================================================
                CONTENT
            ==================================================== */}

            <div
              className="
                flex-1
                overflow-y-auto
                px-5
                py-5
                sm:px-7
                sm:py-6
              "
            >

              {/* ==================================================
                  INVESTMENT SUMMARY
              ================================================== */}

              <div
                className="
                  mb-6
                  grid
                  grid-cols-1
                  gap-3
                  sm:grid-cols-3
                "
              >

                {/* INVESTMENT */}

                <div
                  className="
                    rounded-2xl
                    border
                    border-[#dfe8dc]
                    bg-white
                    p-4
                  "
                >

                  <p
                    className="
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-wide
                      text-[#7a8d82]
                    "
                  >
                    Investment
                  </p>

                  <p
                    className="
                      mt-1
                      truncate
                      text-sm
                      font-bold
                      text-[#18392c]
                    "
                  >
                    {maturityInvestment.name}
                  </p>

                  <p
                    className="
                      mt-1
                      text-[11px]
                      text-slate-400
                    "
                  >
                    {maturityInvestment.type}
                  </p>

                </div>


                {/* STATUS */}

                <div
                  className="
                    rounded-2xl
                    border
                    border-[#dfe8dc]
                    bg-white
                    p-4
                  "
                >

                  <p
                    className="
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-wide
                      text-[#7a8d82]
                    "
                  >
                    Status
                  </p>

                  <div
                    className="
                      mt-2
                      inline-flex
                      items-center
                      rounded-full
                      bg-[#edf6e8]
                      px-3
                      py-1
                      text-[11px]
                      font-semibold
                      text-[#315c46]
                    "
                  >
                    Matured
                  </div>

                </div>


                {/* MATURITY AMOUNT */}

                <div
                  className="
                    rounded-2xl
                    border
                    border-[#cfe0d0]
                    bg-[#edf6e8]
                    p-4
                  "
                >

                  <p
                    className="
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-wide
                      text-[#52705d]
                    "
                  >
                    Maturity Amount
                  </p>

                  <p
                    className="
                      mt-1
                      text-xl
                      font-bold
                      text-[#18392c]
                    "
                  >
                    ₹{formatMoney(
                      Number(
                        maturityInvestment
                          .estimatedMaturityAmount ||
                        maturityInvestment
                          .principalAmount ||
                        maturityInvestment
                          .amount ||
                        0
                      )
                    )}
                  </p>

                </div>

              </div>


              {/* ==================================================
                  MAIN QUESTION
              ================================================== */}

              <div
                className="
                  mb-4
                "
              >

                <h3
                  className="
                    text-base
                    font-bold
                    text-[#18392c]
                    sm:text-lg
                  "
                >
                  What do you want to do with this money?
                </h3>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >
                  Choose how you want to use or reinvest
                  the maturity amount.
                </p>

              </div>


              {/* ==================================================
                  OPTIONS
              ================================================== */}

              {!renewalMode && (

                <div
                  className="
                    grid
                    grid-cols-1
                    gap-3
                    md:grid-cols-2
                  "
                >

                  {/* RENEW FULL */}

                  <button
                    type="button"
                    onClick={() => {
                      openRenewalForm("full");
                    }}
                    className="
                      group
                      rounded-2xl
                      border
                      border-[#dfe8dc]
                      bg-white
                      p-4
                      text-left
                      transition
                      hover:-translate-y-0.5
                      hover:border-[#9fbea6]
                      hover:bg-[#f7faf5]
                      hover:shadow-md
                    "
                  >

                    <div
                      className="
                        flex
                        items-start
                        gap-3
                      "
                    >

                      <div
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-[#edf6e8]
                          text-[#315c46]
                        "
                      >
                        <FiRefreshCw
                          size={18}
                        />
                      </div>

                      <div>

                        <p
                          className="
                            text-sm
                            font-semibold
                            text-[#18392c]
                          "
                        >
                          Renew Full Amount
                        </p>

                        <p
                          className="
                            mt-1
                            text-[11px]
                            leading-5
                            text-slate-400
                          "
                        >
                          Continue with the complete
                          maturity amount.
                        </p>

                      </div>

                    </div>

                  </button>


                  {/* RENEW PARTIAL */}

                  <button
                    type="button"
                    onClick={() => {
                      openRenewalForm("partial");
                    }}
                    className="
                      group
                      rounded-2xl
                      border
                      border-[#dfe8dc]
                      bg-white
                      p-4
                      text-left
                      transition
                      hover:-translate-y-0.5
                      hover:border-[#9fbea6]
                      hover:bg-[#f7faf5]
                      hover:shadow-md
                    "
                  >

                    <div
                      className="
                        flex
                        items-start
                        gap-3
                      "
                    >

                      <div
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-[#f2f6ee]
                          text-[#315c46]
                        "
                      >
                        <FiTrendingUp
                          size={18}
                        />
                      </div>

                      <div>

                        <p
                          className="
                            text-sm
                            font-semibold
                            text-[#18392c]
                          "
                        >
                          Renew Partial Amount
                        </p>

                        <p
                          className="
                            mt-1
                            text-[11px]
                            leading-5
                            text-slate-400
                          "
                        >
                          Renew part of the money and
                          decide what to do with the rest.
                        </p>

                      </div>

                    </div>

                  </button>


                  {/* SAVE IN BANK */}

                  <button
                    type="button"
                    className="
                      group
                      rounded-2xl
                      border
                      border-[#dfe8dc]
                      bg-white
                      p-4
                      text-left
                      transition
                      hover:-translate-y-0.5
                      hover:border-[#9fbea6]
                      hover:bg-[#f7faf5]
                      hover:shadow-md
                    "
                  >

                    <div
                      className="
                        flex
                        items-start
                        gap-3
                      "
                    >

                      <div
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-[#edf6e8]
                          text-[#315c46]
                        "
                      >
                        <FiCreditCard
                          size={18}
                        />
                      </div>

                      <div>

                        <p
                          className="
                            text-sm
                            font-semibold
                            text-[#18392c]
                          "
                        >
                          Save in Bank
                        </p>

                        <p
                          className="
                            mt-1
                            text-[11px]
                            leading-5
                            text-slate-400
                          "
                        >
                          Record the money moved to a
                          savings or bank account.
                        </p>

                      </div>

                    </div>

                  </button>


                  {/* PURCHASE */}

                  <button
                    type="button"
                    className="
                      group
                      rounded-2xl
                      border
                      border-[#dfe8dc]
                      bg-white
                      p-4
                      text-left
                      transition
                      hover:-translate-y-0.5
                      hover:border-[#9fbea6]
                      hover:bg-[#f7faf5]
                      hover:shadow-md
                    "
                  >

                    <div
                      className="
                        flex
                        items-start
                        gap-3
                      "
                    >

                      <div
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-[#f2f6ee]
                          text-[#315c46]
                        "
                      >
                        <FiShoppingBag
                          size={18}
                        />
                      </div>

                      <div>

                        <p
                          className="
                            text-sm
                            font-semibold
                            text-[#18392c]
                          "
                        >
                          Buy Something
                        </p>

                        <p
                          className="
                            mt-1
                            text-[11px]
                            leading-5
                            text-slate-400
                          "
                        >
                          Record a purchase made using
                          the maturity money.
                        </p>

                      </div>

                    </div>

                  </button>


                  {/* NEW INVESTMENT */}

                  <button
                    type="button"
                    className="
                      group
                      rounded-2xl
                      border
                      border-[#dfe8dc]
                      bg-white
                      p-4
                      text-left
                      transition
                      hover:-translate-y-0.5
                      hover:border-[#9fbea6]
                      hover:bg-[#f7faf5]
                      hover:shadow-md
                    "
                  >

                    <div
                      className="
                        flex
                        items-start
                        gap-3
                      "
                    >

                      <div
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-[#edf6e8]
                          text-[#315c46]
                        "
                      >
                        <FiBarChart2
                          size={18}
                        />
                      </div>

                      <div>

                        <p
                          className="
                            text-sm
                            font-semibold
                            text-[#18392c]
                          "
                        >
                          Invest Elsewhere
                        </p>

                        <p
                          className="
                            mt-1
                            text-[11px]
                            leading-5
                            text-slate-400
                          "
                        >
                          Record money moved into another
                          investment.
                        </p>

                      </div>

                    </div>

                  </button>


                  {/* LIABILITY */}

                  <button
                    type="button"
                    className="
                      group
                      rounded-2xl
                      border
                      border-[#dfe8dc]
                      bg-white
                      p-4
                      text-left
                      transition
                      hover:-translate-y-0.5
                      hover:border-[#9fbea6]
                      hover:bg-[#f7faf5]
                      hover:shadow-md
                    "
                  >

                    <div
                      className="
                        flex
                        items-start
                        gap-3
                      "
                    >

                      <div
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-[#f2f6ee]
                          text-[#315c46]
                        "
                      >
                        <FiCreditCard
                          size={18}
                        />
                      </div>

                      <div>

                        <p
                          className="
                            text-sm
                            font-semibold
                            text-[#18392c]
                          "
                        >
                          Pay Liability
                        </p>

                        <p
                          className="
                            mt-1
                            text-[11px]
                            leading-5
                            text-slate-400
                          "
                        >
                          Use the maturity money toward
                          a loan or other liability.
                        </p>

                      </div>

                    </div>

                  </button>


                  {/* CASH */}

                  <button
                    type="button"
                    className="
                      group
                      rounded-2xl
                      border
                      border-[#dfe8dc]
                      bg-white
                      p-4
                      text-left
                      transition
                      hover:-translate-y-0.5
                      hover:border-[#9fbea6]
                      hover:bg-[#f7faf5]
                      hover:shadow-md
                    "
                  >

                    <div
                      className="
                        flex
                        items-start
                        gap-3
                      "
                    >

                      <div
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-[#edf6e8]
                          text-[#315c46]
                        "
                      >
                        <FiDollarSign
                          size={18}
                        />
                      </div>

                      <div>

                        <p
                          className="
                            text-sm
                            font-semibold
                            text-[#18392c]
                          "
                        >
                          Keep as Cash
                        </p>

                        <p
                          className="
                            mt-1
                            text-[11px]
                            leading-5
                            text-slate-400
                          "
                        >
                          Keep some or all of the amount
                          available as cash.
                        </p>

                      </div>

                    </div>

                  </button>

                </div>

              )}


              {/* ==================================================
                  RENEWAL FORM
              ================================================== */}

              {renewalMode && (

                <div
                  className="
                    mt-5
                    rounded-2xl
                    border
                    border-[#c9dcca]
                    bg-white
                    p-5
                    shadow-sm
                  "
                >

                  {/* ==================================================
                      HEADER
                  ================================================== */}

                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      gap-4
                    "
                  >

                    <div>

                      <p
                        className="
                          text-[10px]
                          font-semibold
                          uppercase
                          tracking-[0.15em]
                          text-[#6c8b72]
                        "
                      >
                        Investment Renewal
                      </p>

                      <h3
                        className="
                          mt-1
                          text-lg
                          font-bold
                          text-[#18392c]
                        "
                      >
                        {renewalMode === "full"
                          ? "Renew Full Amount"
                          : "Renew Partial Amount"}
                      </h3>

                      <p
                        className="
                          mt-1
                          text-xs
                          leading-5
                          text-slate-400
                        "
                      >
                        Continue this investment using the
                        existing investment terms.
                      </p>

                    </div>


                    <button
                      type="button"
                      onClick={() => {

                        setRenewalMode(null);

                        setRenewalChangeMode(false);

                        setRenewalError("");

                      }}
                      className="
                        rounded-xl
                        px-3
                        py-2
                        text-xs
                        font-semibold
                        text-[#52665b]
                        hover:bg-[#f2f6ee]
                      "
                    >
                      Back
                    </button>

                  </div>


                  {/* ==================================================
                      MATURITY SUMMARY
                  ================================================== */}

                  <div
                    className="
                      mt-5
                      grid
                      grid-cols-1
                      gap-3
                      sm:grid-cols-2
                    "
                  >

                    <div
                      className="
                        rounded-xl
                        border
                        border-[#dfe8dc]
                        bg-[#f8faf7]
                        p-4
                      "
                    >

                      <p
                        className="
                          text-[10px]
                          font-semibold
                          uppercase
                          tracking-wide
                          text-[#6c8b72]
                        "
                      >
                        Maturity Amount
                      </p>

                      <p
                        className="
                          mt-1
                          text-xl
                          font-bold
                          text-[#18392c]
                        "
                      >
                        ₹
                        {formatMoney(
                          maturityAmountForDisplay
                        )}
                      </p>

                    </div>


                    <div
                      className="
                        rounded-xl
                        border
                        border-[#dfe8dc]
                        bg-[#f8faf7]
                        p-4
                      "
                    >

                      <p
                        className="
                          text-[10px]
                          font-semibold
                          uppercase
                          tracking-wide
                          text-[#6c8b72]
                        "
                      >
                        Current Investment
                      </p>

                      <p
                        className="
                          mt-1
                          text-sm
                          font-bold
                          text-[#18392c]
                        "
                      >
                        {maturityInvestment.name}
                      </p>

                      <p
                        className="
                          mt-1
                          text-[11px]
                          text-slate-400
                        "
                      >
                        {maturityInvestment.type}
                      </p>

                    </div>

                  </div>


                  {/* ==================================================
                      SAME TERMS CONFIRMATION
                  ================================================== */}

                  {!renewalChangeMode && (

                    <div
                      className="
                        mt-5
                        rounded-2xl
                        border
                        border-[#dcebd4]
                        bg-[#f4faef]
                        p-5
                      "
                    >

                      <div
                        className="
                          text-center
                        "
                      >

                        <p
                          className="
                            text-base
                            font-bold
                            text-[#18392c]
                          "
                        >
                          Renew with the existing terms?
                        </p>

                        <p
                          className="
                            mx-auto
                            mt-2
                            max-w-xl
                            text-xs
                            leading-5
                            text-[#61766a]
                          "
                        >
                          Your existing investment details will
                          be carried forward automatically.
                          You do not need to enter the bank,
                          interest rate, or interest method again.
                        </p>

                      </div>


                      {/* FULL RENEWAL AMOUNT */}

                      <div
                        className="
                          mx-auto
                          mt-4
                          max-w-md
                          rounded-xl
                          border
                          border-[#dfe8dc]
                          bg-white
                          p-4
                          text-center
                        "
                      >

                        <p
                          className="
                            text-[10px]
                            font-semibold
                            uppercase
                            tracking-wide
                            text-[#6c8b72]
                          "
                        >
                          Amount to Renew
                        </p>

                        <p
                          className="
                            mt-1
                            text-2xl
                            font-bold
                            text-[#18392c]
                          "
                        >
                          ₹
                          {formatMoney(
                            renewalMode === "full"
                              ? maturityAmountForDisplay
                              : Number(
                                  renewalAmount || 0
                                )
                          )}
                        </p>

                      </div>


                      {/* ACTION BUTTONS */}

                      <div
                        className="
                          mt-5
                          flex
                          flex-col
                          gap-2
                          sm:flex-row
                          sm:justify-center
                        "
                      >

                        <button
                          type="button"
                          onClick={
                            handleConfirmRenewal
                          }
                          className="
                            rounded-xl
                            bg-[#18392c]
                            px-6
                            py-3
                            text-xs
                            font-semibold
                            text-white
                            shadow-sm
                            transition
                            hover:bg-[#244c3b]
                          "
                        >
                          Yes, Renew as It Is
                        </button>


                        <button
                          type="button"
                          onClick={() => {

                            setRenewalChangeMode(
                              true
                            );

                            if (
                              renewalMode ===
                              "full"
                            ) {

                              setRenewalAmount(
                                String(
                                  maturityAmountForDisplay
                                )
                              );

                            }

                          }}
                          className="
                            rounded-xl
                            border
                            border-[#cbdac8]
                            bg-white
                            px-6
                            py-3
                            text-xs
                            font-semibold
                            text-[#315c46]
                            transition
                            hover:bg-[#f2f6ee]
                          "
                        >
                          No, Change Renewal Details
                        </button>

                      </div>

                    </div>

                  )}


                  {/* ==================================================
                      CHANGE RENEWAL DETAILS
                  ================================================== */}

                  {renewalChangeMode && (

                    <div
                      className="
                        mt-5
                        rounded-2xl
                        border
                        border-[#dfe8dc]
                        bg-[#fafcf8]
                        p-5
                      "
                    >

                      <p
                        className="
                          text-sm
                          font-bold
                          text-[#18392c]
                        "
                      >
                        Change Renewal Details
                      </p>

                      <p
                        className="
                          mt-1
                          text-xs
                          text-slate-400
                        "
                      >
                        Change only the details you want to
                        modify. Existing investment terms will
                        remain unchanged.
                      </p>


                      {/* =================================================
                          PARTIAL AMOUNT
                      ================================================= */}

                      {renewalMode === "partial" && (

                        <div className="mt-5">

                          <label
                            className="
                              text-xs
                              font-semibold
                              text-[#52665b]
                            "
                          >
                            Amount to Renew
                          </label>

                          <div className="relative mt-1">

                            <span
                              className="
                                absolute
                                left-3
                                top-1/2
                                -translate-y-1/2
                                font-semibold
                                text-[#6c8b72]
                              "
                            >
                              ₹
                            </span>

                            <input
                              type="number"
                              min="1"
                              max={
                                maturityAmountForDisplay
                              }
                              value={renewalAmount}
                              onChange={(event) =>
                                setRenewalAmount(
                                  event.target.value
                                )
                              }
                              className="
                                w-full
                                rounded-xl
                                border
                                border-[#dfe8dc]
                                bg-white
                                py-3
                                pl-8
                                pr-3
                                text-sm
                                font-semibold
                                text-[#18392c]
                                outline-none
                                focus:border-[#7da889]
                                focus:ring-2
                                focus:ring-[#dcebd4]
                              "
                            />

                          </div>


                          <div
                            className="
                              mt-2
                              flex
                              items-center
                              justify-between
                            "
                          >

                            <span
                              className="
                                text-[11px]
                                text-slate-400
                              "
                            >
                              Maturity Amount
                            </span>

                            <span
                              className="
                                text-xs
                                font-semibold
                                text-[#315c46]
                              "
                            >
                              ₹
                              {formatMoney(
                                maturityAmountForDisplay
                              )}
                            </span>

                          </div>


                          <div
                            className="
                              mt-3
                              rounded-xl
                              bg-[#edf6e8]
                              px-4
                              py-3
                            "
                          >

                            <div
                              className="
                                flex
                                items-center
                                justify-between
                              "
                            >

                              <span
                                className="
                                  text-xs
                                  text-[#6c8b72]
                                "
                              >
                                Remaining Amount
                              </span>

                              <span
                                className="
                                  text-sm
                                  font-bold
                                  text-[#315c46]
                                "
                              >
                                ₹
                                {formatMoney(
                                  Math.max(
                                    0,
                                    maturityAmountForDisplay -
                                    Number(
                                      renewalAmount || 0
                                    )
                                  )
                                )}
                              </span>

                            </div>

                          </div>

                        </div>

                      )}


                      {/* =================================================
                          PAYMENT OPTION
                      ================================================= */}

                      <div className="mt-5">

                        <label
                          className="
                            text-xs
                            font-semibold
                            text-[#52665b]
                          "
                        >
                          Payment / Contribution Option
                        </label>

                        <select
                          value={
                            renewalPaymentOption
                          }
                          onChange={(event) =>
                            setRenewalPaymentOption(
                              event.target.value
                            )
                          }
                          className="
                            mt-1
                            w-full
                            rounded-xl
                            border
                            border-[#dfe8dc]
                            bg-white
                            px-3
                            py-3
                            text-sm
                            text-[#18392c]
                            outline-none
                            focus:border-[#7da889]
                            focus:ring-2
                            focus:ring-[#dcebd4]
                          "
                        >

                          <option value="same">
                            Keep Same as Existing
                          </option>

                          <option value="one-time">
                            One Time
                          </option>

                          <option value="recurring">
                            Recurring
                          </option>

                        </select>

                      </div>


                      {/* =================================================
                          FREQUENCY
                      ================================================= */}

                      {renewalPaymentOption ===
                        "recurring" && (

                        <div className="mt-4">

                          <label
                            className="
                              text-xs
                              font-semibold
                              text-[#52665b]
                            "
                          >
                            Contribution Frequency
                          </label>

                          <select
                            value={
                              renewalFrequency
                            }
                            onChange={(event) =>
                              setRenewalFrequency(
                                event.target.value
                              )
                            }
                            className="
                              mt-1
                              w-full
                              rounded-xl
                              border
                              border-[#dfe8dc]
                              bg-white
                              px-3
                              py-3
                              text-sm
                              text-[#18392c]
                              outline-none
                              focus:border-[#7da889]
                              focus:ring-2
                              focus:ring-[#dcebd4]
                            "
                          >

                            <option value="Monthly">
                              Monthly
                            </option>

                            <option value="Quarterly">
                              Quarterly
                            </option>

                            <option value="Yearly">
                              Yearly
                            </option>

                          </select>

                        </div>

                      )}


                      {/* =================================================
                          NEW MATURITY DATE
                      ================================================= */}

                      <div className="mt-4">

                        <label
                          className="
                            text-xs
                            font-semibold
                            text-[#52665b]
                          "
                        >
                          New Maturity Date
                        </label>

                        <input
                          type="date"
                          value={
                            renewalMaturityDate
                          }
                          onChange={(event) =>
                            setRenewalMaturityDate(
                              event.target.value
                            )
                          }
                          className="
                            mt-1
                            w-full
                            rounded-xl
                            border
                            border-[#dfe8dc]
                            bg-white
                            px-3
                            py-3
                            text-sm
                            text-[#18392c]
                            outline-none
                            focus:border-[#7da889]
                            focus:ring-2
                            focus:ring-[#dcebd4]
                          "
                        />

                      </div>


                      {/* ERROR */}

                      {renewalError && (

                        <div
                          className="
                            mt-4
                            rounded-xl
                            border
                            border-red-200
                            bg-red-50
                            px-4
                            py-3
                          "
                        >

                          <p
                            className="
                              text-xs
                              text-red-600
                            "
                          >
                            {renewalError}
                          </p>

                        </div>

                      )}


                      {/* BUTTONS */}

                      <div
                        className="
                          mt-5
                          flex
                          flex-col-reverse
                          gap-2
                          border-t
                          border-[#edf0e9]
                          pt-5
                          sm:flex-row
                          sm:justify-end
                        "
                      >

                        <button
                          type="button"
                          onClick={() => {

                            setRenewalChangeMode(
                              false
                            );

                            setRenewalError("");

                          }}
                          className="
                            rounded-xl
                            border
                            border-[#d7e1d5]
                            bg-white
                            px-5
                            py-2.5
                            text-xs
                            font-semibold
                            text-[#52665b]
                            hover:bg-[#f4f7f1]
                          "
                        >
                          Back
                        </button>


                        <button
                          type="button"
                          onClick={
                            handleConfirmRenewal
                          }
                          className="
                            rounded-xl
                            bg-[#18392c]
                            px-5
                            py-2.5
                            text-xs
                            font-semibold
                            text-white
                            shadow-sm
                            hover:bg-[#244c3b]
                          "
                        >
                          Confirm Renewal
                        </button>

                      </div>

                    </div>

                  )}

                </div>

              )}


              {/* ==================================================
                  AI SUGGESTION
              ================================================== */}

              <div
                className="
                  mt-5
                  rounded-2xl
                  border
                  border-[#c9dcca]
                  bg-gradient-to-r
                  from-[#edf6e8]
                  to-[#f4f8f1]
                  p-5
                "
              >

                <div
                  className="
                    flex
                    flex-col
                    gap-4
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >

                  <div
                    className="
                      flex
                      items-start
                      gap-3
                    "
                  >

                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-[#315c46]
                        text-white
                      "
                    >
                      <FiZap
                        size={18}
                      />
                    </div>

                    <div>

                      <p
                        className="
                          text-sm
                          font-bold
                          text-[#18392c]
                        "
                      >
                        Want an AI suggestion?
                      </p>

                      <p
                        className="
                          mt-1
                          max-w-2xl
                          text-[11px]
                          leading-5
                          text-[#61766a]
                        "
                      >
                        Gemini can analyze your FinanceOS
                        financial data and suggest possible
                        ways to use this maturity amount.
                      </p>

                    </div>

                  </div>


                  <button
                    type="button"
                    className="
                      shrink-0
                      rounded-xl
                      bg-[#315c46]
                      px-5
                      py-2.5
                      text-xs
                      font-semibold
                      text-white
                      shadow-sm
                      transition
                      hover:bg-[#18392c]
                    "
                  >
                    Get AI Suggestions
                  </button>

                </div>

              </div>

            </div>


            {/* ====================================================
                FOOTER
            ==================================================== */}

            <div
              className="
                flex
                shrink-0
                justify-end
                border-t
                border-[#dfe8dc]
                bg-white
                px-5
                py-4
                sm:px-7
              "
            >

              <button
                type="button"
                onClick={
                  closeMaturityActionModal
                }
                className="
                  rounded-xl
                  border
                  border-[#d7e1d5]
                  bg-[#ffffff]
                  px-5
                  py-2.5
                  text-xs
                  font-semibold
                  text-[#52665b]
                  transition
                  hover:bg-[#f4f7f1]
                "
              >
                Cancel
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


// ============================================================
// OVERVIEW CARD
// ============================================================

function OverviewCard({
  icon,
  title,
  amount,
  count,
  description,
  formatMoney,
}) {

  return (

    <div className="rounded-2xl border border-[#e2e8dc] bg-white p-5">

      <div className="flex items-start justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf6e8] text-[#315c46]">
          {icon}
        </div>

        <span className="rounded-full bg-[#f4f7f1] px-2.5 py-1 text-[10px] font-semibold text-[#5f7568]">
          {count} Active
        </span>

      </div>


      <p className="mt-5 text-xs text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold text-[#18392c]">
        ₹{formatMoney(
          amount
        )}
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        {description}
      </p>

    </div>

  );

}


// ============================================================
// SECTION TITLE
// ============================================================

function SectionTitle({
  icon,
  title,
  count,
}) {

  return (

    <div className="flex items-center gap-2 text-[#315c46]">

      {icon}

      <h3 className="text-sm font-semibold text-[#18392c]">
        {title}
      </h3>

      <span className="text-[10px] text-slate-400">
        ({count})
      </span>

    </div>

  );

}


// ============================================================
// INVESTMENT CARD
// ============================================================

function InvestmentCard({
  investment,
  formatMoney,
  updateStatus,
  deleteItem,
  recordFDInterest,
  recordSIPContribution,
  openMaturityActionModal,
}) {

  const status =
    String(
      investment.status ||
      ""
    )
      .trim()
      .toLowerCase();


  const isActive =
    status === "active";

  const isPaused =
    status === "paused";

  const isFinished =
    [
      "completed",
      "matured",
      "closed",
    ].includes(status);


  // ==========================================================
  // FIXED DEPOSIT CHECK
  // ==========================================================

  const investmentType =
    String(
      investment.type ||
      ""
    )
      .trim()
      .toLowerCase();


  const interestMethod =
    String(
      investment.interestMethod ||
      ""
    )
      .trim()
      .toLowerCase();


  const isFixedDeposit =
    investmentType ===
    "fixed deposit";


  const isPayoutFD =
    interestMethod ===
    "payout";


  const canRecordFDInterest =
    isFixedDeposit &&
    isPayoutFD &&
    isActive;


  const isSIP =
    investmentType === "sip";


  const canRecordSIPContribution =
    isSIP &&
    isActive;


  const principalAmount =
    Number(
      investment.principalAmount ||
      investment.amount ||
      0
    );


  const totalInterestReceived =
    Number(
      investment.totalInterestReceived ||
      0
    );

  let sipProgress = 0;
  if (isSIP) {
    let targetAmount = Number(investment.estimatedMaturityAmount || 0);

    if (targetAmount === 0 && investment.startDate && investment.maturityDate && investment.monthlyContribution) {
      const start = new Date(investment.startDate);
      const end = new Date(investment.maturityDate);
      const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
      if (months > 0) {
        targetAmount = months * Number(investment.monthlyContribution);
      }
    }
    
    if (targetAmount > 0) {
      sipProgress = Math.min((principalAmount / targetAmount) * 100, 100);
    }
  }


  return (

    <div className="rounded-xl border border-[#e2e8dc] bg-[#fafcf8] p-5">

      <CardHeader
        type={
          investment.type ||
          "Investment"
        }
        name={
          investment.name ||
          "Investment"
        }
        status={
          investment.status
        }
      />


      <div className="mt-4 grid grid-cols-2 gap-3">

        <InfoBox
          label={
            isFixedDeposit
              ? "Principal Amount"
              : "Amount"
          }
          value={`₹${formatMoney(
            principalAmount
          )}`}
        />


        <InfoBox
          label="Contribution Type"
          value={
            investment.contributionType ||
            "—"
          }
        />


        <InfoBox
          label="Monthly Equivalent"
          value={`₹${formatMoney(
            investment.monthlyContribution
          )}`}
        />


        <InfoBox
          label="Frequency"
          value={
            investment.frequency ||
            "—"
          }
        />

      </div>


      {/* ======================================================
          SIP PROGRESS
         ====================================================== */}

      {isSIP && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400">Contribution Progress</p>
            <p className="text-[10px] font-semibold text-[#52665b]">
              {sipProgress.toFixed(0)}%
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#dfe8da]">
            <div
              className="h-full rounded-full bg-[#315c46] transition-all"
              style={{ width: `${sipProgress}%` }}
            />
          </div>
        </div>
      )}


      {/* ======================================================
          FIXED DEPOSIT DETAILS
         ====================================================== */}

      {isFixedDeposit && (

        <div className="mt-4 rounded-xl border border-[#dcebd4] bg-[#f4faef] p-4">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c8b72]">
                Fixed Deposit
              </p>

              <p className="mt-1 text-xs font-semibold text-[#18392c]">

                {investment.interestMethod ||
                  "Interest method not set"}

              </p>

            </div>


            {Number(
              investment.interestRate ||
              0
            ) > 0 && (

              <div className="text-right">

                <p className="text-[10px] text-slate-400">
                  Interest Rate
                </p>

                <p className="mt-1 text-sm font-bold text-[#315c46]">

                  {investment.interestRate}% p.a.

                </p>

              </div>

            )}

          </div>


          {investment.institution && (

            <div className="mt-3 border-t border-[#dce5d7] pt-3">

              <p className="text-[10px] text-slate-400">
                Bank / Institution
              </p>

              <p className="mt-1 text-xs font-semibold text-[#52665b]">
                {investment.institution}
              </p>

            </div>

          )}


          {isPayoutFD && (

            <div className="mt-3 border-t border-[#dce5d7] pt-3">

              <p className="text-[10px] text-slate-400">
                Interest Payout
              </p>

              <p className="mt-1 text-xs font-semibold text-[#52665b]">

                {investment.interestPayoutFrequency ||
                  "Not specified"}

              </p>

            </div>

          )}


          {isPayoutFD &&
            totalInterestReceived > 0 && (

            <div className="mt-3">

              <p className="text-[10px] text-slate-400">
                Interest Received
              </p>

              <p className="mt-1 text-sm font-bold text-[#315c46]">

                ₹{formatMoney(
                  totalInterestReceived
                )}

              </p>

            </div>

          )}


          {!isPayoutFD && (

            <p className="mt-3 border-t border-[#dce5d7] pt-3 text-[10px] leading-4 text-[#6c8b72]">

              Cumulative interest remains in the FD
              and is included in the maturity value.

            </p>

          )}

        </div>

      )}


      {/* ======================================================
          DATES
         ====================================================== */}

      <div className="mt-4 border-t border-[#e7ece3] pt-3 text-[10px] text-slate-400">

        <p>
          Start:{" "}
          <span className="font-medium text-[#52665b]">
            {investment.startDate ||
              "Not set"}
          </span>
        </p>


        {investment.maturityDate && (

          <p className="mt-1">

            Maturity:{" "}

            <span className="font-medium text-[#52665b]">
              {investment.maturityDate}
            </span>

          </p>

        )}

      </div>


      {investment.reminder?.enabled && (

        <ReminderBadge text="Contribution Reminder On" />

      )}


      {/* ======================================================
          ACTIONS
         ====================================================== */}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-[#e7ece3] pt-4">


        {/* RECORD FD INTEREST */}

        {canRecordFDInterest && (

          <ActionButton
            icon={
              <FiDollarSign />
            }
            text="Record Interest"
            primary
            onClick={() =>
              recordFDInterest(
                investment
              )
            }
          />

        )}


        {/* RECORD SIP CONTRIBUTION */}

        {canRecordSIPContribution && (

          <ActionButton
            icon={
              <FiDollarSign />
            }
            text="Record Contribution"
            primary
            onClick={() =>
              recordSIPContribution(
                investment
              )
            }
          />

        )}


        {/* PAUSE */}

        {isActive && (

          <ActionButton
            icon={
              <FiPause />
            }
            text="Pause"
            onClick={() =>
              updateStatus(
                investment.id,
                "Paused"
              )
            }
          />

        )}


        {/* RESUME */}

        {isPaused && (

          <ActionButton
            icon={
              <FiPlay />
            }
            text="Resume"
            onClick={() =>
              updateStatus(
                investment.id,
                "Active"
              )
            }
          />

        )}


        {/* MARK MATURED */}

        {!isFinished && (

          <ActionButton
            icon={
              <FiCheckCircle />
            }
            text="Mark Matured"
            onClick={() =>
              updateStatus(
                investment.id,
                "Matured"
              )
            }
          />

        )}


        {/* MATURITY OPTIONS */}

        {status === "matured" && (

          <ActionButton
            icon={
              <FiRefreshCw />
            }
            text="Maturity Options"
            primary
            onClick={() =>
              openMaturityActionModal(
                investment
              )
            }
          />

        )}


        {/* DELETE */}

        <DeleteButton
          onClick={() =>
            deleteItem(
              investment
            )
          }
        />

      </div>

    </div>

  );

}


// ============================================================
// INSURANCE CARD
// ============================================================

function InsuranceCard({
  policy,
  formatMoney,
  updateStatus,
  deleteItem,
  onViewDetails,
}) {

  const isActive =
    policy.status === "Active";

  const isPaused =
    policy.status === "Paused";

  const isFinished =
    [
      "Completed",
      "Matured",
      "Closed",
    ].includes(
      policy.status
    );


  return (

    <div className="rounded-xl border border-[#e2e8dc] bg-[#fafcf8] p-5">

      <CardHeader
        type={
          policy.type ||
          "Insurance"
        }
        name={
          policy.name ||
          "Insurance Policy"
        }
        status={
          policy.status
        }
      />


      {policy.policyNumber && (

        <p className="mt-2 text-[10px] text-slate-400">

          Policy No:{" "}

          <span className="font-medium text-[#52665b]">
            {policy.policyNumber}
          </span>

        </p>

      )}


      <div className="mt-4 grid grid-cols-2 gap-3">

        <InfoBox
          label="Premium"
          value={`₹${formatMoney(
            policy.premiumAmount
          )}`}
        />

        <InfoBox
          label="Frequency"
          value={
            policy.premiumFrequency ||
            "—"
          }
        />


        <div className="col-span-2">

          <InfoBox
            label="Monthly Premium Equivalent"
            value={`₹${formatMoney(
              policy.monthlyPremium
            )}`}
          />

        </div>

      </div>


      <div className="mt-4 border-t border-[#e7ece3] pt-3 text-[10px] text-slate-400">

        <p>
          Start:{" "}
          <span className="font-medium text-[#52665b]">
            {policy.startDate ||
              "Not set"}
          </span>
        </p>


        {policy.nextPremiumDate && (

          <p className="mt-1">

            Next Premium:{" "}

            <span className="font-medium text-[#52665b]">
              {policy.nextPremiumDate}
            </span>

          </p>

        )}


        {policy.maturityDate && (

          <p className="mt-1">

            Maturity / Expiry:{" "}

            <span className="font-medium text-[#52665b]">
              {policy.maturityDate}
            </span>

          </p>

        )}

        {/* Dynamic Metadata Render */}
        {policy.metadata && Object.keys(policy.metadata).length > 0 && (
          <div className="mt-2 border-t border-[#edf0e9] pt-2">
            <span className="font-semibold text-[#18392c]">Details:</span>
            {Object.entries(policy.metadata).map(([key, value]) => {
              if (!value) return null;
              // format key camelCase to Title Case
              const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              return (
                <p key={key} className="mt-1">
                  {formattedKey}:{" "}
                  <span className="font-medium text-[#52665b]">
                    {key.toLowerCase().includes('amount') ? `₹${formatMoney(value)}` : value}
                  </span>
                </p>
              );
            })}
          </div>
        )}

      </div>


      {policy.paymentReminder?.enabled && (

        <ReminderBadge text="Premium Reminder On" />

      )}


      {policy.maturityReminder?.enabled && (

        <ReminderBadge text="Maturity Reminder On" />

      )}


      <div className="mt-5 flex flex-wrap gap-2 border-t border-[#e7ece3] pt-4">

        <ActionButton
          icon={
            <FiList />
          }
          text="View Details"
          onClick={onViewDetails}
        />

        {isActive && (

          <ActionButton
            icon={
              <FiPause />
            }
            text="Pause"
            onClick={() =>
              updateStatus(
                policy.id,
                "Paused"
              )
            }
          />

        )}


        {isPaused && (

          <ActionButton
            icon={
              <FiPlay />
            }
            text="Resume"
            onClick={() =>
              updateStatus(
                policy.id,
                "Active"
              )
            }
          />

        )}


        {!isFinished && (

          <ActionButton
            icon={
              <FiCheckCircle />
            }
            text="Mark Matured"
            onClick={() =>
              updateStatus(
                policy.id,
                "Matured"
              )
            }
          />

        )}


        <DeleteButton
          onClick={() =>
            deleteItem(
              policy
            )
          }
        />

      </div>

    </div>

  );

}


// ============================================================
// LIABILITY CARD
// ============================================================

function LiabilityCard({
  liability,
  formatMoney,
  updateStatus,
  deleteItem,
  recordPayment,
}) {

  const original =
    Number(
      liability.originalAmount ||
      0
    );

  const remaining =
    Number(
      liability.remainingAmount ||
      0
    );

  const paid =
    Math.max(
      original - remaining,
      0
    );


  const paidPercentage =
    original > 0
      ? Math.min(
          (
            paid /
            original
          ) * 100,
          100
        )
      : 0;


  const isActive =
    liability.status === "Active";

  const isPaused =
    liability.status === "Paused";

  const isCompleted =
    liability.status === "Completed";

  const isClosed =
    liability.status === "Closed";


  return (

    <div className="rounded-xl border border-[#e2e8dc] bg-[#fafcf8] p-5">

      <CardHeader
        type={
          liability.type ||
          "Liability"
        }
        name={
          liability.name ||
          "Liability"
        }
        status={
          liability.status
        }
      />


      <div className="mt-4 grid grid-cols-2 gap-3">

        <InfoBox
          label="Original Amount"
          value={`₹${formatMoney(
            original
          )}`}
        />

        <InfoBox
          label="Remaining"
          value={`₹${formatMoney(
            remaining
          )}`}
        />

        <InfoBox
          label={
            liability.type ===
            "Credit Card"
              ? "Monthly Payment"
              : "Monthly EMI"
          }
          value={`₹${formatMoney(
            liability.monthlyEMI
          )}`}
        />

        <InfoBox
          label="Paid"
          value={`${paidPercentage.toFixed(
            0
          )}%`}
        />

      </div>


      {/* PROGRESS */}

      <div className="mt-4">

        <div className="flex items-center justify-between">

          <p className="text-[10px] text-slate-400">
            Repayment Progress
          </p>

          <p className="text-[10px] font-semibold text-[#52665b]">

            ₹{formatMoney(
              paid
            )} paid

          </p>

        </div>


        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#dfe8da]">

          <div
            className="h-full rounded-full bg-[#315c46] transition-all"
            style={{
              width:
                `${paidPercentage}%`,
            }}
          />

        </div>

      </div>


      {/* DATES */}

      <div className="mt-4 border-t border-[#e7ece3] pt-3">

        <div className="flex items-center gap-2 text-[10px] text-slate-400">

          <FiCalendar />

          <span>

            Start:{" "}

            <span className="font-medium text-[#52665b]">
              {liability.startDate ||
                "Not set"}
            </span>

          </span>

        </div>


        {liability.nextDueDate && (

          <p className="mt-2 text-[10px] text-slate-400">

            Next Payment:{" "}

            <span className="font-medium text-[#52665b]">
              {liability.nextDueDate}
            </span>

          </p>

        )}


        {liability.endDate && (

          <p className="mt-1 text-[10px] text-slate-400">

            Expected End:{" "}

            <span className="font-medium text-[#52665b]">
              {liability.endDate}
            </span>

          </p>

        )}

      </div>


      {liability.reminder?.enabled && (

        <ReminderBadge text="Payment Reminder On" />

      )}


      {/* ACTIONS */}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-[#e7ece3] pt-4">

        {!isCompleted &&
          !isClosed &&
          remaining > 0 && (

          <ActionButton
            icon={
              <FiDollarSign />
            }
            text="Record Payment"
            primary
            onClick={() =>
              recordPayment(
                liability
              )
            }
          />

        )}


        {isActive && (

          <ActionButton
            icon={
              <FiPause />
            }
            text="Pause"
            onClick={() =>
              updateStatus(
                liability.id,
                "Paused"
              )
            }
          />

        )}


        {isPaused && (

          <ActionButton
            icon={
              <FiPlay />
            }
            text="Resume"
            onClick={() =>
              updateStatus(
                liability.id,
                "Active"
              )
            }
          />

        )}


        {!isCompleted &&
          !isClosed && (

          <ActionButton
            icon={
              <FiCheckCircle />
            }
            text="Close"
            onClick={() => {

              const confirmed =
                window.confirm(
                  `Close "${liability.name}"? Its remaining balance will stay in the record, but it will no longer count as an active monthly commitment.`
                );

              if (confirmed) {

                updateStatus(
                  liability.id,
                  "Closed"
                );

              }

            }}
          />

        )}


        <DeleteButton
          onClick={() =>
            deleteItem(
              liability
            )
          }
        />

      </div>

    </div>

  );

}


// ============================================================
// CARD HEADER
// ============================================================

function CardHeader({
  type,
  name,
  status,
}) {

  return (

    <div className="flex items-start justify-between gap-4">

      <div>

        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6c8b72]">
          {type}
        </p>

        <h4 className="mt-1 text-sm font-bold text-[#18392c]">
          {name}
        </h4>

      </div>


      <StatusBadge
        status={
          status
        }
      />

    </div>

  );

}


// ============================================================
// INFO BOX
// ============================================================

function InfoBox({
  label,
  value,
}) {

  return (

    <div className="rounded-lg bg-white p-3">

      <p className="text-[10px] text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-[#18392c]">
        {value}
      </p>

    </div>

  );

}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status = "Active",
}) {

  let classes =
    "bg-[#e5f3dc] text-[#315c46]";


  if (
    status === "Paused"
  ) {

    classes =
      "bg-amber-50 text-amber-600";

  }


  if (
    status === "Completed"
  ) {

    classes =
      "bg-blue-50 text-blue-600";

  }


  if (
    status === "Matured"
  ) {

    classes =
      "bg-purple-50 text-purple-600";

  }


  if (
    status === "Closed"
  ) {

    classes =
      "bg-slate-200 text-slate-500";

  }


  return (

    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${classes}`}
    >
      {status}
    </span>

  );

}


// ============================================================
// REMINDER BADGE
// ============================================================

function ReminderBadge({
  text,
}) {

  return (

    <div className="mt-3 inline-flex rounded-full bg-[#e8f4e2] px-2.5 py-1 text-[10px] font-semibold text-[#315c46]">
      {text}
    </div>

  );

}


// ============================================================
// ACTION BUTTON
// ============================================================

function ActionButton({
  icon,
  text,
  onClick,
  primary = false,
}) {

  return (

    <button
      type="button"
      onClick={
        onClick
      }
      className={
        primary
          ? "flex items-center gap-1.5 rounded-lg bg-[#18392c] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-[#244c3b]"
          : "flex items-center gap-1.5 rounded-lg border border-[#dfe6da] bg-white px-3 py-2 text-[11px] font-semibold text-[#52665b] transition hover:bg-[#f2f6ef]"
      }
    >

      {icon}
      {text}

    </button>

  );

}


// ============================================================
// DELETE BUTTON
// ============================================================

function DeleteButton({
  onClick,
}) {

  return (

    <button
      type="button"
      onClick={
        onClick
      }
      className="flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-2 text-[11px] font-semibold text-red-500 transition hover:bg-red-50"
    >

      <FiTrash2 />

      Delete

    </button>

  );

}


// ============================================================
// PAYMENT MODAL
// ============================================================

function PaymentModal({
  liability,
  paymentAmount,
  setPaymentAmount,
  error,
  formatMoney,
  onSubmit,
  onClose,
}) {

  const remaining =
    Number(
      liability.remainingAmount ||
      0
    );


  const enteredAmount =
    Number(
      paymentAmount ||
      0
    );


  const actualPayment =
    Math.min(
      Math.max(
        enteredAmount,
        0
      ),
      remaining
    );


  const newRemaining =
    Math.max(
      remaining -
      actualPayment,
      0
    );


  return (

    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">

      <div className="w-full max-w-md rounded-2xl border border-[#e2e8dc] bg-white shadow-xl">


        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-[#edf0e9] p-5">

          <div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6c8b72]">
              Liability Payment
            </p>

            <h2 className="mt-1 text-lg font-bold text-[#18392c]">
              Record Payment
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {liability.name}
            </p>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-[#f4f7f1]"
          >

            <FiX />

          </button>

        </div>


        {/* FORM */}

        <form
          onSubmit={
            onSubmit
          }
          className="p-5"
        >

          {/* CURRENT BALANCE */}

          <div className="rounded-xl bg-[#fafcf8] p-4">

            <p className="text-[10px] text-slate-400">
              Current Remaining Balance
            </p>

            <p className="mt-1 text-xl font-bold text-[#18392c]">

              ₹{formatMoney(
                remaining
              )}

            </p>

            <p className="mt-1 text-[10px] text-slate-400">

              Expected monthly payment: ₹
              {formatMoney(
                liability.monthlyEMI
              )}

            </p>

          </div>


          {/* PAYMENT */}

          <div className="mt-5">

            <label className="text-xs font-semibold text-[#52665b]">
              Payment Amount
            </label>


            <div className="relative mt-2">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                ₹
              </span>

              <input
                type="number"
                min="1"
                value={
                  paymentAmount
                }
                onChange={(event) =>
                  setPaymentAmount(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-[#dfe6da] bg-[#fafcf8] py-3 pl-9 pr-4 text-sm text-[#18392c] outline-none focus:border-[#9fbd8d]"
              />

            </div>


            <p className="mt-1 text-[10px] leading-4 text-slate-400">
              You can enter the actual amount paid.
              It does not have to equal the regular EMI.
            </p>

          </div>


          {/* PREVIEW */}

          {enteredAmount > 0 && (

            <div className="mt-5 rounded-xl border border-[#dcebd4] bg-[#f4faef] p-4">

              <div className="flex justify-between gap-4">

                <div>

                  <p className="text-[10px] text-[#6c8b72]">
                    Payment Applied
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#315c46]">

                    ₹{formatMoney(
                      actualPayment
                    )}

                  </p>

                </div>


                <div className="text-right">

                  <p className="text-[10px] text-[#6c8b72]">
                    New Balance
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#18392c]">

                    ₹{formatMoney(
                      newRemaining
                    )}

                  </p>

                </div>

              </div>


              {enteredAmount >
                remaining && (

                <p className="mt-3 text-[10px] leading-4 text-amber-600">

                  The entered amount is higher than
                  the remaining balance. FinanceOS will
                  apply only ₹{formatMoney(
                    remaining
                  )} to this liability.

                </p>

              )}


              {newRemaining === 0 && (

                <p className="mt-3 text-[10px] font-semibold text-[#315c46]">
                  This payment will complete the liability.
                </p>

              )}

            </div>

          )}


          {/* ERROR */}

          {error && (

            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">

              <p className="text-xs text-red-600">
                {error}
              </p>

            </div>

          )}


          {/* BUTTONS */}

          <div className="mt-6 flex justify-end gap-3 border-t border-[#edf0e9] pt-5">

            <button
              type="button"
              onClick={
                onClose
              }
              className="rounded-xl border border-[#dfe6da] px-4 py-2.5 text-xs font-semibold text-[#52665b]"
            >
              Cancel
            </button>


            <button
              type="submit"
              className="rounded-xl bg-[#18392c] px-4 py-2.5 text-xs font-semibold text-white"
            >
              Record Payment
            </button>

          </div>

        </form>

      </div>

    </div>

  );

}


// ============================================================
// EXPORT
// ============================================================

export default PlansCommitments;