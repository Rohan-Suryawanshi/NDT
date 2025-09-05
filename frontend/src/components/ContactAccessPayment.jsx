import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Loader2, Shield, Check, Lock, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import axios from "axios";
import { BACKEND_URL } from "@/constant/Global";
import { Location } from "@/constant/Location";

const ContactAccessPayment = ({ profile, onSuccess, onCancel }) => {
   const stripe = useStripe();
   const elements = useElements();
   const [processing, setProcessing] = useState(false);
   const [paymentSucceeded, setPaymentSucceeded] = useState(false);

   // Get user data and find matching location for pricing
   const userData = JSON.parse(localStorage.getItem('user') || '{}');
   const userCurrency = userData.currency || 'USD';
   
   // Find the location data based on user's currency
   const locationData = Location.find(location => location.currencyCode === userCurrency) || Location[0]; // Default to USD if not found
   const amount = locationData.chargeContactProvider;
   const currency = locationData.currencyCode;

   const cardElementOptions = {
      style: {
         base: {
            fontSize: "16px",
            color: "#424770",
            "::placeholder": {
               color: "#aab7c4",
            },
            padding: "12px",
         },
         invalid: {
            color: "#9e2146",
         },
      },
      hidePostalCode: true,
   };
   
   const formatCurrency = (amount) => {
      return `${new Intl.NumberFormat("en-US", {
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
      }).format(amount)} ${currency}`;
   };

   const handleSubmit = async (event) => {
      event.preventDefault();

      if (!stripe || !elements) {
         toast.error("Payment system not loaded. Please try again.");
         return;
      }

      setProcessing(true);

      try {
         const token = localStorage.getItem("accessToken");

         // Create payment intent for contact access
         const { data } = await axios.post(
            `${BACKEND_URL}/api/v1/contact-access/create-contact-payment-intent`,
            {
               providerId: profile.userId,
               providerName: profile.companyName,
               amount: Math.round(amount * 100), // Convert to cents
               currency: currency,
               description: `Contact access for ${profile.companyName}`,
            },
            {
               headers: { Authorization: `Bearer ${token}` },
            }
         );

         const { clientSecret } = data.data;

         // Confirm payment
         const cardElement = elements.getElement(CardElement);
         const { error, paymentIntent } = await stripe.confirmCardPayment(
            clientSecret,
            {
               payment_method: {
                  card: cardElement,
                  billing_details: {
                     name: profile.companyName,
                  },
               },
            }
         );

         if (error) {
            console.error("Payment failed:", error);
            toast.error(error.message || "Payment failed");
         } else if (paymentIntent && paymentIntent.status === "succeeded") {
            // Confirm payment on backend and get contact details
            const confirmResponse = await axios.post(
               `${BACKEND_URL}/api/v1/contact-access/confirm-contact-payment`,
               {
                  providerId: profile.userId,
                  paymentIntentId: paymentIntent.id,
                  status: "succeeded", 
               },
               {
                  headers: { Authorization: `Bearer ${token}` },
               }
            );

            setPaymentSucceeded(true);
            toast.success("Payment successful! Contact details revealed and sent to your email.");

            // Send email with contact details
            await axios.post(
               `${BACKEND_URL}/api/v1/contact-access/send-contact-email`,
               {
                  providerId: profile.userId,
                  providerName: profile.companyName,
                  providerEmail: profile.email,
                  providerPhone: profile.contactNumber,
                  accessType: 'one_time_purchase'
               },
               {
                  headers: { Authorization: `Bearer ${token}` },
               }
            );

            // Call success callback after a short delay
            setTimeout(() => {
               onSuccess(confirmResponse.data.contactDetails);
            }, 2000);
         }
      } catch (error) {
         console.error("Payment error:", error);
         toast.error(error.response?.data?.message || "Payment failed");
      } finally {
         setProcessing(false);
      }
   };

   if (paymentSucceeded) {
      return (
         <Card>
            <CardContent className="pt-6">
               <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                     <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                     <h3 className="text-lg font-semibold text-green-900">
                        Payment Successful!
                     </h3>
                     <p className="text-green-700 mt-1">
                        Contact details for {profile.companyName} have been revealed and sent to your email.
                     </p>
                  </div>
               </div>
            </CardContent>
         </Card>
      );
   }

   return (
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto w-full">
         {/* Provider Info */}
         <Card>
            <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-600" />
                  Contact Access Purchase
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               <div className="flex items-start gap-3">
                  {profile.companyLogoUrl ? (
                     <img
                        src={profile.companyLogoUrl}
                        alt={`${profile.companyName} logo`}
                        className="w-12 h-12 rounded-lg object-cover border"
                     />
                  ) : (
                     <div className="w-12 h-12 rounded-lg bg-[#004aad] flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                     </div>
                  )}
                  <div>
                     <h3 className="font-semibold">{profile.companyName}</h3>
                     <p className="text-sm text-gray-600">{profile.businessLocation || profile.companyLocation}</p>
                  </div>
               </div>

               <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                     <Lock className="h-4 w-4 text-amber-600 mt-0.5" />
                     <div className="text-sm">
                        <p className="font-medium text-amber-800">Premium Contact Information</p>
                        <div className="mt-1 space-y-1">
                           <div className="flex items-center gap-2 text-amber-700">
                              <Phone className="h-3 w-3" />
                              <span>Direct phone number</span>
                           </div>
                           <div className="flex items-center gap-2 text-amber-700">
                              <Mail className="h-3 w-3" />
                              <span>Email address</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Payment Summary */}
         <Card>
            <CardHeader>
               <CardTitle className="text-md">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
               <div className="flex justify-between text-sm">
                  <span>Contact Access Fee:</span>
                  <span>{formatCurrency(amount)}</span>
               </div>
               <div className="flex justify-between text-sm text-gray-500">
                  <span>Processing Fee:</span>
                  <span>Included</span>
               </div>
               <Separator />
               <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(amount)}</span>
               </div>
               <div className="text-xs text-gray-500 mt-2">
                  * One-time payment for permanent access to this provider's contact details
               </div>
            </CardContent>
         </Card>

         {/* Card Details */}
         <Card>
            <CardHeader>
               <CardTitle className="text-md flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Card Details
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               <div>
                  <Label htmlFor="card-element">Credit or Debit Card</Label>
                  <div className="mt-2 p-3 border rounded-md bg-white w-full">
                     <CardElement
                        id="card-element"
                        options={cardElementOptions}
                     />
                  </div>
               </div>

               <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                     <Shield className="h-4 w-4 text-[#004aad] mt-0.5 flex-shrink-0" />
                     <div>
                        <p className="text-sm font-medium text-[#004aad]">
                           Secure Payment
                        </p>
                        <p className="text-xs text-[#004aad] mt-1">
                           Your payment information is encrypted and secure. Contact details will be sent to your email.
                        </p>
                     </div>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Action Buttons */}
         <div className="flex gap-3">
            <Button
               type="button"
               variant="outline"
               onClick={onCancel}
               disabled={processing}
               className="flex-1"
            >
               Cancel
            </Button>
            <Button
               type="submit"
               disabled={!stripe || processing}
               className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
               {processing ? (
                  <>
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     Processing...
                  </>
               ) : (
                  <>
                     <CreditCard className="h-4 w-4 mr-2" />
                     Pay {formatCurrency(amount)}
                  </>
               )}
            </Button>
         </div>
      </form>
   );
};

export default ContactAccessPayment;
