import { useMemo, useState, useEffect } from "react";
import { FiShield, FiX, FiCalendar, FiBell } from "react-icons/fi";
import useFinance from "../../context/useFinance.js";

const inputClass =
  "mt-2 w-full rounded-xl border border-[#dfe6da] bg-[#fafcf8] px-4 py-3 text-sm text-[#18392c] outline-none transition placeholder:text-slate-300 focus:border-[#9fbd8d]";

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}

function formatDateInput(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function FieldLabel({ children }) {
  return <label className="mb-2 block text-xs font-semibold text-[#52665b]">{children}</label>;
}

function MoneyInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
        ₹
      </span>
      <input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onWheel={(e) => e.currentTarget.blur()}
        placeholder={placeholder}
        className={`${inputClass} pl-9`}
      />
    </div>
  );
}

function InsuranceForm({ onClose, onSuccess, editingPolicy = null }) {
  const { addInsurancePolicy, updateInsurancePolicy, availableToAllocate } = useFinance();

  const today = formatDateInput(new Date());
  const isEdit = !!editingPolicy;

  // Form States
  const [policyType, setPolicyType] = useState(editingPolicy?.type || "Life Insurance");
  const [policyName, setPolicyName] = useState(editingPolicy?.name || "");
  const [policyNumber, setPolicyNumber] = useState(editingPolicy?.policyNumber || "");
  const [provider, setProvider] = useState(editingPolicy?.provider || "");
  const [premiumAmount, setPremiumAmount] = useState(editingPolicy?.premiumAmount || "");
  const [premiumFrequency, setPremiumFrequency] = useState(editingPolicy?.premiumFrequency || "Yearly");
  const [startDate, setStartDate] = useState(editingPolicy?.startDate ? formatDateInput(editingPolicy.startDate) : today);
  const [endDate, setEndDate] = useState(editingPolicy?.endDate ? formatDateInput(editingPolicy.endDate) : "");
  const [status, setStatus] = useState(editingPolicy?.status || "Active");
  const [notes, setNotes] = useState(editingPolicy?.notes || "");

  // Payment Source State
  const [paymentMethod, setPaymentMethod] = useState(editingPolicy?.paymentSource?.method || "Cash");
  const [bankName, setBankName] = useState(editingPolicy?.paymentSource?.bankName || "");
  const [last4Digits, setLast4Digits] = useState(editingPolicy?.paymentSource?.last4Digits || "");
  const [upiApp, setUpiApp] = useState(editingPolicy?.paymentSource?.upiApp || "");
  const [upiId, setUpiId] = useState(editingPolicy?.paymentSource?.upiId || "");
  const [otherPaymentDetails, setOtherPaymentDetails] = useState(editingPolicy?.paymentSource?.otherDetails || "");

  // LIC / Life Insurance States
  const [sumAssured, setSumAssured] = useState(editingPolicy?.maturityDetails?.sumAssured || "");
  const [expectedMaturityAmount, setExpectedMaturityAmount] = useState(editingPolicy?.maturityDetails?.expectedMaturityAmount || "");
  const [maturityDate, setMaturityDate] = useState(editingPolicy?.maturityDetails?.actualMaturityDate ? formatDateInput(editingPolicy.maturityDetails.actualMaturityDate) : (editingPolicy?.maturityDate ? formatDateInput(editingPolicy.maturityDate) : ""));
  const [nominee, setNominee] = useState(editingPolicy?.nominee || "");
  const [hasMaturity, setHasMaturity] = useState(editingPolicy?.maturityDetails?.hasMaturity ?? true);

  // Health Insurance States
  const [insuredMembers, setInsuredMembers] = useState(editingPolicy?.healthDetails?.insuredMembers?.join(", ") || "Self");
  const [coverageCategory, setCoverageCategory] = useState(editingPolicy?.healthDetails?.coverageCategory || ["Hospitalization"]);
  const [waitingPeriod, setWaitingPeriod] = useState(editingPolicy?.healthDetails?.waitingPeriod || "0");
  const [hospitalGov, setHospitalGov] = useState(editingPolicy?.healthDetails?.hospitalCoverage?.government ?? true);
  const [hospitalPri, setHospitalPri] = useState(editingPolicy?.healthDetails?.hospitalCoverage?.private ?? true);
  const [hospitalNet, setHospitalNet] = useState(editingPolicy?.healthDetails?.hospitalCoverage?.network ?? true);
  const [cashless, setCashless] = useState(editingPolicy?.healthDetails?.hospitalCoverage?.cashless ?? true);
  const [reimbursement, setReimbursement] = useState(editingPolicy?.healthDetails?.hospitalCoverage?.reimbursement ?? true);
  const [hospitalDetails, setHospitalDetails] = useState(editingPolicy?.healthDetails?.hospitalCoverage?.details || "");

  // Vehicle Insurance States
  const [vehicleType, setVehicleType] = useState(editingPolicy?.vehicleDetails?.vehicleType || "Car");
  const [registrationNumber, setRegistrationNumber] = useState(editingPolicy?.vehicleDetails?.registrationNumber || "");
  const [vehicleMake, setVehicleMake] = useState(editingPolicy?.vehicleDetails?.make || "");
  const [vehicleModel, setVehicleModel] = useState(editingPolicy?.vehicleDetails?.model || "");
  const [vehicleVariant, setVehicleVariant] = useState(editingPolicy?.vehicleDetails?.variant || "");
  const [vehiclePurchaseDate, setVehiclePurchaseDate] = useState(editingPolicy?.vehicleDetails?.purchaseDate ? formatDateInput(editingPolicy.vehicleDetails.purchaseDate) : "");
  const [idv, setIdv] = useState(editingPolicy?.vehicleDetails?.idv || "");
  const [vehicleCoverageType, setVehicleCoverageType] = useState(editingPolicy?.vehicleDetails?.coverageType || "Comprehensive");
  const [vehicleAddons, setVehicleAddons] = useState(editingPolicy?.vehicleDetails?.addons?.join(", ") || "");

  // Home Insurance States
  const [homePropertyType, setHomePropertyType] = useState(editingPolicy?.homeDetails?.propertyType || "Apartment");
  const [homePropertyAddress, setHomePropertyAddress] = useState(editingPolicy?.homeDetails?.propertyAddress || "");
  const [homePropertyValue, setHomePropertyValue] = useState(editingPolicy?.homeDetails?.insuredPropertyValue || "");
  const [homeCoveredItems, setHomeCoveredItems] = useState(editingPolicy?.homeDetails?.coveredItems?.join(", ") || "Building Structure, Household Contents");

  // Reminders States
  const [remindersEnabled, setRemindersEnabled] = useState(editingPolicy?.reminder?.enabled ?? false);
  const [prem5Days, setPrem5Days] = useState(editingPolicy?.reminder?.premiumReminders?.fiveDaysBefore ?? false);
  const [prem1Day, setPrem1Day] = useState(editingPolicy?.reminder?.premiumReminders?.oneDayBefore ?? true);
  const [premOnDue, setPremOnDue] = useState(editingPolicy?.reminder?.premiumReminders?.onDueDate ?? true);
  const [premInApp, setPremInApp] = useState(editingPolicy?.reminder?.premiumReminders?.channels?.inApp ?? true);
  const [premEmail, setPremEmail] = useState(editingPolicy?.reminder?.premiumReminders?.channels?.email ?? true);
  const [premSms, setPremSms] = useState(editingPolicy?.reminder?.premiumReminders?.channels?.sms ?? false);

  const [exp2Months, setExp2Months] = useState(editingPolicy?.reminder?.expiryReminders?.twoMonthsBefore ?? false);
  const [exp1Month, setExp1Month] = useState(editingPolicy?.reminder?.expiryReminders?.oneMonthBefore ?? true);
  const [exp7Days, setExp7Days] = useState(editingPolicy?.reminder?.expiryReminders?.sevenDaysBefore ?? true);
  const [expOnDate, setExpOnDate] = useState(editingPolicy?.reminder?.expiryReminders?.onExpiryDate ?? true);
  const [expInApp, setExpInApp] = useState(editingPolicy?.reminder?.expiryReminders?.channels?.inApp ?? true);
  const [expEmail, setExpEmail] = useState(editingPolicy?.reminder?.expiryReminders?.channels?.email ?? true);
  const [expSms, setExpSms] = useState(editingPolicy?.reminder?.expiryReminders?.channels?.sms ?? false);

  const [matEnabled, setMatEnabled] = useState(editingPolicy?.reminder?.maturityReminders?.enabled ?? false);
  const [mat2Months, setMat2Months] = useState(editingPolicy?.reminder?.maturityReminders?.twoMonthsBefore ?? false);
  const [mat1Month, setMat1Month] = useState(editingPolicy?.reminder?.maturityReminders?.oneMonthBefore ?? true);
  const [matOnDate, setMatOnDate] = useState(editingPolicy?.reminder?.maturityReminders?.onMaturityDate ?? true);
  const [matInApp, setMatInApp] = useState(editingPolicy?.reminder?.maturityReminders?.channels?.inApp ?? true);
  const [matEmail, setMatEmail] = useState(editingPolicy?.reminder?.maturityReminders?.channels?.email ?? true);
  const [matSms, setMatSms] = useState(editingPolicy?.reminder?.maturityReminders?.channels?.sms ?? false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCoverageCategoryToggle = (category) => {
    if (coverageCategory.includes(category)) {
      setCoverageCategory(coverageCategory.filter((c) => c !== category));
    } else {
      setCoverageCategory([...coverageCategory, category]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!policyName.trim()) return setError("Enter the policy/plan name.");
    if (!premiumAmount || Number(premiumAmount) <= 0) return setError("Enter a valid premium amount.");
    if (!startDate) return setError("Select the policy start date.");
    if (endDate && endDate < startDate) return setError("Expiry / End Date cannot be before the start date.");
    if (maturityDate && maturityDate < startDate) return setError("Maturity Date cannot be before the start date.");

    // Payment Source validation
    if (paymentMethod === "UPI") {
      if (!upiApp.trim()) return setError("Please specify the UPI App.");
      if (!upiId.trim()) return setError("Please enter the UPI ID.");
    } else if (paymentMethod === "Bank Account") {
      if (!bankName.trim()) return setError("Please enter the Bank Name.");
      if (!last4Digits.trim() || last4Digits.length !== 4) return setError("Please enter exactly the last 4 digits of the account number.");
    }

    setIsSubmitting(true);

    try {
      const paymentSource = {
        method: paymentMethod,
        bankName: paymentMethod === "Bank Account" || paymentMethod === "UPI" ? bankName : "",
        last4Digits: paymentMethod === "Bank Account" ? last4Digits : "",
        upiApp: paymentMethod === "UPI" ? upiApp : "",
        upiId: paymentMethod === "UPI" ? upiId : "",
        otherDetails: paymentMethod === "Other" ? otherPaymentDetails : "",
      };

      const reminderSettings = {
        enabled: remindersEnabled,
        premiumReminders: {
          fiveDaysBefore: prem5Days,
          oneDayBefore: prem1Day,
          onDueDate: premOnDue,
          channels: { inApp: premInApp, email: premEmail, sms: premSms }
        },
        expiryReminders: {
          twoMonthsBefore: exp2Months,
          oneMonthBefore: exp1Month,
          sevenDaysBefore: exp7Days,
          onExpiryDate: expOnDate,
          channels: { inApp: expInApp, email: expEmail, sms: expSms }
        },
        maturityReminders: {
          enabled: matEnabled,
          twoMonthsBefore: mat2Months,
          oneMonthBefore: mat1Month,
          onMaturityDate: matOnDate,
          channels: { inApp: matInApp, email: matEmail, sms: matSms }
        }
      };

      let typeSpecificDetails = {};

      if (policyType === "Life Insurance") {
        typeSpecificDetails = {
          nominee,
          maturityDetails: {
            hasMaturity,
            sumAssured: Number(sumAssured) || 0,
            expectedMaturityAmount: Number(expectedMaturityAmount) || 0,
            note: notes,
          }
        };
      } else if (policyType === "Health Insurance") {
        typeSpecificDetails = {
          healthDetails: {
            insuredMembers: insuredMembers.split(",").map((m) => m.trim()).filter(Boolean),
            coverageCategory,
            hospitalCoverage: {
              government: hospitalGov,
              private: hospitalPri,
              network: hospitalNet,
              cashless,
              reimbursement,
              details: hospitalDetails
            },
            waitingPeriod: Number(waitingPeriod) || 0
          }
        };
      } else if (policyType === "Vehicle Insurance") {
        typeSpecificDetails = {
          vehicleDetails: {
            vehicleType,
            registrationNumber,
            make: vehicleMake,
            model: vehicleModel,
            variant: vehicleVariant,
            purchaseDate: vehiclePurchaseDate || null,
            idv: Number(idv) || 0,
            coverageType: vehicleCoverageType,
            addons: vehicleAddons.split(",").map((a) => a.trim()).filter(Boolean)
          }
        };
      } else if (policyType === "Home Insurance") {
        typeSpecificDetails = {
          homeDetails: {
            propertyType: homePropertyType,
            propertyAddress: homePropertyAddress,
            insuredPropertyValue: Number(homePropertyValue) || 0,
            coveredItems: homeCoveredItems.split(",").map((i) => i.trim()).filter(Boolean),
            electronicsItems: editingPolicy?.homeDetails?.electronicsItems || [] // Preserved
          }
        };
      }

      const policyPayload = {
        type: policyType,
        name: policyName,
        policyNumber,
        provider,
        premiumAmount: Number(premiumAmount),
        premiumFrequency,
        coverageAmount: Number(sumAssured) || Number(idv) || Number(homePropertyValue) || 0,
        startDate,
        endDate: endDate || null,
        maturityDate: policyType === "Life Insurance" && maturityDate ? maturityDate : null,
        status,
        notes,
        paymentSource,
        reminder: reminderSettings,
        ...typeSpecificDetails,
      };

      if (isEdit) {
        await updateInsurancePolicy(editingPolicy._id, policyPayload);
      } else {
        await addInsurancePolicy(policyPayload);
      }

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || "Failed to save insurance policy.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#edf0e9] bg-[#fafcf8] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f0e4] text-[#315c46]">
              <FiShield size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#18392c]">{isEdit ? "Edit Insurance Policy" : "Add Insurance Policy"}</h2>
              <p className="text-xs text-[#52665b]">Configure details for dynamic persistence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="insuranceForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* TYPE SELECTION (Disabled in Edit Mode to protect history integrity) */}
            <div>
              <FieldLabel>Insurance Type</FieldLabel>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {["Life Insurance", "Health Insurance", "Vehicle Insurance", "Home Insurance", "Other Insurance"].map((type) => (
                  <label
                    key={type}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border p-2 text-center transition ${
                      policyType === type
                        ? "border-[#315c46] bg-[#f4f7f1] text-[#315c46]"
                        : "border-[#dfe6da] bg-white text-slate-500 hover:bg-slate-50"
                    } ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="radio"
                      name="policyType"
                      value={type}
                      disabled={isEdit}
                      checked={policyType === type}
                      onChange={(e) => setPolicyType(e.target.value)}
                      className="hidden"
                    />
                    <span className="text-[10px] font-bold">
                      {type === "Life Insurance" ? "LIC / Life" : type.replace(" Insurance", "")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* COMMON INFORMATION */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#315c46]">Common Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Policy / Plan Name *</FieldLabel>
                  <input
                    type="text"
                    value={policyName}
                    onChange={(e) => setPolicyName(e.target.value)}
                    placeholder="e.g. LIC Jeevan Anand, Apollo Optima"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <FieldLabel>Insurance Provider</FieldLabel>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="e.g. Life Insurance Corporation, Star Health"
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Policy Number</FieldLabel>
                  <input
                    type="text"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    placeholder="e.g. 123456789"
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel>Policy Status</FieldLabel>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Matured">Matured</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Lapsed">Lapsed</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Premium Amount *</FieldLabel>
                  <MoneyInput value={premiumAmount} onChange={setPremiumAmount} placeholder="Amount" />
                </div>
                <div>
                  <FieldLabel>Premium Frequency</FieldLabel>
                  <select
                    value={premiumFrequency}
                    onChange={(e) => setPremiumFrequency(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="One Time">One Time</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Start Date *</FieldLabel>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <FieldLabel>End / Expiry Date</FieldLabel>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* PAYMENT SOURCE SECTION */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#315c46]">Premium Payment Source</h3>
              <div>
                <FieldLabel>Payment Method</FieldLabel>
                <div className="flex gap-4">
                  {["Cash", "UPI", "Bank Account", "Other"].map((m) => (
                    <label key={m} className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={m}
                        checked={paymentMethod === m}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-[#315c46]"
                      />
                      {m}
                    </label>
                  ))}
                </div>
              </div>

              {paymentMethod === "UPI" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <FieldLabel>UPI App Name *</FieldLabel>
                    <input
                      type="text"
                      value={upiApp}
                      onChange={(e) => setUpiApp(e.target.value)}
                      placeholder="e.g. PhonePe, GPay"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <FieldLabel>UPI ID *</FieldLabel>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. name@upi"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <FieldLabel>Associated Bank Name</FieldLabel>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "Bank Account" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Bank Name *</FieldLabel>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <FieldLabel>Last 4 Account Digits *</FieldLabel>
                    <input
                      type="text"
                      maxLength={4}
                      value={last4Digits}
                      onChange={(e) => setLast4Digits(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 9876"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "Other" && (
                <div>
                  <FieldLabel>Specify Payment Details</FieldLabel>
                  <input
                    type="text"
                    value={otherPaymentDetails}
                    onChange={(e) => setOtherPaymentDetails(e.target.value)}
                    placeholder="e.g. Debit Card / Office Allowance"
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            {/* DYNAMIC FIELDS: LIFE INSURANCE / LIC */}
            {policyType === "Life Insurance" && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-blue-900">Life Insurance / LIC Specific Fields</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Sum Assured / Coverage Amount</FieldLabel>
                    <MoneyInput value={sumAssured} onChange={setSumAssured} placeholder="Principal Coverage" />
                  </div>
                  <div>
                    <FieldLabel>Nominee Name</FieldLabel>
                    <input
                      type="text"
                      value={nominee}
                      onChange={(e) => setNominee(e.target.value)}
                      placeholder="Nominee Beneficiary"
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#52665b] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasMaturity}
                        onChange={(e) => setHasMaturity(e.target.checked)}
                        className="accent-blue-600"
                      />
                      Policy has Maturity / Survival Benefit
                    </label>
                  </div>
                  {hasMaturity && (
                    <>
                      <div>
                        <FieldLabel>Expected Maturity Date</FieldLabel>
                        <input
                          type="date"
                          value={maturityDate}
                          onChange={(e) => setMaturityDate(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <FieldLabel>Expected Maturity Amount</FieldLabel>
                        <MoneyInput value={expectedMaturityAmount} onChange={setExpectedMaturityAmount} placeholder="Returns" />
                      </div>
                    </>
                  )}
                </div>

                {startDate && maturityDate && expectedMaturityAmount && hasMaturity && (
                  <p className="text-xs text-blue-700 bg-blue-100/50 p-3 rounded-lg border border-blue-200">
                    <strong>Summary:</strong> LIC Plan starts on {startDate}, matures on {maturityDate} for an expected ₹{formatMoney(expectedMaturityAmount)}.
                  </p>
                )}
              </div>
            )}

            {/* DYNAMIC FIELDS: HEALTH INSURANCE */}
            {policyType === "Health Insurance" && (
              <div className="rounded-xl border border-green-100 bg-green-50/30 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-green-900">Health Insurance Specific Fields</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Coverage Amount / Sum Insured</FieldLabel>
                    <MoneyInput value={sumAssured} onChange={setSumAssured} placeholder="e.g. 5,00,000" />
                  </div>
                  <div>
                    <FieldLabel>Insured Members (Comma Separated)</FieldLabel>
                    <input
                      type="text"
                      value={insuredMembers}
                      onChange={(e) => setInsuredMembers(e.target.value)}
                      placeholder="e.g. Self, Spouse, Child"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <FieldLabel>Waiting Period (Months)</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      value={waitingPeriod}
                      onChange={(e) => setWaitingPeriod(e.target.value)}
                      placeholder="e.g. 24"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <FieldLabel>Hospital / Network Details</FieldLabel>
                    <input
                      type="text"
                      value={hospitalDetails}
                      onChange={(e) => setHospitalDetails(e.target.value)}
                      placeholder="e.g. Max Healthcare, Fortis"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Coverages checkboxes */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-green-100 pt-3">
                  <div>
                    <FieldLabel>Coverage Category</FieldLabel>
                    <div className="space-y-2">
                      {["Accident Coverage", "Disease/Illness Coverage", "Hospitalization", "Critical Illness"].map((c) => (
                        <label key={c} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={coverageCategory.includes(c)}
                            onChange={() => handleCoverageCategoryToggle(c)}
                            className="accent-green-600"
                          />
                          {c}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Hospital Network</FieldLabel>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={hospitalGov} onChange={(e) => setHospitalGov(e.target.checked)} className="accent-green-600" />
                        Government Hospitals
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={hospitalPri} onChange={(e) => setHospitalPri(e.target.checked)} className="accent-green-600" />
                        Private Hospitals
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={hospitalNet} onChange={(e) => setHospitalNet(e.target.checked)} className="accent-green-600" />
                        Network Hospitals
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-green-100 pt-3">
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={cashless} onChange={(e) => setCashless(e.target.checked)} className="accent-green-600" />
                    Cashless Facility
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={reimbursement} onChange={(e) => setReimbursement(e.target.checked)} className="accent-green-600" />
                    Reimbursement Facility
                  </label>
                </div>
              </div>
            )}

            {/* DYNAMIC FIELDS: VEHICLE INSURANCE */}
            {policyType === "Vehicle Insurance" && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-amber-900">Vehicle Insurance Specific Fields</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Vehicle Type</FieldLabel>
                    <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={inputClass}>
                      <option value="Car">Car</option>
                      <option value="Bike">Bike / Two-Wheeler</option>
                      <option value="Commercial">Commercial Vehicle</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Registration Number</FieldLabel>
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. MH-02-CD-5678"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <FieldLabel>Vehicle Make</FieldLabel>
                    <input type="text" value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} placeholder="e.g. Maruti Suzuki" className={inputClass} />
                  </div>
                  <div>
                    <FieldLabel>Vehicle Model & Variant</FieldLabel>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="e.g. Swift VXI"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <FieldLabel>Vehicle Purchase Date</FieldLabel>
                    <input type="date" value={vehiclePurchaseDate} onChange={(e) => setVehiclePurchaseDate(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <FieldLabel>IDV (Insured Declared Value)</FieldLabel>
                    <MoneyInput value={idv} onChange={setIdv} placeholder="Declared Value" />
                  </div>
                  <div>
                    <FieldLabel>Coverage Type</FieldLabel>
                    <select value={vehicleCoverageType} onChange={(e) => setVehicleCoverageType(e.target.value)} className={inputClass}>
                      <option value="Comprehensive">Comprehensive</option>
                      <option value="Third-Party">Third-Party</option>
                      <option value="Own Damage">Own Damage Only</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Add-ons (Comma Separated)</FieldLabel>
                    <input
                      type="text"
                      value={vehicleAddons}
                      onChange={(e) => setVehicleAddons(e.target.value)}
                      placeholder="e.g. Zero Dep, Engine Protection"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC FIELDS: HOME INSURANCE */}
            {policyType === "Home Insurance" && (
              <div className="rounded-xl border border-purple-100 bg-purple-50/30 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-purple-900">Home Insurance Specific Fields</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Property Type</FieldLabel>
                    <select value={homePropertyType} onChange={(e) => setHomePropertyType(e.target.value)} className={inputClass}>
                      <option value="Apartment">Apartment / Flat</option>
                      <option value="House">House</option>
                      <option value="Villa">Villa</option>
                      <option value="Other">Other Property</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Property Address</FieldLabel>
                    <input
                      type="text"
                      value={homePropertyAddress}
                      onChange={(e) => setHomePropertyAddress(e.target.value)}
                      placeholder="Street, City, Zip"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <FieldLabel>Insured Property Value</FieldLabel>
                    <MoneyInput value={homePropertyValue} onChange={setHomePropertyValue} placeholder="Property Valuation" />
                  </div>
                  <div>
                    <FieldLabel>Covered Scope (Comma Separated)</FieldLabel>
                    <input
                      type="text"
                      value={homeCoveredItems}
                      onChange={(e) => setHomeCoveredItems(e.target.value)}
                      placeholder="e.g. Building Structure, Household Contents"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* NOTES */}
            <div>
              <FieldLabel>Notes / Policy Level Remarks</FieldLabel>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about coverage, benefits, etc."
                className={`${inputClass} h-24 resize-none`}
              />
            </div>

            {/* REMINDERS ARCHITECTURE */}
            <div className="rounded-xl border border-slate-100 bg-[#fafcf8] p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-[#edf0e9] pb-3">
                <div className="flex items-center gap-2">
                  <FiBell className="text-[#315c46]" />
                  <span className="text-xs font-bold text-[#18392c]">Configure Reminders</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRemindersEnabled(!remindersEnabled)}
                  className={`h-6 w-11 shrink-0 rounded-full transition relative ${
                    remindersEnabled ? "bg-[#315c46]" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                      remindersEnabled ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {remindersEnabled && (
                <div className="space-y-4 text-xs">
                  {/* Premium Payment reminders */}
                  <div className="space-y-2">
                    <span className="font-bold text-[#315c46]">Premium Reminders</span>
                    <div className="flex flex-wrap gap-4 text-slate-600">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={prem5Days} onChange={(e) => setPrem5Days(e.target.checked)} className="accent-[#315c46]" />
                        5 days before
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={prem1Day} onChange={(e) => setPrem1Day(e.target.checked)} className="accent-[#315c46]" />
                        1 day before
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={premOnDue} onChange={(e) => setPremOnDue(e.target.checked)} className="accent-[#315c46]" />
                        On due date
                      </label>
                    </div>
                  </div>

                  {/* Expiry/Renewal reminders */}
                  <div className="space-y-2 border-t border-[#edf0e9] pt-3">
                    <span className="font-bold text-[#315c46]">Expiry/Renewal Reminders</span>
                    <div className="flex flex-wrap gap-4 text-slate-600">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={exp2Months} onChange={(e) => setExp2Months(e.target.checked)} className="accent-[#315c46]" />
                        2 months before
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={exp1Month} onChange={(e) => setExp1Month(e.target.checked)} className="accent-[#315c46]" />
                        1 month before
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={exp7Days} onChange={(e) => setExp7Days(e.target.checked)} className="accent-[#315c46]" />
                        7 days before
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={expOnDate} onChange={(e) => setExpOnDate(e.target.checked)} className="accent-[#315c46]" />
                        On expiry date
                      </label>
                    </div>
                  </div>

                  {/* Maturity reminders (LIC only) */}
                  {policyType === "Life Insurance" && hasMaturity && (
                    <div className="space-y-2 border-t border-[#edf0e9] pt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#315c46]">Maturity Reminders</span>
                        <button
                          type="button"
                          onClick={() => setMatEnabled(!matEnabled)}
                          className={`h-5 w-9 shrink-0 rounded-full transition relative ${
                            matEnabled ? "bg-[#315c46]" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                              matEnabled ? "right-0.5" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>
                      {matEnabled && (
                        <div className="flex flex-wrap gap-4 text-slate-600">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={mat2Months} onChange={(e) => setMat2Months(e.target.checked)} className="accent-[#315c46]" />
                            2 months before
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={mat1Month} onChange={(e) => setMat1Month(e.target.checked)} className="accent-[#315c46]" />
                            1 month before
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={matOnDate} onChange={(e) => setMatOnDate(e.target.checked)} className="accent-[#315c46]" />
                            On maturity date
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notification Channels */}
                  <div className="space-y-2 border-t border-[#edf0e9] pt-3">
                    <span className="font-bold text-[#315c46]">Reminder Channels</span>
                    <div className="flex gap-5 text-slate-600">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={premInApp} onChange={(e) => setPremInApp(e.target.checked)} className="accent-[#315c46]" />
                        In-App
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={premEmail} onChange={(e) => setPremEmail(e.target.checked)} className="accent-[#315c46]" />
                        Email
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={premSms} onChange={(e) => setPremSms(e.target.checked)} className="accent-[#315c46]" />
                        SMS
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs leading-5 text-red-600">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* FOOTER */}
        <div className="border-t border-[#edf0e9] bg-[#fafcf8] px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#dfe6da] px-5 py-2.5 text-xs font-semibold text-[#52665b] transition hover:bg-[#f4f7f1]"
          >
            Cancel
          </button>
          <button
            form="insuranceForm"
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-[#18392c] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#244c3b] disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : isEdit ? "Update Policy" : "Add Insurance"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InsuranceForm;