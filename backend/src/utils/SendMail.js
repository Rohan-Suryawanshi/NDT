// // utils/sendEmail.js
// import nodemailer from "nodemailer";

// export const sendEmail = async ({ to, subject, html }) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail", // or use Mailgun/SMTP
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to,
//     subject,
//     html,
//   });
// };
// utils/sendEmail.js
import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import "isomorphic-fetch"; // required by microsoft-graph-client

// Create credential using Azure AD app registration
const credential = new ClientSecretCredential(
  process.env.AZURE_TENANT_ID,     // Tenant ID (Directory ID)
  process.env.AZURE_CLIENT_ID,     // App (Client) ID
  process.env.AZURE_CLIENT_SECRET  // Client Secret (Value)
);

// Initialize Graph client
const graphClient = Client.initWithMiddleware({
  authProvider: {
    getAccessToken: async () => {
      const token = await credential.getToken("https://graph.microsoft.com/.default");
      return token.token;
    },
  },
});

// Send Email Function
export const sendEmail = async ({ to, subject, html }) => {
  const message = {
    message: {
      subject,
      body: {
        contentType: "HTML",
        content: html,
      },
      toRecipients: [
        {
          emailAddress: { address: to },
        },
      ],
    },
    saveToSentItems: "true",
  };

  try {
    await graphClient.api(`/users/${process.env.MS_EMAIL}/sendMail`).post(message);
    console.log("✅ Email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};
