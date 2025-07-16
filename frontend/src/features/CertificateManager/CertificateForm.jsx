import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/constant/Global";

export default function CertificateForm({ initialData, onSuccess }) {
   const [formData, setFormData] = useState({
      certificateName: initialData?.certificateName || "",
      certificationBody: initialData?.certificationBody || "",
      category: initialData?.category || "",
      issuedYear: initialData?.issuedYear || "",
      expiryDate: initialData?.expiryDate?.slice(0, 10) || "",
      certificate: null,
   });

   const isEdit = !!initialData?._id;

   const handleChange = (e) => {
      const { name, value, files } = e.target;
      setFormData((prev) => ({
         ...prev,
         [name]: files ? files[0] : value,
      }));
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      const body = new FormData();
      body.append("certificateName", formData.certificateName);
      body.append("certificationBody", formData.certificationBody);
      body.append("category", formData.category);
      body.append("issuedYear", formData.issuedYear);
      body.append("expiryDate", formData.expiryDate);
      if (formData.certificate) {
         body.append("certificate", formData.certificate);
      }

      try {
         const headers = {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
         };

         if (isEdit) {
            await axios.put(
               `${BACKEND_URL}/api/v1/certificates/${initialData._id}`,
               body,
               { headers }
            );
            toast.success("Certificate updated");
         } else {
            await axios.post(
               `${BACKEND_URL}/api/v1/certificates`,
               body,
               {
                  headers,
               }
            );
            toast.success("Certificate added");
         }

         onSuccess();
      } catch{
         toast.error("Something went wrong");
      }
   };

   return (
      <form onSubmit={handleSubmit} className="space-y-4">
         <div>
            <Label className="mb-2">Certificate Name</Label>
            <Input
               type="text"
               name="certificateName"
               value={formData.certificateName}
               onChange={handleChange}
               required
            />
         </div>

         <div>
            <Label className="mb-2">Certification Body</Label>
            <Input
               type="text"
               name="certificationBody"
               value={formData.certificationBody}
               onChange={handleChange}
               required
            />
         </div>

         <div>
            <Label className="mb-2">Category</Label>
            <Input
               type="text"
               name="category"
               value={formData.category}
               onChange={handleChange}
               required
            />
         </div>

         <div>
            <Label className="mb-2">Issued Year</Label>
            <Input
               type="number"
               name="issuedYear"
               value={formData.issuedYear}
               onChange={handleChange}
               required
            />
         </div>

         <div>
            <Label className="mb-2">Expiry Date</Label>
            <Input
               type="date"
               name="expiryDate"
               value={formData.expiryDate}
               onChange={handleChange}
               required
            />
         </div>

         <div>
            <Label className="mb-2">Upload Certificate (optional)</Label>
            <Input
               type="file"
               name="certificate"
               accept=".pdf,.jpg,.png"
               onChange={handleChange}
            />
         </div>

         <Button type="submit" className="w-full mt-4">
            {isEdit ? "Update Certificate" : "Add Certificate"}
         </Button>
      </form>
   );
}
