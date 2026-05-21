import { supabase } from '@/lib/supabaseClient';
import ProductCard from '@/components/ProductCard';

export const revalidate = 0;

async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data || [];
}

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Brand Hero Header */}
      <header className="bg-black text-white py-16 px-4 text-center">
        <h1 className="text-5xl font-black tracking-wider mb-2">G4ever</h1>
        <p className="text-gray-400 max-w-md mx-auto text-sm sm:text-base">
          Timeless Streetwear. Built for longevity, designed for style.
        </p>
      </header>

      {/* Catalog Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-200 pb-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Latest Drops</h2>
            <p className="text-sm text-gray-500">Tap an item to select your size and place an order directly on WhatsApp.</p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500 font-medium">No products available at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-gray-200 bg-white py-8 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} G4ever Apparel. All rights reserved.</p>
      </footer>
    </main>
  );
}