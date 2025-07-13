import Loader from "@/components/common/Loader";
import { Header } from "@/components/Layout/Header";
import AboutSection from "@/features/AboutSection/AboutSection";
import ContactSection from "@/features/ContactSection/ContactSection";
import FeaturesSection from "@/features/FeaturesSection/FeaturesSection";
import FooterSection from "@/features/FooterSection/FooterSection";
import HeroSection from "@/features/HeroSection/HeroSection";
import HowItWorksSection from "@/features/HowItWorksSection/HowItWorksSection";
import NavbarSection from "@/features/NavbarSection/NavbarSection";
import { useState, useEffect } from "react";

// Sections


// Loader

const LandingPage=()=> {
   const [loading, setLoading] = useState(true);

   // Simulate loading for 2 seconds
   useEffect(() => {
      const timeout = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timeout);
   }, []);

   if (loading) return <Loader />;

   return (
      <>
         <NavbarSection/>
         <HeroSection />
         <FeaturesSection />
         <HowItWorksSection />
         <AboutSection />
         <ContactSection />
         <FooterSection />
      </>
   );
}

export default LandingPage;