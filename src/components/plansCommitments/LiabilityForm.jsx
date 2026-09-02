import { useMemo, useState } from "react";
import {
  FiCreditCard,
  FiX,
  FiCalendar,
  FiBell,
  FiClock,
  FiPercent,
  FiUser,
  FiInfo,
  FiMapPin,
  FiBookOpen,
  FiBriefcase
} from "react-icons/fi";
import useFinance from "../../context/useFinance.js";

// ============================================================
// COMMON INPUT STYLES
// ============================================================
const inputClass =
  "mt-2 w-full rounded-xl border border-[#dfe6da] bg-[#fafcf8] px-4 py-3 text-sm text-[#18392c] outline-none transition placeholder:text-slate-300 focus:border-[#9fbd8d] focus:bg-white";

// ============================================================
// HELPERS
// ============================================================
function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}

function formatDateInput(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString) {
  if (!dateString) return "-";
  const parts = dateString.split("-").map(Number);
  if (parts.length !== 3) return dateString;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function calculateNextDueDate(startDate, dueDay) {
  if (!startDate || !dueDay) return "";
  const parts = startDate.split("-").map(Number);
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  
  const selectedDay = Math.min(Math.max(Number(dueDay), 1), 28);
  const start = new Date(year, month - 1, day);
  
  let next = new Date(year, month - 1, selectedDay);
  if (next < start) {
    next.setMonth(next.getMonth() + 1);
  }
  return formatDateInput(next);
}

function addMonthsToDate(dateString, months) {
  if (!dateString || !months || months <= 0) return "";
  const parts = dateString.split("-").map(Number);
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  
  const date = new Date(year, month - 1, day);
  date.setMonth(date.getMonth() + months);
  return formatDateInput(date);
}

function calculateRepaymentSchedule(balance, payment, nextDueDate) {
  if (balance <= 0 || payment <= 0 || !nextDueDate) {
    return {
      remainingPayments: 0,
      expectedEndDate: "",
      finalPaymentAmount: 0,
    };
  }

  const remainingPayments = Math.ceil(balance / payment);
  const expectedEndDate = addMonthsToDate(nextDueDate, remainingPayments - 1);
  const amountBeforeLastPayment = payment * (remainingPayments - 1);
  const finalPaymentAmount = Math.max(balance - amountBeforeLastPayment, 0);

  return {
    remainingPayments,
    expectedEndDate,
    finalPaymentAmount,
  };
}

// ============================================================
// SUBCOMPONENTS
// ============================================================
function SectionHeading({ title, description }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-[#18392c]">{title}</h3>
      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
        {description}
      </p>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6c8b72]">
      {children}
    </span>
  );
}

function MoneyInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-[22px] -translate-y-1/2 text-sm text-[#18392c] font-semibold">
        ₹
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onWheel={(e) => e.currentTarget.blur()}
        placeholder={placeholder}
        className={`${inputClass} pl-8 font-semibold`}
      />
    </div>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        enabled ? "bg-[#315c46]" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function CheckOption({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-[#52665b] select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 accent-[#315c46]"
      />
      {label}
    </label>
  );
}

// ============================================================
// MAIN FORM
// ============================================================
export default function LiabilityForm({ editingLiability, onClose, onSuccess }) {
  const { addLiability, updateLiability } = useFinance();
  const todayStr = formatDateInput(new Date());

  // Common fields state
  const [liabilityType, setLiabilityType] = useState(editingLiability?.type || "Personal Loan");
  const [liabilityName, setLiabilityName] = useState(editingLiability?.name || "");
  const [lender, setLender] = useState(editingLiability?.lender || "");
  const [referenceNumber, setReferenceNumber] = useState(editingLiability?.referenceNumber || "");
  const [principalAmount, setPrincipalAmount] = useState(editingLiability?.principalAmount || "");
  const [remainingAmount, setRemainingAmount] = useState(
    editingLiability?.remainingAmount !== undefined ? editingLiability.remainingAmount : ""
  );
  const [monthlyEMI, setMonthlyEMI] = useState(editingLiability?.monthlyEMI || "");
  const [interestRate, setInterestRate] = useState(editingLiability?.interestRate || "");
  const [interestType, setInterestType] = useState(editingLiability?.interestType || "Fixed");
  const [startDate, setStartDate] = useState(
    editingLiability?.startDate ? formatDateInput(new Date(editingLiability.startDate)) : todayStr
  );
  const [tenure, setTenure] = useState(editingLiability?.tenure || "");
  const [expectedEndDateInput, setExpectedEndDateInput] = useState(
    editingLiability?.endDate ? formatDateInput(new Date(editingLiability.endDate)) : ""
  );
  const [dueDay, setDueDay] = useState(
    editingLiability?.nextDueDate ? new Date(editingLiability.nextDueDate).getDate().toString() : "5"
  );
  const [paymentFrequency, setPaymentFrequency] = useState(editingLiability?.paymentFrequency || "Monthly");
  const [notes, setNotes] = useState(editingLiability?.notes || "");
  const [status, setStatus] = useState(editingLiability?.status || "Active");

  // Payment Source State
  const [sourceMethod, setSourceMethod] = useState(editingLiability?.paymentSource?.method || "Cash");
  const [sourceBankName, setSourceBankName] = useState(editingLiability?.paymentSource?.bankName || "");
  const [sourceLast4, setSourceLast4] = useState(editingLiability?.paymentSource?.last4Digits || "");
  const [sourceUpiApp, setSourceUpiApp] = useState(editingLiability?.paymentSource?.upiApp || "");
  const [sourceUpiId, setSourceUpiId] = useState(editingLiability?.paymentSource?.upiId || "");
  const [sourceOther, setSourceOther] = useState(editingLiability?.paymentSource?.otherDetails || "");

  // Reminders states
  const [reminderEnabled, setReminderEnabled] = useState(editingLiability?.reminder?.enabled || false);
  const [fiveDaysBefore, setFiveDaysBefore] = useState(editingLiability?.reminder?.daysBefore === 5);
  const [oneDayBefore, setOneDayBefore] = useState(editingLiability?.reminder?.daysBefore === 1);
  const [onDueDate, setOnDueDate] = useState(editingLiability?.reminder?.daysBefore === 0);
  const [reminderInApp, setReminderInApp] = useState(editingLiability?.reminder?.channels?.inApp ?? true);
  const [reminderEmail, setReminderEmail] = useState(editingLiability?.reminder?.channels?.email ?? true);
  const [reminderSms, setReminderSms] = useState(editingLiability?.reminder?.channels?.sms ?? false);

  // Type-specific details state
  // Home Loan details
  const [propertyType, setPropertyType] = useState(editingLiability?.homeDetails?.propertyType || "House");
  const [propertyAddress, setPropertyAddress] = useState(editingLiability?.homeDetails?.propertyAddress || "");
  const [downPayment, setDownPayment] = useState(editingLiability?.homeDetails?.downPayment || "");

  // Vehicle Loan details
  const [vehicleType, setVehicleType] = useState(editingLiability?.vehicleDetails?.vehicleType || "Car");
  const [vehicleMake, setVehicleMake] = useState(editingLiability?.vehicleDetails?.make || "");
  const [vehicleModel, setVehicleModel] = useState(editingLiability?.vehicleDetails?.model || "");
  const [vehicleVariant, setVehicleVariant] = useState(editingLiability?.vehicleDetails?.variant || "");
  const [vehicleRegNo, setVehicleRegNo] = useState(editingLiability?.vehicleDetails?.registrationNumber || "");

  // Education Loan details
  const [courseName, setCourseName] = useState(editingLiability?.educationDetails?.courseName || "");
  const [educationalInstitution, setEducationalInstitution] = useState(editingLiability?.educationDetails?.educationalInstitution || "");
  const [moratoriumPeriod, setMoratoriumPeriod] = useState(editingLiability?.educationDetails?.moratoriumPeriod || "");
  const [repaymentStartDate, setRepaymentStartDate] = useState(
    editingLiability?.educationDetails?.repaymentStartDate 
      ? formatDateInput(new Date(editingLiability.educationDetails.repaymentStartDate)) 
      : ""
  );

  // Credit Card details
  const [creditLimit, setCreditLimit] = useState(editingLiability?.creditCardDetails?.creditLimit || "");
  const [ccMinimumDue, setCcMinimumDue] = useState(editingLiability?.creditCardDetails?.minimumDue || "");
  const [ccTotalDue, setCcTotalDue] = useState(editingLiability?.creditCardDetails?.totalDue || "");
  const [ccStatementDate, setCcStatementDate] = useState(
    editingLiability?.creditCardDetails?.statementDate 
      ? formatDateInput(new Date(editingLiability.creditCardDetails.statementDate)) 
      : ""
  );

  // Gold Loan details
  const [goldDescription, setGoldDescription] = useState(editingLiability?.goldDetails?.goldDescription || "");
  const [pledgedGoldWeight, setPledgedGoldWeight] = useState(editingLiability?.goldDetails?.pledgedGoldWeight || "");

  // Business Loan details
  const [businessName, setBusinessName] = useState(editingLiability?.businessDetails?.businessName || "");

  // Other details
  const [otherCategory, setOtherCategory] = useState(editingLiability?.otherDetails?.category || "");
  const [otherDescription, setOtherDescription] = useState(editingLiability?.otherDetails?.description || "");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed values
  const principal = Number(principalAmount || 0);
  const remaining = remainingAmount === "" ? principal : Number(remainingAmount || 0);
  const emi = Number(monthlyEMI || 0);

  const nextDueDate = useMemo(() => {
    return calculateNextDueDate(startDate, dueDay);
  }, [startDate, dueDay]);

  const schedule = useMemo(() => {
    return calculateRepaymentSchedule(remaining, emi, nextDueDate);
  }, [remaining, emi, nextDueDate]);

  const calculatedEndDate = schedule.expectedEndDate;
  const repaymentProgress = principal > 0 ? Math.min(Math.max(((principal - remaining) / principal) * 100, 0), 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!liabilityName.trim()) return setError("Enter a liability/loan name.");
    if (principal <= 0) return setError("Enter a valid original or limit amount.");
    if (remaining < 0 || remaining > principal) {
      return setError("Remaining amount must be between 0 and the original amount.");
    }

    if (liabilityType === "Credit Card") {
      if (referenceNumber && referenceNumber.length > 4) {
        return setError("Reference last 4 digits cannot be longer than 4 characters.");
      }
    }

    // Reminders validation
    if (reminderEnabled) {
      if (!fiveDaysBefore && !oneDayBefore && !onDueDate) {
        return setError("Select at least one reminder timing.");
      }
      if (!reminderInApp && !reminderEmail && !reminderSms) {
        return setError("Select at least one reminder channel.");
      }
    }

    setIsSubmitting(true);

    try {
      const paymentSource = {
        method: sourceMethod,
        bankName: (sourceMethod === "Bank Account" || sourceMethod === "UPI") ? sourceBankName : "",
        last4Digits: sourceMethod === "Bank Account" ? sourceLast4 : "",
        upiApp: sourceMethod === "UPI" ? sourceUpiApp : "",
        upiId: sourceMethod === "UPI" ? sourceUpiId : "",
        otherDetails: sourceMethod === "Other" ? sourceOther : ""
      };

      const daysBefore = fiveDaysBefore ? 5 : (oneDayBefore ? 1 : 0);

      const payload = {
        type: liabilityType,
        name: liabilityName.trim(),
        lender: lender.trim(),
        referenceNumber: referenceNumber.trim(),
        principalAmount: principal,
        remainingAmount: remaining,
        monthlyEMI: emi,
        interestRate: Number(interestRate) || 0,
        interestType,
        startDate: startDate ? new Date(startDate) : undefined,
        tenure: Number(tenure) || 0,
        endDate: expectedEndDateInput ? new Date(expectedEndDateInput) : (calculatedEndDate ? new Date(calculatedEndDate) : undefined),
        nextDueDate: nextDueDate ? new Date(nextDueDate) : undefined,
        paymentFrequency,
        // --------------------------------------------------------
        // RECURRING DUE DAY — stored on the liability document.
        // The backend uses this to automatically derive the full
        // due date for each month (e.g., dueDay=5 → 5 Mar 2026).
        // --------------------------------------------------------
        dueDay: Number(dueDay) || 5,
        paymentSource,
        status,
        notes,
        reminder: {
          enabled: reminderEnabled,
          daysBefore,
          channels: {
            inApp: reminderInApp,
            email: reminderEmail,
            sms: reminderSms
          }
        },

        // Nested subschemas
        homeDetails: liabilityType === "Home Loan" ? {
          propertyType,
          propertyAddress,
          downPayment: Number(downPayment) || 0
        } : undefined,

        vehicleDetails: liabilityType === "Vehicle Loan" ? {
          vehicleType,
          make: vehicleMake,
          model: vehicleModel,
          variant: vehicleVariant,
          registrationNumber: vehicleRegNo
        } : undefined,

        educationDetails: liabilityType === "Education Loan" ? {
          courseName,
          educationalInstitution,
          moratoriumPeriod: Number(moratoriumPeriod) || 0,
          repaymentStartDate: repaymentStartDate ? new Date(repaymentStartDate) : undefined
        } : undefined,

        creditCardDetails: liabilityType === "Credit Card" ? {
          creditLimit: principal, // credit limit is mapped to principal
          minimumDue: Number(ccMinimumDue) || 0,
          totalDue: Number(ccTotalDue) || 0,
          statementDate: ccStatementDate ? new Date(ccStatementDate) : undefined
        } : undefined,

        goldDetails: liabilityType === "Gold Loan" ? {
          goldDescription,
          pledgedGoldWeight: Number(pledgedGoldWeight) || 0
        } : undefined,

        businessDetails: liabilityType === "Business Loan" ? {
          businessName
        } : undefined,

        otherDetails: liabilityType === "Other Liability" ? {
          category: otherCategory,
          description: otherDescription
        } : undefined
      };

      if (editingLiability) {
        await updateLiability(editingLiability._id || editingLiability.id, payload);
      } else {
        await addLiability(payload);
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save liability.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-[#e2e8dc] bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#edf0e9] bg-white p-6">
          <div>
            <div className="flex items-center gap-2 text-[#315c46]">
              <FiCreditCard className="animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]">Liability / Loan</p>
            </div>
            <h2 className="mt-2 text-xl font-extrabold text-[#18392c]">
              {editingLiability ? "Edit Liability" : "Add Liability"}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {editingLiability ? "Modify details of your loan or financial commitment." : "Configure a new financial commitment or debt."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-[#f4f7f1] hover:text-[#18392c] transition"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-600 font-semibold flex items-center gap-2">
              <FiInfo className="shrink-0" />
              {error}
            </div>
          )}

          {/* Section 1: Type & Common Header */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Liability Type</FieldLabel>
              <select
                disabled={!!editingLiability}
                value={liabilityType}
                onChange={(e) => setLiabilityType(e.target.value)}
                className={`${inputClass} disabled:opacity-50`}
              >
                <option value="Personal Loan">Personal Loan</option>
                <option value="Home Loan">Home Loan</option>
                <option value="Vehicle Loan">Vehicle Loan</option>
                <option value="Education Loan">Education Loan</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Gold Loan">Gold Loan</option>
                <option value="Business Loan">Business Loan</option>
                <option value="Other Liability">Other Liability</option>
              </select>
            </div>

            <div>
              <FieldLabel>Liability Name</FieldLabel>
              <input
                type="text"
                required
                value={liabilityName}
                onChange={(e) => setLiabilityName(e.target.value)}
                placeholder="e.g. SBI Home Loan"
                className={inputClass}
              />
            </div>

            <div>
              <FieldLabel>Lender / Bank / Creditor</FieldLabel>
              <input
                type="text"
                value={lender}
                onChange={(e) => setLender(e.target.value)}
                placeholder="e.g. State Bank of India"
                className={inputClass}
              />
            </div>

            <div>
              <FieldLabel>
                {liabilityType === "Credit Card" ? "Card Last 4 Digits" : "Account / Reference Number"}
              </FieldLabel>
              <input
                type={liabilityType === "Credit Card" ? "text" : "text"}
                maxLength={liabilityType === "Credit Card" ? 4 : undefined}
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder={liabilityType === "Credit Card" ? "e.g. 4321" : "e.g. LN-984321"}
                className={inputClass}
              />
            </div>
          </div>

          <hr className="border-[#edf0e9]" />

          {/* Section 2: Type-specific Forms */}
          {/* PERSONAL LOAN */}
          {liabilityType === "Personal Loan" && (
            <div className="space-y-4">
              <SectionHeading title="Personal Loan Parameters" description="Define interests and administrative expenses." />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Interest Rate (%)</FieldLabel>
                  <input
                    type="number"
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="e.g. 10.5"
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Interest Type</FieldLabel>
                  <select value={interestType} onChange={(e) => setInterestType(e.target.value)} className={inputClass}>
                    <option value="Fixed">Fixed Interest</option>
                    <option value="Reducing">Reducing Balance</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* HOME LOAN */}
          {liabilityType === "Home Loan" && (
            <div className="space-y-4">
              <SectionHeading title="Property & Asset Details" description="Identify physical property collateral configurations." />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Property Type</FieldLabel>
                  <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={inputClass}>
                    <option value="House">House</option>
                    <option value="Apartment / Flat">Apartment / Flat</option>
                    <option value="Villa">Villa</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Down Payment Amount</FieldLabel>
                  <MoneyInput value={downPayment} onChange={setDownPayment} placeholder="e.g. 500000" />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Property Address</FieldLabel>
                  <input
                    type="text"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    placeholder="e.g. Flat 402, Green Meadows, Mumbai"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* VEHICLE LOAN */}
          {liabilityType === "Vehicle Loan" && (
            <div className="space-y-4">
              <SectionHeading title="Vehicle Specifications" description="Identify the pledged vehicle details." />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Vehicle Type</FieldLabel>
                  <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={inputClass}>
                    <option value="Car">Car</option>
                    <option value="Bike">Bike</option>
                    <option value="Commercial Vehicle">Commercial Vehicle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Registration Number</FieldLabel>
                  <input
                    type="text"
                    value={vehicleRegNo}
                    onChange={(e) => setVehicleRegNo(e.target.value)}
                    placeholder="e.g. MH-12-AB-1234"
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Make / Brand</FieldLabel>
                  <input
                    type="text"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    placeholder="e.g. Honda"
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Model & Variant</FieldLabel>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="e.g. City ZX (Optional Variant)"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* EDUCATION LOAN */}
          {liabilityType === "Education Loan" && (
            <div className="space-y-4">
              <SectionHeading title="Course & Moratorium Settings" description="Configure education terms and deferred repayment timelines." />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Course Name</FieldLabel>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g. MBA in Finance"
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Educational Institution</FieldLabel>
                  <input
                    type="text"
                    value={educationalInstitution}
                    onChange={(e) => setEducationalInstitution(e.target.value)}
                    placeholder="e.g. IIM Ahmedabad"
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Moratorium Period (Months)</FieldLabel>
                  <input
                    type="number"
                    value={moratoriumPeriod}
                    onChange={(e) => setMoratoriumPeriod(e.target.value)}
                    placeholder="Months with zero EMI (e.g. 12)"
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Repayment Start Date</FieldLabel>
                  <input
                    type="date"
                    value={repaymentStartDate}
                    onChange={(e) => setRepaymentStartDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* CREDIT CARD */}
          {liabilityType === "Credit Card" && (
            <div className="space-y-4">
              <SectionHeading title="Card Limits & Billing Cycle" description="Provide credit details. EMI & tenure do not apply." />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Statement Date (Monthly)</FieldLabel>
                  <input
                    type="date"
                    value={ccStatementDate}
                    onChange={(e) => setCcStatementDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Minimum Amount Due</FieldLabel>
                  <MoneyInput value={ccMinimumDue} onChange={setCcMinimumDue} placeholder="e.g. 500" />
                </div>
                <div>
                  <FieldLabel>Total Due Amount</FieldLabel>
                  <MoneyInput value={ccTotalDue} onChange={setCcTotalDue} placeholder="e.g. 15000" />
                </div>
              </div>
            </div>
          )}

          {/* GOLD LOAN */}
          {liabilityType === "Gold Loan" && (
            <div className="space-y-4">
              <SectionHeading title="Pledged Assets" description="Verify pledged gold weight and descriptions." />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Pledged Gold Weight (Grams)</FieldLabel>
                  <input
                    type="number"
                    step="0.01"
                    value={pledgedGoldWeight}
                    onChange={(e) => setPledgedGoldWeight(e.target.value)}
                    placeholder="e.g. 45.8"
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Gold Description / Carats</FieldLabel>
                  <input
                    type="text"
                    value={goldDescription}
                    onChange={(e) => setGoldDescription(e.target.value)}
                    placeholder="e.g. 4 bangles, 22-carat gold"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* BUSINESS LOAN */}
          {liabilityType === "Business Loan" && (
            <div className="space-y-4">
              <SectionHeading title="Enterprise Context" description="Verify business entities tied to this loan." />
              <div>
                <FieldLabel>Registered Business Name</FieldLabel>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Sunshine Traders Pvt Ltd"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* OTHER LIABILITY */}
          {liabilityType === "Other Liability" && (
            <div className="space-y-4">
              <SectionHeading title="Custom Obligation Details" description="Identify categories and custom obligations." />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Liability Category</FieldLabel>
                  <input
                    type="text"
                    value={otherCategory}
                    onChange={(e) => setOtherCategory(e.target.value)}
                    placeholder="e.g. Friend/Family Debt"
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Custom Description</FieldLabel>
                  <input
                    type="text"
                    value={otherDescription}
                    onChange={(e) => setOtherDescription(e.target.value)}
                    placeholder="Brief description of the arrangement"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          <hr className="border-[#edf0e9]" />

          {/* Section 3: Balances & Repayment Amounts */}
          <div className="space-y-4">
            <SectionHeading
              title={liabilityType === "Credit Card" ? "Credit Limit & Balances" : "Balances & Payment Amounts"}
              description="Enter original principal (or limit), outstanding amount, and regular payments."
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <FieldLabel>{liabilityType === "Credit Card" ? "Total Credit Limit" : "Original Loan Principal"}</FieldLabel>
                <MoneyInput value={principalAmount} onChange={setPrincipalAmount} placeholder="e.g. 50000" />
              </div>
              <div>
                <FieldLabel>Current Outstanding</FieldLabel>
                <MoneyInput value={remainingAmount} onChange={setRemainingAmount} placeholder={principalAmount || "e.g. 40000"} />
              </div>
              <div>
                <FieldLabel>{liabilityType === "Credit Card" ? "Custom Repayment Amt" : "Monthly EMI Payment"}</FieldLabel>
                <MoneyInput value={monthlyEMI} onChange={setMonthlyEMI} placeholder="e.g. 2500" />
              </div>
            </div>

            {/* Repayment Progress Visualization */}
            {principal > 0 && remaining > 0 && liabilityType !== "Credit Card" && (
              <div className="rounded-xl border border-[#e2e8dc] bg-[#fafcf8] p-4 text-xs">
                <div className="flex justify-between font-semibold text-[#18392c]">
                  <span>Repaid: ₹{formatMoney(principal - remaining)}</span>
                  <span>Outstanding: ₹{formatMoney(remaining)}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[#e7eee2] overflow-hidden">
                  <div
                    className="h-full bg-[#315c46] transition-all"
                    style={{ width: `${repaymentProgress}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400 text-right">{repaymentProgress.toFixed(1)}% repaid</p>
              </div>
            )}
          </div>

          <hr className="border-[#edf0e9]" />

          {/* Section 4: Schedule Settings */}
          {liabilityType !== "Credit Card" && (
            <div className="space-y-4">
              <SectionHeading title="Schedule & Amortization Estimates" description="We estimate loan end dates based on start dates and payment rates." />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <FieldLabel>Loan Start Date</FieldLabel>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Tenure (Months)</FieldLabel>
                  <input
                    type="number"
                    value={tenure}
                    onChange={(e) => setTenure(e.target.value)}
                    placeholder="e.g. 24"
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Payment Due Day</FieldLabel>
                  <select value={dueDay} onChange={(e) => setDueDay(e.target.value)} className={inputClass}>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        Day {day}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Automatic End Date and Payments Left */}
              {remaining > 0 && emi > 0 && calculatedEndDate && (
                <div className="rounded-xl border border-[#cfe0c7] bg-[#f5faf2] p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-[#18392c] font-bold">
                    <FiClock className="text-[#315c46]" />
                    <span>Amortization Estimate</span>
                  </div>
                  <p className="text-slate-500">
                    Remaining monthly payments: <span className="font-bold text-[#18392c]">{schedule.remainingPayments}</span>
                  </p>
                  <p className="text-slate-500">
                    Expected loan completion date: <span className="font-bold text-[#18392c]">{formatDisplayDate(calculatedEndDate)}</span>
                  </p>
                  <p className="text-slate-500">
                    Final monthly payment component: <span className="font-bold text-[#18392c]">₹{formatMoney(schedule.finalPaymentAmount)}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Credit Card Specific Date settings */}
          {liabilityType === "Credit Card" && (
            <div className="space-y-4">
              <SectionHeading title="Billing & Statement Due Dates" description="Verify next due dates for credit card bill cycles." />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Start / Account Opening Date</FieldLabel>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Payment Due Day</FieldLabel>
                  <select value={dueDay} onChange={(e) => setDueDay(e.target.value)} className={inputClass}>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        Day {day}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <hr className="border-[#edf0e9]" />

          {/* Section 5: Payment Source Details */}
          <div className="space-y-4">
            <SectionHeading title="Payment Source" description="Configure bank accounts, cash, or UPI systems linked for EMI payouts." />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Method</FieldLabel>
                <select value={sourceMethod} onChange={(e) => setSourceMethod(e.target.value)} className={inputClass}>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Account">Bank Account</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {sourceMethod === "Bank Account" && (
                <>
                  <div>
                    <FieldLabel>Bank Name</FieldLabel>
                    <input
                      type="text"
                      value={sourceBankName}
                      onChange={(e) => setSourceBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <FieldLabel>Last 4 Account Digits only</FieldLabel>
                    <input
                      type="text"
                      maxLength={4}
                      value={sourceLast4}
                      onChange={(e) => setSourceLast4(e.target.value)}
                      placeholder="e.g. 9876"
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {sourceMethod === "UPI" && (
                <>
                  <div>
                    <FieldLabel>UPI App</FieldLabel>
                    <input
                      type="text"
                      value={sourceUpiApp}
                      onChange={(e) => setSourceUpiApp(e.target.value)}
                      placeholder="e.g. Google Pay / PhonePe"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <FieldLabel>UPI ID</FieldLabel>
                    <input
                      type="text"
                      value={sourceUpiId}
                      onChange={(e) => setSourceUpiId(e.target.value)}
                      placeholder="e.g. mobile@okaxis"
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {sourceMethod === "Other" && (
                <div className="sm:col-span-2">
                  <FieldLabel>Specify Other Payment Source</FieldLabel>
                  <input
                    type="text"
                    value={sourceOther}
                    onChange={(e) => setSourceOther(e.target.value)}
                    placeholder="Specify payment source arrangement"
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </div>

          <hr className="border-[#edf0e9]" />

          {/* Section 6: Payment Reminders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionHeading title="Payment Due Reminders" description="Notify yourself before the monthly payment due date." />
              <Toggle enabled={reminderEnabled} onChange={setReminderEnabled} />
            </div>

            {reminderEnabled && (
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#e2e8dc] bg-[#fafcf8] p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel>Notify Timing</FieldLabel>
                  <div className="space-y-2">
                    <CheckOption
                      label="5 days before payment due date"
                      checked={fiveDaysBefore}
                      onChange={(checked) => {
                        setFiveDaysBefore(checked);
                        if (checked) {
                          setOneDayBefore(false);
                          setOnDueDate(false);
                        }
                      }}
                    />
                    <CheckOption
                      label="1 day before payment due date"
                      checked={oneDayBefore}
                      onChange={(checked) => {
                        setOneDayBefore(checked);
                        if (checked) {
                          setFiveDaysBefore(false);
                          setOnDueDate(false);
                        }
                      }}
                    />
                    <CheckOption
                      label="On the payment due date"
                      checked={onDueDate}
                      onChange={(checked) => {
                        setOnDueDate(checked);
                        if (checked) {
                          setFiveDaysBefore(false);
                          setOneDayBefore(false);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <FieldLabel>Delivery Channels</FieldLabel>
                  <div className="space-y-2">
                    <CheckOption label="In-App Notifications" checked={reminderInApp} onChange={setReminderInApp} />
                    <CheckOption label="Email Alerts" checked={reminderEmail} onChange={setReminderEmail} />
                    <CheckOption label="SMS Text Notifications" checked={reminderSms} onChange={setReminderSms} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr className="border-[#edf0e9]" />

          {/* Section 7: Notes & Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Additional Notes</FieldLabel>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Details of prepayment options, collateral, etc."
                className={`${inputClass} h-24 resize-none`}
              />
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Overdue">Overdue</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-[#edf0e9] bg-white p-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#dfe6da] px-6 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="rounded-xl bg-[#315c46] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#18392c] transition disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Liability"}
          </button>
        </div>
      </div>
    </div>
  );
}