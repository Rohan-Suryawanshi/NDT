import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { agreementTexts } from "@/constant/agreements";
import { BACKEND_URL } from "@/constant/Global";
import { Location } from "@/constant/Location";
import toast from "react-hot-toast";

export default function Register() {
   const [form, setForm] = useState({
      name: "",
      email: "",
      password: "",
      avatar: null,
      role: "client",
      location: "",
      currency: "",
      acceptedTerms: false,
   });

   const [previewImage, setPreviewImage] = useState(null);

   const handleChange = (e) => {
      const { name, value, type, checked, files } = e.target;

      if (name === "avatar" && files?.[0]) {
         const file = files[0];
         setForm((prev) => ({ ...prev, avatar: file }));

         const reader = new FileReader();
         reader.onloadend = () => {
            setPreviewImage(reader.result);
         };
         reader.readAsDataURL(file);
      } else {
         setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
         }));
      }
   };

   const handleRegister = async (e) => {
      e.preventDefault();
      if (
         !form.name ||
         !form.email ||
         !form.password ||
         !form.role ||
         !form.avatar ||
         !form.location ||
         !form.currency
      ) {
         toast.error("All fields are required, including image.");
         return;
      }
      if (!form.acceptedTerms) {
         toast.error("Please accept the Terms of Service.");
         return;
      }

      try {
         const formData = new FormData();
         formData.append("name", form.name);
         formData.append("email", form.email);
         formData.append("password", form.password);
         formData.append("role", form.role);
         formData.append("acceptedTerms", form.acceptedTerms);
         formData.append("location", form.location);
         formData.append("currency", form.currency);

         if (form.avatar) {
            formData.append("avatar", form.avatar);
         }
         const res = await fetch(`${BACKEND_URL}/api/v1/users/register`, {
            method: "POST",
            body: formData, // Automatically sets multipart/form-data
         });

         const data = await res.json();
         if (data.success) {
            toast.success(data.message);
         } else {
            toast.error(data.message);
         }
         console.log("Registered:", data);
      } catch (err) {
         console.error("Registration failed:", err);
      }
   };

   return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
         <form
            onSubmit={handleRegister}
            className="w-full max-w-2xl bg-white p-8 rounded-lg shadow space-y-6 my-8"
            noValidate
         >
            <h2 className="text-3xl font-bold text-center text-[#004aad]">
               Register
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                     Full Name
                  </label>
                  <Input
                     type="text"
                     name="name"
                     value={form.name}
                     onChange={handleChange}
                     placeholder="Full Name"
                     required
                  />
               </div>
               <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                     Email
                  </label>
                  <Input
                     type="email"
                     name="email"
                     value={form.email}
                     onChange={handleChange}
                     placeholder="Email"
                     required
                  />
               </div>
               <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                     Password
                  </label>
                  <Input
                     type="password"
                     name="password"
                     value={form.password}
                     onChange={handleChange}
                     placeholder="Password"
                     required
                  />
               </div>

               {/* Role */}
               <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                     Role
                  </label>
                  <Select
                     value={form.role}
                     onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, role: value }))
                     }
                  >
                     <SelectTrigger className="h-11 px-3 py-1 text-base md:text-sm w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004aad]">
                        <SelectValue placeholder="Select Role" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="provider">Provider</SelectItem>
                        <SelectItem value="inspector">Inspector</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <Select
                  value={form.location || ""}
                  onValueChange={(value) => {
                     const selected = Location.find(
                        (loc) => loc.country === value
                     );
                     if (selected) {
                        setForm((prev) => ({
                           ...prev,
                              location: selected.country,
                              currency: selected.currencyCode,
                        }));
                     }
                  }}
               >
                  <SelectTrigger className="h-11 px-3 py-1 text-base md:text-sm w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004aad]">
                     <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                     {Location.map((location) => (
                        <SelectItem key={location.id} value={location.country}>
                           {location.country} ({location.currencyCode})
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>

            {/* Avatar Upload */}
            <div className="flex flex-col gap-3">
               <label className="text-sm font-medium text-gray-700">
                  Upload Image
               </label>
               <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full border bg-gray-100 flex items-center justify-center overflow-hidden">
                     {previewImage ? (
                        <img
                           src={previewImage}
                           alt="Preview"
                           className="object-cover w-full h-full"
                        />
                     ) : (
                        <span className="text-gray-400 text-xs text-center px-2">
                           No Image
                        </span>
                     )}
                  </div>
                  <label className="cursor-pointer inline-block text-sm text-[#004aad] hover:underline">
                     Choose Image
                     <input
                        type="file"
                        name="avatar"
                        accept="image/*"
                        onChange={handleChange}
                        className="hidden"
                     />
                  </label>
               </div>
               <p className="text-xs text-gray-500">
                  Only JPG, PNG. Max size: 2MB.
               </p>
            </div>

            {/* Dynamic Terms */}
            <div className="border border-gray-300 rounded-md h-40 p-3 overflow-y-scroll text-sm text-gray-700 bg-gray-50 whitespace-pre-line">
               {agreementTexts[form.role]}
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-2 text-sm text-gray-700">
               <input
                  type="checkbox"
                  name="acceptedTerms"
                  checked={form.acceptedTerms}
                  onChange={handleChange}
                  className="mt-1"
               />
               I have read and agree to the Terms of Service.
            </label>

            <Button type="submit" className="w-full">
               Register
            </Button>
         </form>
      </div>
   );
}
