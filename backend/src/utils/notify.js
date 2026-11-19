import nodemailer from 'nodemailer';

export async function notifyEnquiry(enquiry) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, ENQUIRY_NOTIFY_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !ENQUIRY_NOTIFY_EMAIL) return false;
  const transport = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: SMTP_USER, pass: SMTP_PASSWORD } });
  await transport.sendMail({
    from: SMTP_USER,
    to: ENQUIRY_NOTIFY_EMAIL,
    subject: `New website enquiry ${enquiry.reference}`,
    text: [`Reference: ${enquiry.reference}`, `Customer: ${enquiry.customerName}`, `Company: ${enquiry.companyName || '—'}`, `Phone: ${enquiry.mobile}`, `Email: ${enquiry.email || '—'}`, `Product: ${enquiry.productName || '—'}`, `Category: ${enquiry.category || '—'}`, `Quantity: ${enquiry.quantity || '—'}`, `Message: ${enquiry.message || '—'}`].join('\n')
  });
  return true;
}
