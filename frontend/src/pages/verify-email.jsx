import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "@/constant/Global";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
   const [searchParams] = useSearchParams();
   const navigate = useNavigate();
   const token = searchParams.get("token");

   const [verified, setVerified] = useState(null);
   const [loading, setLoading] = useState(true);

   const hasVerified = useRef(false); // ✅ Guard to prevent double execution

   useEffect(() => {
      if (hasVerified.current) return;
      hasVerified.current = true;

      const verifyEmail = async () => {
         if (!token) {
            setVerified(false);
            toast.error("Invalid verification link.");
            setLoading(false);
            return;
         }

         try {
            const res = await fetch(
               `${BACKEND_URL}/api/v1/users/verify-email?token=${token}`
            );
            const data = await res.json();

            if (res.ok) {
               setVerified(true);
               toast.success("Email verified successfully!");
            } else {
               setVerified(false);
               toast.error(data.message || "Verification failed.");
            }
         } catch (err) {
            console.error("Verification error:", err);
            setVerified(false);
            toast.error("Something went wrong.");
         } finally {
            setLoading(false);
         }
      };

      verifyEmail();
   }, [token]);

   return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
         <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6 text-center">
            {loading ? (
               <p className="text-gray-600 text-lg font-medium">
                  Verifying your email...
               </p>
            ) : verified ? (
               <>
                  <h2 className="text-green-600 text-2xl font-bold">
                     Success ✅
                  </h2>
                  <p className="mt-2 text-gray-700">
                     Your email has been verified.
                  </p>
                  <Button className="mt-4" onClick={() => navigate("/login")}>
                     Go to Login
                  </Button>
               </>
            ) : (
               <>
                  <h2 className="text-red-600 text-2xl font-bold">
                     Verification Failed ❌
                  </h2>
                  <p className="mt-2 text-gray-700">
                     This link is invalid or has expired.
                  </p>
               </>
            )}
         </div>
      </div>
   );
}
