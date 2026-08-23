const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'FinanceProvider.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const newContent = `
  const updateLiability = async (id, updates = {}) => {
    try {
      const token = localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");
      const dbId = id; // Assuming id matches _id
      const payload = {
        name: updates.name,
        type: updates.type,
        principalAmount: updates.loanAmount || updates.amount || updates.originalAmount,
        remainingAmount: updates.outstandingAmount || updates.balance,
        monthlyEMI: updates.monthlyPayment || updates.emi,
        interestRate: updates.interestRate,
        status: updates.status,
      };
      // Clean undefined fields
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      const response = await fetch(\`http://localhost:5000/api/liabilities/\${dbId}\`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        await loadLiabilities();
      }
    } catch (error) {
      console.error("Error updating liability:", error);
    }
  };

  const deleteLiability = async (id) => {
    try {
      const token = localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");
      const response = await fetch(\`http://localhost:5000/api/liabilities/\${id}\`, {
        method: "DELETE",
        headers: { Authorization: \`Bearer \${token}\` },
      });
      if (response.ok) {
        await loadLiabilities();
      }
    } catch (error) {
      console.error("Error deleting liability:", error);
    }
  };

  const recordLiabilityPayment = async (id, paymentData = {}) => {
    try {
      const token = localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");
      const response = await fetch(\`http://localhost:5000/api/liabilities/\${id}/payment\`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` },
        body: JSON.stringify(paymentData),
      });
      if (response.ok) {
        await loadLiabilities();
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error("Error recording liability payment:", error);
      return { success: false };
    }
  };
`;

const start1 = content.indexOf("const updateLiability = (id, updates = {}) => {");
const end1 = content.indexOf("const loadMonthlyFinanceData = async () => {");
if(start1 !== -1 && end1 !== -1) {
  content = content.substring(0, start1) + newContent + "\n" + content.substring(end1);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated Liability methods");
