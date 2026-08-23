const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'FinanceProvider.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  {
    target: "const addLiability = (liability = {}) => {",
    newContent: `
  const loadLiabilities = async () => {
    try {
      const token = localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");
      if (!token) return;
      const response = await fetch(\`http://localhost:5000/api/liabilities?t=\${Date.now()}\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      const data = await response.json();
      if (data.success) {
        setLiabilities(
          data.liabilities.map((l) => ({
            ...l,
            id: l._id,
            loanAmount: l.principalAmount,
            amount: l.principalAmount,
            originalAmount: l.principalAmount,
            outstandingAmount: l.remainingAmount,
            balance: l.remainingAmount,
            emi: l.monthlyEMI,
            monthlyPayment: l.monthlyEMI
          }))
        );
      }
    } catch (error) {
      console.error("Error loading liabilities:", error);
    }
  };

  const addLiability = async (liability = {}) => {
    try {
      const token = localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");
      const response = await fetch("http://localhost:5000/api/liabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({
          name: liability.name,
          type: liability.type,
          principalAmount: liability.loanAmount || liability.amount || 0,
          remainingAmount: liability.outstandingAmount || liability.balance || 0,
          monthlyEMI: liability.monthlyPayment || liability.emi || 0,
          interestRate: liability.interestRate || 0,
          lender: liability.lender || "",
          accountLast4: liability.accountLast4 || "",
          startDate: liability.startDate,
          endDate: liability.endDate
        }),
      });
      if (response.ok) {
        await loadLiabilities();
      }
    } catch (error) {
      console.error("Error adding liability:", error);
    }
  };
`
  }
];

const start1 = content.indexOf("const addLiability = (liability = {}) => {");
const end1 = content.indexOf("const updateLiability = (id, updates = {}) => {");
if(start1 !== -1 && end1 !== -1) {
  content = content.substring(0, start1) + replacements[0].newContent + content.substring(end1);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated addLiability");
