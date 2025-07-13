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
         "text-sm font-medium transition-colors hover:text-blue-600",
         location.pathname === path
            ? "text-blue-600 font-semibold"
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
               <a href="#about" className="hover:text-blue-600">
                  About
               </a>
               <a href="#features" className="hover:text-blue-600">
                  Features
               </a>
               <a href="#contact" className="hover:text-blue-600">
                  Contact
               </a>

               {user?.role === "client" && (
                  <>
                     <Link
                        to="/find-providers"
                        className={navLinkClasses("/find-providers")}
                     >
                        Find Providers
                     </Link>
                     <Link
                        to="/recommendations"
                        className={navLinkClasses("/recommendations")}
                     >
                        Recommendations
                     </Link>
                     <Link
                        to="/my-requests"
                        className={navLinkClasses("/my-requests")}
                     >
                        My Requests
                     </Link>
                  </>
               )}

               {user?.role === "provider" && (
                  <Link
                     to="/dashboard-provider"
                     className={navLinkClasses("/dashboard-provider")}
                  >
                     Provider Dashboard
                  </Link>
               )}

               {user?.role === "admin" && (
                  <Link
                     to="/admin/dashboard"
                     className={navLinkClasses("/admin/dashboard")}
                  >
                     Admin Dashboard
                  </Link>
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
                           onClick={() => navigate("/dashboard")}
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

                        {user.role !== "admin" && (
                           <DropdownMenuItem
                              onClick={() => navigate("/settings")}
                           >
                              <Settings className="mr-2 h-4 w-4" /> Settings
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
                     <a href="#about" className="block hover:text-blue-600">
                        About
                     </a>
                     <a href="#features" className="block hover:text-blue-600">
                        Features
                     </a>
                     <a href="#contact" className="block hover:text-blue-600">
                        Contact
                     </a>

                     {user?.role === "client" && (
                        <>
                           <Link to="/find-providers" className="block">
                              Find Providers
                           </Link>
                           <Link to="/recommendations" className="block">
                              Recommendations
                           </Link>
                           <Link to="/my-requests" className="block">
                              My Requests
                           </Link>
                        </>
                     )}

                     {user?.role === "provider" && (
                        <Link to="/provider-dashboard" className="block">
                           Provider Dashboard
                        </Link>
                     )}

                     {user?.role === "admin" && (
                        <Link to="/admin/dashboard" className="block">
                           Admin Dashboard
                        </Link>
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
