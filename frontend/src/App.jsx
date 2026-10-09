import { useState, useEffect } from 'react';
import { Search, ShoppingBag, Signal, SignalHigh, Star } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [liteMode, setLiteMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState("All");

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('obsidian_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Fetch live products from your Express backend
  useEffect(() => {
    fetch('http://localhost:5000/api/products')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      })
      .then((data) => {
        setProducts(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem('obsidian_cart', JSON.stringify(cart));
  }, [cart]);

  // Dynamic filter supporting search and category chips
  const filteredProducts = products.filter((product) => {
    const title = product.title || "";
    const category = product.category || "";
    const price = Number(product.discounted_price || product.original_price || 0);

    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChip =
      activeChip === "All" ? true :
      activeChip === "Under ₹299" ? price <= 299 :
      category.toLowerCase().includes(activeChip.toLowerCase());

    return matchesSearch && matchesChip;
  });

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  return (
    <div className={`min-h-screen ${liteMode ? 'bg-gray-100 font-sans' : 'bg-gray-50 font-serif'}`}>
      
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-pink-600 tracking-tight">Obsidian</h1>
          
          <div className="flex-1 max-w-xl relative hidden md:block">
            <input 
              type="text" 
              placeholder="Search by product or problem (e.g. 'kurti', 'shoes')"
              className="w-full border border-gray-300 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-pink-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLiteMode(!liteMode)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                liteMode ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}
              title="Toggle Bharat Lite Mode"
            >
              {liteMode ? <Signal className="w-4 h-4" /> : <SignalHigh className="w-4 h-4" />}
              <span className="hidden sm:inline">{liteMode ? 'Lite Mode ON' : 'Lite Mode OFF'}</span>
            </button>

            <button className="relative p-2 text-gray-700 hover:text-pink-600">
              <ShoppingBag className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-pink-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE SEARCH */}
      <div className="md:hidden p-4 bg-white border-t border-gray-100">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search products..."
            className="w-full border border-gray-300 rounded-lg py-2 pl-10 pr-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        </div>
      </div>

      {/* QUICK CHIPS */}
      <div className="max-w-6xl mx-auto p-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {["All", "Under ₹299", "Home & Kitchen", "Sports & Fitness", "Books", "Kids Clothing", "Women Clothing"].map((chip) => (
          <button 
            key={chip}
            onClick={() => setActiveChip(chip)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeChip === chip 
                ? 'bg-pink-50 border-pink-200 text-pink-700' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* PRODUCT GRID & STATES */}
      <main className="max-w-6xl mx-auto p-4">
        {loading && (
          <div className="text-center py-20 text-gray-500 font-sans">
            Loading products from database...
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-red-500 font-sans">
            Failed to load products: {error}
          </div>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="text-center py-20 text-gray-400 font-sans">
            No products found matching your search.
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div 
                key={product.product_id} 
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col"
              >
                {!liteMode ? (
                  <img 
                    src={product.image_url} 
                    alt={product.title} 
                    className="w-full h-48 object-cover bg-gray-50"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80";
                    }}
                  />
                ) : (
                  <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-sans">
                    [Image Hidden - Lite Mode]
                  </div>
                )}

                <div className="p-3 flex flex-col flex-grow font-sans">
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                    {product.brand || product.category}
                  </span>

                  <h3 className="text-sm text-gray-800 line-clamp-2 mb-1" title={product.title}>
                    {product.title}
                  </h3>

                  <div className="flex items-center gap-1 mb-2">
                    <div className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs flex items-center font-bold">
                      {product.rating || "4.0"} <Star className="w-3 h-3 ml-0.5 fill-current" />
                    </div>
                    {product.review_count && (
                      <span className="text-xs text-gray-400">({product.review_count})</span>
                    )}
                  </div>

                  <div className="mt-auto pt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      ₹{product.discounted_price || product.original_price}
                    </span>
                    {product.discounted_price && product.original_price && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹{product.original_price}
                      </span>
                    )}
                    {product.discount_percentage && (
                      <span className="text-xs font-semibold text-green-600">
                        {product.discount_percentage}% off
                      </span>
                    )}
                  </div>

                  <button 
                    onClick={() => addToCart(product)}
                    className="mt-3 w-full border border-pink-600 text-pink-600 hover:bg-pink-50 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}