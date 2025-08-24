import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Loader2, Shield, Check } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { BACKEND_URL } from "@/constant/Global";

const StripePaymentForm = ({ job, paymentDetails, onSuccess, onCancel }) => {
   const stripe = useStripe();
   const elements = useElements();
   const [processing, setProcessing] = useState(false);
   const [paymentSucceeded, setPaymentSucceeded] = useState(false);
   console.log(paymentDetails);

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

   const handleSubmit = async (event) => {
      event.preventDefault();

      if (!stripe || !elements) {
         toast.error("Payment system not loaded. Please try again.");
         return;
      }

      setProcessing(true);

      try {
         const token = localStorage.getItem("accessToken");
         

         // Create payment intent
         const { data } = await axios.post(
            `${BACKEND_URL}/api/v1/payments/create-payment-intent`,
            {
               jobId: job._id,
               amount: Math.round(paymentDetails.totalAmount * 100),
               currency: job.costDetails?.currency || "USD",
               description: `Payment for job: ${job.title}`,
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
                     name: job.clientName,
                     email: job.clientEmail,
                  },
               },
            }
         );

         if (error) {
            console.error("Payment failed:", error);
            toast.error(error.message || "Payment failed");
         } else if (paymentIntent && paymentIntent.status === "succeeded") {
            // Confirm payment on backend
            await axios.post(
               `${BACKEND_URL}/api/v1/payments/confirm-payment`,
               {
                  jobId: job._id,
                  paymentIntentId: paymentIntent.id,
                  status: "succeeded",
               },
               {
                  headers: { Authorization: `Bearer ${token}` },
               }
            );

            setPaymentSucceeded(true);
            toast.success("Payment successful! You can now download reports.");

            // Call success callback after a short delay
            setTimeout(() => {
               onSuccess();
            }, 2000);
         }
      } catch (error) {
         console.error("Payment error:", error);
         toast.error(error.response?.data?.message || "Payment failed");
      } finally {
         setProcessing(false);
      }
   };

   //  const formatCurrency = (amount) => {
   //     return new Intl.NumberFormat("en-US", {
   //        style: "currency",
   //        currency: job.costDetails?.currency,
   //     }).format(amount);
   //  };

   const formatCurrency = (amount) => {
      return `${new Intl.NumberFormat("en-US", {
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
      }).format(amount)} ${job.costDetails?.currency}`;
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
                        Your payment has been processed successfully. You now
                        have access to download reports and attachments.
                     </p>
                  </div>
               </div>
            </CardContent>
         </Card>
      );
   }

   return (
      <form
         onSubmit={handleSubmit}
         className="space-y-3 max-w-md mx-auto w-full"
      >
         {/* Payment Summary */}
         <Card>
            <CardHeader>
               <CardTitle className="text-md">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
               <div className="flex justify-between text-sm">
                  <span>Job Amount:</span>
                  <span>{formatCurrency(paymentDetails.baseAmount)}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span>Platform Fee (5%):</span>
                  <span>{formatCurrency(paymentDetails.platformFee)}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span>Processing Fee:</span>
                  <span>{formatCurrency(paymentDetails.processingFee)}</span>
               </div>
               <Separator />
               <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(paymentDetails.totalAmount)}</span>
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
            <CardContent className="space-y-2">
               <div>
                  <Label htmlFor="card-element">Credit or Debit Card</Label>
                  <div className="mt-2 p-3 border rounded-md bg-white w-full max-w-md">
                     <CardElement
                        id="card-element"
                        options={cardElementOptions}
                     />
                  </div>
               </div>

               <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                     <Shield className="h-5 w-5 text-[#004aad] mt-0.5 flex-shrink-0" />
                     <div>
                        <p className="text-sm font-medium text-[#004aad]">
                           Secure Payment
                        </p>
                        <p className="text-xs text-[#004aad] mt-1">
                           Your payment information is encrypted and secure. We
                           use industry-standard security measures to protect
                           your data.
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
               className="flex-1"
            >
               {processing ? (
                  <>
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     Processing...
                  </>
               ) : (
                  <>
                     <CreditCard className="h-4 w-4 mr-2" />
                     Pay {formatCurrency(paymentDetails.totalAmount)}
                  </>
               )}
            </Button>
         </div>
      </form>
   );
};

export default StripePaymentForm;
