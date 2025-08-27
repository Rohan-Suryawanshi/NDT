import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate=useNavigate();
  return (
    <section className="bg-white py-20">

      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center gap-10">
        <motion.div
          className="md:w-1/2 text-gray-800"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold mb-4 text-[#004aad]">
            Welcome to NDT Connect
          </h1>
          <p className="mb-6 text-gray-600">
            Your trusted platform for Non-Destructive Testing services.
            Find expert providers or offer your specialized NDT skills.
          </p>
          <Button onClick={() => navigate("/login")}>Get Started</Button>
        </motion.div>

        <motion.img
          src="/Hero-section.jpg"
          alt="NDT illustration"
          className="md:w-1/2 rounded-lg shadow"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        />
      </div>
    </section>
  );
};

export default HeroSection;
