import { useState, useEffect } from "react";
import { BACKEND_URL } from "@/constant/Global";

export const useAuth = () => {
   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchAuth = async () => {
         try {
            const storedToken = localStorage.getItem("accessToken");

            if (storedToken) {
               const res = await fetch(
                  `${BACKEND_URL}/api/v1/users/current-user`,
                  {
                     headers: {
                        Authorization: `Bearer ${storedToken}`,
                     },
                  }
               );

               const data = await res.json();

               if (res.ok) {
                  setUser(data.data);
                  localStorage.setItem("user", JSON.stringify(data.data));
               } else {
                  throw new Error(data.message || "Failed to verify user");
               }
            } else {
               setUser(null);
            }
         } catch (error) {
            console.error("Error loading auth data:", error);
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");
            setUser(null);
         } finally {
            setLoading(false);
         }
      };

      fetchAuth();
   }, []);

   const login = (userData, token) => {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
   };

   const logout = async () => {
      try {
         const token = localStorage.getItem("accessToken");
         if (token) {
            await fetch(`${BACKEND_URL}/api/v1/users/logout`, {
               method: "POST",
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            });
         }
      } catch (error) {
         console.error("Error during logout:", error);
      } finally {
         localStorage.removeItem("user");
         localStorage.removeItem("accessToken");
         setUser(null);
      }
   };

   const refreshAuth = async () => {
      try {
         const token = localStorage.getItem("accessToken");
         if (token) {
            const res = await fetch(
               `${BACKEND_URL}/api/v1/users/current-user`,
               {
                  headers: {
                     Authorization: `Bearer ${token}`,
                  },
               }
            );

            const data = await res.json();

            if (res.ok) {
               setUser(data.data);
               localStorage.setItem("user", JSON.stringify(data.data));
            } else {
               throw new Error(data.message || "Failed to refresh auth");
            }
         }
      } catch (error) {
         console.error("Error refreshing auth:", error);
         localStorage.removeItem("user");
         localStorage.removeItem("accessToken");
         setUser(null);
      }
   };

   return { user, login, logout, loading, refreshAuth };
};
