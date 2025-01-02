import Image from 'next/image';
import Link from 'next/link';
import { Link as ScrollLink, Element } from 'react-scroll';
import { IconX, IconMenu2 } from '@tabler/icons-react';

interface NavbarProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

const Navbar = ({ isMenuOpen, toggleMenu }: NavbarProps) => {
  return (
    <>
      <Element
        name="top"
        className="overflow-hidden rounded-[6px] top-5 sticky md:mx-auto z-50 
        xl:w-4/5 2xl:w-[68%] bg-white flex items-center 
        justify-between py-6 px-4 md:px-8 mx-6"
      >
        <Link href={"/"} aria-label="Ir a la página principal">
          <Image
            src={"/logo/logo.webp"}
            alt="Logo Capital Code"
            width={1000}
            height={1000}
            className="w-40"
          />
        </Link>

        <div className="absolute right-1/2 translate-x-1/2 transform">
          <div className="hidden md:flex gap-x-10 items-center text-gray-700 font-medium text-lg cursor-pointer">
            <Link href={"/showcase"} className="hover:text-blue-500">
              Proyectos
            </Link>

            <ScrollLink
              to="services"
              smooth={true}
              className="hover:text-blue-500"
              role="button"
              tabIndex={0}
            >
              Servicios
            </ScrollLink>

            <ScrollLink
              to="process"
              smooth={true}
              className="hover:text-blue-500"
              role="button"
              tabIndex={0}
            >
              Proceso
            </ScrollLink>

            <ScrollLink
              to="guarentees"
              smooth={true}
              className="hover:text-blue-500"
              role="button"
              tabIndex={0}
            >
              Garantías
            </ScrollLink>
          </div>
        </div>

        <div className="flex items-center gap-x-4">
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-gray-700"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
          </button>
          <Link
            href={"/meeting"}
            className="
              py-3 
              px-6
              text-lg 
              hover:bg-[#abcbff]
              rounded-[6px]
              border-2
              border-black
              text-white
              bg-[#121212]
              transition
              duration-200
              hover:shadow-[1px_1px_rgba(0,0,0),2px_2px_rgba(0,0,0),3px_3px_rgba(0,0,0),4px_4px_rgba(0,0,0),5px_5px_0px_0px_rgba(0,0,0)] dark:shadow-[1px_1px_rgba(255,255,255),2px_2px_rgba(255,255,255),3px_3px_rgba(255,255,255),4px_4px_rgba(255,255,255),5px_5px_0px_0px_rgba(255,255,255)]"
            aria-label="Agendar una llamada"
          >
            Agendar Llamada
          </Link>
        </div>
      </Element>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white">
          <div className="flex flex-col items-center justify-center h-full space-y-8 text-xl font-medium">
            <Link 
              href={"/showcase"} 
              className="hover:text-blue-500 px-6 py-3"
              onClick={toggleMenu}
            >
              Proyectos
            </Link>
            <ScrollLink
              to="services"
              smooth={true}
              className="hover:text-blue-500 px-6 py-3"
              onClick={toggleMenu}
              role="button"
              tabIndex={0}
            >
              Servicios
            </ScrollLink>
            <ScrollLink
              to="process"
              smooth={true}
              className="hover:text-blue-500 px-6 py-3"
              onClick={toggleMenu}
              role="button"
              tabIndex={0}
            >
              Proceso
            </ScrollLink>
            <ScrollLink
              to="guarentees"
              smooth={true}
              className="hover:text-blue-500 px-6 py-3"
              onClick={toggleMenu}
              role="button"
              tabIndex={0}
            >
              Garantías
            </ScrollLink>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
