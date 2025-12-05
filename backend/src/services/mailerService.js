import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  BASE_URL,
} = process.env;

if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
  console.warn(
    "EMAIL_* env vars not fully set. Email sending will fail until configured."
  );
}

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT) || 587,
  secure: false, 
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Send an RFP email to a single vendor.
export async function sendRfpEmailToVendor({ vendor, rfp }) {
  const to = vendor.email;
  const subject = `RFP: ${rfp.title || "New RFP from our company"}`;

  const structured = rfp.structured || {};
  const itemsText = (structured.items || [])
    .map((it) => `- ${it.quantity || ""} ${it.name} (${it.specs || ""})`)
    .join("\n");

  // This could be th frontend URL but i'll just use BASE_URL for now
  const appLink = BASE_URL || "http://localhost:5000";

  const text = `
Hi ${vendor.name || "Vendor"},

You have been invited to respond to the following Request for Proposal (RFP).

Title: ${rfp.title || "(no title)"}

Original description:
${rfp.naturalLanguageDescription || "(not provided)"}

Key details:
- Budget: ${structured.budget ?? "N/A"}
- Delivery timeline (days): ${structured.deliveryTimelineDays ?? "N/A"}
- Minimum warranty (months): ${structured.warrantyMonths ?? "N/A"}
- Payment terms: ${structured.paymentTerms || "N/A"}

Items / Scope:
${itemsText || "(not listed)"}

How to respond:
Please reply to this email with your commercial & technical proposal, including:
- Total price
- Delivery timeline
- Warranty terms
- Payment terms
- Any other conditions

Your response will be automatically parsed by our internal AI RFP tool.

If you have any questions, reply to this email.

Best regards,
RFP Team

(Internal link for requester: ${appLink})
  `.trim();

  const mailOptions = {
    from: EMAIL_FROM || EMAIL_USER,
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
}
