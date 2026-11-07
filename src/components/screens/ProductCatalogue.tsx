import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  Search,
  Wifi,
  Mail,
  Shield,
  Phone,
  Cpu,
  ChevronRight,
  Plus,
  Check,
  Info,
  SlidersHorizontal
} from 'lucide-react';

export const ProductCatalogue: React.FC = () => {
  const { products, setScreen, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const categories = [
    'All Products',
    'Internet',
    'Cloud & Collaboration',
    'Security',
    'Voice',
    'IoT'
  ];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory =
        selectedCategory === 'All Products' ||
        p.category.toLowerCase().includes(selectedCategory.toLowerCase());

      const s = searchQuery.toLowerCase();
      const matchesSearch =
        !s ||
        p.product_name.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Internet':
        return <Wifi className="w-5 h-5" />;
      case 'Cloud & Collaboration':
        return <Mail className="w-5 h-5" />;
      case 'Security':
        return <Shield className="w-5 h-5" />;
      case 'Voice':
        return <Phone className="w-5 h-5" />;
      case 'IoT':
        return <Cpu className="w-5 h-5" />;
      default:
        return <Wifi className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full">
      {/* Title & Stats */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Product Catalogue
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Explore our complete range of business solutions (25 products).
        </p>
      </div>

      {/* Search Input Bar (Matching Screen 4) */}
      <div className="relative mb-5">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products (e.g., broadband, cloud, security)..."
          className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E40000] focus:border-[#E40000] shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Pills (Matching Screen 4) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#E40000] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Product List Cards */}
      <div className="space-y-3.5">
        {filteredProducts.map((p) => {
          return (
            <div
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
            >
              {/* Left Details */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#E40000] flex items-center justify-center shrink-0 border border-rose-100">
                  {getCategoryIcon(p.category)}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-[#E40000] transition-colors">
                    {p.product_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-xl">
                    {p.description}
                  </p>

                  {/* Badges / Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-[#E40000] border border-rose-100">
                      {p.category}
                    </span>

                    {p.city_tiers && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                        {p.city_tiers}
                      </span>
                    )}

                    {p.gstin_required && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        GSTIN Required
                      </span>
                    )}

                    {p.dependencies !== 'None' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        Requires Broadband
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Price & Arrow */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 shrink-0">
                <div className="sm:text-right">
                  <p className="text-base sm:text-lg font-black text-slate-900 leading-none">
                    ₹{p.monthly_price.toLocaleString('en-IN')}{' '}
                    <span className="text-xs font-normal text-slate-500">/{p.price_unit}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {p.setup_fee > 0 ? `+ ₹${p.setup_fee.toLocaleString('en-IN')} setup` : '+ ₹0 setup'}
                  </p>
                </div>

                <div className="sm:mt-2.5 flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setScreen('checkout');
                      showToast(`Added ${p.product_name} to comparison quote`);
                    }}
                    className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-[#E40000] hover:text-white text-slate-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    Configure
                  </button>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors hidden sm:block" />
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <SlidersHorizontal className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No products match your criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the search filter</p>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#E40000] tracking-wider">
                  {selectedProduct.category} • ID: {selectedProduct.id}
                </span>
                <h3 className="font-bold text-slate-900 text-lg mt-0.5">
                  {selectedProduct.product_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedProduct.description}
            </p>

            {selectedProduct.features && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <p className="text-xs font-bold text-slate-800">Enterprise Features Included:</p>
                {selectedProduct.features.split(',').map((f, i) => (
                  <div key={i} className="flex items-center space-x-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{f.trim()}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Monthly Rental</span>
                <span className="font-bold text-slate-900">
                  ₹{selectedProduct.monthly_price.toLocaleString('en-IN')} / {selectedProduct.price_unit}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">One-Time Setup Fee</span>
                <span className="font-bold text-slate-900">
                  ₹{selectedProduct.setup_fee.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Contract Duration</span>
                <span className="font-bold text-slate-900">
                  {selectedProduct.contract_months} Months
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Availability</span>
                <span className="font-bold text-slate-900">{selectedProduct.city_tiers}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setScreen('checkout');
                  showToast(`Selected ${selectedProduct.product_name}`);
                }}
                className="px-5 py-2 rounded-lg bg-[#E40000] hover:bg-[#C90000] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Configure in Bundle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
