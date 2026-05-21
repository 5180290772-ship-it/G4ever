'use client';

import React, { useState, useEffect } from 'react';

interface GalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: GalleryProps) {
  const [activeImage, setActiveImage] = useState<string>(images[0]);

  // Sync activeImage if the images array changes dynamically
  useEffect(() => {
    if (images && images.length > 0) {
      setActiveImage(images[0]);
    }
  }, [images]);

  // Fallback if images array is somehow empty
  const fallbackImage = 'https://via.placeholder.com/600x750?text=G4Ever+Apparel';
  const currentMainImage = activeImage || images[0] || fallbackImage;

  return (
    <div className="flex flex-col gap-4">
      {/* Hero Display Image Frame */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden aspect-[4/5] relative w-full">
        <img
          src={currentMainImage} // 👈 Use the safe fallback image reference here
          alt={`${productName} Showcase`}
          className="w-full h-full object-cover object-center transition duration-300"
        />
      </div>

      {/* Row of Alternative Image Angles */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {images.map((imgUrl, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(imgUrl)}
              className={`w-20 h-24 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                activeImage === imgUrl ? 'border-black scale-95' : 'border-gray-100 hover:border-gray-300'
              }`}
            >
              <img
                src={imgUrl || fallbackImage}
                alt={`${productName} thumbnail angle ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}