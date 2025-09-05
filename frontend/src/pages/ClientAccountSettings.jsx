import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";
import { BACKEND_URL } from "@/constant/Global";
import { Location } from "@/constant/Location";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ClientAccountSettings() {
   const [form, setForm] = useState({
      companyName: "",
      industry: "",
      primaryLocation: "",
      contactNumber: "",
   });

   const [loading, setLoading] = useState(false);
   const [isExistingProfile, setIsExistingProfile] = useState(false);
   const navigate = useNavigate();
   
   // OTP verification states
   const [isOtpSent, setIsOtpSent] = useState(false);
   const [isPhoneVerified, setIsPhoneVerified] = useState(false);
   const [otp, setOtp] = useState("");
   const [isVerifying, setIsVerifying] = useState(false);
   const [isSendingOtp, setIsSendingOtp] = useState(false);

   useEffect(() => {
      const fetchProfile = async () => {
         try {
            const res = await fetch(
               `${BACKEND_URL}/api/v1/client-routes/profile`,
               {
                  headers: {
                     Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                     )}`,
                  },
               }
            );

            if (res.ok) {
               const data = await res.json();
               setForm({
                  companyName: data?.data?.companyName || "",
                  industry: data?.data?.industry || "",
                  primaryLocation: data?.data?.primaryLocation || "",
                  contactNumber: data?.data?.contactNumber || "",
               });
               setIsExistingProfile(true);
               
               // If profile exists, consider phone already verified
               if (data?.data?.contactNumber) {
                  setIsPhoneVerified(true);
               }
            } else if (res.status !== 404) {
               throw new Error("Failed to fetch profile");
            }
         } catch (err) {
            console.error("Profile fetch error:", err);
            toast.error("Failed to fetch profile. Please try again.");
         }
      };

      fetchProfile();
   }, []);

   const handleChange = (e) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      
      // Reset phone verification if contact number changes
      if (name === "contactNumber") {
         setIsPhoneVerified(false);
         setIsOtpSent(false);
         setOtp("");
      }
   };

   // Send OTP function
   const handleSendOtp = async () => {
      if (!form.contactNumber) {
         toast.error("Please enter contact number first");
         return;
      }

      setIsSendingOtp(true);
      try {
         await axios.post(
            `${BACKEND_URL}/api/v1/client-routes/send-otp`,
            { contactNumber: form.contactNumber },
            {
               headers: {
                  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
               },
            }
         );
         setIsOtpSent(true);
         toast.success("OTP sent successfully!");
      } catch (err) {
         toast.error(err?.response?.data?.message || "Failed to send OTP");
      } finally {
         setIsSendingOtp(false);
      }
   };

   // Verify OTP function
   const handleVerifyOtp = async () => {
      if (!otp) {
         toast.error("Please enter the OTP");
         return;
      }

      setIsVerifying(true);
      try {
         await axios.post(
            `${BACKEND_URL}/api/v1/client-routes/verify-otp`,
            { 
               contactNumber: form.contactNumber,
               otp: otp 
            },
            {
               headers: {
                  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
               },
            }
         );
         setIsPhoneVerified(true);
         setIsOtpSent(false);
         setOtp("");
         toast.success("Phone number verified successfully!");
      } catch (err) {
         toast.error(err?.response?.data?.message || "Invalid OTP");
      } finally {
         setIsVerifying(false);
      }
   };

   const handlePrimaryLocationChange = (value) => {
      setForm((prev) => ({ ...prev, primaryLocation: value }));
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!isPhoneVerified) {
         toast.error("Please verify your phone number before saving");
         return;
      }
      
      setLoading(true);

      try {
         const method =  "POST";

         const res = await fetch(
            `${BACKEND_URL}/api/v1/client-routes/profile`,
            {
               method,
               headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem(
                     "accessToken"
                  )}`,
               },
               body: JSON.stringify(form),
            }
         );

         const data = await res.json();

         if (res.ok) {
            toast.success(
               isExistingProfile ? "Profile updated" : "Profile created"
            );
            setIsExistingProfile(true);
            navigate('/dashboard-client');
            
         } else {
            toast.error(data.message || "Something went wrong");
         }
      } catch (err) {
         console.error("Submit error:", err);
         toast.error("Failed to save data");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-gray-100 px-4 py-10">
         <div className="max-w-2xl mx-auto">
            <Card>
               <CardHeader>
                  <CardTitle className="text-xl text-center">
                     Account Settings
                  </CardTitle>
                  <p className="text-sm text-gray-500 text-center">
                     {isExistingProfile
                        ? "Update your business information"
                        : "Complete your profile to get started."}
                  </p>
               </CardHeader>

               <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                     <div>
                        <label className="text-sm font-medium text-gray-700">
                           Company Name
                        </label>
                        <Input
                           name="companyName"
                           value={form.companyName}
                           onChange={handleChange}
                           placeholder="Enter your company name"
                           required
                        />
                     </div>

                     <div>
                        <label className="text-sm font-medium text-gray-700">
                           Industry
                        </label>
                        <Input
                           name="industry"
                           value={form.industry}
                           onChange={handleChange}
                           placeholder="Enter your industry"
                           required
                        />
                     </div>

                     <div>
                        <label className="text-sm font-medium text-gray-700">
                           Primary Location
                        </label>
                        <Select
                           value={form.primaryLocation}
                           onValueChange={handlePrimaryLocationChange}
                        >
                           <SelectTrigger className="w-full mt-1 px-3 py-2 border rounded focus:outline-none focus:ring">
                              <SelectValue placeholder="Select your primary location" />
                           </SelectTrigger>
                           <SelectContent>
                              {Location.map((loc) => (
                                 <SelectItem key={loc.id} value={loc.country}>
                                    {loc.country}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>

                     <div>
                        <label className="text-sm font-medium text-gray-700">
                           Contact Number
                        </label>
                        <div className="space-y-2">
                           <div className="flex gap-2">
                              <Input
                                 name="contactNumber"
                                 value={form.contactNumber}
                                 onChange={handleChange}
                                 placeholder="Enter contact number (e.g., +1234567890)"
                                 required
                                 className={`${isPhoneVerified ? 'border-green-500' : ''}`}
                              />
                              {!isPhoneVerified && (
                                 <Button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={isSendingOtp || !form.contactNumber}
                                    className="whitespace-nowrap"
                                 >
                                    {isSendingOtp ? "Sending..." : "Send OTP"}
                                 </Button>
                              )}
                           </div>
                           
                           {isPhoneVerified && (
                              <div className="text-green-600 text-sm flex items-center">
                                 ✓ Phone number verified
                              </div>
                           )}
                           
                           {isOtpSent && !isPhoneVerified && (
                              <div className="flex gap-2">
                                 <Input
                                    type="text"
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                    className="w-40"
                                 />
                                 <Button
                                    type="button"
                                    onClick={handleVerifyOtp}
                                    disabled={isVerifying || !otp}
                                 >
                                    {isVerifying ? "Verifying..." : "Verify"}
                                 </Button>
                                 <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleSendOtp}
                                    disabled={isSendingOtp}
                                 >
                                    Resend
                                 </Button>
                              </div>
                           )}
                        </div>
                     </div>

                     <Button
                        type="submit"
                        className="w-full"
                        disabled={loading || !isPhoneVerified}
                     >
                        {loading
                           ? isExistingProfile
                              ? "Updating..."
                              : "Saving..."
                           : isExistingProfile
                           ? "Update Profile"
                           : "Create Profile"}
                     </Button>
                     
                     {!isPhoneVerified && (
                        <div className="text-sm text-gray-500 text-center">
                           Please verify your phone number to save profile
                        </div>
                     )}
                  </form>
               </CardContent>
            </Card>
         </div>
      </div>
   );
}
