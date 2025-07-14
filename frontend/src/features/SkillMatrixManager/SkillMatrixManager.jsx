import { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, Eye } from "lucide-react";
import { BACKEND_URL } from "@/constant/Global";
import toast from "react-hot-toast";

export default function SkillMatrixManager() {
   const [data, setData] = useState([]);
   const [filters, setFilters] = useState({
      technician: "",
      method: "",
      level: "",
      expiry: "",
   });
   const [form, setForm] = useState({
      technician: "",
      certificates: [{ method: "", level: "", expiry: "", file: null }],
   });
   const [editing, setEditing] = useState(null);

   const fetchData = async () => {
      try {
         const res = await axios.get(`${BACKEND_URL}/api/v1/skill-matrix`, {
            headers: {
               Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
         });
         setData(res.data?.data || []);
      } catch {
         toast.error("Failed to load skill matrices");
      }
   };

   useEffect(() => {
      fetchData();
   }, []);

   const handleChange = (idx, key, val) => {
      const updated = [...form.certificates];
      updated[idx][key] = val;
      setForm((prev) => ({ ...prev, certificates: updated }));
   };

   const addCertRow = () => {
      setForm((prev) => ({
         ...prev,
         certificates: [
            ...prev.certificates,
            { method: "", level: "", expiry: "", file: null },
         ],
      }));
   };

   const removeCertRow = (idx) => {
      const updated = [...form.certificates];
      updated.splice(idx, 1);
      setForm((prev) => ({ ...prev, certificates: updated }));
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData();

      const certs = form.certificates.map((cert) => ({
         method: cert.method,
         level: cert.level,
         certificationExpiryDate: cert.expiry,
      }));

      formData.append(
         "data",
         JSON.stringify({
            technician: { name: form.technician },
            certificates: certs,
         })
      );

      form.certificates.forEach((cert) => {
         formData.append("certificateFiles", cert.file);
      });

      try {
         if (editing) {
            await axios.put(
               `${BACKEND_URL}/api/v1/skill-matrix/${editing}`,
               formData,
               {
                  headers: {
                     Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                     )}`,
                  },
               }
            );
            toast.success("Skill Matrix Updated");
         } else {
            await axios.post(`${BACKEND_URL}/api/v1/skill-matrix`, formData, {
               headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                     "accessToken"
                  )}`,
               },
            });
            toast.success("Skill Matrix Created");
         }

         setForm({
            technician: "",
            certificates: [{ method: "", level: "", expiry: "", file: null }],
         });
         setEditing(null);
         fetchData();
      } catch (err) {
         toast.error(err?.response?.data?.message || "Submission Failed");
      }
   };

   const handleEdit = (matrix) => {
      setEditing(matrix._id);
      setForm({
         technician: matrix.technician.name,
         certificates: matrix.certificates.map((cert) => ({
            method: cert.method,
            level: cert.level,
            expiry: cert.certificationExpiryDate,
            file: null,
         })),
      });
   };

   const handleDelete = async (id) => {
      try {
         await axios.delete(`${BACKEND_URL}/api/v1/skill-matrix/${id}`, {
            headers: {
               Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
         });
         toast.success("Deleted");
         fetchData();
      } catch {
         toast.error("Delete failed");
      }
   };

   const filtered = data.filter(
      (matrix) =>
         matrix.technician.name
            .toLowerCase()
            .includes(filters.technician.toLowerCase()) &&
         matrix.certificates.some(
            (cert) =>
               cert.method
                  .toLowerCase()
                  .includes(filters.method.toLowerCase()) &&
               cert.level.toLowerCase().includes(filters.level.toLowerCase()) &&
               cert.certificationExpiryDate.includes(filters.expiry)
         )
   );

   return (
      <div className="p-6 space-y-6">
         <h1 className="text-2xl font-bold">Skill Matrix Manager</h1>
         <div className="border p-4 rounded space-y-2 shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               {["Technician", "Method", "Level", "Expiry"].map((key) => (
                  <label key={key} className="font-medium">
                     {key}
                  </label>
               ))}
            </div>

            {/* Filter Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
               {["technician", "method", "level", "expiry"].map((key) => (
                  <Input
                     key={key}
                     placeholder={`Filter by ${key}`}
                     value={filters[key]}
                     onChange={(e) =>
                        setFilters((prev) => ({
                           ...prev,
                           [key]: e.target.value,
                        }))
                     }
                  />
               ))}
            </div>
         </div>

         {/* Form */}
         <form
            onSubmit={handleSubmit}
            className="border p-4 rounded space-y-4 shadow"
         >
            <div>
               <Label className="mb-2">Technician Name</Label>
               <Input
                  placeholder="Technician Name"
                  value={form.technician}
                  onChange={(e) =>
                     setForm((prev) => ({
                        ...prev,
                        technician: e.target.value,
                     }))
                  }
                  required
               />
            </div>

            {form.certificates.map((cert, idx) => (
               <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center"
               >
                  <div>
                     <Label className="mb-2">Method</Label>
                     <Input
                        placeholder="Method"
                        value={cert.method}
                        onChange={(e) =>
                           handleChange(idx, "method", e.target.value)
                        }
                        required
                     />
                  </div>
                  <div>
                     <Label className="mb-2">Level</Label>
                     <Input
                        placeholder="Level"
                        value={cert.level}
                        onChange={(e) =>
                           handleChange(idx, "level", e.target.value)
                        }
                        required
                     />
                  </div>
                  <div>
                     <Label className="mb-2">Expiry Date</Label>
                     <Input
                        type="date"
                        value={cert.expiry}
                        onChange={(e) =>
                           handleChange(idx, "expiry", e.target.value)
                        }
                        required
                     />
                  </div>
                  <div>
                     <Label className="mb-2">Upload File</Label>
                     <Input
                        type="file"
                        onChange={(e) =>
                           handleChange(idx, "file", e.target.files[0])
                        }
                        accept="image/*,application/pdf"
                     />
                  </div>
                  {form.certificates.length > 1 && (
                     <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeCertRow(idx)}
                        className="mt-5"
                     >
                        <Trash2 size={16} />
                     </Button>
                  )}
               </div>
            ))}

            <div className="flex gap-4">
               <Button type="button" variant="outline" onClick={addCertRow}>
                  <Plus size={16} className="mr-1" /> Add Certificate
               </Button>
               <Button type="submit">{editing ? "Update" : "Submit"}</Button>
            </div>
         </form>

         {/* Table */}
         <div className="overflow-x-auto border rounded">
            <table className="min-w-full table-auto">
               <thead className="bg-gray-100 text-left">
                  <tr>
                     <th className="p-2 border">Technician</th>
                     <th className="p-2 border">Method</th>
                     <th className="p-2 border">Level</th>
                     <th className="p-2 border">Expiry</th>
                     <th className="p-2 border">Action</th>
                  </tr>
               </thead>
               <tbody>
                  {filtered.flatMap((matrix) =>
                     matrix.certificates.map((cert, i) => (
                        <tr key={`${matrix._id}-${i}`} className="border-b">
                           <td className="p-2 border">
                              {matrix.technician.name}
                           </td>
                           <td className="p-2 border">{cert.method}</td>
                           <td className="p-2 border">{cert.level}</td>
                           <td className="p-2 border">
                              {new Date(
                                 cert.certificationExpiryDate
                              ).toLocaleDateString()}
                           </td>
                           <td className="p-2 border flex gap-2 items-center">
                              {cert.certificationUrl && (
                                 <a
                                    href={cert.certificationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                 >
                                    <Button size="sm" variant="secondary">
                                       <Eye size={14} />
                                    </Button>
                                 </a>
                              )}
                              <Button
                                 size="sm"
                                 onClick={() => handleEdit(matrix)}
                                 variant="outline"
                              >
                                 <Pencil size={14} />
                              </Button>
                              <Button
                                 size="sm"
                                 variant="destructive"
                                 onClick={() => handleDelete(matrix._id)}
                              >
                                 <Trash2 size={14} />
                              </Button>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
   );
}
