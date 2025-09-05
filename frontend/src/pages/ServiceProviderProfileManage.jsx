import { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { BACKEND_URL } from "@/constant/Global";
import { Location } from "@/constant/Location";
import { Upload, Save } from "lucide-react";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Default marker fix for missing icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
   iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
   iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
   shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function LocationMarker({ form, setForm }) {
   useMapEvents({
      click(e) {
         setForm((prev) => ({
            ...prev,
            companyLat: e.latlng.lat,
            companyLng: e.latlng.lng,
         }));
      },
   });

   return (
      <Marker
         position={[form.companyLat, form.companyLng]}
         draggable={true}
         eventHandlers={{
            dragend: (e) => {
               const { lat, lng } = e.target.getLatLng();
               setForm((prev) => ({
                  ...prev,
                  companyLat: lat,
                  companyLng: lng,
               }));
            },
         }}
      />
   );
}

export default function ServiceProviderProfileManage() {
   const navigate = useNavigate();
   const [form, setForm] = useState({
      contactNumber: "",
      companyName: "",
      companyLocation: "",
      companyLat: 37.0902,
      companyLng: -95.7129,
      companyDescription: "",
      companySpecialization: "",
   });

   const [companyLogo, setCompanyLogo] = useState(null);
   const [proceduresFile, setProceduresFile] = useState(null);
   
   // OTP verification states
   const [isOtpSent, setIsOtpSent] = useState(false);
   const [isPhoneVerified, setIsPhoneVerified] = useState(false);
   const [otp, setOtp] = useState("");
   const [isVerifying, setIsVerifying] = useState(false);
   const [isSendingOtp, setIsSendingOtp] = useState(false);

   const fetchProfile = async () => {
      try {
         const res = await axios.get(
            `${BACKEND_URL}/api/v1/service-provider/profile`,
            {
               headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                     "accessToken"
                  )}`,
               },
            }
         );

         const data = res.data?.data;
         setForm({
            contactNumber: data.contactNumber || "",
            companyName: data.companyName || "",
            companyLocation: data.companyLocation || "",
            companyDescription: data.companyDescription || "",
            companyLat: data.companyLat || 37.0902, // ← add this
            companyLng: data.companyLng || -95.7129, // ← add this
            companySpecialization: (data.companySpecialization || []).join(
               ", "
            ),
         });
         
         // If profile exists, consider phone already verified
         if (data.contactNumber) {
            setIsPhoneVerified(true);
         }
      } catch {
         toast.error("Please Create the Profile");
      }
   };

   useEffect(() => {
      fetchProfile();
   }, []);

   const handleChange = (key, value) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      
      // Reset phone verification if contact number changes
      if (key === "contactNumber") {
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
            `${BACKEND_URL}/api/v1/service-provider/send-otp`,
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
            `${BACKEND_URL}/api/v1/service-provider/verify-otp`,
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

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!isPhoneVerified) {
         toast.error("Please verify your phone number before saving");
         return;
      }

      const formData = new FormData();
      for (const key in form) {
         formData.append(key, form[key]);
      }
      if (companyLogo) formData.append("companyLogo", companyLogo);
      if (proceduresFile) formData.append("proceduresFile", proceduresFile);

      try {
         await axios.post(
            `${BACKEND_URL}/api/v1/service-provider/profile`,
            formData,
            {
               headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                     "accessToken"
                  )}`,
                  "Content-Type": "multipart/form-data",
               },
            }
         );
         toast.success("Profile saved successfully");
         if (localStorage.getItem("firstLogin")) {
            navigate("/skill-matrix");
            localStorage.removeItem("firstLogin");
         }
         fetchProfile();
      } catch (err) {
         toast.error(
            err?.response?.data?.message || "Profile submission failed"
         );
      }
   };

   return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
         <h2 className="text-2xl font-bold">Service Provider Profile</h2>
         <form
            onSubmit={handleSubmit}
            className="space-y-4 border rounded p-4 shadow-sm bg-white"
         >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <Label className="mb-2">Contact Number</Label>
                  <div className="space-y-2">
                     <div className="flex gap-2">
                        <Input
                           type="text"
                           placeholder="Enter contact number (e.g., +1234567890)"
                           value={form.contactNumber}
                           onChange={(e) =>
                              handleChange("contactNumber", e.target.value)
                           }
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
               <div>
                  <Label className="mb-2">Company Name</Label>
                  <Input
                     type="text"
                     placeholder="Enter company name"
                     value={form.companyName}
                     onChange={(e) =>
                        handleChange("companyName", e.target.value)
                     }
                     required
                  />
               </div>
               <div>
                  <Label className="mb-2 block">Company Location</Label>
                  <Select
                     value={form.companyLocation}
                     onValueChange={(value) =>
                        handleChange("companyLocation", value)
                     }
                  >
                     <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select company location" />
                     </SelectTrigger>
                     <SelectContent>
                        {Location.map((loc) => (
                           <SelectItem key={loc.id} value={loc.country}>
                              {loc.country} ({loc.currencyCode})
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div>
                  <Label className="mb-2">Specialization</Label>
                  <Input
                     type="text"
                     placeholder="e.g. RT, UT, VT"
                     value={form.companySpecialization}
                     onChange={(e) =>
                        handleChange("companySpecialization", e.target.value)
                     }
                     required
                  />
               </div>
            </div>
            <div>
               <Label className="mb-2">Description</Label>
               <Textarea
                  placeholder="Describe your company..."
                  value={form.companyDescription}
                  onChange={(e) =>
                     handleChange("companyDescription", e.target.value)
                  }
                  required
               />
            </div>
               <div>
                  <Label className="mb-2 block">Set Location on Map</Label>
                  <MapContainer
                     center={[form.companyLat, form.companyLng]}
                     zoom={5}
                     style={{ height: "300px", width: "100%" }}
                  >
                     <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        noWrap={true}
                     />
                     <LocationMarker form={form} setForm={setForm} />
                  </MapContainer>
               </div>

            {/* Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <Label className="mb-2">Upload Company Logo</Label>
                  <Button asChild className="w-full">
                     <label>
                        <Upload size={16} className="mr-2" />
                        Choose Logo
                        <Input
                           type="file"
                           accept="image/*"
                           onChange={(e) => setCompanyLogo(e.target.files[0])}
                           className="hidden"
                        />
                     </label>
                  </Button>
                  {companyLogo && (
                     <div className="mt-2 text-sm text-gray-600">
                        {companyLogo.name}
                     </div>
                  )}
               </div>
               <div>
                  <Label className="mb-2">Upload Procedures (PDF)</Label>
                  <Button asChild className="w-full">
                     <label>
                        <Upload size={16} className="mr-2" />
                        Choose PDF
                        <Input
                           type="file"
                           accept="application/pdf"
                           onChange={(e) =>
                              setProceduresFile(e.target.files[0])
                           }
                           className="hidden"
                        />
                     </label>
                  </Button>
                  {proceduresFile && (
                     <div className="mt-2 text-sm text-gray-600">
                        {proceduresFile.name}
                     </div>
                  )}
               </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
               <Button 
                  type="submit" 
                  className="gap-2"
                  disabled={!isPhoneVerified}
               >
                  <Save size={16} /> Save Profile
               </Button>
               {!isPhoneVerified && (
                  <div className="text-sm text-gray-500 flex items-center">
                     Please verify your phone number to save profile
                  </div>
               )}
            </div>
         </form>
      </div>
   );
}
