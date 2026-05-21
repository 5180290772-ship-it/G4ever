'use client';

import { useState } from 'react';
import { formatCedi } from '@/lib/utils'; // 👈 Import our safe currency utility helper

interface Product {
  id: string;
  name: string;
  price: number;
  sizes: string[];
}

export default function PurchaseController({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'M');
  
  // Real G4Ever WhatsApp Business Number
  const WHATSAPP_NUMBER = '233541250705'; 

  const handleOrder = () => {
    // 👉 Format the price to Cedis ahead of string building
    const formattedPrice = formatCedi(product.price);

    const message = `Hi G4Ever! 👋 I want to purchase this piece:\n\n` +
                    `🛍️ *Product:* ${product.name}\n` +
                    `📏 *Size:* ${selectedSize}\n` +
                    `💵 *Price:* ${formattedPrice}\n\n` + // 👈 Use the clean string variable here safely
                    `Please let me know how to proceed with payment and delivery!`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="mt-4 space-y-6">
      <div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">
          Available Sizes
        </span>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((size: string) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`min-w-[54px] h-12 rounded-xl text-sm font-bold border transition duration-200 ${
                selectedSize === size
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 text-gray-800 hover:border-black'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleOrder}
        className="w-full sm:max-w-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition shadow-md shadow-emerald-100"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.411 0 11.989 0c3.183.001 6.177 1.24 8.43 3.496 2.253 2.256 3.491 5.253 3.491 8.432 0 6.584-5.352 11.932-11.931 11.932-2.006-.001-3.978-.507-5.73-1.474L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.435 0 9.855-4.417 9.858-9.855.001-2.633-1.023-5.107-2.883-6.97C16.486 1.86 14.019 1.838 11.99 1.838c-5.437 0-9.857 4.418-9.86 9.856-.001 1.701.453 3.361 1.315 4.811L2.464 21.5l5.183-1.346z"/>
        </svg>
        Secure via WhatsApp Order
      </button>
    </div>
  );
}