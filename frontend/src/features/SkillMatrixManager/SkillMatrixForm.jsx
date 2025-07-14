import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

export default function SkillMatrixForm({ onSubmit }) {
   const [technicianName, setTechnicianName] = useState("");
   const [certificates, setCertificates] = useState([
      { method: "", level: "", certificationExpiryDate: "", file: null },
   ]);

   const handleChange = (index, field, value) => {
      const updated = [...certificates];
      updated[index][field] = value;
      setCertificates(updated);
   };

   const handleFile = (index, file) => {
      const updated = [...certificates];
      updated[index].file = file;
      setCertificates(updated);
   };

   const addCertificate = () => {
      setCertificates([
         ...certificates,
         { method: "", level: "", certificationExpiryDate: "", file: null },
      ]);
   };

   const removeCertificate = (index) => {
      const updated = [...certificates];
      updated.splice(index, 1);
      setCertificates(updated);
   };

   const handleSubmit = (e) => {
      e.preventDefault();

      if (!technicianName.trim()) {
         return toast.error("Technician name is required");
      }

      for (let i = 0; i < certificates.length; i++) {
         const cert = certificates[i];
         if (
            !cert.method ||
            !cert.level ||
            !cert.certificationExpiryDate ||
            !cert.file
         ) {
            return toast.error(`Please complete certificate #${i + 1}`);
         }
      }

      const data = {
         technician: { name: technicianName },
         certificates: certificates.map(
            ({ method, level, certificationExpiryDate }) => ({
               method,
               level,
               certificationExpiryDate,
            })
         ),
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(data));
      certificates.forEach((cert) =>
         formData.append("certificateFiles", cert.file)
      );

      onSubmit(formData);
   };

   return (
      <form onSubmit={handleSubmit} className="space-y-6">
         <div>
            <Label>Technician Name</Label>
            <Input
               type="text"
               value={technicianName}
               onChange={(e) => setTechnicianName(e.target.value)}
               required
            />
         </div>

         <div className="space-y-5">
            {certificates.map((cert, index) => (
               <div
                  key={index}
                  className="p-4 border rounded relative bg-gray-50"
               >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                     <div>
                        <Label>Method</Label>
                        <Input
                           type="text"
                           value={cert.method}
                           onChange={(e) =>
                              handleChange(index, "method", e.target.value)
                           }
                           required
                        />
                     </div>
                     <div>
                        <Label>Level</Label>
                        <Input
                           type="text"
                           value={cert.level}
                           onChange={(e) =>
                              handleChange(index, "level", e.target.value)
                           }
                           required
                        />
                     </div>
                     <div>
                        <Label>Expiry Date</Label>
                        <Input
                           type="date"
                           value={cert.certificationExpiryDate}
                           onChange={(e) =>
                              handleChange(
                                 index,
                                 "certificationExpiryDate",
                                 e.target.value
                              )
                           }
                           required
                        />
                     </div>
                  </div>

                  <div>
                     <Label>Certificate File</Label>
                     <Input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFile(index, e.target.files[0])}
                        required
                     />
                  </div>

                  {certificates.length > 1 && (
                     <Button
                        type="button"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => removeCertificate(index)}
                     >
                        Remove
                     </Button>
                  )}
               </div>
            ))}
         </div>

         <Button type="button" onClick={addCertificate} variant="outline">
            ➕ Add Certificate
         </Button>

         <Button type="submit" className="w-full">
            Submit
         </Button>
      </form>
   );
}
