/*
  FinancialSummaryCard

  This is a reusable component used to display important
  financial values on the FinanceOS dashboard.

  Examples:
  - Monthly Income
  - Monthly Expenses
  - Monthly Savings
  - Available to Allocate

  We use props so the same component can display different data.
  Later these values can come from the backend/database.
*/

function FinancialSummaryCard({
  title,
  amount,
  description,
  icon: Icon,
  type = "normal",
}) {

  /*
    Different card types can use different styles.

    normal   = regular financial information
    positive = savings / available money
    negative = expenses / outgoing money
  */
  const amountStyle =
    type === "negative"
      ? "text-red-500"
      : type === "positive"
        ? "text-[#315c46]"
        : "text-[#18392c]";

  return (
    <div className="rounded-2xl border border-[#e2e8dc] bg-white p-5">

      {/* Card heading and icon */}
      <div className="flex items-center justify-between">

        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        {/* Show icon only when an icon is provided */}
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf5e7] text-[#315c46]">
            <Icon className="text-lg" />
          </div>
        )}

      </div>

      {/* Main financial value */}
      <h3 className={`mt-4 text-2xl font-bold ${amountStyle}`}>
        {amount}
      </h3>

      {/* Small explanation below the value */}
      <p className="mt-2 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}

export default FinancialSummaryCard;