import { Button } from "@/components/ui/button";

export default function SkillMatrixCard({ matrix, onEdit, onDelete }) {
   return (
      <div className="border p-4 rounded shadow space-y-2">
         <h3 className="font-semibold text-lg">{matrix.technician.name}</h3>
         {matrix.certificates.map((cert, i) => (
            <div key={i} className="text-sm text-gray-700 border-t mt-2 pt-2">
               <p>Method: {cert.method}</p>
               <p>Level: {cert.level}</p>
               <p>
                  Expiry:{" "}
                  {new Date(cert.certificationExpiryDate).toLocaleDateString()}
               </p>
               <a
                  href={cert.certificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
               >
                  View Certificate
               </a>
            </div>
         ))}
         <div className="flex justify-between mt-3">
            <Button onClick={() => onEdit(matrix)}>Edit</Button>
            <Button variant="destructive" onClick={() => onDelete(matrix._id)}>
               Delete
            </Button>
         </div>
      </div>
   );
}
