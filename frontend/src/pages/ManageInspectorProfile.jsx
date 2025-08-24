import React, { useState, useEffect, useCallback } from "react";
import {
   User,
   Phone,
   Building2,
   DollarSign,
   Clock,
   Award,
   FileText,
   Bell,
   Star,
   Plus,
   Edit,
   Trash2,
   Upload,
   Save,
   X,
   Calendar,
   Mail,
   MapPin,
   CheckCircle,
   AlertCircle,
   Eye,
   EyeOff,
   Wallet,
   TrendingUp,
   ArrowDownLeft,
   PiggyBank,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import toast from "react-hot-toast";
import { BACKEND_URL } from "@/constant/Global";
import { Location } from "@/constant/Location.js";
import {
   Select,
   SelectContent,
   SelectTrigger,
   SelectValue,
   SelectItem,
} from "@/components/ui/select";

// Create axios instance with default config
const api = axios.create({
   baseURL: BACKEND_URL,
   headers: {
      "Content-Type": "application/json",
   },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
   const token = localStorage.getItem("accessToken");
   if (token) {
      config.headers.Authorization = `Bearer ${token}`;
   }
   return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
   (response) => {
      return response;
   },
   (error) => {
      if (error.response?.status === 401) {
         localStorage.removeItem("accessToken");
         localStorage.removeItem("user");
         window.location.href = "/login";
      }
      return Promise.reject(error);
   }
);

// Tab components outside main component to prevent re-renders
const ProfileInfoTab = ({
   profile,
   isEditing,
   setProfile,
   setIsEditing,
   handleSave,
   handleResumeUpload,
}) => {
   if (!profile) return <div>Loading profile...</div>;

   return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                     <User className="w-5 h-5" />
                     Personal Information
                  </h3>
                  <button
                     onClick={() => setIsEditing(!isEditing)}
                     className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-[#004aad] rounded-lg hover:bg-blue-100 transition-colors"
                  >
                     <Edit className="w-4 h-4" />
                     {isEditing ? "Cancel" : "Edit"}
                  </button>
               </div>

               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                     </label>
                     {isEditing ? (
                        <input
                           type="text"
                           value={profile.fullName || ""}
                           onChange={(e) => {
                              
                              setProfile((prev) => ({
                                 ...prev,
                                 fullName: e.target.value,
                              }));
                           }}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent"
                        />
                     ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-lg">
                           {profile.fullName}
                        </div>
                     )}
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Number
                     </label>
                     {isEditing ? (
                        <input
                           type="tel"
                           value={profile.contactNumber || ""}
                           onChange={(e) => {
                             
                              setProfile((prev) => ({
                                 ...prev,
                                 contactNumber: e.target.value,
                              }));
                           }}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent"
                        />
                     ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-lg flex items-center gap-2">
                           <Phone className="w-4 h-4 text-gray-400" />
                           {profile.contactNumber}
                        </div>
                     )}
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                        Association Type
                     </label>
                     {isEditing ? (
                        <select
                           value={profile.associationType || "Freelancer"}
                           onChange={(e) => {
                            
                              setProfile((prev) => ({
                                 ...prev,
                                 associationType: e.target.value,
                              }));
                           }}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent"
                        >
                           <option value="Freelancer">Freelancer</option>
                           <option value="Company Employee">
                              Company Employee
                           </option>
                        </select>
                     ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-lg">
                           {profile.associationType}
                        </div>
                     )}
                  </div>

                  {(profile.associationType === "Company Employee" ||
                     isEditing) && (
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                           Company Name
                        </label>
                        {isEditing ? (
                           <input
                              type="text"
                              value={profile.companyName || ""}
                              onChange={(e) => {
                                
                                 setProfile((prev) => ({
                                    ...prev,
                                    companyName: e.target.value,
                                 }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent"
                              placeholder="Enter company name"
                           />
                        ) : (
                           <div className="px-3 py-2 bg-gray-50 rounded-lg">
                              {profile.companyName || "Not specified"}
                           </div>
                        )}
                     </div>
                  )}
               </div>

               {isEditing && (
                  <div className="flex gap-3 mt-6 pt-6 border-t">
                     <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-[#004aad] text-white rounded-lg  transition-colors"
                     >
                        <Save className="w-4 h-4" />
                        Save Changes
                     </button>
                     <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                     >
                        Cancel
                     </button>
                  </div>
               )}
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
               <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5" />
                  Resume
               </h3>

               {profile.resume ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                           <FileText className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                           <div className="font-medium">Resume.pdf</div>
                           <div className="text-sm text-gray-500">
                              Uploaded on{" "}
                              {new Date(
                                 profile.resume.uploadedAt
                              ).toLocaleDateString()}
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button
                           onClick={() =>
                              window.open(profile.resume.url, "_blank")
                           }
                           className="p-2 text-[#004aad]   hover:bg-blue-50 rounded-lg transition-colors"
                        >
                           <Eye className="w-4 h-4" />
                        </button>{" "}
                        <label className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                           <Upload className="w-4 h-4" />
                           <input
                              type="file"
                              accept=".pdf"
                              onChange={handleResumeUpload}
                              className="hidden"
                           />
                        </label>
                     </div>
                  </div>
               ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                     <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                     <div className="font-medium text-gray-900 mb-2">
                        Upload your resume
                     </div>
                     <div className="text-sm text-gray-500 mb-4">
                        PDF files up to 10MB
                     </div>
                     <label className="px-4 py-2 bg-[#004aad] text-white rounded-lg  transition-colors cursor-pointer">
                        Choose File{" "}
                        <input
                           type="file"
                           accept=".pdf"
                           onChange={handleResumeUpload}
                           className="hidden"
                        />
                     </label>
                  </div>
               )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
               <h3 className="text-lg font-semibold mb-4">Account Status</h3>
               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-gray-600">Verification Status</span>
                     <span
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                           profile.verified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                     >
                        {profile.verified ? (
                           <>
                              <CheckCircle className="w-4 h-4" />
                              Verified
                           </>
                        ) : (
                           <>
                              <AlertCircle className="w-4 h-4" />
                              Pending
                           </>
                        )}
                     </span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-gray-600">Subscription Plan</span>
                     <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                           profile.subscriptionPlan === "Pro"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                     >
                        {profile.subscriptionPlan}
                     </span>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

const CertificationsTab = ({
   profile,
   setProfile,
   showCertModal,
   setShowCertModal,
   newCert,
   setNewCert,
   addCertification,
   removeCertification,
   getExpiryStatus,
   api,
}) => {
   if (!profile) return <div>Loading certifications...</div>;

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Certifications</h3>
            <button
               onClick={() => setShowCertModal(true)}
               className="flex items-center gap-2 px-4 py-2 bg-[#004aad] text-white rounded-lg  transition-colors"
            >
               <Plus className="w-4 h-4" />
               Add Certification
            </button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.certifications.map((cert) => {
               const expiryStatus = getExpiryStatus(cert.expiryDate);
               return (
                  <div
                     key={cert._id}
                     className="bg-white rounded-xl p-6 shadow-sm border"
                  >
                     <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                           <h4 className="font-semibold text-lg">
                              {cert.certificationBody}
                           </h4>
                           <p className="text-gray-600">{cert.level}</p>
                        </div>
                        <button
                           onClick={() => removeCertification(cert._id)}
                           className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                     {/* Certificate Image */}{" "}
                     {cert.certificateImage ? (
                        <div className="mb-4">
                           <div className="relative group">
                              <img
                                 src={cert.certificateImage}
                                 alt={`${cert.certificationBody} Certificate`}
                                 className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                                 onClick={() =>
                                    window.open(cert.certificateImage, "_blank")
                                 }
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                 <div className="flex gap-2">
                                    <button
                                       onClick={() =>
                                          window.open(
                                             cert.certificateImage,
                                             "_blank"
                                          )
                                       }
                                       className="p-2 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                                       title="View full size"
                                    >
                                       <Eye className="w-4 h-4" />
                                    </button>
                                    <label
                                       className="p-2 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                                       title="Update image"
                                    >
                                       <Upload className="w-4 h-4" />
                                       <input
                                          type="file"
                                          accept="image/*"
                                          onChange={async (e) => {
                                             const file = e.target.files[0];
                                             if (file) {
                                                if (
                                                   file.size >
                                                   5 * 1024 * 1024
                                                ) {
                                                   toast.error(
                                                      "Image size must be less than 5MB"
                                                   );
                                                   return;
                                                }

                                                try {
                                                   const formData =
                                                      new FormData();
                                                   formData.append(
                                                      "certificateImage",
                                                      file
                                                   );

                                                   const response =
                                                      await api.patch(
                                                         `/api/v1/inspectors/certifications/${cert._id}/image`,
                                                         formData,
                                                         {
                                                            headers: {
                                                               "Content-Type":
                                                                  "multipart/form-data",
                                                            },
                                                         }
                                                      );

                                                   setProfile(
                                                      response.data.data
                                                   );
                                                   toast.success(
                                                      "Certificate image updated successfully"
                                                   );
                                                } catch (error) {
                                                   console.error(
                                                      "Error updating certificate image:",
                                                      error
                                                   );
                                                   toast.error(
                                                      error.response?.data
                                                         ?.message ||
                                                         "Failed to update image"
                                                   );
                                                }
                                             }
                                          }}
                                          className="hidden"
                                       />
                                    </label>
                                 </div>
                              </div>
                           </div>
                           <p className="text-xs text-gray-500 mt-1">
                              Click to view full size • Hover to update
                           </p>
                        </div>
                     ) : (
                        <div className="mb-4 p-4 border-2 border-dashed border-gray-200 rounded-lg text-center bg-gray-50">
                           <Award className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                           <p className="text-xs text-gray-500 mb-3">
                              No certificate image uploaded
                           </p>
                           <label className="px-3 py-1.5 bg-[#004aad] text-white text-xs rounded-lg transition-colors cursor-pointer">
                              Add Image
                              <input
                                 type="file"
                                 accept="image/*"
                                 onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                       if (file.size > 5 * 1024 * 1024) {
                                          toast.error(
                                             "Image size must be less than 5MB"
                                          );
                                          return;
                                       }

                                       try {
                                          const formData = new FormData();
                                          formData.append(
                                             "certificateImage",
                                             file
                                          );

                                          const response = await api.patch(
                                             `/api/v1/inspectors/certifications/${cert._id}/image`,
                                             formData,
                                             {
                                                headers: {
                                                   "Content-Type":
                                                      "multipart/form-data",
                                                },
                                             }
                                          );

                                          setProfile(response.data.data);
                                          toast.success(
                                             "Certificate image uploaded successfully"
                                          );
                                       } catch (error) {
                                          console.error(
                                             "Error uploading certificate image:",
                                             error
                                          );
                                          toast.error(
                                             error.response?.data?.message ||
                                                "Failed to upload image"
                                          );
                                       }
                                    }
                                 }}
                                 className="hidden"
                              />
                           </label>
                        </div>
                     )}
                     {cert.expiryDate && (
                        <div className="flex items-center gap-2">
                           <Calendar className="w-4 h-4 text-gray-400" />
                           <span className="text-sm text-gray-600">
                              Expires:{" "}
                              {new Date(cert.expiryDate).toLocaleDateString()}
                           </span>
                           <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                 expiryStatus === "expired"
                                    ? "bg-red-100 text-red-800"
                                    : expiryStatus === "expiring"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                           >
                              {expiryStatus === "expired"
                                 ? "Expired"
                                 : expiryStatus === "expiring"
                                 ? "Expiring Soon"
                                 : "Valid"}
                           </span>
                        </div>
                     )}
                  </div>
               );
            })}
         </div>

         {/* Add Certification Modal */}
         {showCertModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
               <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-lg font-semibold">
                        Add Certification
                     </h3>{" "}
                     <button
                        onClick={() => {
                           setShowCertModal(false);
                           setNewCert({
                              certificationBody: "",
                              level: "",
                              expiryDate: "",
                              image: null,
                           });
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                     >
                        <X className="w-4 h-4" />
                     </button>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                           Certification Body
                        </label>{" "}
                        <input
                           type="text"
                           value={newCert.certificationBody}
                           onChange={(e) => {
                            
                              setNewCert((prev) => ({
                                 ...prev,
                                 certificationBody: e.target.value,
                              }));
                           }}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent"
                           placeholder="Enter Certification Body"
                        />
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                           Level/Title
                        </label>
                        <input
                           type="text"
                           value={newCert.level}
                           onChange={(e) => {
                           
                              setNewCert((prev) => ({
                                 ...prev,
                                 level: e.target.value,
                              }));
                           }}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent"
                           placeholder="e.g., Solutions Architect Professional"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                           Expiry Date (Optional)
                        </label>
                        <input
                           type="date"
                           value={newCert.expiryDate}
                           onChange={(e) => {
                            
                              setNewCert((prev) => ({
                                 ...prev,
                                 expiryDate: e.target.value,
                              }));
                           }}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent"
                        />
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                           Certificate Image (Optional)
                        </label>
                        {newCert.image ? (
                           <div className="space-y-3">
                              <div className="relative">
                                 <img
                                    src={URL.createObjectURL(newCert.image)}
                                    alt="Certificate preview"
                                    className="w-full h-32 object-cover rounded-lg border"
                                 />
                                 <button
                                    type="button"
                                    onClick={() =>
                                       setNewCert((prev) => ({
                                          ...prev,
                                          image: null,
                                       }))
                                    }
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                 >
                                    <X className="w-3 h-3" />
                                 </button>
                              </div>
                              <label className="block w-full px-3 py-2 text-sm text-center border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                 Change Image
                                 <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                       const file = e.target.files[0];
                                       if (file) {
                                          if (file.size > 5 * 1024 * 1024) {
                                             // 5MB limit
                                             toast.error(
                                                "Image size must be less than 5MB"
                                             );
                                             return;
                                          }
                                       
                                          setNewCert((prev) => ({
                                             ...prev,
                                             image: file,
                                          }));
                                       }
                                    }}
                                    className="hidden"
                                 />
                              </label>
                           </div>
                        ) : (
                           <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                              <div className="text-sm text-gray-600 mb-2">
                                 Upload certificate image
                              </div>
                              <div className="text-xs text-gray-500 mb-3">
                                 JPG, PNG or GIF up to 5MB
                              </div>
                              <label className="px-3 py-1.5 bg-[#004aad] text-white text-sm rounded-lg  transition-colors cursor-pointer">
                                 Choose File
                                 <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                       const file = e.target.files[0];
                                       if (file) {
                                          if (file.size > 5 * 1024 * 1024) {
                                             // 5MB limit
                                             toast.error(
                                                "Image size must be less than 5MB"
                                             );
                                             return;
                                          }
                                        
                                          setNewCert((prev) => ({
                                             ...prev,
                                             image: file,
                                          }));
                                       }
                                    }}
                                    className="hidden"
                                 />
                              </label>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                     <button
                        onClick={addCertification}
                        className="flex-1 px-4 py-2 bg-[#004aad] text-white rounded-lg  transition-colors"
                     >
                        Add Certification
                     </button>{" "}
                     <button
                        onClick={() => {
                           setShowCertModal(false);
                           setNewCert({
                              certificationBody: "",
                              level: "",
                              expiryDate: "",
                              image: null,
                           });
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                     >
                        Cancel
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

const RatesTab = ({ profile, setProfile, updateField }) => {
   if (!profile) return <div>Loading rates...</div>;

   return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
               <DollarSign className="w-5 h-5" />
               Pricing
            </h3>

            <div className="space-y-6">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Hourly Rate
                  </label>
                  <div className="relative">
                     <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                     <input
                        type="number"
                        value={profile.hourlyRate || 0}
                        onChange={(e) => {
                         
                           setProfile((prev) => ({
                              ...prev,
                              hourlyRate: Number(e.target.value),
                           }));
                        }}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent"
                        placeholder="0"
                     />
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Currency
                  </label>
                  <div className="relative">
                     <Select
                        value={profile.currency}
                        onValueChange={(val) =>
                           setProfile((prev) => ({
                              ...prev,
                              currency: val,
                           }))
                        }
                     >
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Select Currency" />
                        </SelectTrigger>
                        <SelectContent>
                           {Location.map((loc) => (
                              <SelectItem key={loc.id} value={loc.currencyCode}>
                                 {loc.currencyCode}-{loc.country}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Monthly Rate 
                  </label>
                  <div className="relative">
                     <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                     <input
                        type="number"
                        value={profile.monthlyRate || 0}
                        onChange={(e) => {
                           setProfile((prev) => ({
                              ...prev,
                              monthlyRate: Number(e.target.value),
                           }));
                        }}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent"
                        placeholder="0"
                     />
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
               <Clock className="w-5 h-5" />
               Availability
            </h3>
            <div className="space-y-6">
               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                     <div className="font-medium">Available for Work</div>
                     <div className="text-sm text-gray-600">
                        Show your profile to potential clients
                     </div>
                  </div>
                  <button
                     onClick={async () => {
                        const newAvailability = !profile.availability;
                        setProfile((prev) => ({
                           ...prev,
                           availability: newAvailability,
                        }));
                        await updateField("availability", newAvailability);
                     }}
                     className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        profile.availability ? "bg-[#004aad]" : "bg-gray-300"
                     }`}
                  >
                     <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                           profile.availability
                              ? "translate-x-6"
                              : "translate-x-1"
                        }`}
                     />
                  </button>
               </div>

               <div
                  className={`p-4 rounded-lg border-2 border-dashed ${
                     profile.availability
                        ? "border-green-300 bg-green-50"
                        : "border-red-300 bg-red-50"
                  }`}
               >
                  <div
                     className={`flex items-center gap-2 mb-2 ${
                        profile.availability ? "text-green-800" : "text-red-800"
                     }`}
                  >
                     {profile.availability ? (
                        <CheckCircle className="w-5 h-5" />
                     ) : (
                        <AlertCircle className="w-5 h-5" />
                     )}
                     <span className="font-medium">
                        {profile.availability
                           ? "You are available"
                           : "You are unavailable"}
                     </span>
                  </div>
                  <p
                     className={`text-sm ${
                        profile.availability ? "text-green-700" : "text-red-700"
                     }`}
                  >
                     {profile.availability
                        ? "Your profile is visible to clients and you can receive job offers."
                        : "Your profile is hidden and you won't receive new job offers."}
                  </p>
               </div>
            </div>{" "}
            <button
               onClick={() => updateField("rates")}
               className="w-full mt-6 px-4 py-2 bg-[#004aad] text-white rounded-lg  transition-colors"
            >
               Save Changes
            </button>
         </div>
      </div>
   );
};

const EarningsTab = ({ balance, fetchBalance }) => {
   const [refreshing, setRefreshing] = useState(false);
   const currency = JSON.parse(localStorage.getItem("user")).currency;

   // Format currency function
   // const formatCurrency = (amount) => {
   //    if (!amount) return "$0.00";
   //    return new Intl.NumberFormat("en-US", {
   //       style: "currency",
   //       currency: "USD",
   //    }).format(amount);
   // };

   const formatCurrency = (amount) => {
      return `${new Intl.NumberFormat("en-US", {
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
      }).format(amount)} ${currency}`;
   };

   const refreshEarnings = async () => {
      setRefreshing(true);
      await fetchBalance();
      setRefreshing(false);
      toast.success("Earnings data refreshed");
   };

   return (
      <div className="space-y-6">
         {/* Header with refresh button */}
         <div className="flex items-center justify-between">
            <div>
               <h3 className="text-lg font-semibold">Earnings Summary</h3>
               <p className="text-gray-600">
                  Overview of your inspection earnings and financial status
               </p>
            </div>
            <button
               onClick={refreshEarnings}
               disabled={refreshing}
               className="flex items-center gap-2 px-4 py-2 bg-[#004aad] text-white rounded-lg  transition-colors disabled:opacity-50"
            >
               <TrendingUp
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
               />
               Refresh
            </button>
         </div>

         {/* Earnings Cards Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Available Balance Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-green-100 rounded-lg">
                        <Wallet className="w-5 h-5 text-green-600" />
                     </div>
                     <div>
                        <h4 className="font-semibold text-gray-900">
                           Available Balance
                        </h4>
                        <p className="text-sm text-gray-600">
                           Ready for withdrawal
                        </p>
                     </div>
                  </div>
               </div>
               <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatCurrency(balance.availableBalance)}
               </div>
               <div className="text-sm text-gray-500">
                  {balance.availableBalance >= 10
                     ? "Ready to withdraw"
                     : `Minimum 10 ${currency} required for withdrawal`}
               </div>
            </div>

            {/* Total Earnings Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-[#004aad]" />
                     </div>
                     <div>
                        <h4 className="font-semibold text-gray-900">
                           Total Earnings
                        </h4>
                        <p className="text-sm text-gray-600">
                           All-time inspection earnings
                        </p>
                     </div>
                  </div>
               </div>
               <div className="text-3xl font-bold text-[#004aad] mb-2">
                  {formatCurrency(balance.totalEarnings)}
               </div>
               <div className="text-sm text-gray-500">
                  Lifetime earnings from inspections
               </div>
            </div>

            {/* Pending Balance Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="w-5 h-5 text-yellow-600" />
                     </div>
                     <div>
                        <h4 className="font-semibold text-gray-900">
                           Pending Balance
                        </h4>
                        <p className="text-sm text-gray-600">
                           Processing payments
                        </p>
                     </div>
                  </div>
               </div>
               <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {formatCurrency(balance.pendingBalance)}
               </div>
               <div className="text-sm text-gray-500">
                  Will be available soon
               </div>
            </div>

            {/* Total Withdrawn Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-purple-100 rounded-lg">
                        <ArrowDownLeft className="w-5 h-5 text-purple-600" />
                     </div>
                     <div>
                        <h4 className="font-semibold text-gray-900">
                           Total Withdrawn
                        </h4>
                        <p className="text-sm text-gray-600">
                           Successfully withdrawn
                        </p>
                     </div>
                  </div>
               </div>
               <div className="text-3xl font-bold text-purple-600 mb-2">
                  {formatCurrency(balance.totalWithdrawn)}
               </div>
               <div className="text-sm text-gray-500">
                  Total amount withdrawn to date
               </div>
            </div>
         </div>

         {/* Earnings Info */}
         <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h4 className="font-semibold text-[#004aad] mb-3">
               💡 About Your Earnings
            </h4>
            <div className="space-y-2 text-sm text-[#004aad]">
               <p>
                  • <strong>Available Balance:</strong> Funds ready for
                  immediate withdrawal
               </p>
               <p>
                  • <strong>Pending Balance:</strong> Payments being processed
                  (typically 2-3 business days)
               </p>
               <p>
                  • <strong>Total Earnings:</strong> Your lifetime earnings from
                  all completed inspections
               </p>
               <p>
                  • <strong>Minimum Withdrawal:</strong> 10 {currency} minimum required
                  for withdrawal requests
               </p>
            </div>
         </div>
      </div>
   );
};

const ManageInspectorProfile = () => {
   const { user } = useAuth();
   // State management
   const [profile, setProfile] = useState(null);
   const [balance, setBalance] = useState({
      totalEarnings: 0,
      availableBalance: 0,
      pendingBalance: 0,
      totalWithdrawn: 0,
   });
   const [loading, setLoading] = useState(true);
   const [isEditing, setIsEditing] = useState(false);
   const [activeTab, setActiveTab] = useState("profile");
   const [showCertModal, setShowCertModal] = useState(false);
   const [newCert, setNewCert] = useState({
      certificationBody: "",
      level: "",
      expiryDate: "",
      image: null,
   }); // Debug profile changes

   // Fetch balance and earnings data
   const fetchBalance = useCallback(async () => {
      try {
         const token = localStorage.getItem("accessToken");

         if (!token) {
            return; // Don't show error, just return
         }

         const response = await api.get("/api/v1/payments/inspector-balance");
         setBalance(response.data.data);
      } catch (error) {
         console.error("Error fetching balance:", error);
         // Try fallback to provider balance endpoint
         try {
            const response = await api.get("/api/v1/payments/provider-balance");
            setBalance(response.data.data);
         } catch (fallbackError) {
            console.error(
               "Error fetching balance from fallback:",
               fallbackError
            );
            // Keep default balance values, don't show error to user
         }
      }
   }, []);

   // Fetch inspector profile
   const fetchProfile = useCallback(async () => {
      try {
         setLoading(true);

         const response = await api.get("/api/v1/inspectors/profile");
         setProfile(response.data.data);
      } catch (error) {
         console.error("Error fetching profile:", error);
         console.error("Error response:", error.response);

         // Only set default profile if it's a 404 (no profile exists)
         if (error.response?.status === 404) {
            setProfile({
               fullName: user?.name || "",
               contactNumber: "",
               associationType: "Freelancer",
               companyName: "",
               hourlyRate: 0,
               monthlyRate: 0,
               marginRate: 0,
               currency: "",
               availability: true,
               verified: false,
               subscriptionPlan: "Free",
               rating: 0,
               totalEarnings: 0,
               certificateExpiryAlerts: true,
               matchingJobEmailAlerts: true,
               acceptedTerms: false,
               certifications: [],
               resume: null,
            });
         } else {
            toast.error(
               error.response?.data?.message || "Failed to load profile"
            );
            setProfile(null);
         }
      } finally {
         setLoading(false);
      }
   }, [user?.name]); 

   useEffect(() => {
      if (user) {
         Promise.all([fetchProfile(), fetchBalance()]);
      } else {
         console.log("No user found, skipping data fetch");
      }
   }, [user, fetchProfile, fetchBalance]); // Save profile changes
   const handleSave = async () => {
      try {
         setLoading(true);
         const formData = new FormData();

         // Add all profile fields to FormData
         Object.keys(profile).forEach((key) => {
            if (key === "certifications") {
               formData.append(key, JSON.stringify(profile[key]));
            } else if (
               key !== "resume" &&
               key !== "_id" &&
               key !== "userId" &&
               key !== "createdAt" &&
               key !== "updatedAt"
            ) {
               formData.append(key, profile[key]);
            }
         });

         const response = await api.post(
            "/api/v1/inspectors/profile",
            formData,
            {
               headers: {
                  "Content-Type": "multipart/form-data",
               },
            }
         );

         setProfile(response.data.data);
         setIsEditing(false);
         toast.success("Profile saved successfully");
      } catch (error) {
         console.error("Error saving profile:", error);
         toast.error(error.response?.data?.message || "Failed to save profile");
      } finally {
         setLoading(false);
      }
   };
   // Update specific fields
   const updateField = async (field, value) => {
      try {
         let endpoint = "/api/v1/inspectors/";
         let body = {};

         switch (field) {
            case "availability":
               endpoint += "availability";
               body = { availability: value };
               break;
            case "rates":
               endpoint += "rates";
               body = {
                  hourlyRate: profile.hourlyRate,
                  monthlyRate: profile.monthlyRate,
                  currency: profile.currency,
               };
               break;
            case "notifications":
               endpoint += "notifications";
               body = {
                  certificateExpiryAlerts: profile.certificateExpiryAlerts,
                  matchingJobEmailAlerts: profile.matchingJobEmailAlerts,
               };
               break;
            default:
               return handleSave();
         }

         const response = await api.patch(endpoint, body);
         setProfile(response.data.data);
         toast.success("Updated successfully");
      } catch (error) {
         console.error("Error updating field:", error);
         toast.error(error.response?.data?.message || "Failed to update");
      }
   };
   const addCertification = async () => {
      if (newCert.certificationBody && newCert.level) {
         try {
            const formData = new FormData();
            formData.append("certificationBody", newCert.certificationBody);
            formData.append("level", newCert.level);
            if (newCert.expiryDate) {
               formData.append("expiryDate", newCert.expiryDate);
            }
            if (newCert.image) {
               formData.append("certificateImage", newCert.image);
            }

            const response = await api.post(
               "/api/v1/inspectors/certifications",
               formData,
               {
                  headers: {
                     "Content-Type": "multipart/form-data",
                  },
               }
            );
            setProfile(response.data.data);
            setNewCert({
               certificationBody: "",
               level: "",
               expiryDate: "",
               image: null,
            });
            setShowCertModal(false);
            toast.success("Certification added successfully");
         } catch (error) {
            console.error("Error adding certification:", error);
            toast.error(
               error.response?.data?.message || "Failed to add certification"
            );
         }
      }
   };
   const removeCertification = async (id) => {
      try {
         const response = await api.delete(
            `/api/v1/inspectors/certifications/${id}`
         );

         setProfile(response.data.data);
         toast.success("Certification removed successfully");
      } catch (error) {
         console.error("Error removing certification:", error);
         toast.error(
            error.response?.data?.message || "Failed to remove certification"
         );
      }
   };

   const getExpiryStatus = (expiryDate) => {
      if (!expiryDate) return "none";
      const today = new Date();
      const expiry = new Date(expiryDate);
      const daysUntilExpiry = Math.ceil(
         (expiry - today) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry < 0) return "expired";
      if (daysUntilExpiry <= 30) return "expiring";
      return "valid";
   };
   const ProfileHeader = () => {
      if (!profile) return null;
      const currency=JSON.parse(localStorage.getItem('user')).currency;

      // Format currency function
      const formatCurrency = (amount) => {
         return `${new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
         }).format(amount)} ${currency}`;
      };

      return (
         <>
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white mb-8">
               <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                     <div className="relative">
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold backdrop-blur-sm">
                           <img
                              src={profile.userId?.avatar}
                              alt={profile.fullName}
                           />
                        </div>
                        {profile.verified && (
                           <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                              <CheckCircle className="w-4 h-4" />
                           </div>
                        )}
                     </div>
                     <div>
                        <h1 className="text-3xl font-bold mb-2">
                           {profile.fullName}
                        </h1>
                        <div className="flex items-center gap-4 text-blue-100">
                           <span className="flex items-center gap-2">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              {profile.rating}
                           </span>
                           <span className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              {profile.associationType}
                           </span>
                           <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                 profile.availability
                                    ? "bg-green-500/20 text-green-100 border border-green-400/30"
                                    : "bg-red-500/20 text-red-100 border border-red-400/30"
                              }`}
                           >
                              {profile.availability
                                 ? "Available"
                                 : "Unavailable"}
                           </span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-right">
                        <div className="text-2xl font-bold">
                           {formatCurrency(balance.totalEarnings)}
                        </div>
                        <div className="text-blue-200 text-sm">
                           Total Earnings
                        </div>
                     </div>
                     <div
                        className={`px-4 py-2 rounded-lg font-medium ${
                           profile.subscriptionPlan === "Pro"
                              ? "bg-yellow-500/20 text-yellow-100 border border-yellow-400/30"
                              : "bg-gray-500/20 text-gray-100 border border-gray-400/30"
                        }`}
                     >
                        {profile.subscriptionPlan}
                     </div>
                  </div>
               </div>
            </div>

            {/* Earnings Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
               <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-green-100 text-sm font-medium">
                           Available Balance
                        </p>
                        <div className="text-2xl font-bold">
                           {formatCurrency(balance.availableBalance)}
                        </div>
                     </div>
                     <Wallet className="h-8 w-8 text-green-100" />
                  </div>
               </div>

               <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-blue-100 text-sm font-medium">
                           Total Earnings
                        </p>
                        <div className="text-2xl font-bold">
                           {formatCurrency(balance.totalEarnings)}
                        </div>
                     </div>
                     <TrendingUp className="h-8 w-8 text-blue-100" />
                  </div>
               </div>

               <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-yellow-100 text-sm font-medium">
                           Pending Balance
                        </p>
                        <div className="text-2xl font-bold">
                           {formatCurrency(balance.pendingBalance)}
                        </div>
                     </div>
                     <Clock className="h-8 w-8 text-yellow-100" />
                  </div>
               </div>

               <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-purple-100 text-sm font-medium">
                           Total Withdrawn
                        </p>
                        <div className="text-2xl font-bold">
                           {formatCurrency(balance.totalWithdrawn)}
                        </div>
                     </div>
                     <ArrowDownLeft className="h-8 w-8 text-purple-100" />
                  </div>
               </div>
            </div>
         </>
      );
   };
   const TabNavigation = () => (
      <div className="flex flex-wrap gap-2 mb-8 p-1 bg-gray-100 rounded-xl">
         {[
            { id: "profile", label: "Profile Info", icon: User },
            { id: "certifications", label: "Certifications", icon: Award },
            { id: "rates", label: "Rates & Availability", icon: DollarSign },
            { id: "earnings", label: "Earnings Overview", icon: PiggyBank },
         ].map((tab) => {
            const Icon = tab.icon;
            return (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                     activeTab === tab.id
                        ? "bg-white text-[#004aad] shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
               >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
               </button>
            );
         })}{" "}
      </div>
   );

   // Handle resume upload
   const handleResumeUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
         // 10MB limit
         toast.error("File size must be less than 10MB");
         return;
      }

      if (file.type !== "application/pdf") {
         toast.error("Only PDF files are allowed");
         return;
      }

      try {
         const formData = new FormData();
         formData.append("resume", file);

         const response = await api.patch(
            "/api/v1/inspectors/resume",
            formData,
            {
               headers: {
                  "Content-Type": "multipart/form-data",
               },
            }
         );

         setProfile(response.data.data);
         toast.success("Resume uploaded successfully");
      } catch (error) {
         console.error("Error uploading resume:", error);
         toast.error(
            error.response?.data?.message || "Failed to upload resume"
         );
      }
   };

   return (
      <div className="min-h-screen bg-gray-50">
         {loading && (
            <div className="flex items-center justify-center h-64">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004aad]"></div>
            </div>
         )}

         {!profile ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
               <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                     No Profile Found
                  </h2>
                  <p className="text-gray-600 mb-6">
                     You haven't created an inspector profile yet.
                  </p>
                  <button
                     onClick={() =>
                        setProfile({
                           fullName: user?.name || "",
                           contactNumber: "",
                           associationType: "Freelancer",
                           companyName: "",
                           hourlyRate: 0,
                           monthlyRate: 0,
                           marginRate: 0,
                           currency: "",
                           availability: true,
                           verified: false,
                           subscriptionPlan: "Free",
                           rating: 0,
                           totalEarnings: 0,
                           certificateExpiryAlerts: true,
                           matchingJobEmailAlerts: true,
                           acceptedTerms: false,
                           certifications: [],
                           resume: null,
                        })
                     }
                     className="px-6 py-3 bg-[#004aad]  text-white rounded-lg  transition-colors"
                  >
                     Create Profile
                  </button>
               </div>
            </div>
         ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
               <ProfileHeader />
               <TabNavigation />
               <div className="transition-all duration-300">
                  {" "}
                  {activeTab === "profile" && (
                     <ProfileInfoTab
                        profile={profile}
                        isEditing={isEditing}
                        setProfile={setProfile}
                        setIsEditing={setIsEditing}
                        handleSave={handleSave}
                        handleResumeUpload={handleResumeUpload}
                     />
                  )}{" "}
                  {activeTab === "certifications" && (
                     <CertificationsTab
                        profile={profile}
                        setProfile={setProfile}
                        showCertModal={showCertModal}
                        setShowCertModal={setShowCertModal}
                        newCert={newCert}
                        setNewCert={setNewCert}
                        addCertification={addCertification}
                        removeCertification={removeCertification}
                        getExpiryStatus={getExpiryStatus}
                        api={api}
                     />
                  )}{" "}
                  {activeTab === "rates" && (
                     <RatesTab
                        profile={profile}
                        setProfile={setProfile}
                        updateField={updateField}
                     />
                  )}
                  {activeTab === "earnings" && (
                     <EarningsTab
                        balance={balance}
                        fetchBalance={fetchBalance}
                     />
                  )}
                  {activeTab === "preferences" && (
                     <PreferencesTab
                        profile={profile}
                        setProfile={setProfile}
                        updateField={updateField}
                     />
                  )}
               </div>
            </div>
         )}
      </div>
   );
};

export default ManageInspectorProfile;
