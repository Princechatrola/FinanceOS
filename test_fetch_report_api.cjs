const mongoose = require('./backend/node_modules/mongoose');
const dotenv = require('./backend/node_modules/dotenv');
dotenv.config({ path: 'd:/FinanceOS-main/FinanceOS_Code/backend/.env' });

async function checkReportApi() {
  await mongoose.connect(process.env.MONGO_URI);
  await fetch('http://localhost:5000/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dip@test.com' })
  });

  const userDoc = await mongoose.connection.db.collection('users').findOne({ email: 'dip@test.com' });

  const verifyRes = await fetch('http://localhost:5000/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dip@test.com', otp: userDoc.otp })
  });
  const { token } = await verifyRes.json();

  const res = await fetch('http://localhost:5000/api/reports?duration=monthly&year=2026&month=3', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('Report API Full Response: status =', res.status, JSON.stringify(data, null, 2));
  process.exit(0);
}

checkReportApi().catch(err => {
  console.error(err);
  process.exit(1);
});
