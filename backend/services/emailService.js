// ============================================================
// FINANCEOS - CENTRALIZED EMAIL SERVICE (PRODUCTION SMTP)
// ============================================================

const nodemailer = require("nodemailer");

/**
 * Safe email masker for logs: never exposes full email or credentials
 */
function maskEmail(email) {
  if (!email || typeof email !== "string") return "unknown";
  const parts = email.trim().split("@");
  if (parts.length !== 2) return "***@***";
  const user = parts[0];
  const domain = parts[1];
  const maskedUser =
    user.length > 2
      ? `${user[0]}***${user[user.length - 1]}`
      : `${user[0]}***`;
  return `${maskedUser}@${domain}`;
}

/**
 * Validates if an email is syntactically valid and has a deliverable external domain.
 * Blocks obvious dummy/mock/typo domains to prevent silent outbound bounces.
 */
function isDeliverableEmail(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();

  // Basic structure check: must have user@domain.tld with tld >= 2 chars
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) return false;

  const [, domain] = trimmed.split("@");
  if (!domain) return false;

  // Disallow mock / test / placeholder domains
  const blockedDomains = [
    "test.com",
    "example.com",
    "example.org",
    "example.net",
    "fake.com",
    "sample.com",
    "financeos-test.com",
    "invalid.com",
    "localhost",
  ];
  if (blockedDomains.includes(domain)) return false;

  // Disallow obvious typos like .com.com, .co.com, or incomplete TLDs
  if (
    domain.endsWith(".com.com") ||
    domain.endsWith(".co.com") ||
    domain.endsWith(".test")
  ) {
    return false;
  }

  // TLD check (last segment after dot must be at least 2 alpha characters)
  const segments = domain.split(".");
  const tld = segments[segments.length - 1];
  if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return false;
  }

  return true;
}

const hasEmailConfig = Boolean(
  process.env.EMAIL_USER && process.env.EMAIL_PASSWORD
);

// Normalize app password: strip spaces for reliability
const normalizedEmailPassword = (process.env.EMAIL_PASSWORD || "")
  .toString()
  .replace(/\s+/g, "");

// Explicit Gmail SMTP direct SSL configuration (Port 465, pooled, with timeouts)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: normalizedEmailPassword,
  },
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

/**
 * Verify transporter at startup without logging sensitive secrets.
 */
async function verifyTransporter() {
  if (!hasEmailConfig) {
    console.log("Email service configured: NO");
    return false;
  }

  console.log("Email service configured: YES");
  try {
    await transporter.verify();
    console.log("SMTP transporter verified: YES");
    return true;
  } catch (error) {
    console.error("SMTP transporter verified: NO -", error.message);
    return false;
  }
}

/**
 * Base email sender helper. Inspects accepted/rejected to verify SMTP acceptance.
 */
async function sendEmail({ to, subject, text, html }) {
  const cleanTo = (to || "").trim();

  if (!cleanTo) {
    console.warn("[EmailService] Missing recipient email address.");
    return {
      success: false,
      error: "No recipient email provided",
      accepted: [],
      rejected: [],
    };
  }

  if (!isDeliverableEmail(cleanTo)) {
    console.warn(
      `[EmailService] Recipient rejected: Invalid or undeliverable format: ${maskEmail(cleanTo)}`
    );
    return {
      success: false,
      error: `Recipient address '${maskEmail(cleanTo)}' is invalid, mock, or undeliverable`,
      accepted: [],
      rejected: [cleanTo],
    };
  }

  const senderEmail = process.env.EMAIL_USER;
  if (!senderEmail) {
    console.error("[EmailService] EMAIL_USER not configured.");
    return {
      success: false,
      error: "EMAIL_USER not configured on server",
      accepted: [],
      rejected: [cleanTo],
    };
  }

  const mailOptions = {
    from: `"FinanceOS" <${senderEmail}>`,
    to: cleanTo,
    replyTo: senderEmail,
    subject: subject || "FinanceOS Notification",
    text: text || "",
    html: html || text || "",
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    const accepted = Array.isArray(info.accepted) ? info.accepted : [];
    const rejected = Array.isArray(info.rejected) ? info.rejected : [];
    const isAccepted = accepted.length > 0 && !rejected.includes(cleanTo);

    console.log(
      `[EmailService] SMTP Dispatch: Recipient=${maskEmail(cleanTo)} | Accepted=${isAccepted} | Response=${info.response || "250 OK"} | MessageId=${info.messageId}`
    );

    return {
      success: isAccepted,
      accepted,
      rejected,
      response: info.response,
      messageId: info.messageId,
      envelope: info.envelope,
      error: isAccepted
        ? null
        : "Recipient address was not accepted by SMTP server",
    };
  } catch (error) {
    console.error(
      `[EmailService] SMTP Failure to ${maskEmail(cleanTo)}:`,
      error.message
    );
    return {
      success: false,
      error: error.message,
      accepted: [],
      rejected: [cleanTo],
    };
  }
}

/**
 * Send an email notification for Admin messages and system communications
 */
async function sendAdminMessageEmail({
  to,
  recipientName = "FinanceOS User",
  subject = "FinanceOS Communication",
  message = "",
  category = "Important Update",
}) {
  const formattedMessage = message
    ? message.replace(/\n/g, "<br/>")
    : "You have a new update in your FinanceOS account.";

  const html = `
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
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2ebd9; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              
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
                    This is an official communication sent to ${maskEmail(to)}.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `Hello ${recipientName},\n\n${message}\n\nRegards,\nFinanceOS Team`;

  return sendEmail({
    to,
    subject: subject || "FinanceOS Communication",
    text,
    html,
  });
}

/**
 * Send a financial reminder email with real MongoDB data
 * Format follows PART N requirement strictly:
 * Subject: FinanceOS Reminder: <Reminder Title>
 * Body:
 * Hello <User Name>,
 * This is your FinanceOS reminder.
 * Reminder: <Title>
 * Details: <Description>
 * Due: <Date and Time>
 * Linked financial item: <actual linked item if available>
 * Please review your FinanceOS account.
 * Regards,
 * FinanceOS
 */
async function sendReminderEmail({
  to,
  recipientName = "FinanceOS User",
  reminderTitle = "Financial Reminder",
  description = "Upcoming financial obligation",
  dueDate = "Upcoming",
  linkedItem = null,
  category = "Reminder",
  amount = 0,
}) {
  const formattedDueDate = dueDate instanceof Date
    ? dueDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : String(dueDate || "Upcoming");

  const formattedAmount = Number(amount) > 0
    ? `₹${Number(amount).toLocaleString("en-IN")}`
    : null;

  const linkedItemStr = linkedItem
    ? `${linkedItem} (${category})`
    : `${category} reminder`;

  const subject = `FinanceOS Reminder: ${reminderTitle}`;

  const text = `Hello ${recipientName},\n\nThis is your FinanceOS reminder.\n\nReminder:\n${reminderTitle}\n\nDetails:\n${description}\n\nDue:\n${formattedDueDate}${formattedAmount ? `\nAmount: ${formattedAmount}` : ""}\n\nLinked financial item:\n${linkedItemStr}\n\nPlease review your FinanceOS account.\n\nRegards,\nFinanceOS`;

  const html = `
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
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2ebd9; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              
              <!-- HEADER -->
              <tr>
                <td style="background: linear-gradient(135deg, #173b2b 0%, #295741 100%); padding: 30px; text-align: left;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">
                    Finance<span style="color: #8ed867;">OS</span>
                  </h1>
                  <p style="color: #c9decb; margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                    Financial Reminder &bull; ${category}
                  </p>
                </td>
              </tr>

              <!-- BODY -->
              <tr>
                <td style="padding: 35px 30px 25px 30px;">
                  <p style="color: #173b2b; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">
                    Hello ${recipientName},
                  </p>
                  <p style="color: #4b5e52; font-size: 14px; margin: 0 0 20px 0;">
                    This is your FinanceOS reminder.
                  </p>
                  
                  <div style="background-color: #f9fbf8; border: 1px solid #e5ede0; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <div style="margin-bottom: 12px;">
                      <span style="font-size: 11px; font-weight: 700; color: #6a7c71; text-transform: uppercase; letter-spacing: 0.5px;">Reminder</span>
                      <div style="color: #173b2b; font-size: 16px; font-weight: 700; margin-top: 2px;">
                        ${reminderTitle}
                      </div>
                    </div>

                    <div style="margin-bottom: 12px;">
                      <span style="font-size: 11px; font-weight: 700; color: #6a7c71; text-transform: uppercase; letter-spacing: 0.5px;">Details</span>
                      <div style="color: #3b5043; font-size: 14px; margin-top: 2px; line-height: 1.5;">
                        ${description}
                      </div>
                    </div>

                    <div style="margin-bottom: 12px; display: flex; gap: 20px;">
                      <div>
                        <span style="font-size: 11px; font-weight: 700; color: #6a7c71; text-transform: uppercase; letter-spacing: 0.5px;">Due Date</span>
                        <div style="color: #28553d; font-size: 14px; font-weight: 600; margin-top: 2px;">
                          ${formattedDueDate}
                        </div>
                      </div>
                      ${
                        formattedAmount
                          ? `
                        <div style="margin-left: 25px;">
                          <span style="font-size: 11px; font-weight: 700; color: #6a7c71; text-transform: uppercase; letter-spacing: 0.5px;">Amount</span>
                          <div style="color: #173b2b; font-size: 14px; font-weight: 700; margin-top: 2px;">
                            ${formattedAmount}
                          </div>
                        </div>
                      `
                          : ""
                      }
                    </div>

                    <div style="border-top: 1px solid #eef3ec; padding-top: 12px; margin-top: 12px;">
                      <span style="font-size: 11px; font-weight: 700; color: #6a7c71; text-transform: uppercase; letter-spacing: 0.5px;">Linked Financial Item</span>
                      <div style="color: #3b5043; font-size: 13px; margin-top: 2px;">
                        ${linkedItemStr}
                      </div>
                    </div>
                  </div>

                  <p style="color: #6a7c71; font-size: 13px; line-height: 1.5; margin: 25px 0 0 0;">
                    Please review your FinanceOS account to stay on top of your financial plan.
                  </p>

                  <p style="color: #173b2b; font-size: 14px; font-weight: 600; margin: 20px 0 0 0;">
                    Regards,<br/>
                    FinanceOS
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
                    Sent to ${maskEmail(to)}. This notification does not alter your account balances or financial records.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    text,
    html,
  });
}

/**
 * Consolidated OTP email sender for authentication
 */
async function sendOTPEmail(email, otp) {
  const subject = "FinanceOS Login OTP";
  const text = `Hello,\n\nYour OTP for signing in to FinanceOS is: ${otp}\n\nThis OTP is valid for 5 minutes.\n\nFinanceOS - Manage Today, Secure Tomorrow`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #f7f9f4; border-radius: 12px;">
      <h2 style="color:#43822e;">FinanceOS</h2>
      <p>Hello,</p>
      <p>Your OTP for signing in to FinanceOS is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #173b2b; background: #e7f3d8; padding: 18px; text-align: center; border-radius: 10px; margin: 20px 0;">
        ${otp}
      </div>
      <p>This OTP is valid for <strong>5 minutes</strong>.</p>
      <p style="color:#777;">If you did not request this OTP, please ignore this email.</p>
      <hr />
      <p style="font-size:12px;color:#888;">FinanceOS - Manage Today, Secure Tomorrow</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}

module.exports = {
  transporter,
  maskEmail,
  isDeliverableEmail,
  verifyTransporter,
  sendEmail,
  sendAdminMessageEmail,
  sendReminderEmail,
  sendOTPEmail,
};
