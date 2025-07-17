import { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { BACKEND_URL } from "@/constant/Global";
import { Upload, Save } from "lucide-react";

export default function ServiceProviderProfileManage() {
  const [form, setForm] = useState({
    contactNumber: "",
    companyName: "",
    companyLocation: "",
    companyDescription: "",
    companySpecialization: "",
  });

  const [companyLogo, setCompanyLogo] = useState(null);
  const [proceduresFile, setProceduresFile] = useState(null);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/v1/service-provider/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      const data = res.data?.data;
      setForm({
        contactNumber: data.contactNumber || "",
        companyName: data.companyName || "",
        companyLocation: data.companyLocation || "",
        companyDescription: data.companyDescription || "",
        companySpecialization: (data.companySpecialization || []).join(", "),
      });
    } catch {
      toast.error("Please Create the Profile");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    for (const key in form) {
      formData.append(key, form[key]);
    }
    if (companyLogo) formData.append("companyLogo", companyLogo);
    if (proceduresFile) formData.append("proceduresFile", proceduresFile);

    try {
      await axios.post(`${BACKEND_URL}/api/v1/service-provider/profile`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Profile saved successfully");
      fetchProfile();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Profile submission failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Service Provider Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4 shadow-sm bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2">Contact Number</Label>
            <Input
              type="text"
              placeholder="Enter contact number"
              value={form.contactNumber}
              onChange={(e) => handleChange("contactNumber", e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="mb-2">Company Name</Label>
            <Input
              type="text"
              placeholder="Enter company name"
              value={form.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="mb-2">Company Location</Label>
            <Input
              type="text"
              placeholder="Enter company location"
              value={form.companyLocation}
              onChange={(e) => handleChange("companyLocation", e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="mb-2">Specialization</Label>
            <Input
              type="text"
              placeholder="e.g. RT, UT, VT"
              value={form.companySpecialization}
              onChange={(e) => handleChange("companySpecialization", e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <Label className="mb-2">Description</Label>
          <Textarea
            placeholder="Describe your company..."
            value={form.companyDescription}
            onChange={(e) => handleChange("companyDescription", e.target.value)}
            required
          />
        </div>

        {/* Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2">Upload Company Logo</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setCompanyLogo(e.target.files[0])}
            />
          </div>
          <div>
            <Label className="mb-2">Upload Procedures (PDF)</Label>
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => setProceduresFile(e.target.files[0])}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" className="gap-2">
            <Save size={16} /> Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
