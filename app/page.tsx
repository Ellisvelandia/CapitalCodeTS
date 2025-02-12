"use client";

import dynamic from "next/dynamic";
import BoxRevealDemo from "@/components/demos/box-reveal-demo";
import { CoverDemo } from "@/components/demos/cover-demo";
import { ScrollBasedVelocityDemo } from "@/components/demos/scroll-based-velocity-demo";
import { WordPullUpDemo } from "@/components/demos/word-pull-up-demo";
import BoxReveal from "@/components/magicui/box-reveal";
import NumberTicker from "@/components/magicui/number-ticker";
import { InfiniteMovingLogos } from "@/components/ui/infinite-moving-logos";
import Image from "next/image";
import Link from "next/link";
import { PiCheckBold } from "react-icons/pi";
import { Link as ScrollLink, Element } from "react-scroll";
import { IconStarFilled } from "@tabler/icons-react";
import { ShootingStarsAndStarsBackgroundDemo } from "@/components/demos/shooting-stars-demo";
import LetsMakeThingsHappenSection from "@/components/ui/lets-make-things-happen";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { getSEOTags } from "@/lib/seo";
import Footer from "@/components/footer";

// Dynamically import components
const AnimatedBeamMultipleOutputDemoDynamic = dynamic(() =>
  import("@/components/demos/animated-beam-demo").then(
    (mod) => mod.AnimatedBeamMultipleOutputDemo
  )
);
const AnimatedShinyTextDemoDynamic = dynamic(() =>
  import("@/components/demos/animated-shiny-text-demo").then(
    (mod) => mod.AnimatedShinyTextDemo
  )
);

const services = [
  {
    icon: "/images/s_6.png",
    title: "Desarrollo Web Personalizado",
    description:
      "Creamos sitios web únicos y personalizados que reflejan la identidad de tu marca y cumplen tus objetivos comerciales",
  },
  {
    icon: "/images/s_1.png",
    title: "Desarrollo de Software",
    description:
      "Desarrollamos soluciones de software a medida para optimizar tus procesos empresariales y aumentar la eficiencia",
  },
  {
    icon: "/images/s_5.png",
    title: "Aplicaciones Móviles",
    description:
      "Diseñamos y desarrollamos aplicaciones móviles intuitivas para iOS y Android que conectan con tus usuarios",
  },
  {
    icon: "/images/s_3.png",
    title: "Consultoría Tecnológica",
    description:
      "Asesoramos en la selección e implementación de tecnologías para maximizar el potencial de tu negocio",
  },
  {
    icon: "/images/s_4.png",
    title: "E-commerce",
    description:
      "Creamos tiendas en línea robustas y seguras para impulsar tus ventas en el mundo digital",
  },
  {
    icon: "/images/s_2.png",
    title: "Mantenimiento y Soporte",
    description:
      "Ofrecemos soporte continuo y mantenimiento para garantizar el funcionamiento óptimo de tus sistemas",
  },
];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Define metadata for the Home page
  const metadata = getSEOTags({
    title: "Capital Code | Desarrollo de Software y Sitios Web Personalizados",
    description:
      "Especialistas en desarrollo de software y sitios web personalizados para empresas e individuos.",
    keywords: [
      "desarrollo de software",
      "sitios web personalizados",
      "soluciones tecnológicas innovadoras",
    ],
    openGraph: {
      title: "Capital Code | Desarrollo de Software",
      description:
        "Expertos en desarrollo de software y sitios web personalizados",
      url: "https://capital-code.vercel.app/",
      images: [
        {
          url: "/logo/logo.webp",
          width: 1200,
          height: 630,
          alt: "Capital Code - Desarrollo de Software",
        },
      ],
    },
  });

  return (
    <>
      <main className="overflow-clip inset-0 -z-10 h-full w-full bg-[#fafafa] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <Navbar isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
        <div className="md:pb-10">
          <div className="md:px-0 mx-6 xl:w-4/5 2xl:w-[68%] md:mx-auto mt-14">
            <AnimatedShinyTextDemoDynamic />

            <h1>
              <CoverDemo />
            </h1>

            <div style={{ maxWidth: "90%", margin: "0 auto" }}>
              <p
                className="text-center md:text-2xl text-lg my-6 mx-auto text-gray-500"
                style={{ display: "block" }}
              >
                Especialistas en desarrollo de software y sitios web
                personalizados para empresas e individuos
              </p>
            </div>
            <div
              className="
                   flex 
                    md:justify-center 
                    items-center 
                    gap-x-4
                     "
            >
              <Link
                href="/meeting"
                className="py-3 
              px-10
              md:px-16
        md:text-xl
        hover:bg-[#abcbff] 
        rounded-[6px]
        border-2 
        border-black 
        dark:border-white 
         bg-[#121212] 
         text-white 
         transition 
         duration-200 
         hover:shadow-[1px_1px_rgba(0,0,0),2px_2px_rgba(0,0,0),3px_3px_rgba(0,0,0),4px_4px_rgba(0,0,0),5px_5px_0px_0px_rgba(0,0,0)] dark:shadow-[1px_1px_rgba(255,255,255),2px_2px_rgba(255,255,255),3px_3px_rgba(255,255,255),4px_4px_rgba(255,255,255),5px_5px_0px_0px_rgba(255,255,255)] "
              >
                Agendar Llamada
              </Link>
              <Link
                href={"/showcase"}
                className="
                bg-white
     py-3 
     px-10
     md:px-16
        md:text-xl
          border-4
          border-black
          rounded-[6px]
          hover:shadow-[1px_1px_rgba(0,0,0),2px_2px_rgba(0,0,0),3px_3px_rgba(0,0,0),4px_4px_rgba(0,0,0),5px_5px_0px_0px_rgba(0,0,0)] dark:shadow-[1px_1px_rgba(255,255,255),2px_2px_rgba(255,255,255),3px_3px_rgba(255,255,255),4px_4px_rgba(255,255,255),5px_5px_0px_0px_rgba(255,255,255)]"
              >
                Proyectos
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center text-left md:justify-items-center md:mx-auto mt-10 md:mt-16">
              <BoxReveal boxColor={"#3b82f6"} duration={0.5}>
                <p className="md:text-xl font-semibold flex gap-x-2 md:gap-x-4 items-center">
                  <PiCheckBold className="text-xl text-blue-500" />
                  Desarrollo Web
                </p>
              </BoxReveal>
              <BoxReveal boxColor={"#3b82f6"} duration={0.5}>
                <p className="md:text-xl font-semibold flex gap-x-2 md:gap-x-4 items-center">
                  <PiCheckBold className="text-xl text-blue-500" />
                  Desarrollo de Software
                </p>
              </BoxReveal>
              <BoxReveal boxColor={"#3b82f6"} duration={0.5}>
                <p className="md:text-xl font-semibold flex gap-x-2 md:gap-x-4 items-center">
                  <PiCheckBold className="text-xl text-blue-500" />
                  Aplicaciones Móviles
                </p>
              </BoxReveal>
              <BoxReveal boxColor={"#3b82f6"} duration={0.5}>
                <p className="md:text-xl font-semibold flex gap-x-2 md:gap-x-4 items-center">
                  <PiCheckBold className="text-xl text-blue-500" />
                  Consultoría Tecnológica
                </p>
              </BoxReveal>
            </div>

            <div className="md:flex items-center justify-between gap-y-4 my-10 gap-x-28 mx-auto">
              <div className="md:w-2/5">
                <h1 className="text-2xl font-medium text-gray-600 w-4/5">
                  Expertos en soluciones digitales personalizadas
                </h1>

                <div className="flex my-6 gap-x-5 w-full">
                  <div>
                    <h1 className="text-blue-500 text-3xl md:text-5xl">
                      <NumberTicker value={1000} /> +
                      <p className="text-gray-500 text-sm md:text-md">
                        Proyectos Exitosos
                      </p>
                    </h1>
                  </div>

                  <div className="w-px bg-gray-300 self-stretch"></div>

                  <div className="flex-1 min-w-0">
                    <h1 className="text-blue-500 text-3xl md:text-5xl whitespace-nowrap overflow-hidden">
                      <NumberTicker value={100} /> +
                      <p className="text-gray-500 text-sm md:text-md">
                        Clientes Satisfechos
                      </p>
                    </h1>
                  </div>
                </div>
              </div>

              <section className="overflow-hidden mt-10 md:w-4/5">
                <InfiniteMovingLogos
                  speed="slow"
                  direction="left"
                  items={[
                    {
                      logo: "/logo/nexus.webp",
                      name: "Logo1",
                    },
                    {
                      logo: "/logo/parabole.webp",
                      name: "Logo2",
                    },
                    {
                      logo: "/logo/polyurea.webp",
                      name: "Logo3",
                    },
                    {
                      logo: "/logo/wordable.webp",
                      name: "Logo4",
                    },
                  ]}
                />
              </section>
            </div>
          </div>
        </div>

        <Element name="services">
          <div className="md:px-0 mx-6 xl:w-4/5 2xl:w-[68%] md:mx-auto ">
            <h1>
              <WordPullUpDemo />
            </h1>
            <p className="md:text-center py-4 md:w-1/2 mx-auto text-xl md:text-2xl text-gray-500">
              Transformamos ideas en soluciones tecnológicas innovadoras
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
              {services.map((service) => (
                <div
                  key={service.title}
                  className="flex flex-col justify-between h-full space-y-4 text-center bg-gray-100 p-4 cursor-pointer hover:scale-105 transition-transform rounded-md"
                >
                  <Image
                    src={service.icon}
                    width={10000}
                    height={10000}
                    className="object-contain bg-gray-100 p-4 w-full h-40 rounded-md"
                    alt="image"
                  />
                  <h1 className="text-xl font-medium">{service.title}</h1>
                  <p className="text-gray-800">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Element>

        <section className="py-20">
          <ScrollBasedVelocityDemo />
        </section>

        <Element name="process">
          <main className="md:px-0 mx-6 md:mx-auto">
            <h1 className="text-3xl md:text-5xl md:text-center font-medium flex items-center gap-x-2 mx-auto justify-center">
              Nuestro{" "}
              <span className="text-blue-500 flex gap-x-1 items-center">
                <Image
                  src={"/icons/squiggle.svg"}
                  width={10000}
                  height={10000}
                  className="w-6"
                  alt="image"
                />
                Proceso
                <Image
                  src={"/icons/star.svg"}
                  width={10000}
                  height={10000}
                  className="w-6 mb-8"
                  alt="image"
                />
              </span>{" "}
              Creativo
            </h1>

            <p
              className="text-center 
            py-4 md:w-1/2 mx-auto 
            text-xl md:text-2xl text-gray-500"
            >
              Nuestro proceso está diseñado para crear soluciones tecnológicas
              efectivas y escalables
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center w-full md:w-1/2 mx-auto">
              <div className="w-full md:w-1/2 order-2 md:order-1">
                <AnimatedBeamMultipleOutputDemoDynamic />
              </div>
              <div className="w-full md:w-1/2 order-1 md:order-2 md:ml-0">
                <BoxRevealDemo />
              </div>
            </div>
          </main>
        </Element>

        <section>
          <main className="md:flex items-center justify-center space-y-6 md:space-y-0 md:gap-x-20 xl:w-4/5 2xl:w-[68%] mx-auto px-6 md:px-0">
            <Image
              src={"/logo/logo.webp"}
              width={10000}
              height={10000}
              className=" md:w-1/3 rounded-md"
              alt="image"
            />
            <div className="flex flex-col gap-y-5 md:w-1/2">
              <h1 className="text-lg md:text-2xl ">
                &quot;Capital Code ha transformado completamente nuestra
                presencia digital. Su equipo no solo desarrolló una plataforma
                excepcional, sino que también nos guió estratégicamente en cada
                paso del proceso. Su experiencia en desarrollo de software
                personalizado fue invaluable para nuestro negocio.&quot;
              </h1>
              <div className="flex items-center gap-x-1">
                <IconStarFilled className="text-4xl text-yellow-500" />
                <IconStarFilled className="text-4xl text-yellow-500" />
                <IconStarFilled className="text-4xl text-yellow-500" />
                <IconStarFilled className="text-4xl text-yellow-500" />
                <IconStarFilled className="text-4xl text-yellow-500" />
              </div>

              <span className="text-xl font-medium">
                Jordan, Brisson <br />
                Director Ejecutivo, Atlas Massage
              </span>
            </div>
          </main>
        </section>

        <Element name="guarentees">
          <ShootingStarsAndStarsBackgroundDemo />
        </Element>

        <section className="my-10 md:py-20 xl:w-4/5 2xl:w-[68%] md:mx-auto">
          <LetsMakeThingsHappenSection />
        </section>

        <Footer />
      </main>
    </>
  );
}
