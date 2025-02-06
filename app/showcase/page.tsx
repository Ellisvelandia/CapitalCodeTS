"use client";

import { BlurFadeDemo } from "@/components/demos/blur-fade-demo";
import Footer from "@/components/footer";
import WordFadeIn from "@/components/magicui/word-fade-in";
import { Element } from "react-scroll";
import Navbar from "@/components/Navbar";
import LetsMakeThingsHappenSection from "@/components/ui/lets-make-things-happen";
import { useState } from "react";
import { getSEOTags } from "@/lib/seo"; // Importing the getSEOTags function

const Showcase = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Define metadata for the Showcase page
  const metadata = getSEOTags({
    title: "Proyectos de Capital Code | Desarrollo de Software",
    description:
      "Explora algunos de nuestros proyectos recientes de desarrollo de software y sitios web personalizados.",
    keywords: [
      "proyectos",
      "desarrollo de software",
      "sitios web personalizados",
    ],
    openGraph: {
      title: "Proyectos de Capital Code",
      description:
        "Mira nuestros proyectos recientes y cómo transformamos ideas en soluciones.",
      url: "https://capital-code.vercel.app/showcase",
    },
  });

  return (
    <div className="overflow-clip inset-0 -z-10 h-full w-full bg-[#fafafa] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
      <Element name="top">
        <Navbar isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      </Element>

      <Element name="services">
        <section className="md:px-0 mx-6 xl:w-4/5 2xl:w-[68%] md:mx-auto">
          <div className="flex items-center justify-center relative">
            <WordFadeIn
              className="text-3xl pt-20 lg:text-5xl font-semibold max-w-3xl mx-auto md:text-center z-20"
              words="Diseño y Código que Impulsa el Crecimiento de tu Negocio"
            />
          </div>
          <p className="md:text-center text-xl md:text-2xl my-6 md:w-4/5 mx-auto text-gray-500">
            Explora algunos de nuestros proyectos recientes de desarrollo de
            software y sitios web personalizados.
          </p>
        </section>
      </Element>

      <Element name="process">
        <BlurFadeDemo />
      </Element>

      <Element name="guarentees">
        <LetsMakeThingsHappenSection />
      </Element>

      <Footer />
    </div>
  );
};

export default Showcase;
