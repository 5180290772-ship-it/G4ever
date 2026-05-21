'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatCedi } from '@/lib/utils'; // 👈 Safely import the reusable formatter

interface Product {
  id: string;
  name: string;
  slug: string; 
  description: string;
  price: number;
  images: string[];
  sizes: string[];
}

export default function ProductCard({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'M');
  
  // Real G4Ever WhatsApp Business Number
  const WHATSAPP_NUMBER = '233541250705'; 

  const handleWhatsAppOrder = () => {
    // 👉 Use the formatter for the WhatsApp text payload string
    const formattedPrice = formatCedi(product.price);

    const message = `Hi G4Ever! 👋 I'd like to order:\n\n` +
                    `🛍️ *Product:* ${product.name}\n` +
                    `📏 *Size:* ${selectedSize}\n` +
                    `💵 *Price:* ${formattedPrice}\n\n` + // 👈 Safe variable usage
                    `Is this item available for delivery?`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const displayImage = product.images?.[0] || 'https://via.placeholder.com/400x500?text=G4Ever+Apparel';

  return (
    <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-300">
      
      {/* Clicking the image routes directly to detailed view */}
      <Link href={`/product/${product.slug}`} className="block relative aspect-[4/5] bg-gray-100 overflow-hidden">
        <img 
          src={displayImage} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
      </Link>
      
      <div className="p-5">
        {/* Clicking the title routes to detail view */}
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:underline cursor-pointer">{product.name}</h3>
        </Link>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{product.description}</p>
        
        <div className="flex items-center justify-between mb-4">
          {/* 👉 IMPLEMENT FORMATTER HERE FOR DISPLAY */}
          <span className="text-xl font-bold text-gray-900">
            {formatCedi(product.price)}
          </span>
          
          <div className="flex gap-1 items-center">
            <span className="text-xs font-medium text-gray-400 mr-1">Size:</span>
            <select 
              value={selectedSize} 
              onChange={(e) => setSelectedSize(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-1 focus:outline-none focus:border-black"
            >
              {product.sizes.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={handleWhatsAppOrder}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.411 0 11.989 0c3.183.001 6.177 1.24 8.43 3.496 2.253 2.256 3.491 5.253 3.491 8.432 0 6.584-5.352 11.932-11.931 11.932-2.006-.001-3.978-.507-5.73-1.474L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.435 0 9.855-4.417 9.858-9.855.001-2.633-1.023-5.107-2.883-6.97C16.486 1.86 14.019 1.838 11.99 1.838c-5.437 0-9.857 4.418-9.86 9.856-.001 1.701.453 3.361 1.315 4.811L2.464 21.5l5.183-1.346z"/>
          </svg>
          Order via WhatsApp
        </button>
      </div>
    </div>
  );
}