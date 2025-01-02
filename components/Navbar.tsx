import Image from 'next/image';
import Link from 'next/link';
import { Link as ScrollLink } from 'react-scroll';
import { IconX, IconMenu2 } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

const Navbar = ({ isMenuOpen, toggleMenu }: NavbarProps) => {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <div className="overflow-hidden rounded-[6px] top-5 sticky md:mx-auto z-50 xl:w-4/5 2xl:w-[68%] bg-white flex items-center justify-between py-6 px-4 md:px-8 mx-6">
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
        <div className="absolute top-full left-0 right-0 bg-white border-t md:hidden">
          <div className="flex flex-col p-4 space-y-4">
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
      )}
    </div>
  );
};

export default Navbar;
