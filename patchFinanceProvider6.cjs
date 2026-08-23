const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'FinanceProvider.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetMethod = "const recordFDInterest = async (investmentId, interestData = {}) => {";

// Locate the block
const startIdx = content.indexOf(targetMethod);
if (startIdx === -1) {
    console.log("Could not find recordFDInterest");
    process.exit(1);
}

const endBlockStr = `      return {
        success: true,
        message: data.message || "FD interest recorded successfully.",
        investment: data.investment,
      };`;
const endIdx = content.indexOf(endBlockStr, startIdx);

if (endIdx === -1) {
    console.log("Could not find end of recordFDInterest");
    process.exit(1);
}

const replaceWith = `      if (interestMethod === "payout" && amount > 0) {
        // Also record as additional income so it's added to Available to Allocate
        await recordAdditionalIncome({
            type: "Interest Income",
            category: "FD Interest",
            amount: amount,
            note: \`Interest from FD: \${investment.name || investment.id}\`,
            date: new Date().toISOString().slice(0,10)
        });
      }

      return {
        success: true,
        message: data.message || "FD interest recorded successfully.",
        investment: data.investment,
      };`;

content = content.substring(0, endIdx) + replaceWith + content.substring(endIdx + endBlockStr.length);
fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched recordFDInterest for Available to Allocate");
