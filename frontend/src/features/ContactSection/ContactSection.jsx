import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { BACKEND_URL } from "@/constant/Global";

const ContactSection = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/contact/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      console.log(data);
      if (data.success) {
        toast.success("Message sent successfully!");
        setForm({ name: "", email: "", phone: "", message: "" });
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    }
  };

  return (
    <section id="contact" className="py-20 bg-white px-4">
      <h3 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Contact Us
      </h3>
      <form className="max-w-xl mx-auto space-y-4" onSubmit={handleSubmit}>
        <Input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your Name"
        />
        <Input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Your Email"
        />
        <Input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone Number"
        />
        <Textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="Your Message"
          className="h-32"
        />
        <Button type="submit" className="w-full">
          Send Message
        </Button>
      </form>
    </section>
  );
};

export default ContactSection;
