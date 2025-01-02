import BlurFade from "@/components/magicui/blur-fade";
import Image from "next/image";
import Link from "next/link";

const works = [
  {
    background: "bg-gray-200",
    imageUrl: "/images/business.webp",
    title: "Sistema de Gestión Empresarial",
    description: "Software personalizado para gestión de recursos",
    link: "https://www.rubbishbrothers.com",
  },
  {
    background: "bg-gray-200",
    imageUrl: "/images/business.webp",
    title: "Plataforma de Reservas Online",
    description: "Aplicación web para gestión de citas",
    link: "https://www.atlasmassage.ca",
  },
  {
    background: "bg-gray-200",
    imageUrl: "/images/business.webp",
    title: "Portal de Seguridad Corporativa",
    description: "Sistema integrado de seguridad",
    link: "https://www.canadiansecuritysolutions.com",
  },
  {
    background: "bg-gray-200",
    imageUrl: "/images/business.webp",
    title: "Plataforma de Arte Digital",
    description: "Marketplace de NFTs y arte digital",
    link: "https://www.flight9.art",
  },
];

export function BlurFadeDemo() {
  return (
    <section id="photos">
      <div className="grid md:grid-cols-2 gap-8 mt-10 justify-items-center">
        {works.map(({ imageUrl, title, description, link }, idx) => (
          <BlurFade
            key={title}
            delay={0.25 + idx * 0.05}
            inView
            className={`rounded-lg ${works[idx].background} p-4`}
          >
            <Link href={link} target="_blank" rel="noreferrer">
              <Image
                height={10000}
                width={10000}
                className="h-5/6 w-full object-cover rounded-lg"
                src={imageUrl}
                alt={`Proyecto ${idx + 1} - ${title}`}
              />
              <h3 className="text-lg font-semibold p-4">{title}</h3>
              <p className="text-sm text-gray-600 px-4 pb-4">{description}</p>
            </Link>
          </BlurFade>
        ))}
      </div>
    </section>
  );
}
