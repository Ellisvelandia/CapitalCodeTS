import Image from "next/image";
import Link from "next/link";
import { Link as ScrollLink } from "react-scroll";
import {
  IconX,
  IconMenu2,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";

interface NavbarProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

const Navbar = ({ isMenuOpen, toggleMenu }: NavbarProps) => {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <div className="overflow-hidden rounded-[6px] top-5 sticky md:mx-auto z-50 xl:w-4/5 2xl:w-[68%] bg-white flex items-center justify-between py-4 sm:py-6 px-3 sm:px-4 md:px-8 mx-3 sm:mx-6">
      <Link href={"/"} aria-label="Ir a la página principal">
        <Image
          src={"/logo/logo.webp"}
          alt="Logo Capital Code"
          width={1000}
          height={1000}
          className="w-32 sm:w-40"
        />
      </Link>

      <div className="absolute right-1/2 translate-x-1/2 transform md:pr-24 lg:pr-32 xl:pr-0">
        <div className="hidden md:flex gap-x-6 lg:gap-x-10 items-center text-gray-700 font-medium text-base lg:text-lg cursor-pointer">
          <Link href={"/showcase"} className="hover:text-blue-500">
            Proyectos
          </Link>

          {isHomePage ? (
            <>
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
            </>
          ) : (
            <>
              <Link href="/#services" className="hover:text-blue-500">
                Servicios
              </Link>
              <Link href="/#process" className="hover:text-blue-500">
                Proceso
              </Link>
              <Link href="/#guarentees" className="hover:text-blue-500">
                Garantías
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-x-4">
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 text-gray-700"
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isMenuOpen ? (
            <IconX className="w-6 h-6" />
          ) : (
            <IconMenu2 className="w-6 h-6" />
          )}
        </button>
        <Link
          href={"/meeting"}
          className="py-3 px-6 text-lg hover:bg-[#abcbff] rounded-[6px] border-2 border-black dark:border-white bg-[#121212] text-white transition duration-200 hover:shadow-[1px_1px_rgba(0,0,0),2px_2px_rgba(0,0,0),3px_3px_rgba(0,0,0),4px_4px_rgba(0,0,0),5px_5px_0px_0px_rgba(0,0,0)] dark:shadow-[1px_1px_rgba(255,255,255),2px_2px_rgba(255,255,255),3px_3px_rgba(255,255,255),4px_4px_rgba(255,255,255),5px_5px_0px_0px_rgba(255,255,255)]"
        >
          Agendar Llamada
        </Link>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 bg-white z-50 md:hidden">
          <div className="flex flex-col min-h-screen">
            <div className="flex justify-between items-center p-6">
              <div className="w-32">
                <Image
                  src={"/logo/logo.webp"}
                  alt="Logo Capital Code"
                  width={1000}
                  height={1000}
                  className="w-full"
                />
              </div>
              <button
                onClick={toggleMenu}
                className="p-2"
                aria-label="Cerrar menú"
              >
                <IconX className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <nav className="flex-1 px-6 pt-8">
              <div className="space-y-8">
                <Link
                  href={"/showcase"}
                  className="block text-[17px] text-blue-600 font-medium"
                  onClick={toggleMenu}
                >
                  Proyectos
                </Link>
                {isHomePage ? (
                  <>
                    <ScrollLink
                      to="services"
                      smooth={true}
                      className="block text-[17px] text-gray-700 font-medium"
                      role="button"
                      tabIndex={0}
                      onClick={toggleMenu}
                    >
                      Servicios
                    </ScrollLink>
                    <ScrollLink
                      to="process"
                      smooth={true}
                      className="block text-[17px] text-gray-700 font-medium"
                      role="button"
                      tabIndex={0}
                      onClick={toggleMenu}
                    >
                      Proceso
                    </ScrollLink>
                    <ScrollLink
                      to="guarentees"
                      smooth={true}
                      className="block text-[17px] text-gray-700 font-medium"
                      role="button"
                      tabIndex={0}
                      onClick={toggleMenu}
                    >
                      Garantías
                    </ScrollLink>
                  </>
                ) : (
                  <>
                    <Link
                      href="/#services"
                      className="block text-[17px] text-gray-700 font-medium"
                      onClick={toggleMenu}
                    >
                      Servicios
                    </Link>
                    <Link
                      href="/#process"
                      className="block text-[17px] text-gray-700 font-medium"
                      onClick={toggleMenu}
                    >
                      Proceso
                    </Link>
                    <Link
                      href="/#guarentees"
                      className="block text-[17px] text-gray-700 font-medium"
                      onClick={toggleMenu}
                    >
                      Garantías
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
