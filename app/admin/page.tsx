'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  slug: string;
  description: string;
  sizes: string[];
  images: string[];
}

interface Sale {
  id: string;
  product_id: string;
  product_name: string;
  size: string;
  quantity: number;
  total_amount: number;
  created_at: string;
}

export default function AdminPanel() {
  // Auth States
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // Catalog & Analytics States
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Inventory Form Fields State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Manual Sale Logger Form Fields State
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [oldSaleQty, setOldSaleQty] = useState<number>(0);
  const [oldSaleProductId, setOldSaleProductId] = useState<string>('');
  const [logProductId, setLogProductId] = useState('');
  const [logSize, setLogSize] = useState('');
  const [logQty, setLogQty] = useState('1');
  const [saleLoading, setSaleLoading] = useState(false);

  const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Sync initialization state loops
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) {
        fetchProducts();
        fetchSales();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProducts();
        fetchSales();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const fetchSales = async () => {
    const { data } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
    if (data) setSales(data);
  };

  // Automatically handle fallback sizes on dropdown selection changes
  useEffect(() => {
    if (logProductId) {
      const selectedProd = products.find(p => p.id === logProductId);
      if (selectedProd && selectedProd.sizes && selectedProd.sizes.length > 0 && !editingSaleId) {
        setLogSize(selectedProd.sizes[0]);
      }
    }
  }, [logProductId, products, editingSaleId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage({ type: 'error', text: error.message });
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProducts([]);
    setSales([]);
    clearForm();
    clearSaleForm();
  };

  const handleSizeToggle = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const clearForm = () => {
    setEditingProductId(null);
    setName('');
    setDescription('');
    setPrice('');
    setStock('10');
    setSelectedSizes(['S', 'M', 'L', 'XL']);
    setImageFiles([]);
    setExistingImages([]);
  };

  const clearSaleForm = () => {
    setEditingSaleId(null);
    setOldSaleQty(0);
    setOldSaleProductId('');
    setLogProductId('');
    setLogSize('');
    setLogQty('1');
  };

  const startEdit = (product: Product) => {
    setEditingProductId(product.id);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setSelectedSizes(product.sizes || []);
    setExistingImages(product.images || []);
    setImageFiles([]);
    setMessage({ type: '', text: '' });
  };

  const startSaleEdit = (sale: Sale) => {
    setEditingSaleId(sale.id);
    setOldSaleQty(sale.quantity);
    setOldSaleProductId(sale.product_id);
    setLogProductId(sale.product_id);
    setLogSize(sale.size);
    setLogQty(sale.quantity.toString());
    setMessage({ type: '', text: '' });
  };

  // Create & Update Product logic handlers
  const handleInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (!name || !price) throw new Error('Name and Price metrics are required.');

      let finalImageUrls = [...existingImages];

      if (imageFiles.length > 0) {
        const uploadedUrls: string[] = [];
        for (const file of imageFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
          uploadedUrls.push(publicUrl);
        }
        finalImageUrls = editingProductId ? [...finalImageUrls, ...uploadedUrls] : uploadedUrls;
      }

      if (finalImageUrls.length === 0) throw new Error('At least one photo attachment is required.');

      const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
      const productPayload = { name, slug, description, price: parseFloat(price), stock: parseInt(stock), sizes: selectedSizes, images: finalImageUrls };

      if (editingProductId) {
        const { error: dbError } = await supabase.from('products').update(productPayload).eq('id', editingProductId);
        if (dbError) throw dbError;
        setMessage({ type: 'success', text: '⚡ G4Ever product database updated!' });
      } else {
        const { error: dbError } = await supabase.from('products').insert([productPayload]);
        if (dbError) throw dbError;
        setMessage({ type: 'success', text: '🚀 New piece dropped successfully!' });
      }

      clearForm();
      fetchProducts();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle Sales Add and Edit Transactions with Dynamic Inventory Corrections
  const handleLogSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaleLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const selectedProduct = products.find(p => p.id === logProductId);
      if (!selectedProduct) throw new Error('Please select a valid store item.');

      const newQty = parseInt(logQty);
      if (newQty <= 0) throw new Error('Quantity must be greater than zero.');

      const totalCalculated = Number(selectedProduct.price) * newQty;

      if (editingSaleId) {
        // UPDATE TRANSACTION FLOW
        // Calculate the difference between old quantity logged and new quantity input
        // e.g. if old was 3 and new is 1, quantityDiff is (1 - 3) = -2 (we add 2 units back to stock)
        const quantityDiff = newQty - oldSaleQty;

        // If shifting transactions to a completely different product, restore total original quantities to old product first
        if (logProductId !== oldSaleProductId) {
          const oldProduct = products.find(p => p.id === oldSaleProductId);
          if (oldProduct) {
            await supabase.from('products').update({ stock: oldProduct.stock + oldSaleQty }).eq('id', oldSaleProductId);
          }
          if (selectedProduct.stock < newQty) throw new Error('Insufficient stock for the newly selected item.');
          await supabase.from('products').update({ stock: selectedProduct.stock - newQty }).eq('id', selectedProduct.id);
        } else {
          // If editing same product, check relative stock bounds change
          if (selectedProduct.stock < quantityDiff) {
            throw new Error(`Insufficient warehouse stock available to increase this order by ${quantityDiff} item(s).`);
          }
          await supabase.from('products').update({ stock: selectedProduct.stock - quantityDiff }).eq('id', selectedProduct.id);
        }

        const { error: saleUpdateError } = await supabase
          .from('sales')
          .update({
            product_id: selectedProduct.id,
            product_name: selectedProduct.name,
            size: logSize,
            quantity: newQty,
            price_at_sale: selectedProduct.price,
            total_amount: totalCalculated
          })
          .eq('id', editingSaleId);

        if (saleUpdateError) throw saleUpdateError;
        setMessage({ type: 'success', text: '⚡ Transaction log modified and stock re-balanced!' });

      } else {
        // FRESh NEW INsERT FLOW
        if (selectedProduct.stock < newQty) {
          throw new Error(`Insufficient stock. Only ${selectedProduct.stock} unit(s) left.`);
        }

        const { error: saleError } = await supabase.from('sales').insert([
          { product_id: selectedProduct.id, product_name: selectedProduct.name, size: logSize, quantity: newQty, price_at_sale: selectedProduct.price, total_amount: totalCalculated }
        ]);
        if (saleError) throw saleError;

        await supabase.from('products').update({ stock: selectedProduct.stock - newQty }).eq('id', selectedProduct.id);
        setMessage({ type: 'success', text: `💰 Successfully logged sale of ${newQty}x ${selectedProduct.name}!` });
      }

      clearSaleForm();
      fetchProducts();
      fetchSales();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to sync sale transaction.' });
    } finally {
      setSaleLoading(false);
    }
  };

  // DELETE TRANSACTION FLOW with automated Full Stock Restock Reversals
  const handleSaleDelete = async (sale: Sale) => {
    if (!confirm(`Cancel order log for ${sale.product_name}? This will return ${sale.quantity} item(s) back into active store inventory stock automatically.`)) return;

    try {
      // 1. Terminate the sales entry row
      const { error: deleteError } = await supabase.from('sales').delete().eq('id', sale.id);
      if (deleteError) throw deleteError;

      // 2. Identify corresponding product context row and append stock values back
      const associatedProduct = products.find(p => p.id === sale.product_id);
      if (associatedProduct) {
        const restoredStock = associatedProduct.stock + sale.quantity;
        await supabase.from('products').update({ stock: restoredStock }).eq('id', sale.product_id);
      }

      if (editingSaleId === sale.id) clearSaleForm();
      setMessage({ type: 'success', text: '🗑️ Transaction revoked and stock returned back to warehouse inventory rows!' });
      
      fetchProducts();
      fetchSales();
    } catch (error: any) {
      alert('Transaction deletion failure: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to pull this item from the store?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert(error.message);
    else {
      if (editingProductId === id) clearForm();
      setProducts(products.filter(p => p.id !== id));
    }
  };

  // Computational stats
  const totalRevenue = sales.reduce((sum, item) => sum + Number(item.total_amount), 0);
  const totalGarmentsSold = sales.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = products.filter(p => p.stock <= 3).length;

  if (authLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold">Authenticating Terminal...</div>;

  if (!session) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-widest text-white">G4EVER</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2">Central Command Access</p>
          </div>
          {message.text && <div className="p-4 bg-rose-950 text-rose-300 rounded-xl text-xs font-bold border border-rose-900">{message.text}</div>}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Admin Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition text-sm" required />
          </div>
          <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl text-sm">Access Terminal</button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-bold text-gray-700">Admin Dashboard</span>
          </div>
          <button onClick={handleLogout} className="text-xs font-bold uppercase bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl transition">
            Disconnect Session
          </button>
        </div>

        {/* Analytics Rows Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-black text-white rounded-2xl p-5 shadow-sm border border-zinc-900">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Gross Revenue Settlement</p>
            <p className="text-3xl font-black mt-1 text-emerald-400">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Pieces Transacted</p>
            <p className="text-3xl font-black mt-1 text-gray-900">{totalGarmentsSold} Items</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Low Stock Warnings</p>
            <p className="text-3xl font-black mt-1 text-rose-600">{lowStockCount} SKUs</p>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Action Forms Left Side Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-gray-900">{editingProductId ? '⚡ Edit Store Item Properties' : '🚀 Publish Fresh Drop'}</h2>
                {editingProductId && <button onClick={clearForm} className="text-xs font-medium text-gray-400 hover:text-black transition underline">Cancel Edit</button>}
              </div>
              <form onSubmit={handleInventorySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Item Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-black transition" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-black transition resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Price ($) *</label>
                    <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-black transition" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Stock Amount</label>
                    <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-black transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Available Sizing Run</label>
                  <div className="flex flex-wrap gap-1">
                    {allSizes.map((size) => {
                      const isSelected = selectedSizes.includes(size);
                      return (
                        <button type="button" key={size} onClick={() => handleSizeToggle(size)} className={`h-8 px-3 rounded-lg font-bold border text-xs transition ${isSelected ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {editingProductId && existingImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {existingImages.map((img, i) => (
                      <img key={i} src={img} className="w-10 h-12 object-cover border rounded-lg" alt="" />
                    ))}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">{editingProductId ? 'Add Additional Photos (Optional)' : 'Photos *'}</label>
                  <input type="file" accept="image/*" onChange={(e) => e.target.files && setImageFiles(Array.from(e.target.files))} multiple className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700" required={!editingProductId && existingImages.length === 0} />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-black text-white font-bold py-2.5 rounded-xl hover:bg-gray-900 transition text-sm">
                  {loading ? 'Syncing...' : editingProductId ? '⚡ Update Item Properties' : '🚀 Publish Fresh Drop'}
                </button>
              </form>
            </div>

            {/* UPGRADED SALE ACTION LOGGER FORM */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">
                    {editingSaleId ? '⚡ Edit Logged Transaction' : '💰 Log Completed WhatsApp Sale'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Automates stock reconciliation on confirmation.</p>
                </div>
                {editingSaleId && (
                  <button onClick={clearSaleForm} className="text-xs font-medium text-gray-400 hover:text-black transition underline">
                    Cancel Edit Mode
                  </button>
                )}
              </div>
              <form onSubmit={handleLogSaleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Select Purchased Item</label>
                  <select value={logProductId} onChange={(e) => setLogProductId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black text-gray-900" required>
                    <option value="">-- Choose Active Drop --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${Number(p.price).toFixed(2)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Size</label>
                  <select value={logSize} onChange={(e) => setLogSize(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black text-gray-900" required>
                    {logProductId ? (
                      products.find(p => p.id === logProductId)?.sizes.map(s => <option key={s} value={s}>{s}</option>)
                    ) : (
                      allSizes.map(s => <option key={s} value={s}>{s}</option>)
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Qty</label>
                  <input type="number" min="1" value={logQty} onChange={(e) => setLogQty(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black text-gray-900 text-center" required />
                </div>
                <div className="sm:col-span-4 mt-2">
                  <button type="submit" disabled={saleLoading || !logProductId} className={`w-full text-white font-bold py-3 rounded-xl transition text-sm disabled:opacity-40 ${editingSaleId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                    {saleLoading ? 'Re-calculating Ledgers...' : editingSaleId ? '⚡ Save Transaction Alterations' : '💸 Confirm & Log WhatsApp Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Registries Lists Columns Right Side */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col max-h-[440px]">
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Active Stock Registry ({products.length})</h2>
                <p className="text-[11px] text-gray-400">Click a title row to activate Edit Mode.</p>
              </div>
              <div className="divide-y divide-gray-100 overflow-y-auto mt-2 pr-1 flex-1">
                {products.map((prod) => (
                  <div key={prod.id} className={`py-2.5 flex items-center justify-between gap-2 group ${editingProductId === prod.id ? 'bg-zinc-50 px-1 rounded-lg border border-dashed' : ''}`}>
                    <div className="truncate cursor-pointer flex-1" onClick={() => startEdit(prod)}>
                      <p className="text-xs font-bold text-gray-900 truncate group-hover:underline">{prod.name}</p>
                      <p className="text-[10px] text-gray-400">${Number(prod.price).toFixed(2)} — Stock: <span className={prod.stock <= 3 ? 'text-rose-600 font-bold' : ''}>{prod.stock}</span></p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(prod)} className="text-[10px] font-bold bg-zinc-50 hover:bg-zinc-100 px-2 py-1 rounded-md text-gray-600">Edit</button>
                      <button onClick={() => handleDelete(prod.id)} className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-md">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* UPGRADED INTERACTIVE TRANSACTION TIMELINE FEED */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col max-h-[380px]">
              <div>
                <h2 className="text-base font-extrabold text-gray-900">📈 Live Order Feed</h2>
                <p className="text-[11px] text-gray-400">Click entry text to update or reverse orders.</p>
              </div>
              <div className="divide-y divide-gray-100 overflow-y-auto mt-2 pr-1 flex-1">
                {sales.length === 0 ? (
                  <p className="text-[11px] text-gray-400 py-4 text-center">No transactions registered.</p>
                ) : (
                  sales.map((sale) => (
                    <div key={sale.id} className={`py-2.5 flex items-center justify-between gap-2 transition group ${editingSaleId === sale.id ? 'bg-amber-50/50 px-1 rounded-lg border border-dashed border-amber-200' : ''}`}>
                      <div className="truncate cursor-pointer flex-1" onClick={() => startSaleEdit(sale)}>
                        <p className="text-xs font-bold text-gray-900 truncate group-hover:underline">{sale.product_name}</p>
                        <p className="text-[10px] text-gray-400">Size {sale.size} — Qty: {sale.quantity} <span className="text-emerald-600 font-bold ml-1">+${Number(sale.total_amount).toFixed(2)}</span></p>
                      </div>
                      <div className="flex gap-1 items-center">
                        <button onClick={() => startSaleEdit(sale)} className="text-[9px] font-bold text-zinc-500 hover:text-black bg-zinc-50 px-1.5 py-0.5 rounded">
                          Edit
                        </button>
                        <button onClick={() => handleSaleDelete(sale)} className="text-[9px] font-bold text-rose-600 hover:bg-rose-50 px-1.5 py-0.5 rounded">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}