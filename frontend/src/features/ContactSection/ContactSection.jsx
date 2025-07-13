import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ContactSection=()=> {
   return (
      <section id="contact" className="py-20 bg-white px-4">
         <h3 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Contact Us
         </h3>
         <form className="max-w-xl mx-auto space-y-4">
            <Input placeholder="Your Name" />
            <Input type="email" placeholder="Your Email" />
            <Input placeholder="Phone Number" />
            <Textarea placeholder="Your Message" className="h-32" />
            <Button className="w-full">
               Send Message
            </Button>
         </form>
      </section>
   );
}

export default ContactSection;