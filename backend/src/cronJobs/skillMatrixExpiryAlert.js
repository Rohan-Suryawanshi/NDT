import cron from "node-cron";
import { SkillMatrix } from "../models/SkillMatrix.model.js";
import { sendEmail } from "../utils/SendMail.js";


// Run every day at 9 AM
cron.schedule("0 9 * * *", async () => {
  console.log("🔔 Checking SkillMatrix for expiring certifications...");

  try {
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);

    // Find technicians with expiring certificates
    const technicians = await SkillMatrix.find({
      certificates: {
        $elemMatch: {
          certificationExpiryDate: {
            $gte: today,
            $lte: sevenDaysLater,
          },
        },
      },
    }).populate("userId", "email name");

    console.log(technicians)

    for (const tech of technicians) {
      const expiringCerts = tech.certificates.filter(
        (cert) =>
          cert.certificationExpiryDate >= today &&
          cert.certificationExpiryDate <= sevenDaysLater
      );

      if (expiringCerts.length > 0) {
        await sendEmail({
          to: tech.userId.email,
          // to:"a90685766@gmail.com",
          subject: "⚠️ SkillMatrix Certification Expiry Alert",
          html: `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">SkillMatrix Certification Expiry Alert</h2>
      </div>

      <!-- Body -->
      <div style="padding: 20px; color: #333; line-height: 1.6;">
        <p>Hi <strong>${tech.technician.name}</strong>,</p>
        <p>
          The following certifications will <strong style="color: #dc2626;">expire within 7 days</strong>.  
          Please renew them on time to remain active in the system.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <thead>
            <tr style="background: #f3f4f6; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e5e7eb;">Method</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb;">Level</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb;">Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            ${expiringCerts
              .map(
                (c) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${c.method}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${c.level}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #dc2626;">
                  ${new Date(c.certificationExpiryDate).toDateString()}
                </td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>

        <p style="margin-top: 20px;">
          ⚡ <strong>Action Required:</strong> Please update your certifications in your SkillMatrix to remain compliant.
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
          `✅ Sent SkillMatrix expiry alert to ${tech.userId.email} for ${expiringCerts.length} certs`
        );
      }
    }
  } catch (err) {
    console.error("❌ Error in SkillMatrix expiry cron:", err.message);
  }
});
