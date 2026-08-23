const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'FinanceProvider.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const newMethod = `
  const addInvestmentTransaction = async (investmentId, transactionData = {}) => {
    try {
      const token = localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");
      if (!token) return { success: false, message: "Authentication token not found." };

      const response = await fetch(
        \`http://localhost:5000/api/investments/\${investmentId}/transactions\`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: \`Bearer \${token}\`,
          },
          body: JSON.stringify(transactionData),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add transaction.");
      }

      await loadInvestments();

      return {
        success: true,
        investment: data.investment,
        message: data.message || "Transaction recorded successfully.",
      };
    } catch (error) {
      console.error("Add Investment Transaction:", error);
      return {
        success: false,
        message: error.message || "Failed to add transaction.",
      };
    }
  };

`;

const target1 = "const addSIPContribution = async (investmentId, contributionData = {}) => {";
if(content.includes(target1) && !content.includes("const addInvestmentTransaction = async")) {
  content = content.replace(target1, newMethod + target1);
}

const exportTarget = "addSIPContribution,";
if(content.includes(exportTarget) && !content.includes("addInvestmentTransaction,")) {
  content = content.replace(exportTarget, "addInvestmentTransaction,\n    " + exportTarget);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated addInvestmentTransaction");
