import {
   Sheet,
   SheetContent,
   SheetHeader,
   SheetTitle,
   SheetTrigger,
} from "@/components/ui/sheet";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
   Menu,
   Home,
   LayoutDashboard,
   LogIn,
   LogOut,
   UserPlus,
   UserCircle,
   Search,
   Sparkles,
   Briefcase,
   Shield,
   Settings,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NavbarSection = () => {
   const { user, logout, loading } = useAuth();
   const location = useLocation();
   const navigate = useNavigate();

   const handleLogout = () => {
      logout();
      navigate("/");
   };

   const navLinkClasses = (path) =>
      cn(
         "text-sm font-medium transition-colors hover:text-[#004aad]-600",
         location.pathname === path
            ? "text-[#004aad]-600 font-semibold"
            : "text-gray-700"
      );

   return (
      <nav className="bg-white shadow sticky top-0 z-50">
         <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center">
               <img
                  src="./Logo.png"
                  alt="NDT Connect Logo"
                  className="h-8 w-auto"
               />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
               {user?.role === "client" && (
                  <>
                     <Link
                        to="/find-providers"
                        className={navLinkClasses("/find-providers")}
                     >
                        Find Providers
                     </Link>
                     <Link
                        to="/client-requests"
                        className={navLinkClasses("/client-requests")}
                     >
                        My Requests
                     </Link>
                     <Link
                        to="/find-inspectors"
                        className={navLinkClasses("/find-inspectors")}
                     >
                        Find Inspectors
                     </Link>
                  </>
               )}

               {user?.role === "provider" && (
                  <>
                     <Link
                        to="/dashboard-provider"
                        className={navLinkClasses("/dashboard-provider")}
                     >
                        Provider Dashboard
                     </Link>
                     <Link
                        to="/service-request"
                        className={navLinkClasses("/service-request")}
                     >
                        Service Requests
                     </Link>
                  </>
               )}

               {user?.role === "inspector" && (
                  <>
                     <Link
                        to="/dashboard-inspector"
                        className={navLinkClasses("/dashboard-inspector")}
                     >
                        Inspector Dashboard
                     </Link>
                     <Link
                        to="/inspector/assigned-jobs"
                        className={navLinkClasses("/inspector/assigned-jobs")}
                     >
                        Assigned Jobs
                     </Link>
                  </>
               )}

               {user?.role === "admin" && (
                  <>
                     <Link
                        to="/dashboard-admin"
                        className={navLinkClasses("/dashboard-admin")}
                     >
                        Admin Dashboard
                     </Link>
                     <Link
                        to="/admin/user-management"
                        className={navLinkClasses("/admin/user-management")}
                     >
                        User Management
                     </Link>
                     <Link
                        to="/admin/service-manager"
                        className={navLinkClasses("/admin/service-manager")}
                     >
                        Service Manager
                     </Link>
                  </>
               )}

               {loading ? (
                  <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
               ) : user ? (
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                           <Avatar className="h-8 w-8">
                              <AvatarImage
                                 src={
                                    user.avatar || "https://placehold.co/40x40"
                                 }
                              />
                              <AvatarFallback>
                                 {user.name?.[0]?.toUpperCase() ?? "U"}
                              </AvatarFallback>
                           </Avatar>
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                           <p className="text-sm font-medium">{user.name}</p>
                           <p className="text-xs text-gray-500">{user.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                           onClick={() => {
                              if (user.role === "client") {
                                 navigate("/dashboard-client");
                              } else if (user.role === "provider") {
                                 navigate("/dashboard-provider");
                              } else if (user.role === "inspector") {
                                 navigate("/dashboard-inspector");
                              } else if (user.role === "admin") {
                                 navigate("/dashboard-admin");
                              } else {
                                 navigate("/dashboard");
                              }
                           }}
                        >
                           <LayoutDashboard className="mr-2 h-4 w-4" />{" "}
                           Dashboard
                        </DropdownMenuItem>

                        {user.role === "provider" && (
                           <DropdownMenuItem
                              onClick={() => navigate("/provider-profile")}
                           >
                              <UserCircle className="mr-2 h-4 w-4" /> My Profile
                           </DropdownMenuItem>
                        )}

                        {user.role === "inspector" && (
                           <DropdownMenuItem
                              onClick={() => navigate("/inspector-profile")}
                           >
                              <UserCircle className="mr-2 h-4 w-4" /> My Profile
                           </DropdownMenuItem>
                        )}

                        {user.role !== "admin" && (
                           <DropdownMenuItem
                             onClick={() => {
                              if (user.role === "client") {
                                 navigate("/account-settings");
                              } else if (user.role === "provider") {
                                 navigate("/provider-profile");
                              } else if (user.role === "inspector") {
                                 navigate("/inspector-profile");
                              } else {
                                 navigate("/dashboard");
                              }
                           }}
                           >
                              <Settings className="mr-2 h-4 w-4" /> Settings
                           </DropdownMenuItem>
                        )}

                        {user.role === "admin" && (
                           <DropdownMenuItem
                              onClick={() => navigate("/admin/settings")}
                           >
                              <Settings className="mr-2 h-4 w-4" /> Admin Settings
                           </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                           <LogOut className="mr-2 h-4 w-4" /> Log out
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

            {/* Mobile Menu */}
            <Sheet>
               <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                     <Menu className="h-6 w-6" />
                  </Button>
               </SheetTrigger>
               <SheetContent side="right" className="p-6">
                  <SheetHeader>
                     <SheetTitle className="text-xl font-semibold text-center">
                        Menu
                     </SheetTitle>
                  </SheetHeader>

                  <nav className="space-y-4 mt-6 text-gray-700">
                     {user?.role === "client" && (
                        <>
                           <Link to="/find-providers" className="block">
                              Find Providers
                           </Link>
                           <Link to="/client-requests" className="block">
                              My Requests
                           </Link>
                           <Link to="/find-inspectors" className="block">
                              Find Inspectors
                           </Link>
                        </>
                     )}

                     {user?.role === "provider" && (
                        <>
                           <Link to="/dashboard-provider" className="block">
                              Provider Dashboard
                           </Link>
                           <Link to="/service-request" className="block">
                              Service Requests
                           </Link>
                        </>
                     )}

                     {user?.role === "inspector" && (
                        <>
                           <Link to="/dashboard-inspector" className="block">
                              Inspector Dashboard
                           </Link>
                           <Link to="/inspector/assigned-jobs" className="block">
                              Assigned Jobs
                           </Link>
                        </>
                     )}

                     {user?.role === "admin" && (
                        <>
                           <Link to="/dashboard-admin" className="block">
                              Admin Dashboard
                           </Link>
                           <Link to="/admin/user-management" className="block">
                              User Management
                           </Link>
                           <Link to="/admin/service-manager" className="block">
                              Service Manager
                           </Link>
                        </>
                     )}

                     {user ? (
                        <Button className="w-full mt-4" onClick={handleLogout}>
                           <LogOut className="mr-2 h-4 w-4" /> Logout
                        </Button>
                     ) : (
                        <Button className="w-full mt-4" asChild>
                           <Link to="/login">
                              <LogIn className="mr-2 h-4 w-4" /> Login
                           </Link>
                        </Button>
                     )}
                  </nav>
               </SheetContent>
            </Sheet>
         </div>
      </nav>
   );
};

export default NavbarSection;
