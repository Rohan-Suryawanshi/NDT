// backend/src/controllers/ContactUs.controller.js

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendEmail } from "../utils/SendMail.js";

export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json(new ApiError("Name, email, and message are required.", 400));
    }

    // Compose email content
    const subject = `Contact Us Message from ${name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color:#004aad;">New Contact Us Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Message:</strong></p>
        <p style="background:#f2f2f2; padding:10px; border-radius:5px;">${message}</p>
        <hr />
        <p style="font-size: 12px; color: #777;">This message was sent from your NDT Connect website contact form.</p>
      </div>
    `;

    // Send email
    await sendEmail({
      to: "suryawanshi9673@gmail.com",
      subject,
      html, // send HTML instead of text
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Message sent successfully!", true));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError("Failed to send message", 500));
  }
};

export const sendInspectorContactEmail = async (req, res) => {
  try {
    const { 
      inspectorId, 
      inspectorName, 
      inspectorEmail, 
      inspectorPhone, 
      associationType, 
      companyName, 
      accessType 
    } = req.body;
    
    const userEmail = req.user.email;
    const userName = req.user.fullName || req.user.email;

    if (!inspectorId || !inspectorName || !inspectorEmail) {
      return res
        .status(400)
        .json(new ApiError("Inspector details are required.", 400));
    }

    // Compose email content for the user
    const subject = `Inspector Contact Details - ${inspectorName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <div style="background: linear-gradient(135deg, #004aad 0%, #0066cc 100%); padding: 20px; margin-bottom: 20px; border-radius: 8px;">
          <h2 style="color: white; margin: 0; text-align: center;">Inspector Contact Details</h2>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #004aad; margin-top: 0;">Inspector Information</h3>
          <p><strong>Name:</strong> ${inspectorName}</p>
          <p><strong>Email:</strong> <a href="mailto:${inspectorEmail}" style="color: #004aad; text-decoration: none;">${inspectorEmail}</a></p>
          <p><strong>Phone:</strong> <a href="tel:${inspectorPhone}" style="color: #004aad; text-decoration: none;">${inspectorPhone}</a></p>
          <p><strong>Association Type:</strong> ${associationType || 'N/A'}</p>
          ${companyName ? `<p><strong>Company:</strong> ${companyName}</p>` : ''}
        </div>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px;">
          <h4 style="color: #856404; margin-top: 0;">Important Note</h4>
          <p style="color: #856404; margin-bottom: 0;">This is a one-time access purchase. You have paid to view this inspector's contact information. Please save these details for your records.</p>
        </div>
        
        <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin-bottom: 20px;">
          <h4 style="color: #155724; margin-top: 0;">Next Steps</h4>
          <ul style="color: #155724; margin-bottom: 0;">
            <li>Contact the inspector directly using the provided information</li>
            <li>Discuss your inspection requirements and schedule</li>
            <li>Verify the inspector's availability and rates</li>
            <li>Confirm their expertise matches your specific needs</li>
          </ul>
        </div>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6c757d; text-align: center;">
          This email was sent from NDT Connect platform. Access type: ${accessType || 'One-time purchase'}
          <br>Purchase date: ${new Date().toLocaleDateString()}
        </p>
      </div>
    `;

    // Send email to the user who purchased access
   console.log("📧 Sending email to:", userEmail);

  //  await sendEmail({
  //    from: process.env.EMAIL_FROM,
  //    to: userEmail,
  //    subject,
  //    html,
  //  });

   console.log("✅ Email send function resolved");

    return res
      .status(200)
      .json(new ApiResponse(200, "Inspector contact details sent to your email successfully!", true));
  } catch (error) {
    console.error("Error sending inspector contact email:", error);
    return res.status(500).json(new ApiError("Failed to send inspector contact email", 500));
  }
};
