const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'FinanceProvider.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const newContent = `
  const loadInsurances = async () => {
    try {
      const token = localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");
      if (!token) return;
      const response = await fetch(\`http://localhost:5000/api/insurances?t=\${Date.now()}\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      const data = await response.json();
      if (data.success) {
        setInsurancePolicies(
          data.insurances.map((i) => ({
            ...i,
            id: i._id,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading insurances:", error);
    }
  };

  const addInsurancePolicy = async (policy = {}) => {
    try {
      const token = localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");
      const response = await fetch("http://localhost:5000/api/insurances", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` },
        body: JSON.stringify(policy),
      });
      if (response.ok) {
        await loadInsurances();
      }
    } catch (error) {
      console.error("Error adding insurance:", error);
    }
  };

  const updateInsurancePolicy = async (id, updates = {}) => {
    try {
      const token = localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");
      const response = await fetch(\`http://localhost:5000/api/insurances/\${id}\`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        await loadInsurances();
      }
    } catch (error) {
      console.error("Error updating insurance:", error);
    }
  };

  const deleteInsurancePolicy = async (id) => {
    try {
      const token = localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");
      const response = await fetch(\`http://localhost:5000/api/insurances/\${id}\`, {
        method: "DELETE",
        headers: { Authorization: \`Bearer \${token}\` },
      });
      if (response.ok) {
        await loadInsurances();
      }
    } catch (error) {
      console.error("Error deleting insurance:", error);
    }
  };

  const recordInsurancePremium = async (id, paymentData = {}) => {
    try {
      const token = localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");
      const response = await fetch(\`http://localhost:5000/api/insurances/\${id}/payment\`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` },
        body: JSON.stringify(paymentData),
      });
      if (response.ok) {
        await loadInsurances();
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error("Error recording insurance premium:", error);
      return { success: false };
    }
  };
`;

const start1 = content.indexOf("const addInsurancePolicy = (policy = {}) => {");
const end1 = content.indexOf("const addLiability = async (liability = {}) => {");
if(start1 !== -1 && end1 !== -1) {
  content = content.substring(0, start1) + newContent + "\n  " + content.substring(end1);
}

const loadDataOld = "await loadInvestments();";
const loadDataNew = "await loadInvestments();\n        await loadLiabilities();\n        await loadInsurances();";
content = content.replace(loadDataOld, loadDataNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated Insurance methods");
