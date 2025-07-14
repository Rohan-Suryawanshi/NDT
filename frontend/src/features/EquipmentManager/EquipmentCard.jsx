import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function EquipmentCard({ equipment, onEdit, onDelete }) {
   return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
         <h4 className="font-bold text-lg mb-2">{equipment.method}</h4>
         <p>
            <b>Manufacturer:</b> {equipment.manufacturer}
         </p>
         {equipment.model && (
            <p>
               <b>Model:</b> {equipment.model}
            </p>
         )}
         <p>
            <b>Serial Number:</b> {equipment.serialNumber}
         </p>
         <p>
            <b>Calibration Expiry:</b>{" "}
            {format(new Date(equipment.calibrationExpiry), "yyyy-MM-dd")}
         </p>
         <div className="flex justify-between mt-4">
            <Button
               variant="outline"
               size="sm"
               onClick={() => onEdit(equipment)}
            >
               Edit
            </Button>
            <Button
               variant="destructive"
               size="sm"
               onClick={() => onDelete(equipment._id)}
            >
               Delete
            </Button>
         </div>
      </div>
   );
}
