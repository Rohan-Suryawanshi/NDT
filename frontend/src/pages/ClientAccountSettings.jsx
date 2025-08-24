import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";
import { BACKEND_URL } from "@/constant/Global";
import { Location } from "@/constant/Location";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";

export default function ClientAccountSettings() {
   const [form, setForm] = useState({
      companyName: "",
      industry: "",
      primaryLocation: "",
      contactNumber: "",
   });

   const [loading, setLoading] = useState(false);
   const [isExistingProfile, setIsExistingProfile] = useState(false);

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
   };

   const handlePrimaryLocationChange = (value) => {
      setForm((prev) => ({ ...prev, primaryLocation: value }));
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
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
                        <Input
                           name="contactNumber"
                           value={form.contactNumber}
                           onChange={handleChange}
                           placeholder="Enter your contact number"
                           required
                        />
                     </div>

                     <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                     >
                        {loading
                           ? isExistingProfile
                              ? "Updating..."
                              : "Saving..."
                           : isExistingProfile
                           ? "Update Profile"
                           : "Create Profile"}
                     </Button>
                  </form>
               </CardContent>
            </Card>
         </div>
      </div>
   );
}
