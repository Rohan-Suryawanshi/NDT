import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { BACKEND_URL } from "@/constant/Global";

import { Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
   Select,
   SelectTrigger,
   SelectContent,
   SelectItem,
   SelectValue,
} from "@/components/ui/select";

export default function OfferedServicesManager() {
   const [services, setServices] = useState([]);
   const [offerings, setOfferings] = useState([]);
   const [form, setForm] = useState({
      serviceId: "",
      charge: "",
      unit: "Per Unit",
      currency: "USD",
      tax: 0,
   });
   const [editingId, setEditingId] = useState(null);

   // Fetch services & offerings on mount
   useEffect(() => {
      fetchServices();
      fetchOfferings();
   }, []);

   const fetchServices = async () => {
      try {
         const res = await axios.get(`${BACKEND_URL}/api/v1/service`, {
            headers: {
               Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
         });
         setServices(res.data.data);
      } catch {
         toast.error("Failed to load services");
      }
   };

   const fetchOfferings = async () => {
      try {
         const res = await axios.get(`${BACKEND_URL}/api/v1/offered-services`, {
            headers: {
               Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
         });
         setOfferings(res.data.data);
      } catch {
         toast.error("Failed to load offerings");
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (!form.serviceId || !form.charge) {
         return toast.error("Service and charge are required.");
      }

      try {
         const url = `${BACKEND_URL}/api/v1/offered-services`;
         await axios.post(url, form, {
            headers: {
               Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
         });

         toast.success(
            editingId ? "Updated successfully" : "Added successfully"
         );
         resetForm();
         fetchOfferings();
      } catch (err) {
         toast.error(err?.response?.data?.message || "Submission failed");
      }
   };

   const handleEdit = (off) => {
      setEditingId(off._id);
      setForm({
         serviceId: off.serviceId._id,
         charge: off.charge,
         unit: off.unit,
         currency: off.currency,
         tax: off.tax,
      });
   };

   const handleDelete = async (id) => {
      try {
         await axios.delete(`${BACKEND_URL}/api/v1/offered-services/${id}`, {
            headers: {
               Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
         });
         toast.success("Deleted successfully");
         fetchOfferings();
      } catch {
         toast.error("Failed to delete");
      }
   };

   const resetForm = () => {
      setEditingId(null);
      setForm({
         serviceId: "",
         charge: "",
         unit: "Per Unit",
         currency: "USD",
         tax: 0,
      });
   };

   return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
         <h2 className="text-2xl font-bold mb-6">Add Service</h2>

         {/* Form Section */}
         <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white p-4 rounded shadow-sm border"
         >
            <div className="flex flex-wrap gap-4">
               {/* Give more space to Service dropdown */}
               <div className="w-full sm:flex-[2] min-w-[240px]">
                  <Label className="mb-2">Service</Label>
                  <Select
                     value={form.serviceId}
                     onValueChange={(v) =>
                        setForm((prev) => ({ ...prev, serviceId: v }))
                     }
                  >
                     <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a service" />
                     </SelectTrigger>
                     <SelectContent>
                        {services.map((s) => (
                           <SelectItem key={s._id} value={s._id}>
                              {s.name}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               {/* All other fields have equal flexible width */}
               <div className="w-full sm:flex-1 min-w-[140px]">
                  <Label className="mb-2">Price</Label>
                  <Input
                     type="number"
                     placeholder="e.g. 100"
                     value={form.charge}
                     onChange={(e) =>
                        setForm((prev) => ({ ...prev, charge: e.target.value }))
                     }
                     required
                  />
               </div>

               <div className="w-full sm:flex-1 min-w-[140px]">
                  <Label className="mb-2">Unit</Label>
                  <Select
                     value={form.unit}
                     onValueChange={(v) =>
                        setForm((prev) => ({ ...prev, unit: v }))
                     }
                  >
                     <SelectTrigger className="w-full">
                        <SelectValue placeholder="Unit" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="Per Unit">Per Unit</SelectItem>
                        <SelectItem value="Per Day">Per Day</SelectItem>
                        <SelectItem value="Per Service">Per Service</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <div className="w-full sm:flex-1 min-w-[140px] ">
                  <Label className="mb-2">Currency</Label>
                  <Select
                     value={form.currency}
                     onValueChange={(v) =>
                        setForm((prev) => ({ ...prev, currency: v }))
                     }
                  >
                     <SelectTrigger className="w-full">
                        <SelectValue placeholder="Currency" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <div className="w-full sm:flex-1 min-w-[120px]">
                  <Label className="mb-2">Tax %</Label>
                  <Input
                     type="number"
                     placeholder="0"
                     value={form.tax}
                     onChange={(e) =>
                        setForm((prev) => ({ ...prev, tax: e.target.value }))
                     }
                  />
               </div>
            </div>

            <Button type="submit" className="w-full sm:w-auto">
               {editingId ? "Update Service" : "Add Service"}
            </Button>
         </form>

         {/* Table Section */}
         <div className="mt-8 overflow-x-auto border rounded shadow bg-white">
            <table className="min-w-full table-auto text-sm text-left">
               <thead className="bg-gray-100 text-gray-600">
                  <tr>
                     <th className="p-3">Service</th>
                     <th className="p-3">Price</th>
                     <th className="p-3">Unit</th>
                     <th className="p-3">Currency</th>
                     <th className="p-3">Tax</th>
                     <th className="p-3 text-center">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {offerings.map((off) => (
                     <tr key={off._id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{off.serviceId?.name}</td>
                        <td className="p-3">
                           ${Number(off.charge).toFixed(2)}
                        </td>
                        <td className="p-3">{off.unit}</td>
                        <td className="p-3">{off.currency}</td>
                        <td className="p-3">{off.tax}%</td>
                        <td className="p-3 flex justify-center gap-2">
                           <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(off)}
                           >
                              <Pencil size={14} />
                           </Button>
                           <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(off._id)}
                           >
                              <Trash2 size={14} />
                           </Button>
                        </td>
                     </tr>
                  ))}
                  {offerings.length === 0 && (
                     <tr>
                        <td
                           colSpan="6"
                           className="p-4 text-center text-gray-500"
                        >
                           No offerings found
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
   );
}
