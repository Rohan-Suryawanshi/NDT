// utils/sendEmail.js
import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",   // Microsoft SMTP
    port: 587,
    secure: false,                // STARTTLS
    auth: {
      user: process.env.EMAIL_USER, // e.g. support@yourdomain.com
      pass: process.env.EMAIL_PASS, // app password or real password
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER, // must match the authenticated user
    to,
    subject,
    html,
  });
};
