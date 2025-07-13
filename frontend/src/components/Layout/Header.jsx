import { Link, useLocation, useNavigate } from "react-router-dom";
import {
   Home,
   LogIn,
   LogOut,
   UserPlus,
   LayoutDashboard,
   Search,
   Sparkles,
   Briefcase,
   Settings,
   Shield,
   UserCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
   const { user, logout, loading } = useAuth();
   const location = useLocation();
   const navigate = useNavigate();

   const handleLogout = () => {
      logout();
      navigate("/");
   };

   const navLinkClasses = (path) =>
      cn(
         "text-sm font-medium transition-colors hover:text-primary",
         location.pathname === path ? "text-primary" : "text-muted-foreground"
      );

   return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur px-2">
         <div className="container flex h-16 items-center justify-between">
            <Link
               to="/"
               className="flex items-center gap-2 font-bold text-lg"
               aria-label="NDT Connect Home"
            >
               NDT Connect
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
               <Link to="/" className={navLinkClasses("/")}>
                  <Home className="h-4 w-4 inline-block mr-1" /> Home
               </Link>

               {user?.role === "client" && (
                  <>
                     <Link
                        to="/find-providers"
                        className={navLinkClasses("/find-providers")}
                     >
                        <Search className="h-4 w-4 inline-block mr-1" /> Find
                        Providers
                     </Link>
                     <Link
                        to="/recommendations"
                        className={navLinkClasses("/recommendations")}
                     >
                        <Sparkles className="h-4 w-4 inline-block mr-1" /> Get
                        Recommendations
                     </Link>
                     <Link
                        to="/my-requests"
                        className={navLinkClasses("/my-requests")}
                     >
                        <Briefcase className="h-4 w-4 inline-block mr-1" /> My
                        Requests
                     </Link>
                  </>
               )}

               {user?.role === "provider" && (
                  <Link
                     to="/provider-dashboard"
                     className={navLinkClasses("/provider-dashboard")}
                  >
                     <LayoutDashboard className="h-4 w-4 inline-block mr-1" />{" "}
                     Provider Dashboard
                  </Link>
               )}

               {user?.role === "admin" && (
                  <Link
                     to="/admin/dashboard"
                     className={navLinkClasses("/admin/dashboard")}
                  >
                     <Shield className="h-4 w-4 inline-block mr-1" /> Admin
                     Dashboard
                  </Link>
               )}
            </nav>

            <div className="flex items-center gap-3">
               {loading ? (
                  <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
               ) : user ? (
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           variant="ghost"
                           className="relative h-8 w-8 rounded-full"
                        >
                           <Avatar className="h-8 w-8">
                              <AvatarImage
                                 src={
                                    user.avatar ||
                                    "https://placehold.co/40x40.png"
                                 }
                                 alt={user.name || "User"}
                              />
                              <AvatarFallback>
                                 {user.name?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                           </Avatar>
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuLabel className="font-normal">
                           <div className="flex flex-col space-y-1">
                              <p className="text-sm font-medium leading-none">
                                 {user.name ?? user.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                 {user.email} ({user.role})
                              </p>
                           </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {user.role === "admin" ? (
                           <DropdownMenuItem
                              onClick={() => navigate("/admin/dashboard")}
                           >
                              <Shield className="mr-2 h-4 w-4" />
                              Admin Dashboard
                           </DropdownMenuItem>
                        ) : (
                           <DropdownMenuItem
                              onClick={() => navigate("/dashboard")}
                           >
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              Dashboard
                           </DropdownMenuItem>
                        )}

                        {user.role === "provider" && (
                           <DropdownMenuItem
                              onClick={() => navigate("/provider-profile")}
                           >
                              <UserCircle className="mr-2 h-4 w-4" />
                              My Profile
                           </DropdownMenuItem>
                        )}

                        {user.role !== "admin" && (
                           <DropdownMenuItem
                              onClick={() => navigate("/settings")}
                           >
                              <Settings className="mr-2 h-4 w-4" />
                              Settings
                           </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                           <LogOut className="mr-2 h-4 w-4" />
                           Log out
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               ) : (
                  <>
                     <Button variant="ghost" asChild>
                        <Link to="/login">
                           <LogIn className="mr-2 h-4 w-4" /> Login
                        </Link>
                     </Button>
                     <Button asChild>
                        <Link to="/register">
                           <UserPlus className="mr-2 h-4 w-4" /> Register
                        </Link>
                     </Button>
                  </>
               )}
            </div>
         </div>
      </header>
   );
}
