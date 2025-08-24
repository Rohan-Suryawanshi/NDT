import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import CertificateForm from "./CertificateForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Trash2, PlusCircle } from "lucide-react";
import { BACKEND_URL } from "@/constant/Global";
import { Location } from "@/constant/Location";
import NavbarSection from "../NavbarSection/NavbarSection";

export default function CertificateManager() {
   const [certificates, setCertificates] = useState([]);
   const [selectedCert, setSelectedCert] = useState(null);
   const [open, setOpen] = useState(false);

   const fetchCertificates = async () => {
      try {
         const res = await axios.get(
            `${BACKEND_URL}/api/v1/certificates`,
            {
               headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                     "accessToken"
                  )}`,
               },
            }
         );
         setCertificates(res.data.data);
      } catch {
         toast.error("Failed to fetch certificates");
      }
   };

   const deleteCertificate = async (id) => {
      try {
         await axios.delete(`${BACKEND_URL}/api/v1/certificates/${id}`, {
            headers: {
               Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
         });
         toast.success("Certificate deleted");
         fetchCertificates();
      } catch {
         toast.error("Delete failed");
      }
   };

   useEffect(() => {
      fetchCertificates();
   }, []);

   return (
      <>
      <NavbarSection/>
      <div className="p-6 max-w-7xl mx-auto">
         <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
               Company Certificates
            </h1>
            <Dialog open={open} onOpenChange={setOpen}>
               <DialogTrigger asChild>
                  <Button
                     onClick={() => {
                        setSelectedCert(null);
                        setOpen(true);
                     }}
                     className="gap-2"
                  >
                     <PlusCircle size={18} /> Add Certificate
                  </Button>
               </DialogTrigger>
               <DialogContent>
                  <DialogHeader>
                     <DialogTitle className="text-center">Edit Certificate</DialogTitle>
                     <DialogDescription>
                     </DialogDescription>
                  </DialogHeader>
                  <CertificateForm
                     initialData={selectedCert}
                     onSuccess={() => {
                        fetchCertificates();
                        setOpen(false);
                     }}
                  />
               </DialogContent>
            </Dialog>
         </div>

         <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
               <thead className="bg-gray-100 text-gray-700 text-left">
                  <tr>
                     <th className="p-3">Certificate Name</th>
                     <th className="p-3">Body</th>
                     <th className="p-3">Category</th>
                     <th className="p-3">Issued</th>
                     <th className="p-3">Expiry</th>
                     <th className="p-3">Certificate</th>
                     <th className="p-3">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {certificates.map((cert) => (
                     <tr
                        key={cert._id}
                        className="border-t hover:bg-muted transition"
                     >
                        <td className="p-3">{cert.certificateName}</td>
                        <td className="p-3">{cert.certificationBody}</td>
                        <td className="p-3">{cert.category}</td>
                        <td className="p-3">{cert.issuedYear}</td>
                        <td className="p-3">
                           {new Date(cert.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                           {cert.certificateUrl ? (
                              <a
                                 href={cert.certificateUrl}
                                 className="text-[#004aad] underline"
                                 target="_blank"
                                 rel="noreferrer"
                              >
                                 View
                              </a>
                           ) : (
                              <span className="text-gray-400">N/A</span>
                           )}
                        </td>
                        <td className="p-3">
                           <div className="flex gap-2">
                              <Button
                                 variant="outline"
                                 size="icon"
                                 onClick={() => {
                                    setSelectedCert(cert);
                                    setOpen(true);
                                 }}
                              >
                                 <Pencil size={16} />
                              </Button>
                              <Button
                                 variant="destructive"
                                 size="icon"
                                 onClick={() => deleteCertificate(cert._id)}
                              >
                                 <Trash2 size={16} />
                              </Button>
                           </div>
                        </td>
                     </tr>
                  ))}
                  {certificates.length === 0 && (
                     <tr>
                        <td
                           colSpan="7"
                           className="text-center p-4 text-gray-500"
                        >
                           No certificates found.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
   </>
   );
}
