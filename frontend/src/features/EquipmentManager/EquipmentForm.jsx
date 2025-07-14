import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function EquipmentForm({ initialData, onSubmit }) {
   const [formData, setFormData] = useState(
      initialData || {
         method: "",
         manufacturer: "",
         model: "",
         serialNumber: "",
         calibrationExpiry: "",
      }
   );

   const handleChange = (e) =>
      setFormData({ ...formData, [e.target.name]: e.target.value });

   const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
   };

   return (
      <form onSubmit={handleSubmit} className="space-y-4">
         {["method", "manufacturer", "model", "serialNumber"].map((field) => (
            <div key={field}>
               <Label htmlFor={field} className="mb-2">
                  {field}
               </Label>
               <Input
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  required={field !== "model"}
               />
            </div>
         ))}
         <div>
            <Label htmlFor="calibrationExpiry" className="mb-2">
               Calibration Expiry
            </Label>
            <Input
               type="date"
               name="calibrationExpiry"
               value={formData.calibrationExpiry?.slice(0, 10) || ""}
               onChange={handleChange}
               required
            />
         </div>
         <Button type="submit" className="w-full">
            {initialData ? "Update" : "Add"} Equipment
         </Button>
      </form>
   );
}
