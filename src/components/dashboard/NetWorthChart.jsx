// ============================================================
// FINANCEOS - NET WORTH CHART
// ============================================================
//
// Displays:
//
// 1. Current Net Worth
// 2. Total Assets
// 3. Cash & Savings
// 4. Investments
// 5. Outstanding Liabilities
// 6. Monthly Net Worth History
// 7. Previous-month comparison
// 8. Net Worth growth percentage
//
// Data comes from FinanceProvider.
//
// No fake historical data is generated.
//
// ============================================================


import {
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
} from "react-icons/fi";

import useFinance
  from "../../context/useFinance.js";


// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(value) {

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(value || 0)
  );

}


// ============================================================
// FORMAT SHORT MONEY
// ============================================================

function formatShortMoney(value) {

  const number =
    Number(
      value || 0
    );


  const absolute =
    Math.abs(
      number
    );


  if (
    absolute >= 10000000
  ) {

    return `${
      (
        number /
        10000000
      ).toFixed(1)
    }Cr`;

  }


  if (
    absolute >= 100000
  ) {

    return `${
      (
        number /
        100000
      ).toFixed(1)
    }L`;

  }


  if (
    absolute >= 1000
  ) {

    return `${
      (
        number /
        1000
      ).toFixed(0)
    }K`;

  }


  return String(
    Math.round(
      number
    )
  );

}


// ============================================================
// MONTH NAMES
// ============================================================

const monthNames = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];


// ============================================================
// NET WORTH CHART
// ============================================================

function NetWorthChart() {


  // ==========================================================
  // FINANCE CONTEXT
  // ==========================================================

  const {

    netWorth,

    totalAssets,

    totalCashSavings,

    totalInvestmentValue,

    totalOutstandingLiabilities,

    netWorthHistory,

  } = useFinance();


  // ==========================================================
  // HISTORY
  // ==========================================================
  //
  // FinanceProvider already sorts history chronologically.
  //
  // Still copy + sort here so this component remains safe if
  // the source changes later.
  //
  // Only the latest 6 monthly records are displayed.
  //
  // ==========================================================

  const history =
    Array.isArray(
      netWorthHistory
    )

      ? [
          ...netWorthHistory,
        ]
          .sort(
            (
              first,
              second
            ) => {

              const firstKey =
                Number(
                  first.year || 0
                ) *
                  12 +
                Number(
                  first.month || 0
                );


              const secondKey =
                Number(
                  second.year || 0
                ) *
                  12 +
                Number(
                  second.month || 0
                );


              return (
                firstKey -
                secondKey
              );

            }
          )
          .slice(-6)

      : [];


  // ==========================================================
  // CURRENT NET WORTH
  // ==========================================================

  const currentValue =
    Number(
      netWorth || 0
    );


  // ==========================================================
  // PREVIOUS NET WORTH
  // ==========================================================
  //
  // If there are at least two snapshots:
  //
  // previousValue = second-last snapshot.
  //
  // ==========================================================

  const previousValue =
    history.length >= 2

      ? Number(
          history[
            history.length - 2
          ]?.netWorth || 0
        )

      : null;


  // ==========================================================
  // NET WORTH CHANGE
  // ==========================================================

  const change =
    previousValue === null

      ? 0

      : currentValue -
        previousValue;


  // ==========================================================
  // CHANGE PERCENTAGE
  // ==========================================================

  const changePercent =
    previousValue !== null &&
    previousValue !== 0

      ? (
          change /
          Math.abs(
            previousValue
          )
        ) * 100

      : 0;


  // ==========================================================
  // CHANGE ICON
  // ==========================================================

  const ChangeIcon =
    change > 0

      ? FiTrendingUp

      : change < 0

      ? FiTrendingDown

      : FiMinus;


  // ==========================================================
  // CHANGE STYLE
  // ==========================================================

  const changeClass =
    change > 0

      ? "text-emerald-600"

      : change < 0

      ? "text-red-500"

      : "text-slate-400";


  // ==========================================================
  // CHART DATA
  // ==========================================================

  const chartData =
    history.map(
      (record) => {

        const month =
          Number(
            record.month || 0
          );


        const year =
          Number(
            record.year || 0
          );


        return {

          ...record,

          month,

          year,

          value:
            Number(
              record.netWorth || 0
            ),

          monthLabel:
            monthNames[
              month
            ] || "",

          yearLabel:
            year
              ? String(
                  year
                )
              : "",

        };

      }
    );


  // ==========================================================
  // CHART DIMENSIONS
  // ==========================================================

  const width = 760;

  const height = 280;

  const paddingLeft = 70;

  const paddingRight = 30;

  const paddingTop = 30;

  const paddingBottom = 55;


  const usableWidth =
    width -
    paddingLeft -
    paddingRight;


  const usableHeight =
    height -
    paddingTop -
    paddingBottom;


  // ==========================================================
  // VALUES
  // ==========================================================

  const values =
    chartData.map(
      (item) =>
        item.value
    );


  // ==========================================================
  // MINIMUM / MAXIMUM
  // ==========================================================

  const rawMinimum =
    values.length > 0

      ? Math.min(
          ...values
        )

      : 0;


  const rawMaximum =
    values.length > 0

      ? Math.max(
          ...values
        )

      : 1;


  // ==========================================================
  // CHART RANGE
  // ==========================================================
  //
  // Add some vertical breathing room around the values.
  //
  // If all points have the same value, create a useful range
  // so the graph does not collapse into an unusable line.
  //
  // ==========================================================

  const rawRange =
    rawMaximum -
    rawMinimum;


  const fallbackRange =
    Math.max(
      Math.abs(
        rawMaximum
      ) * 0.2,
      1000
    );


  const chartPadding =
    rawRange > 0

      ? rawRange * 0.2

      : fallbackRange;


  const minimum =
    rawMinimum -
    chartPadding;


  const maximum =
    rawMaximum +
    chartPadding;


  const range =
    maximum -
    minimum || 1;


  // ==========================================================
  // CHART POINTS
  // ==========================================================

  const points =
    chartData.map(
      (
        item,
        index
      ) => {


        // ------------------------------------------------------
        // X POSITION
        // ------------------------------------------------------

        const x =
          chartData.length === 1

            ? paddingLeft +
              usableWidth / 2

            : paddingLeft +
              (
                index /
                (
                  chartData.length -
                  1
                )
              ) *
                usableWidth;


        // ------------------------------------------------------
        // Y POSITION
        // ------------------------------------------------------

        const y =
          paddingTop +
          (
            1 -
            (
              item.value -
              minimum
            ) /
              range
          ) *
            usableHeight;


        return {

          ...item,

          x,

          y,

        };

      }
    );


  // ==========================================================
  // POLYLINE POINTS
  // ==========================================================

  const linePoints =
    points
      .map(
        (point) =>
          `${point.x},${point.y}`
      )
      .join(" ");


  // ==========================================================
  // AREA POINTS
  // ==========================================================

  const areaPoints =
    points.length > 1

      ? [
          `${points[0].x},${
            height -
            paddingBottom
          }`,

          ...points.map(
            (point) =>
              `${point.x},${point.y}`
          ),

          `${
            points[
              points.length - 1
            ].x
          },${
            height -
            paddingBottom
          }`,
        ].join(" ")

      : "";


  // ==========================================================
  // Y AXIS GRID
  // ==========================================================

  const gridRows =
    Array.from(
      {
        length: 5,
      },
      (
        _,
        index
      ) => {

        const ratio =
          index / 4;


        const y =
          paddingTop +
          ratio *
            usableHeight;


        const value =
          maximum -
          ratio *
            range;


        return {

          y,

          value,

        };

      }
    );


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <section className="rounded-2xl border border-[#e2e8dc] bg-white p-6">


      {/* ======================================================
          HEADER
         ====================================================== */}

      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">


        {/* LEFT */}

        <div>


          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6c8b72]">

            Financial Position

          </p>


          <h2 className="mt-1 text-lg font-bold text-[#18392c]">

            Net Worth

          </h2>


          <p className="mt-1 text-xs text-slate-400">

            Total assets minus outstanding liabilities.

          </p>


        </div>


        {/* ====================================================
            CURRENT NET WORTH
           ==================================================== */}

        <div className="sm:text-right">


          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">

            Current Net Worth

          </p>


          <p className="mt-1 text-2xl font-bold tracking-tight text-[#18392c]">

            {
              formatMoney(
                currentValue
              )
            }

          </p>


          {/* ==================================================
              CHANGE
             ================================================== */}

          {
            previousValue !== null

              ? (

                <div
                  className={`mt-1 flex flex-wrap items-center gap-1 text-xs font-semibold sm:justify-end ${changeClass}`}
                >


                  <ChangeIcon />


                  <span>

                    {
                      change >= 0
                        ? "+"
                        : ""
                    }

                    {
                      formatMoney(
                        change
                      )
                    }

                  </span>


                  {
                    previousValue !== 0 && (

                      <span>

                        (
                        {
                          changePercent >= 0
                            ? "+"
                            : ""
                        }

                        {
                          changePercent.toFixed(
                            1
                          )
                        }
                        %)

                      </span>

                    )
                  }


                  <span className="font-normal text-slate-400">

                    vs previous month

                  </span>


                </div>

              )

              : (

                <p className="mt-1 text-[11px] text-slate-400">

                  Save another monthly record to compare growth.

                </p>

              )
          }


        </div>


      </div>


      {/* ======================================================
          FINANCIAL BREAKDOWN
         ====================================================== */}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">


        <SummaryItem

          label="Total Assets"

          value={
            totalAssets
          }

        />


        <SummaryItem

          label="Cash & Savings"

          value={
            totalCashSavings
          }

        />


        <SummaryItem

          label="Investments"

          value={
            totalInvestmentValue
          }

        />


        <SummaryItem

          label="Liabilities"

          value={
            totalOutstandingLiabilities
          }

          negative

        />


      </div>


      {/* ======================================================
          NET WORTH FORMULA
         ====================================================== */}

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-[#fafcf8] px-4 py-3">


        <span className="text-[11px] text-slate-400">

          Net Worth

        </span>


        <span className="text-xs font-semibold text-[#18392c]">

          =

        </span>


        <span className="text-[11px] font-medium text-[#315c46]">

          Assets

        </span>


        <span className="text-xs text-slate-400">

          −

        </span>


        <span className="text-[11px] font-medium text-red-500">

          Liabilities

        </span>


      </div>


      {/* ======================================================
          CHART SECTION
         ====================================================== */}

      <div className="mt-7 border-t border-[#edf0e9] pt-5">


        {/* ====================================================
            CHART HEADER
           ==================================================== */}

        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">


          <div>


            <h3 className="text-sm font-bold text-[#18392c]">

              Net Worth Growth

            </h3>


            <p className="mt-1 text-[11px] text-slate-400">

              Historical net worth recorded when monthly finance is saved.

            </p>


          </div>


          {
            chartData.length > 0 && (

              <span className="w-fit rounded-full bg-[#f0f6eb] px-3 py-1 text-[10px] font-semibold text-[#52665b]">

                Last {
                  chartData.length
                } {
                  chartData.length === 1
                    ? "month"
                    : "months"
                }

              </span>

            )
          }


        </div>


        {/* ====================================================
            NO DATA
           ==================================================== */}

        {
          chartData.length === 0

            ? (

              <div className="flex h-[240px] items-center justify-center rounded-xl bg-[#fafcf8]">


                <div className="max-w-sm px-5 text-center">


                  <FiTrendingUp className="mx-auto text-2xl text-[#aac59a]" />


                  <p className="mt-3 text-sm font-semibold text-[#52665b]">

                    No Net Worth history yet

                  </p>


                  <p className="mt-1 text-xs leading-5 text-slate-400">

                    Save your Monthly Finance information to create
                    your first Net Worth snapshot.

                  </p>


                </div>


              </div>

            )

            : (

              // =================================================
              // CHART
              // =================================================

              <div className="overflow-x-auto rounded-xl bg-[#fcfdfb]">


                <svg

                  viewBox={`0 0 ${width} ${height}`}

                  className="h-[280px] min-w-[650px] w-full"

                  role="img"

                  aria-label="Monthly net worth growth chart"

                >


                  {/* ============================================
                      HORIZONTAL GRID + Y LABELS
                     ============================================ */}

                  {
                    gridRows.map(
                      (
                        row,
                        index
                      ) => (

                        <g
                          key={
                            index
                          }
                        >


                          <line

                            x1={
                              paddingLeft
                            }

                            y1={
                              row.y
                            }

                            x2={
                              width -
                              paddingRight
                            }

                            y2={
                              row.y
                            }

                            stroke="#edf0e9"

                            strokeWidth="1"

                          />


                          <text

                            x={
                              paddingLeft -
                              12
                            }

                            y={
                              row.y + 4
                            }

                            textAnchor="end"

                            fontSize="10"

                            fill="#94a3b8"

                          >

                            ₹
                            {
                              formatShortMoney(
                                row.value
                              )
                            }

                          </text>


                        </g>

                      )
                    )
                  }


                  {/* ============================================
                      ZERO LINE
                     ============================================ */}

                  {
                    minimum < 0 &&
                    maximum > 0 && (

                      <line

                        x1={
                          paddingLeft
                        }

                        y1={
                          paddingTop +
                          (
                            1 -
                            (
                              0 -
                              minimum
                            ) /
                              range
                          ) *
                            usableHeight
                        }

                        x2={
                          width -
                          paddingRight
                        }

                        y2={
                          paddingTop +
                          (
                            1 -
                            (
                              0 -
                              minimum
                            ) /
                              range
                          ) *
                            usableHeight
                        }

                        stroke="#cbd5e1"

                        strokeWidth="1.5"

                        strokeDasharray="5 5"

                      />

                    )
                  }


                  {/* ============================================
                      AREA
                     ============================================ */}

                  {
                    points.length > 1 && (

                      <polygon

                        points={
                          areaPoints
                        }

                        fill="#eef6e9"

                      />

                    )
                  }


                  {/* ============================================
                      GRAPH LINE
                     ============================================ */}

                  {
                    points.length > 1 && (

                      <polyline

                        points={
                          linePoints
                        }

                        fill="none"

                        stroke="#315c46"

                        strokeWidth="3"

                        strokeLinecap="round"

                        strokeLinejoin="round"

                      />

                    )
                  }


                  {/* ============================================
                      POINTS
                     ============================================ */}

                  {
                    points.map(
                      (
                        point,
                        index
                      ) => (

                        <g
                          key={`${point.year}-${point.month}-${index}`}
                        >


                          {/* POINT */}

                          <circle

                            cx={
                              point.x
                            }

                            cy={
                              point.y
                            }

                            r="5"

                            fill="#ffffff"

                            stroke="#315c46"

                            strokeWidth="3"

                          >


                            <title>

                              {
                                point.monthLabel
                              } {
                                point.year
                              }: {
                                formatMoney(
                                  point.value
                                )
                              }

                            </title>


                          </circle>


                          {/* ====================================
                              MONTH
                             ==================================== */}

                          <text

                            x={
                              point.x
                            }

                            y={
                              height - 27
                            }

                            textAnchor="middle"

                            fontSize="11"

                            fontWeight="600"

                            fill="#52665b"

                          >

                            {
                              point.monthLabel
                            }

                          </text>


                          {/* ====================================
                              YEAR
                             ==================================== */}

                          <text

                            x={
                              point.x
                            }

                            y={
                              height - 12
                            }

                            textAnchor="middle"

                            fontSize="9"

                            fill="#94a3b8"

                          >

                            {
                              point.yearLabel
                            }

                          </text>


                        </g>

                      )
                    )
                  }


                </svg>


              </div>

            )
        }


        {/* ====================================================
            ONE MONTH MESSAGE
           ==================================================== */}

        {
          chartData.length === 1 && (

            <div className="mt-3 rounded-xl bg-[#fafcf8] px-4 py-3">


              <p className="text-[11px] leading-5 text-[#5f7568]">

                Your first Net Worth snapshot has been recorded.
                The growth line and monthly comparison will appear
                after another month's financial record is saved.

              </p>


            </div>

          )
        }


      </div>


    </section>

  );

}


// ============================================================
// SUMMARY ITEM
// ============================================================

function SummaryItem({
  label,
  value,
  negative = false,
}) {

  return (

    <div className="rounded-xl bg-[#f7f9f3] p-4">


      <p className="text-[10px] font-medium text-slate-400">

        {label}

      </p>


      <p
        className={`mt-1 text-sm font-bold ${
          negative
            ? "text-red-500"
            : "text-[#18392c]"
        }`}
      >

        {
          formatMoney(
            value
          )
        }

      </p>


    </div>

  );

}


// ============================================================
// EXPORT
// ============================================================

export default NetWorthChart;