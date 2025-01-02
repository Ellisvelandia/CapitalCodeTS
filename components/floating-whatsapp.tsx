"use client";

import { useState } from "react";
import { IconBrandWhatsapp, IconX } from "@tabler/icons-react";

const FloatingWhatsApp = () => {
  const [isOpen, setIsOpen] = useState(false);

  const whatsappNumbers = [
    {
      country: "Colombia",
      number: "573125668800",
      flag: "🇨🇴"
    },
    {
      country: "México",
      number: "5218991499735",
      flag: "🇲🇽"
    }
  ];

  const handleWhatsAppClick = (number: string) => {
    window.open(`https://wa.me/${number}`, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition-colors duration-200 relative"
        aria-label="Contactar por WhatsApp"
      >
        {isOpen ? (
          <IconX size={30} />
        ) : (
          <IconBrandWhatsapp size={30} />
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 bg-white rounded-lg shadow-xl w-64 overflow-hidden">
          <div className="p-4 bg-green-500 text-white">
            <h3 className="text-lg font-semibold">Contáctanos</h3>
            <p className="text-sm opacity-90">Selecciona tu país</p>
          </div>
          <div className="divide-y">
            {whatsappNumbers.map((item) => (
              <button
                key={item.number}
                onClick={() => handleWhatsAppClick(item.number)}
                className="w-full p-4 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200"
              >
                <span className="text-2xl">{item.flag}</span>
                <div>
                  <p className="font-medium text-gray-900">{item.country}</p>
                  <p className="text-sm text-gray-500">WhatsApp</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingWhatsApp;
