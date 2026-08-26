// ============================================================
// FINANCEOS - EMAIL SERVICE
// ============================================================

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "financeos.system@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "uabf nomh mkjn idjp",
  },
});

// Verify connection configuration
transporter.verify((error) => {
  if (error) {
    console.error("Email Service Connection Error:", error.message);
  } else {
    console.log("FinanceOS Email Service is ready to send emails.");
  }
});

/**
 * Send an email notification for Admin messages and reminders
 */
async function sendAdminMessageEmail({
  to,
  recipientName = "FinanceOS User",
  subject = "FinanceOS Communication",
  message = "",
  category = "Important Update",
}) {
  if (!to) {
    console.warn("sendAdminMessageEmail: Missing recipient email address.");
    return { success: false, error: "No recipient email provided" };
  }

  const formattedMessage = message
    ? message.replace(/\n/g, "<br/>")
    : "You have a new update in your FinanceOS account.";

  const mailOptions = {
    from: `"FinanceOS" <${process.env.EMAIL_USER || "financeos.system@gmail.com"}>`,
    to: to.trim(),
    subject: subject,
    text: `Hello ${recipientName},\n\n${message}\n\nRegards,\nFinanceOS Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f6f8f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f6f8f4; padding: 30px 15px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2ebd9; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                
                <!-- HEADER -->
                <tr>
                  <td style="background: linear-gradient(135deg, #173b2b 0%, #295741 100%); padding: 30px; text-align: left;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td>
                          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">
                            Finance<span style="color: #8ed867;">OS</span>
                          </h1>
                          <p style="color: #c9decb; margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                            ${category}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CONTENT -->
                <tr>
                  <td style="padding: 35px 30px 25px 30px;">
                    <p style="color: #173b2b; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">
                      Hello ${recipientName},
                    </p>
                    
                    <div style="background-color: #f9fbf8; border: 1px solid #e5ede0; border-radius: 12px; padding: 20px; margin: 20px 0;">
                      <h3 style="color: #28553d; font-size: 15px; font-weight: 700; margin: 0 0 12px 0; border-bottom: 1px solid #e5ede0; padding-bottom: 8px;">
                        ${subject}
                      </h3>
                      <div style="color: #3b5043; font-size: 14px; line-height: 1.6; word-break: break-word;">
                        ${formattedMessage}
                      </div>
                    </div>

                    <p style="color: #6a7c71; font-size: 13px; line-height: 1.5; margin: 25px 0 0 0;">
                      Please visit your FinanceOS dashboard to view details and take any necessary actions.
                    </p>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="background-color: #fafcf9; border-top: 1px solid #eef3ec; padding: 20px 30px; text-align: center;">
                    <p style="color: #8fa095; font-size: 12px; margin: 0;">
                      &copy; ${new Date().getFullYear()} FinanceOS &bull; Manage Today, Secure Tomorrow.
                    </p>
                    <p style="color: #a7b6ad; font-size: 11px; margin: 6px 0 0 0;">
                      This is an official communication sent to ${to}.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  transporter,
  sendAdminMessageEmail,
};
