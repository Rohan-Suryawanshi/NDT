import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { BACKEND_URL } from "@/constant/Global";
import { Pencil, Trash2, Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@/components/ui/dialog";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import NavbarSection from "@/features/NavbarSection/NavbarSection";

export default function ServiceManager() {
   const [services, setServices] = useState([]);
   const [filteredServices, setFilteredServices] = useState([]);
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [searchTerm, setSearchTerm] = useState("");
   const [filterType, setFilterType] = useState("all");
   const [form, setForm] = useState({
      name: "",
      code: "",
      description: "",
      isPremium: false,
   });
   const [editingId, setEditingId] = useState(null);

   // Fetch services on component mount
   useEffect(() => {
      fetchServices();
   }, []);

   // Filter services based on search and filter criteria
   useEffect(() => {
      let filtered = services;

      // Search filter
      if (searchTerm) {
         filtered = filtered.filter(
            (service) =>
               service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               service.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
               service.description
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase())
         );
      }

      // Type filter
      if (filterType === "premium") {
         filtered = filtered.filter((service) => service.isPremium);
      } else if (filterType === "standard") {
         filtered = filtered.filter((service) => !service.isPremium);
      }

      setFilteredServices(filtered);
   }, [services, searchTerm, filterType]);

   const fetchServices = async () => {
      try {
         setIsLoading(true);
         const response = await axios.get(`${BACKEND_URL}/api/v1/service`, {
            headers: {
               Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
         });
         setServices(response.data.data || []);
         toast.success("Services loaded successfully");
      } catch (error) {
         console.error("Error fetching services:", error);
         toast.error("Failed to load services");
      } finally {
         setIsLoading(false);
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!form.name.trim() || !form.code.trim()) {
         toast.error("Name and code are required");
         return;
      }

      try {
         setIsLoading(true);
         const method = editingId ? "put" : "post";
         const url = editingId
            ? `${BACKEND_URL}/api/v1/service/${editingId}`
            : `${BACKEND_URL}/api/v1/service`;

         await axios[method](url, form, {
            headers: {
               Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
               "Content-Type": "application/json",
            },
         });

         toast.success(
            editingId
               ? "Service updated successfully"
               : "Service created successfully"
         );
         resetForm();
         setIsDialogOpen(false);
         fetchServices();
      } catch (error) {
         console.error("Error saving service:", error);
         const errorMessage =
            error.response?.data?.message || "Failed to save service";
         toast.error(errorMessage);
      } finally {
         setIsLoading(false);
      }
   };

   const handleEdit = (service) => {
      setForm({
         name: service.name,
         code: service.code,
         description: service.description || "",
         isPremium: service.isPremium || false,
      });
      setEditingId(service._id);
      setIsDialogOpen(true);
   };

   const handleDelete = async (id) => {
      if (!window.confirm("Are you sure you want to delete this service?")) {
         return;
      }

      try {
         setIsLoading(true);
         await axios.delete(`${BACKEND_URL}/api/v1/service/${id}`, {
            headers: {
               Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
         });
         toast.success("Service deleted successfully");
         fetchServices();
      } catch (error) {
         console.error("Error deleting service:", error);
         toast.error("Failed to delete service");
      } finally {
         setIsLoading(false);
      }
   };

   const resetForm = () => {
      setForm({
         name: "",
         code: "",
         description: "",
         isPremium: false,
      });
      setEditingId(null);
   };

   const handleDialogClose = () => {
      setIsDialogOpen(false);
      resetForm();
   };

   return (
      <>
      <NavbarSection/>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 mt-3">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
               <h1 className="text-3xl font-bold text-gray-900">
                  Service Manager
               </h1>
               <p className="text-gray-600 mt-1">
                  Manage all services in the system
               </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
               <DialogTrigger asChild>
                  <Button
                     onClick={() => setIsDialogOpen(true)}
                     className="flex items-center gap-2"
                  >
                     <Plus className="h-4 w-4" />
                     Add New Service
                  </Button>
               </DialogTrigger>
               <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                     <DialogTitle>
                        {editingId ? "Edit Service" : "Add New Service"}
                     </DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <Label htmlFor="name">Service Name *</Label>
                        <Input
                           id="name"
                           placeholder="Enter service name"
                           value={form.name}
                           onChange={(e) =>
                              setForm((prev) => ({
                                 ...prev,
                                 name: e.target.value,
                              }))
                           }
                           required
                        />
                     </div>

                     <div>
                        <Label htmlFor="code">Service Code *</Label>
                        <Input
                           id="code"
                           placeholder="Enter service code (e.g., INSP001)"
                           value={form.code}
                           onChange={(e) =>
                              setForm((prev) => ({
                                 ...prev,
                                 code: e.target.value.toUpperCase(),
                              }))
                           }
                           required
                        />
                     </div>

                     <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                           id="description"
                           placeholder="Enter service description"
                           value={form.description}
                           onChange={(e) =>
                              setForm((prev) => ({
                                 ...prev,
                                 description: e.target.value,
                              }))
                           }
                           rows={3}
                        />
                     </div>

                     <div className="flex items-center space-x-2">
                        <Switch
                           id="isPremium"
                           checked={form.isPremium}
                           onCheckedChange={(checked) =>
                              setForm((prev) => ({
                                 ...prev,
                                 isPremium: checked,
                              }))
                           }
                        />
                        <Label htmlFor="isPremium">Premium Service</Label>
                     </div>

                     <div className="flex gap-2 pt-4">
                        <Button
                           type="submit"
                           disabled={isLoading}
                           className="flex-1"
                        >
                           {isLoading
                              ? editingId
                                 ? "Updating..."
                                 : "Creating..."
                              : editingId
                              ? "Update Service"
                              : "Create Service"}
                        </Button>
                        <Button
                           type="button"
                           variant="outline"
                           onClick={handleDialogClose}
                           className="flex-1"
                        >
                           Cancel
                        </Button>
                     </div>
                  </form>
               </DialogContent>
            </Dialog>
         </div>

         {/* Summary Stats */}
         <div className="my-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               <div className="bg-white rounded-lg shadow flex flex-col items-center py-6">
                  <div className="text-3xl font-extrabold text-blue-600">
                     {services.length}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                     Total Services
                  </div>
               </div>
               <div className="bg-white rounded-lg shadow flex flex-col items-center py-6">
                  <div className="text-3xl font-extrabold text-yellow-600">
                     {services.filter((s) => s.isPremium).length}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                     Premium Services
                  </div>
               </div>
               <div className="bg-white rounded-lg shadow flex flex-col items-center py-6">
                  <div className="text-3xl font-extrabold text-green-600">
                     {services.filter((s) => !s.isPremium).length}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                     Standard Services
                  </div>
               </div>
               <div className="bg-white rounded-lg shadow flex flex-col items-center py-6">
                  <div className="text-3xl font-extrabold text-purple-600">
                     {filteredServices.length}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                     Filtered Results
                  </div>
               </div>
            </div>
         </div>
         {/* Search and Filter Controls */}
         <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
               <Input
                  placeholder="Search services by name, code, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
               />
            </div>

            <div className="flex items-center gap-2">
               <Filter className="h-4 w-4 text-gray-500" />
               <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">All Services</SelectItem>
                     <SelectItem value="premium">Premium Only</SelectItem>
                     <SelectItem value="standard">Standard Only</SelectItem>
                  </SelectContent>
               </Select>
            </div>
         </div>

         {/* Services Grid */}
         {isLoading && services.length === 0 ? (
            <div className="text-center py-8">
               <div className="animate-pulse">Loading services...</div>
            </div>
         ) : filteredServices.length === 0 ? (
            <div className="text-center py-8">
               <p className="text-gray-500">
                  {searchTerm || filterType !== "all"
                     ? "No services found matching your criteria"
                     : "No services available. Add your first service to get started."}
               </p>
            </div>
         ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {filteredServices.map((service) => (
                  <Card
                     key={service._id}
                     className="hover:shadow-md transition-shadow"
                  >
                     <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                           <div className="flex-1">
                              <CardTitle className="text-lg">
                                 {service.name}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                 <Badge variant="outline" className="text-xs">
                                    {service.code}
                                 </Badge>
                                 {service.isPremium && (
                                    <Badge className="text-xs bg-yellow-100 text-yellow-800">
                                       Premium
                                    </Badge>
                                 )}
                              </div>
                           </div>

                           <div className="flex gap-1">
                              <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleEdit(service)}
                                 className="h-8 w-8 p-0"
                              >
                                 <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleDelete(service._id)}
                                 className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           </div>
                        </div>
                     </CardHeader>

                     {service.description && (
                        <CardContent className="pt-0">
                           <p className="text-sm text-gray-600 line-clamp-3">
                              {service.description}
                           </p>
                        </CardContent>
                     )}
                  </Card>
               ))}
            </div>
         )}
      </div>
      </>
   );
}
