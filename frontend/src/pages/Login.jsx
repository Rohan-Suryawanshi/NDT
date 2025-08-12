import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/constant/Global";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export default function Login() {
   const navigate = useNavigate();
   const { login } = useAuth();

   const [form, setForm] = useState({
      email: "",
      password: "",
   });

   const [loading, setLoading] = useState(false);

   const handleChange = (e) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
   };

   const handleLogin = async (e) => {
      e.preventDefault();

      if (!form.email || !form.password) {
         toast.error("Email and Password are required");
         return;
      }

      setLoading(true);
      try {
         const res = await fetch(`${BACKEND_URL}/api/v1/users/login`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
         });

         const data = await res.json();

         if (!res.ok) {
            toast.error(data.message || "Login failed");
         } else {
            toast.success("Login successful!");
            console.log(data);

            // Use the login function from useAuth hook
            login(data.data.user, data.data.accessToken);

            if (data.data.user.role === "provider") {
               navigate("/dashboard-provider");
            } else if (data.data.user.role === "inspector") {
               navigate("/dashboard-inspector");
            } else if (data.data.user.role === "admin") {
               navigate("/admin/dashboard");
            } else {
               navigate("/dashboard-client");
            }
         }
      } catch (err) {
         console.error("Login error:", err);
         toast.error("Something went wrong");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
         <form
            onSubmit={handleLogin}
            className="w-full max-w-md bg-white p-8 rounded-lg shadow space-y-6"
         >
            <h2 className="text-3xl font-bold text-center text-[#004aad]">
               Login
            </h2>

            <div className="flex flex-col gap-1">
               <label className="text-sm font-medium text-gray-700">
                  Email
               </label>
               <Input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
               />
            </div>

            <div className="flex flex-col gap-1">
               <label className="text-sm font-medium text-gray-700">
                  Password
               </label>
               <Input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
               />
            </div>

            <Button type="submit" className="w-full mt-4" disabled={loading}>
               {loading ? "Logging in..." : "Login"}
            </Button>

            <p className="text-sm text-center text-gray-600 mt-4">
               Don’t have an account?{" "}
               <span
                  onClick={() => navigate("/register")}
                  className="text-[#004aad] hover:underline cursor-pointer"
               >
                  Register
               </span>
            </p>
         </form>
      </div>
   );
}
