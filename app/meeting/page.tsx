"use client";

import Calendly from "./calendly";
import { PiCheckCircle } from "react-icons/pi";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import Head from "next/head";
import { getSEOTags } from "@/lib/seo"; // Importing the getSEOTags function

const checkItemVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 },
};

const Meeting = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Define metadata for the Meeting page
  const metadata = getSEOTags({
    title: "Agenda una Reunión | Capital Code",
    description:
      "Agenda una consulta gratuita con nuestro equipo de expertos en desarrollo de software.",
    keywords: ["reunión", "consultoría", "desarrollo de software"],
    openGraph: {
      title: "Agenda una Reunión con Capital Code",
      description:
        "Nos entusiasma conocer nuevos clientes y discutir proyectos de desarrollo de software personalizados.",
      url: "https://capital-code.vercel.app/meeting",
    },
  });

  return (
    <div
      className="
      flex flex-col  w-full  
      overflow-clip inset-0 -z-10 
      bg-[#fafafa] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]
    "
    >
      <Navbar isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <div className="md:px-0 px-6 xl:w-4/5 2xl:w-[68%] justify-between md:mt-14 md:flex mx-auto  ">
        <div className="md:w-2/5">
          <h1 className="text-4xl font-semibold pt-10   ">
            Agenda una Reunión
          </h1>
          <p className="text-lg text-gray-500 py-4">
            Nos entusiasma conocer nuevos clientes y discutir proyectos de
            desarrollo de software personalizados. Agenda una consulta gratuita
            con nuestro equipo de expertos.
          </p>

          {[
            {
              title: "Desarrollo + Diseño de Software",
              description:
                "Convertimos tus ideas en soluciones tecnológicas innovadoras y personalizadas.",
            },

            {
              title: "Consultoría Gratuita",
              description:
                "Recibe asesoría experta sobre cómo mejorar tu negocio a través de soluciones digitales.",
            },
            {
              title: "Soporte Técnico Especializado",
              description:
                "Brindamos soporte técnico continuo para tu software y aplicaciones web.",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              variants={checkItemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 1.8 }}
              className="flex gap-x-4 py-4"
            >
              <PiCheckCircle className=" rounded-md text-[#3d80d7] text-2xl flex-shrink-0" />
              <ul>
                <h3 className="text-lg font-bold text-gray-700">
                  {item.title}
                </h3>
                <div className="text-gray-400">{item.description}</div>
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="md:w-1/2">
          <Calendly />
        </div>
      </div>
    </div>
  );
};

export default Meeting;
