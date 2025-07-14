import { useEffect, useState } from "react";
import axios from "axios";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import EquipmentForm from "./EquipmentForm";
import EquipmentCard from "./EquipmentCard";
import { BACKEND_URL } from "@/constant/Global";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";

export default function EquipmentManager() {
   const [equipments, setEquipments] = useState([]);
   const [open, setOpen] = useState(false);
   const [selectedEquipment, setSelectedEquipment] = useState(null);
   const [searchMethod, setSearchMethod] = useState("");
   const [expiryBefore, setExpiryBefore] = useState("");

   // Fetch equipments
   const fetchEquipments = async () => {
      try {
         const res = await axios.get(`${BACKEND_URL}/api/v1/equipments`, {
            headers: {
               Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
         });
         setEquipments(res.data?.data || []);
      } catch {
         toast.error("Failed to fetch equipments");
      }
   };

   // Handle Add/Edit submit
   const handleAddOrUpdate = async (formData) => {
      try {
         if (selectedEquipment) {
            await axios.put(
               `${BACKEND_URL}/api/v1/equipments/${selectedEquipment._id}`,
               formData,
               {
                  headers: {
                     Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                     )}`,
                  },
               }
            );
            toast.success("Equipment updated");
         } else {
            await axios.post(`${BACKEND_URL}/api/v1/equipments`, formData, {
               headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                     "accessToken"
                  )}`,
               },
            });
            toast.success("Equipment added");
         }
         fetchEquipments();
         setOpen(false);
         setSelectedEquipment(null);
      } catch {
         toast.error("Error saving equipment");
      }
   };

   // Handle Delete
   const handleDelete = async (id) => {
      if (!confirm("Delete this equipment?")) return;
      try {
         await axios.delete(`${BACKEND_URL}/api/v1/equipments/${id}`, {
            headers: {
               Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
         });
         toast.success("Deleted");
         fetchEquipments();
      } catch {
         toast.error("Failed to delete");
      }
   };

   // Edit handler
   const handleEdit = (equipment) => {
      setSelectedEquipment(equipment);
      setOpen(true);
   };

   useEffect(() => {
      fetchEquipments();
   }, []);

   // Filtered equipments
   const filteredEquipments = equipments.filter((item) => {
      const methodMatch = item.method
         .toLowerCase()
         .includes(searchMethod.toLowerCase());
      const expiryMatch = expiryBefore
         ? new Date(item.calibrationExpiry) <= new Date(expiryBefore)
         : true;
      return methodMatch && expiryMatch;
   });

   return (
      <div className="p-6">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Equipment Manager</h2>
            <Dialog
               open={open}
               onOpenChange={(o) => {
                  setOpen(o);
                  if (!o) setSelectedEquipment(null);
               }}
            >
               <DialogTrigger asChild>
                  <Button onClick={() => setSelectedEquipment(null)}>
                     Add Equipment
                  </Button>
               </DialogTrigger>
               <DialogContent>
                  <DialogHeader>
                     <DialogTitle>
                        {selectedEquipment ? "Edit Equipment" : "Add Equipment"}
                     </DialogTitle>
                  </DialogHeader>
                  <EquipmentForm
                     initialData={selectedEquipment}
                     onSubmit={handleAddOrUpdate}
                  />
               </DialogContent>
            </Dialog>
         </div>

         {/* Filters */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
               <label className="block text-sm font-medium">
                  Filter by Method
               </label>
               <Input
                  type="text"
                  placeholder="e.g. UT"
                  value={searchMethod}
                  onChange={(e) => setSearchMethod(e.target.value)}
                  className="w-full mt-1 border rounded px-2 py-1"
               />
            </div>
            <div>
               <label className="block text-sm font-medium">
                  Calibration Expiry Before
               </label>
               <Input
                  type="date"
                  value={expiryBefore}
                  onChange={(e) => setExpiryBefore(e.target.value)}
                  className="w-full mt-1 border rounded px-2 py-1"
               />
            </div>
            <div className="flex items-end">
               <Button
                  variant="outline"
                  onClick={() => {
                     setSearchMethod("");
                     setExpiryBefore("");
                  }}
               >
                  Clear Filters
               </Button>
            </div>
         </div>

         {/* Equipment cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEquipments.map((item) => (
               <EquipmentCard
                  key={item._id}
                  equipment={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
               />
            ))}
         </div>
      </div>
   );
}
