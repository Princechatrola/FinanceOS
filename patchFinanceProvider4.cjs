const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'FinanceProvider.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldInvestmentData = `const investmentData = {
        name: investment.name,
        type: investment.type,
        amount,
        paymentSource: investment.paymentSource || undefined,
        paymentSourceDetails: {
          bankName: investment.paymentSourceDetails?.bankName || "",
          accountLast4: investment.paymentSourceDetails?.accountLast4 || "",
          upiId: investment.paymentSourceDetails?.upiId || "",
          otherDetails: investment.paymentSourceDetails?.otherDetails || "",
        },
        contributionType: investment.contributionType || "Recurring",
        frequency: investment.frequency || null,
        monthlyContribution: isFD
          ? 0
          : nonNegative(
              firstDefined(investment.monthlyContribution, investment.monthlyAmount)
            ),
        startDate: investment.startDate || null,
        nextContributionDate: investment.nextContributionDate || null,
        maturityDate: investment.maturityDate || null,
        status: investment.status || "Active",
        institution: investment.institution || "",
        principalAmount: isFD
          ? nonNegative(firstDefined(investment.principalAmount, amount))
          : undefined,
        interestRate: isFD ? nonNegative(investment.interestRate) : undefined,
        interestMethod: isFD ? investment.interestMethod || "Payout" : undefined,
        interestPayoutFrequency: isFD ? investment.interestPayoutFrequency || null : undefined,
        compoundingFrequency: isFD ? investment.compoundingFrequency || null : undefined,
        estimatedInterest: isFD ? nonNegative(investment.estimatedInterest) : 0,
        estimatedAnnualInterest: isFD ? nonNegative(investment.estimatedAnnualInterest) : 0,
        estimatedInterestPerPayout: isFD ? nonNegative(investment.estimatedInterestPerPayout) : 0,
        estimatedMaturityAmount: isFD ? nonNegative(investment.estimatedMaturityAmount) : 0,`;

const newInvestmentData = `const investmentData = {
        name: investment.name,
        type: investment.type,
        amount,
        paymentSource: investment.paymentSource || undefined,
        paymentSourceDetails: {
          bankName: investment.paymentSourceDetails?.bankName || "",
          accountLast4: investment.paymentSourceDetails?.accountLast4 || "",
          upiId: investment.paymentSourceDetails?.upiId || "",
          otherDetails: investment.paymentSourceDetails?.otherDetails || "",
        },
        contributionType: investment.contributionType || "Recurring",
        frequency: investment.frequency || null,
        monthlyContribution: isFD
          ? 0
          : nonNegative(
              firstDefined(investment.monthlyContribution, investment.monthlyAmount)
            ),
        startDate: investment.startDate || null,
        nextContributionDate: investment.nextContributionDate || null,
        maturityDate: investment.maturityDate || null,
        status: investment.status || "Active",
        institution: investment.institution || "",
        principalAmount: isFD
          ? nonNegative(firstDefined(investment.principalAmount, amount))
          : undefined,
        interestRate: isFD ? nonNegative(investment.interestRate) : undefined,
        interestMethod: isFD ? investment.interestMethod || "Payout" : undefined,
        interestPayoutFrequency: isFD ? investment.interestPayoutFrequency || null : undefined,
        compoundingFrequency: isFD ? investment.compoundingFrequency || null : undefined,
        estimatedInterest: isFD ? nonNegative(investment.estimatedInterest) : 0,
        estimatedAnnualInterest: isFD ? nonNegative(investment.estimatedAnnualInterest) : 0,
        estimatedInterestPerPayout: isFD ? nonNegative(investment.estimatedInterestPerPayout) : 0,
        estimatedMaturityAmount: isFD ? nonNegative(investment.estimatedMaturityAmount) : 0,
        // New fields mapped for advanced investments
        amc: investment.amc || "",
        schemeName: investment.schemeName || investment.fundName || "",
        units: investment.units || 0,
        nav: investment.nav || 0,
        goldType: investment.goldType || "",
        weight: investment.weight || 0,
        purity: investment.purity || "",
        companyName: investment.companyName || "",
        symbol: investment.symbol || investment.ticker || "",
        broker: investment.broker || "",
        quantity: investment.quantity || 0,
        purchasePrice: investment.purchasePrice || 0,`;

if(content.includes(oldInvestmentData)) {
    content = content.replace(oldInvestmentData, newInvestmentData);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Updated addInvestment successfully");
} else {
    console.log("Failed to find addInvestment pattern");
}
