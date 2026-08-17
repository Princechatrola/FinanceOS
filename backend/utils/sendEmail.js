const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"FinanceOS" <${process.env.EMAIL_USER}>`,

    to: email,

    subject: "FinanceOS Login OTP",

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: auto;
        padding: 30px;
        background: #f7f9f4;
        border-radius: 12px;
      ">

        <h2 style="color:#43822e;">
          FinanceOS
        </h2>

        <p>Hello,</p>

        <p>
          Your OTP for signing in to FinanceOS is:
        </p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #173b2b;
          background: #e7f3d8;
          padding: 18px;
          text-align: center;
          border-radius: 10px;
          margin: 20px 0;
        ">
          ${otp}
        </div>

        <p>
          This OTP is valid for <strong>5 minutes</strong>.
        </p>

        <p style="color:#777;">
          If you did not request this OTP, please ignore this email.
        </p>

        <hr />

        <p style="font-size:12px;color:#888;">
          FinanceOS - Manage Today, Secure Tomorrow
        </p>

      </div>
    `,
  });
};

module.exports = sendOTPEmail;