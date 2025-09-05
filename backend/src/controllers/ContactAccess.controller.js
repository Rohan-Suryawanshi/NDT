// Contact Access Controller Implementation
// File: backend/src/controllers/ContactAccess.controller.js


import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import { ContactAccess } from '../models/ContactAccess.model.js';
import { sendEmail } from '../utils/SendMail.js';
import { ServiceProviderProfile } from '../models/ServiceProviderProfile.model.js';
import { User } from '../models/User.model.js';

// Create payment intent for contact access
const createContactPaymentIntent = async (req, res) => {
  try {
    const { providerId, providerName, amount, currency, description } = req.body;
    const userId = req.user.id;

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in cents
      currency: currency || 'usd',
      description: description || `Contact access for ${providerName}`,
      metadata: {
        userId,
        providerId,
        type: 'contact_access'
      }
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent'
    });
  }
};

// Confirm contact payment and log access
const confirmContactPayment = async (req, res) => {
  try {
    const { providerId, paymentIntentId, status } = req.body;
    const userId = req.user.id;

    if (status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Get provider details
    const provider = await ServiceProviderProfile.findOne({ userId: providerId });
    const userProvider = await User.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Create contact access record
    const contactAccess = new ContactAccess({
      userId,
      providerId,
      providerEmail: userProvider.email,
      providerPhone: provider.contactNumber,

      amountPaid: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      transactionId: paymentIntentId,
      paymentStatus: "succeeded",
      accessDate: new Date(),
    });

    await contactAccess.save();

    // Return contact details
    res.status(200).json({
      success: true,
      data: {
        contactDetails: {
          phone: provider.contactNumber,
          email: provider.email
        }
      }
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment'
    });
  }
};

// Send contact details via email
const sendContactEmail = async (req, res) => {
  try {
    const { providerId, providerName, providerEmail, providerPhone, accessType } = req.body;
    const userId = req.user.id;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }


    // Email template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #004aad;">Contact Information Access</h2>
        <p>Hello ${user.fullName || user.name},</p>
        <p>You have successfully purchased access to contact information for <strong>${providerName}</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #004aad; margin-top: 0;">Contact Details:</h3>
          <p><strong>Company:</strong> ${providerName}</p>
          <p><strong>Phone:</strong> ${providerPhone}</p>
        </div>
        
        <p>This information is now available for your use. Please reach out to the provider directly for any service inquiries.</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent because you purchased contact access on our platform.
          If you have any questions, please contact our support team.
        </p>
      </div>
    `;

    // Send email
    await sendEmail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `Contact Information for ${providerName}`,
      html: emailHtml
    });

    // Update contact access record to mark email as sent
    await ContactAccess.findOneAndUpdate(
      { userId, providerId },
      { emailSent: true },
      { sort: { createdAt: -1 } }
    );

    res.status(200).json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email'
    });
  }
};

// Admin: Get contact access data
const getContactAccessData = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get contact access records with populated user and provider data
    const contactAccess = await ContactAccess.find()
      .populate("userId", "fullName name email")
      .populate("providerId", "companyName contactNumber")
      .populate("inspectorId", "contactNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

      console.log(await ContactAccess.find());



    // Get total count for pagination
    const totalCount = await ContactAccess.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    // Calculate stats
    const stats = await ContactAccess.aggregate([
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalRevenue: { $sum: '$amountPaid' },
          uniqueUsers: { $addToSet: '$userId' },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'succeeded'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          totalPurchases: 1,
          totalRevenue: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          successRate: {
            $multiply: [
              { $divide: ['$successfulPayments', '$totalPurchases'] },
              100
            ]
          }
        }
      }
    ]);

    const statsData = stats[0] || {
      totalPurchases: 0,
      totalRevenue: 0,
      uniqueUsers: 0,
      successRate: 0
    };

    res.status(200).json({
      success: true,
      data: {
        contactAccess,
        totalPages,
        stats: statsData
      }
    });
  } catch (error) {
    console.error('Get contact access data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact access data'
    });
  }
};

export {
  createContactPaymentIntent,
  confirmContactPayment,
  sendContactEmail,
  getContactAccessData,
};

