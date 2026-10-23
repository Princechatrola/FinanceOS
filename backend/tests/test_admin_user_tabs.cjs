const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const { getAdminUserFinancial, getAdminUserActivity, getAdminUserReport } = require('../controllers/adminController');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const mockRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.body = data;
      return res;
    };
    return res;
  };

  /* 1. Test Populated User Financial */
  console.log('--- Testing 6a6b7281682b6cd19e2e3eb9 Financial ---');
  const res1 = mockRes();
  await getAdminUserFinancial({ params: { id: '6a6b7281682b6cd19e2e3eb9' }, query: { year: 2026, month: 3 } }, res1);
  console.log('Status:', res1.statusCode);
  console.log('User Name:', res1.body?.user?.name);
  console.log('Period:', res1.body?.period?.monthLabel);
  console.log('Income:', res1.body?.summary?.income);
  console.log('Expenses:', res1.body?.summary?.expenses);
  console.log('Opening Balance:', res1.body?.summary?.openingBalance);
  console.log('Available to Allocate:', res1.body?.summary?.availableToAllocate);
  console.log('Closing Balance:', res1.body?.summary?.closingBalance);
  console.log('Net Worth:', res1.body?.summary?.netWorth);
  console.log('Saving Goals:', res1.body?.savingGoals?.length);
  console.log('Investments:', res1.body?.investments?.length);
  console.log('Liabilities:', res1.body?.liabilities?.length);
  console.log('Insurances:', res1.body?.insurances?.length);

  /* 2. Test Populated User Activity */
  console.log('\n--- Testing 6a6b7281682b6cd19e2e3eb9 Activity ---');
  const res2 = mockRes();
  await getAdminUserActivity({ params: { id: '6a6b7281682b6cd19e2e3eb9' } }, res2);
  console.log('Status:', res2.statusCode);
  console.log('Activity Count:', res2.body?.activities?.length);
  console.log('Stats:', res2.body?.stats);
  if (res2.body?.activities?.length > 0) {
    console.log('Latest Activity:', res2.body.activities[0]);
  }

  /* 3. Test Populated User Report */
  console.log('\n--- Testing 6a6b7281682b6cd19e2e3eb9 Report ---');
  const res3 = mockRes();
  await getAdminUserReport({ params: { id: '6a6b7281682b6cd19e2e3eb9' }, query: { duration: 'monthly', year: 2026, month: 3 } }, res3);
  console.log('Status:', res3.statusCode);
  console.log('Report Period:', res3.body?.report?.header?.periodLabel);
  console.log('Financial Health Score:', res3.body?.report?.financialHealth?.score);
  console.log('Total Savings:', res3.body?.report?.financialSummary?.totalSavings);

  /* 4. Test User from Prompt: 6aa18e2f10e3472554221d3e */
  console.log('\n--- Testing 6aa18e2f10e3472554221d3e (User from prompt) ---');
  const res4 = mockRes();
  await getAdminUserFinancial({ params: { id: '6aa18e2f10e3472554221d3e' }, query: {} }, res4);
  console.log('Status:', res4.statusCode);
  console.log('User Name:', res4.body?.user?.name);
  console.log('hasAnyFinancialData:', res4.body?.hasAnyFinancialData);
  console.log('Available to Allocate:', res4.body?.summary?.availableToAllocate);

  const res5 = mockRes();
  await getAdminUserActivity({ params: { id: '6aa18e2f10e3472554221d3e' } }, res5);
  console.log('Activity Count:', res5.body?.activities?.length);
  console.log('Activity Stats:', res5.body?.stats);

  /* 5. Test Invalid ID */
  console.log('\n--- Testing Invalid ID ---');
  const res6 = mockRes();
  await getAdminUserFinancial({ params: { id: 'invalid-id-xyz' }, query: {} }, res6);
  console.log('Status:', res6.statusCode, 'Message:', res6.body?.message);

  /* 6. Test Non-existent User */
  console.log('\n--- Testing Non-existent User ---');
  const res7 = mockRes();
  await getAdminUserFinancial({ params: { id: '6a6b7281682b6cd19e2e3000' }, query: {} }, res7);
  console.log('Status:', res7.statusCode, 'Message:', res7.body?.message);

  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
