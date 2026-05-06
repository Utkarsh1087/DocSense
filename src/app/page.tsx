import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import Branding from "@/components/Branding";
import Integrations from "@/components/Integrations";
import Workflow from "@/components/Workflow";
import Comparison from "@/components/Comparison";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="bg-white min-h-screen">
      <Navbar />
      <HeroSection />
      <Branding />
      <Integrations />
      <Workflow />
      <Comparison />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
