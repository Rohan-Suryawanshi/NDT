import Loader from "@/components/common/Loader";
// import AboutSection from "@/features/AboutSection/AboutSection";
import ContactSection from "@/features/ContactSection/ContactSection";
import FeaturesSection from "@/features/FeaturesSection/FeaturesSection";
import FooterSection from "@/features/FooterSection/FooterSection";
import HeroSection from "@/features/HeroSection/HeroSection";
import HowItWorksSection from "@/features/HowItWorksSection/HowItWorksSection";
import NavbarSection from "@/features/NavbarSection/NavbarSection";
import { lazy, Suspense } from "react";
// Sections
const AboutSection = lazy(() => import("@/features/AboutSection/AboutSection"));

// Loader

const LandingPage = () => {
   return (
      <>
         <NavbarSection />
         <HeroSection />
         <div className="sm:hidden">
         <Suspense fallback={<Loader />}>
            <AboutSection />
         </Suspense>
         </div>
         <FeaturesSection />
         <HowItWorksSection />
         <ContactSection />
         <FooterSection />
      </>
   );
};

export default LandingPage;
