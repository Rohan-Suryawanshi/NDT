# Mobile Number Verification Setup Guide

This guide explains how to set up and use the mobile number verification feature using Twilio SMS API.

## Prerequisites

1. **Twilio Account**: Sign up at [https://www.twilio.com/](https://www.twilio.com/)
2. **Twilio Phone Number**: Purchase a phone number from Twilio console
3. **API Credentials**: Get your Account SID and Auth Token from Twilio console

## Environment Variables Setup

Add the following variables to your `.env` file:

```bash
# Twilio Configuration for OTP
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

### How to get Twilio credentials:

1. **Account SID & Auth Token**:
   - Login to Twilio Console
   - Go to Dashboard
   - Find "Account SID" and "Auth Token" in the project info section

2. **Phone Number**:
   - Go to Phone Numbers → Manage → Active numbers
   - If you don't have one, buy a new number
   - Use the format: `+1234567890` (with country code)

## API Endpoints

### 1. Send OTP
```http
POST /api/v1/service-provider/send-otp
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "contactNumber": "+1234567890"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "messageSid": "SM1234567890abcdef"
  },
  "message": "OTP sent successfully"
}
```

### 2. Verify OTP
```http
POST /api/v1/service-provider/verify-otp
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "contactNumber": "+1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "verified": true
  },
  "message": "OTP verified successfully"
}
```

## How the Verification Works

1. **User enters phone number** in the Service Provider Profile form
2. **Click "Send OTP"** button to request verification code
3. **System generates** a 6-digit random OTP
4. **Twilio sends SMS** with the OTP to the provided number
5. **User enters OTP** in the verification field
6. **System verifies** the OTP and marks phone as verified
7. **User can now save** the profile (submit button is disabled until verification)

## Security Features

- **OTP Expiry**: OTPs expire after 5 minutes
- **Verification Window**: Phone verification is valid for 10 minutes after OTP verification
- **No Persistent Storage**: OTPs are stored in memory only (use Redis in production)
- **Rate Limiting**: Consider adding rate limiting for OTP requests in production

## Frontend Integration

The frontend automatically handles:
- ✅ Phone number input validation
- ✅ Send OTP button functionality
- ✅ OTP input field
- ✅ Verification status display
- ✅ Form submission control (disabled until verified)
- ✅ Visual feedback for verification status

## Error Handling

Common error scenarios handled:
- Invalid phone number format
- OTP send failures
- Invalid or expired OTP
- Network connectivity issues
- Twilio API errors

## Production Considerations

1. **Use Redis**: Replace in-memory storage with Redis for OTP and verification data
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Phone Number Validation**: Add more robust phone number validation
4. **Audit Logging**: Log verification attempts for security monitoring
5. **Twilio Webhook**: Consider using Twilio webhooks for delivery status

## Testing

### Test with Twilio's Magic Number (Sandbox):
- Use `+15005550006` as the "To" number for testing
- This number will always receive messages successfully in sandbox mode

### Example Test Flow:
1. Enter `+15005550006` as contact number
2. Click "Send OTP"
3. Check Twilio console logs for the OTP
4. Enter the OTP to verify

## Troubleshooting

### Common Issues:

1. **"Failed to send OTP"**:
   - Check Twilio credentials in .env file
   - Verify Twilio account has sufficient balance
   - Check phone number format (must include country code)

2. **"Invalid OTP"**:
   - OTP might have expired (5-minute limit)
   - Check for typos in OTP entry
   - Ensure correct phone number was used

3. **"Phone number must be verified"**:
   - Complete OTP verification before saving profile
   - Verification expires after 10 minutes

### Debug Steps:
1. Check backend console logs for Twilio API responses
2. Verify environment variables are loaded correctly
3. Test with Twilio's magic numbers first
4. Check Twilio console for delivery status

## Cost Considerations

- Twilio charges per SMS sent
- Current pricing: ~$0.0075 per SMS (varies by country)
- Consider implementing daily limits per user to control costs

## Security Notes

⚠️ **Important**: Never expose Twilio credentials in frontend code or public repositories. Always use environment variables and keep them secure.
