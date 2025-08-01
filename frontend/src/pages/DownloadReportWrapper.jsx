import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import DownloadReport from './DownloadReport';

// Load Stripe (replace with your actual publishable key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RoPFEEMrHLNlt2XS0uEdOi4DD8FDgu7JCMRGAXBL6vdzVGSnySMGuc5acuXEJcKM9BLf5DOBVVk2YxZV8A9JRge00vlsS8gdv');

const DownloadReportWrapper = () => {
  return (
    <Elements stripe={stripePromise}>
      <DownloadReport />
    </Elements>
  );
};

export default DownloadReportWrapper;
