import { supabase } from '@/lib/supabaseClient';
import ProductGallery from '@/components/ProductGallery';
import PurchaseController from '@/components/PurchaseController';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatCedi } from '@/lib/utils'; // 👈 Safely imported your currency formatter

export const revalidate = 0;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    console.error('Error fetching product detail:', error);
    return null;
  }
  return data;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['https://via.placeholder.com/600x750?text=G4Ever+Apparel'];

  return (
    <main className="min-h-screen bg-white pb-16">
      {/* Mini Navigation Header */}
      <nav className="border-b border-gray-100 py-4 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-sm font-bold text-black uppercase tracking-wider hover:opacity-70 transition">
          ← Back to Catalog
        </Link>
        <span className="text-xl font-black tracking-widest">G4EVER</span>
        <div className="w-20"></div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        {/* Left Column: Interactive Gallery */}
        <ProductGallery images={images} productName={product.name} />

        {/* Right Column: Details */}
        <div className="flex flex-col justify-start">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            {product.name}
          </h1>
          
          {/* ⚡ UPDATED: Displaying Cedi Price safely instead of Dollars */}
          <p className="text-2xl font-bold text-gray-900 mb-6">
            {formatCedi(product.price)}
          </p>

          <hr className="border-gray-100 mb-6" />

          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Product Description</h3>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              {product.description || "No description provided for this piece."}
            </p>
          </div>

          {/* Interactive Client Section */}
          <PurchaseController product={product} />
        </div>
      </section>
    </main>
  );
}