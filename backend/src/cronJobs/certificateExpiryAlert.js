import cron from "node-cron";
import { sendEmail } from "../utils/SendMail.js";
import { InspectorProfile } from "../models/InspectorProfile.model.js";

// Run every day at 9 AM
cron.schedule("0 9 * * *", async () => {
  console.log("🔔 Checking for expiring certifications...");

  try {
    // Find inspectors with certifications expiring in 7 days
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);

    const inspectors = await InspectorProfile.find({
      "certifications.expiryDate": { $gte: today, $lte: sevenDaysLater },
      certificateExpiryAlerts: true, // only if alerts enabled
    }).populate("userId", "email name");

    for (const inspector of inspectors) {
      const expiringCerts = inspector.certifications.filter(
        (cert) => cert.expiryDate >= today && cert.expiryDate <= sevenDaysLater
      );

      if (expiringCerts.length > 0) {
        // Send email alert
        await sendEmail({
          to: inspector.userId.email,
          subject: "⚠️ Certification Expiry Alert",
          html: `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background: #004aad; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px; color: white">Certification Expiry Alert</h2>
      </div>

      <!-- Body -->
      <div style="padding: 20px; color: #333; line-height: 1.6;">
        <p>Hi <strong>${inspector.fullName}</strong>,</p>
        <p>
          The following certifications will <strong style="color: #dc2626;">expire within 7 days</strong>.  
          Please renew them on time to remain verified.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <thead>
            <tr style="background: #f3f4f6; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e5e7eb;">Certification Body</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb;">Level</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb;">Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            ${expiringCerts
              .map(
                (c) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${c.certificationBody}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${c.level}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #dc2626;">
                  ${new Date(c.expiryDate).toDateString()}
                </td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>

        <p style="margin-top: 20px;">
          ⚡ <strong>Action Required:</strong> Please update your certifications to continue being eligible for assignments.  
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>This is an automated reminder from <strong>Your Company</strong>.</p>
        <p>Please do not reply to this email.</p>
      </div>
    </div>
  </div>
  `,
        });

        console.log(
          `✅ Sent expiry alert to ${inspector.userId.email} for ${expiringCerts.length} certs`
        );
      }
    }
  } catch (err) {
    console.error("❌ Error in certification expiry cron:", err.message);
  }
});
