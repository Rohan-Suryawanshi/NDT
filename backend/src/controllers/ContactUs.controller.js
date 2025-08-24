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
