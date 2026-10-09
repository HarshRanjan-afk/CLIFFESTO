import { useState, useEffect } from 'react';
import { Search, ShoppingBag, Signal, SignalHigh, Star, X, Plus, Minus, Trash2, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Lite Mode states
  const [liteMode, setLiteMode] = useState(false);
  const [revealedImages, setRevealedImages] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState("All");

  // Cart & Modal states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('obsidian_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

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

  // Cart Actions
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product_id === product.product_id);
      if (existing) {
        return prevCart.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product_id !== productId));
  };

  const toggleImageReveal = (productId, e) => {
    e.stopPropagation();
    setRevealedImages((prev) => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce(
    (sum, item) => sum + Number(item.discounted_price || item.original_price || 0) * item.quantity,
    0
  );

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

  return (
    <div className={`min-h-screen ${liteMode ? 'bg-gray-100 font-sans' : 'bg-gray-50 font-sans'}`}>
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-pink-600 tracking-tight cursor-pointer" onClick={() => setActiveChip("All")}>
            Obsidian
          </h1>
          
          <div className="flex-1 max-w-xl relative hidden md:block">
            <input 
              type="text" 
              placeholder="Search products or categories..."
              className="w-full border border-gray-300 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-pink-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          </div>

          <div className="flex items-center gap-3">
            {/* Bharat Lite Mode Toggle */}
            <button 
              onClick={() => setLiteMode(!liteMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                liteMode ? 'bg-green-100 border-green-300 text-green-800' : 'bg-gray-100 border-gray-300 text-gray-700'
              }`}
            >
              {liteMode ? <Signal className="w-3.5 h-3.5 text-green-600" /> : <SignalHigh className="w-3.5 h-3.5 text-gray-500" />}
              <span>{liteMode ? 'Lite Mode ON' : 'Lite Mode OFF'}</span>
            </button>

            {/* Cart Trigger */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-700 hover:text-pink-600 transition-colors"
            >
              <ShoppingBag className="w-6 h-6" />
              {totalCartCount > 0 && (
                <span className="absolute top-0 right-0 bg-pink-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* QUICK CHIPS */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {["All", "Under ₹299", "Home & Kitchen", "Sports & Fitness", "Books", "Kids Clothing", "Women Clothing"].map((chip) => (
          <button 
            key={chip}
            onClick={() => setActiveChip(chip)}
            className={`whitespace-nowrap px-3.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              activeChip === chip 
                ? 'bg-pink-50 border-pink-300 text-pink-700 font-semibold' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* PRODUCT GRID */}
      <main className="max-w-6xl mx-auto px-4 py-4">
        {loading && <div className="text-center py-20 text-gray-500">Loading catalog...</div>}
        {error && <div className="text-center py-20 text-red-500">Failed to load: {error}</div>}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="text-center py-20 text-gray-400">No products found.</div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const showImage = !liteMode || revealedImages[product.product_id];
              return (
                <div 
                  key={product.product_id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:border-gray-300 transition-shadow"
                >
                  {/* Image or Click-to-load box */}
                  {showImage ? (
                    <img 
                      src={product.image_url} 
                      alt={product.title} 
                      className="w-full h-44 object-cover bg-gray-50"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80";
                      }}
                    />
                  ) : (
                    <div 
                      onClick={(e) => toggleImageReveal(product.product_id, e)}
                      className="w-full h-44 bg-gray-100 flex flex-col items-center justify-center text-gray-500 text-xs gap-1.5 p-3 text-center border-b border-dashed border-gray-300 hover:bg-gray-200"
                    >
                      <span className="font-semibold text-gray-700">Image Hidden (Lite Mode)</span>
                      <span className="text-[11px] text-pink-600 bg-white px-2 py-0.5 rounded border border-pink-200">
                        Tap to load (~45 KB)
                      </span>
                    </div>
                  )}

                  <div className="p-3 flex flex-col flex-grow">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      {product.brand || product.category}
                    </span>
                    <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 mt-0.5 mb-1" title={product.title}>
                      {product.title}
                    </h3>

                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="bg-green-100 text-green-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        {product.rating || "4.1"} <Star className="w-2.5 h-2.5 fill-current" />
                      </span>
                      {product.review_count && (
                        <span className="text-[11px] text-gray-400">({product.review_count})</span>
                      )}
                    </div>

                    <div className="mt-auto pt-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-gray-900">
                          ₹{product.discounted_price || product.original_price}
                        </span>
                        {product.discounted_price && product.original_price && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{product.original_price}
                          </span>
                        )}
                        {product.discount_percentage && (
                          <span className="text-[11px] font-bold text-green-600">
                            {product.discount_percentage}% off
                          </span>
                        )}
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="mt-2.5 w-full bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 py-1.5 rounded text-xs font-bold transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                {selectedProduct.brand || "Product Details"}
              </span>
              <button onClick={() => setSelectedProduct(null)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <img 
                src={selectedProduct.image_url} 
                alt={selectedProduct.title} 
                className="w-full h-56 object-contain bg-gray-50 rounded"
              />

              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedProduct.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    {selectedProduct.rating || "4.1"} <Star className="w-3 h-3 fill-current" />
                  </span>
                  <span className="text-xs text-gray-400">({selectedProduct.review_count || 120} reviews)</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900">
                  ₹{selectedProduct.discounted_price || selectedProduct.original_price}
                </span>
                {selectedProduct.discounted_price && selectedProduct.original_price && (
                  <span className="text-sm text-gray-400 line-through">
                    ₹{selectedProduct.original_price}
                  </span>
                )}
                {selectedProduct.discount_percentage && (
                  <span className="text-xs font-bold text-green-600">
                    {selectedProduct.discount_percentage}% off
                  </span>
                )}
              </div>

              {selectedProduct.description && (
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-1">Description</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{selectedProduct.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div>🚚 Delivery: <span className="font-semibold text-gray-800">{selectedProduct.delivery_time || "3-5 days"}</span></div>
                <div>🔄 Return: <span className="font-semibold text-gray-800">{selectedProduct.return_policy || "7 days"}</span></div>
                <div>💵 COD: <span className="font-semibold text-gray-800">{selectedProduct.cod_available ? "Available" : "Prepaid Only"}</span></div>
                <div>🏷️ Category: <span className="font-semibold text-gray-800">{selectedProduct.category}</span></div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-2">
              <button 
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-pink-600" />
                <h3 className="font-bold text-gray-800">Your Cart ({totalCartCount})</h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  Your cart is empty.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product_id} className="flex gap-3 p-2.5 border border-gray-200 rounded-lg items-center">
                    <img src={item.image_url} alt={item.title} className="w-14 h-14 object-cover rounded bg-gray-50" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-gray-800 truncate">{item.title}</h4>
                      <div className="text-xs font-bold text-gray-900 mt-1">
                        ₹{item.discounted_price || item.original_price}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 border border-gray-200 rounded px-1 py-0.5">
                      <button onClick={() => updateQuantity(item.product_id, -1)} className="p-1 hover:text-pink-600">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold px-1">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product_id, 1)} className="p-1 hover:text-pink-600">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.product_id)} className="p-1 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
                <div className="flex justify-between text-sm font-bold text-gray-800">
                  <span>Total Amount</span>
                  <span>₹{totalCartPrice}</span>
                </div>
                <button 
                  onClick={() => alert(`Order placed for ₹${totalCartPrice}!`)}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}