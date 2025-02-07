import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="bg-white py-10 px-6 md:px-0 md:mx-auto border-t"
      role="contentinfo"
    >
      <div className="flex flex-col justify-between gap-y-3 xl:w-4/5 2xl:w-[68%] mx-auto">
        <div className="text-3xl md:text-5xl font-medium">
          <Link href="/" aria-label="Capital Code - Página principal">
            <Image
              src="/logo/logo.webp"
              width={160}
              height={40}
              className="w-40"
              alt="Logo de Capital Code"
              loading="lazy"
            />
          </Link>
        </div>
        <p className="text-left text-xl text-gray-900 hover:text-black transition-colors">
          capitalcodecol@gmail.com
        </p>
      </div>

      <nav className="flex flex-col md:flex-row md:justify-center md:items-center gap-4 mt-10 text-gray-900">
        <p className="text-center md:text-left">
          {currentYear} Capital Code. Todos los derechos reservados.
        </p>
        <Link
          href="/politica-de-privacidad"
          className="text-blue-800 hover:text-blue-950 font-medium hover:underline transition-colors"
          aria-label="Ver política de privacidad"
        >
          Política de Privacidad
        </Link>
      </nav>
    </footer>
  );
};

export default Footer;
