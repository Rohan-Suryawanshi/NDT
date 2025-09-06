import { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Plus, Eye } from "lucide-react";
import { BACKEND_URL } from "@/constant/Global";
import toast from "react-hot-toast";
import NavbarSection from "../NavbarSection/NavbarSection";

const NDT_LEVELS = [
   { value: "assistant", label: "Assistant NDT Tech." },
   { value: "level_1", label: "Level I" },
   { value: "level_2", label: "Level II" },
   { value: "level_3", label: "Level III" },
   { value: "engineer", label: "Engineer" },
];

export default function SkillMatrixManager() {
   const [data, setData] = useState([]);
   const [services, setServices] = useState([]);
   const [filters, setFilters] = useState({
      technician: "",
      method: "",
      level: "",
      expiry: "",
   });
   const [formKey, setFormKey] = useState(Date.now()); // For resetting file input
   const [form, setForm] = useState({
      technician: "",
      certificates: [
         {
            method: "",
            level: "",
            expiry: "",
            file: null,
            experience: "",
            qualification: "",
            isAvailable: true,
         },
      ],
   });
   const [editing, setEditing] = useState(null);

   useEffect(() => {
      fetchData();
      fetchServices();
   }, []);

   const fetchServices = async () => {
      try {
         const res = await axios.get(`${BACKEND_URL}/api/v1/service`, {
            headers: {
               Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
         });
         setServices(res.data?.data || []);
      } catch {
         toast.error("Failed to load services");
      }
   };

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

   const handleChange = (idx, key, value) => {
      const updated = [...form.certificates];
      updated[idx][key] = value;
      setForm((prev) => ({ ...prev, certificates: updated }));
   };
   const addCertRow = () => {
      setForm((prev) => ({
         ...prev,
         certificates: [
            ...prev.certificates,
            {
               method: "",
               level: "",
               expiry: "",
               file: null,
               experience: "",
               qualification: "",
               isAvailable: true,
            },
         ],
      }));
   };

   const removeCertRow = (idx) => {
      const updated = [...form.certificates];
      updated.splice(idx, 1);
      setForm((prev) => ({ ...prev, certificates: updated }));
   };

   const clearForm = () => {
      setForm({
         technician: "",
         certificates: [
            {
               method: "",
               level: "",
               expiry: "",
               file: null,
               experience: "",
               qualification: "",
               isAvailable: true,
            },
         ],
      });
      setEditing(null);
      setFormKey(Date.now());
   };
   const handleEdit = (matrix) => {
      setEditing(matrix._id);
      setFormKey(Date.now());
      setForm({
         technician: matrix.technician.name,
         certificates: matrix.certificates.map((cert) => ({
            method: cert.method,
            level: cert.level,
            expiry: cert.certificationExpiryDate
               ? new Date(cert.certificationExpiryDate)
                    .toISOString()
                    .slice(0, 10)
               : "",
            file: null,
            experience: cert.experience || "",
            qualification: cert.qualification || "",
            isAvailable:
               cert.isAvailable !== undefined ? cert.isAvailable : true,
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
   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!editing && form.certificates.some((c) => !c.file)) {
         toast.error("All certificates must have a file uploaded.");
         return;
      }

      const formData = new FormData();
      const certs = form.certificates.map((c) => ({
         method: c.method,
         level: c.level,
         certificationExpiryDate: c.expiry,
         experience: c.experience,
         qualification: c.qualification,
         isAvailable: c.isAvailable,
      }));

      formData.append(
         "data",
         JSON.stringify({
            technician: { name: form.technician },
            certificates: certs,
         })
      );
      form.certificates.forEach((c) =>
         formData.append("certificateFiles", c.file)
      );

      try {
         const url = editing
            ? `${BACKEND_URL}/api/v1/skill-matrix/${editing}`
            : `${BACKEND_URL}/api/v1/skill-matrix`;

         const method = editing ? "put" : "post";

         await axios[method](url, formData, {
            headers: {
               Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
         });

         toast.success(
            editing ? "Skill Matrix Updated" : "Skill Matrix Created"
         );
         clearForm();
         fetchData();
      } catch (err) {
         toast.error(err?.response?.data?.message || "Submission Failed");
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
      <>
         <NavbarSection />
         <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Skill Matrix Manager</h1>
            {/* Filters */}
            {/* <div className="border p-4 rounded mb-2 shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               {["Technician", "Method", "Level", "Expiry"].map((key) => (
                  <label key={key} >{key}</label>
               ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
               {["technician", "method", "level", "expiry"].map((key) => (
                  <Input
                     key={key}
                     placeholder={`Filter by ${key}`}
                     value={filters[key]}
                     onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
               ))}
            </div>
         </div> */}
            {/* Filters */}
            <div className="border p-4 rounded mb-4 shadow space-y-4">
               <h2 className="text-lg font-semibold">Filter Skill Matrices</h2>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Technician Filter */}
                  <div className="flex flex-col gap-1">
                     <label className="text-sm font-medium text-gray-700">
                        Technician
                     </label>
                     <Input
                        placeholder="Filter by Technician"
                        value={filters.technician}
                        onChange={(e) =>
                           setFilters((prev) => ({
                              ...prev,
                              technician: e.target.value,
                           }))
                        }
                     />
                  </div>

                  {/* Method Filter */}
                  <div className="flex flex-col gap-1">
                     <label className="text-sm font-medium text-gray-700">
                        Method
                     </label>
                     <Input
                        placeholder="Filter by Method"
                        value={filters.method}
                        onChange={(e) =>
                           setFilters((prev) => ({
                              ...prev,
                              method: e.target.value,
                           }))
                        }
                     />
                  </div>

                  {/* Level Filter */}
                  <div className="flex flex-col gap-1">
                     <label className="text-sm font-medium text-gray-700">
                        Level
                     </label>
                     <Input
                        placeholder="Filter by Level"
                        value={filters.level}
                        onChange={(e) =>
                           setFilters((prev) => ({
                              ...prev,
                              level: e.target.value,
                           }))
                        }
                     />
                  </div>

                  {/* Expiry Filter */}
                  <div className="flex flex-col gap-1">
                     <label className="text-sm font-medium text-gray-700">
                        Expiry
                     </label>
                     <Input
                        placeholder="Filter by Expiry"
                        value={filters.expiry}
                        onChange={(e) =>
                           setFilters((prev) => ({
                              ...prev,
                              expiry: e.target.value,
                           }))
                        }
                     />
                  </div>
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
               </div>{" "}
               {form.certificates.map((cert, idx) => (
                  <div
                     key={idx}
                     className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50"
                  >
                     {/* Method (Service) Dropdown */}
                     <div>
                        <Label className="mb-2">Method (Service)</Label>
                        <Select
                           value={cert.method}
                           onValueChange={(value) =>
                              handleChange(idx, "method", value)
                           }
                        >
                           <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Service" />
                           </SelectTrigger>
                           <SelectContent>
                              {services.map((service) => (
                                 <SelectItem
                                    key={service._id}
                                    value={service.name}
                                 >
                                    {service.name}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>

                     {/* Level Dropdown */}
                     <div>
                        <Label className="mb-2">Certification Level</Label>
                        <Select
                           value={cert.level}
                           onValueChange={(value) =>
                              handleChange(idx, "level", value)
                           }
                        >
                           <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Level" />
                           </SelectTrigger>
                           <SelectContent>
                              {NDT_LEVELS.map((level) => (
                                 <SelectItem
                                    key={level.value}
                                    value={level.value}
                                 >
                                    {level.label}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>

                     {/* Expiry Date */}
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

                     {/* Experience */}
                     <div>
                        <Label className="mb-2">Experience</Label>
                        <Input
                           placeholder="e.g., 5 years"
                           value={cert.experience}
                           onChange={(e) =>
                              handleChange(idx, "experience", e.target.value)
                           }
                        />
                     </div>

                     {/* Qualification */}
                     <div>
                        <Label className="mb-2">Qualification</Label>
                        <Textarea
                           placeholder="Educational background, certifications..."
                           value={cert.qualification}
                           onChange={(e) =>
                              handleChange(idx, "qualification", e.target.value)
                           }
                           rows={2}
                        />
                     </div>

                     {/* Availability Switch */}
                     <div className="flex items-center space-x-2">
                        <Label className="mb-2">Availability</Label>
                        <Switch
                           checked={cert.isAvailable}
                           onCheckedChange={(checked) =>
                              handleChange(idx, "isAvailable", checked)
                           }
                        />
                        <span
                           className={`text-sm font-medium ${
                              cert.isAvailable
                                 ? "text-green-600"
                                 : "text-red-600"
                           }`}
                        >
                           {cert.isAvailable ? "Available" : "Not Available"}
                        </span>
                     </div>

                     {/* Upload File */}
                     <div className="md:col-span-2">
                        <Label className="mb-2">Upload Certificate</Label>
                        <Button
                           type="button"
                           className="w-full"
                           onClick={() =>
                              document
                                 .getElementById(`file-input-${formKey}-${idx}`)
                                 .click()
                           }
                        >
                           {cert.file ? cert.file.name : "Choose File"}
                        </Button>
                        <Input
                           id={`file-input-${formKey}-${idx}`}
                           key={`${formKey}-${idx}`}
                           type="file"
                           accept="image/*,application/pdf"
                           style={{ display: "none" }}
                           onChange={(e) =>
                              handleChange(idx, "file", e.target.files[0])
                           }
                        />
                     </div>
                     {form.certificates.length > 1 && (
                        <div className="flex items-end">
                           <Button
                              type="button"
                              variant="destructive"
                              onClick={() => removeCertRow(idx)}
                              className="w-full"
                           >
                              <Trash2 size={16} className="mr-2" />
                              Remove Certificate
                           </Button>
                        </div>
                     )}
                  </div>
               ))}
               <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={addCertRow}>
                     <Plus size={16} className="mr-1" /> Add Certificate
                  </Button>
                  <Button type="submit">{editing ? "Update" : "Submit"}</Button>
                  <Button type="button" variant="secondary" onClick={clearForm}>
                     Clear Form
                  </Button>
               </div>
            </form>{" "}
            {/* Table */}
            <div className="overflow-x-auto border rounded">
               <table className="min-w-full table-auto">
                  <thead className="bg-gray-100 text-left">
                     <tr>
                        <th className="p-2 border">Technician</th>
                        <th className="p-2 border">Method</th>
                        <th className="p-2 border">Level</th>
                        <th className="p-2 border">Experience</th>
                        <th className="p-2 border">Qualification</th>
                        <th className="p-2 border">Available</th>
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
                              <td className="p-2 border">
                                 {NDT_LEVELS.find(
                                    (level) => level.value === cert.level
                                 )?.label || cert.level}
                              </td>
                              <td className="p-2 border">
                                 {cert.experience || "N/A"}
                              </td>
                              <td className="p-2 border">
                                 <div
                                    className="max-w-xs truncate"
                                    title={cert.qualification}
                                 >
                                    {cert.qualification || "N/A"}
                                 </div>
                              </td>
                              <td className="p-2 border">
                                 <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                       cert.isAvailable !== false
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                    }`}
                                 >
                                    {cert.isAvailable !== false
                                       ? "Available"
                                       : "Not Available"}
                                 </span>
                              </td>
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
      </>
   );
}
