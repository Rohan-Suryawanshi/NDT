import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import DownloadReport from './DownloadReport';

// Load Stripe (replace with your actual publishable key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const DownloadReportWrapper = () => {
  return (
    <Elements stripe={stripePromise}>
      <DownloadReport />
    </Elements>
  );
};

export default DownloadReportWrapper;
