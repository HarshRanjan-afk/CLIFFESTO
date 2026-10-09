import { useState, useEffect } from 'react';
import { Search, ShoppingBag, Signal, SignalHigh, Star, X, Plus, Minus, Trash2, CheckCircle2, MapPin, Truck, CreditCard, Filter, RotateCcw, Check } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Lite Mode states
  const [liteMode, setLiteMode] = useState(false);
  const [revealedImages, setRevealedImages] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // Detailed Filter Controls
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState("All");
  const [selectedRating, setSelectedRating] = useState("All");
  const [sortBy, setSortBy] = useState("featured");

  // Interaction states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);

  // Animation triggers
  const [cartBouncing, setCartBouncing] = useState(false);
  const [showFlyingBadge, setShowFlyingBadge] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);

  // Address & Order Form state
  const [shippingForm, setShippingForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'cod'
  });

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

  // Cart Actions (Quietly adds, animates badge, DOES NOT open drawer)
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

    // Button feedback
    setRecentlyAddedId(product.product_id);
    setTimeout(() => setRecentlyAddedId(null), 900);

    // Navbar Bag pulse animation
    setCartBouncing(true);
    setShowFlyingBadge(true);
    setTimeout(() => setCartBouncing(false), 500);
    setTimeout(() => setShowFlyingBadge(false), 800);
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

  const resetAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedPriceRange("All");
    setSelectedRating("All");
    setSortBy("featured");
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce(
    (sum, item) => sum + Number(item.discounted_price || item.original_price || 0) * item.quantity,
    0
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (!shippingForm.fullName || !shippingForm.phone || !shippingForm.street || !shippingForm.pincode) {
      alert("Please fill all required address fields.");
      return;
    }

    const orderData = {
      orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      items: cart,
      shipping: shippingForm,
      totalAmount: totalCartPrice,
      date: new Date().toLocaleDateString()
    };

    setOrderPlaced(orderData);
    setCart([]);
    setIsCheckoutOpen(false);
  };

  // Filter & sort pipeline
  const filteredProducts = products
    .filter((product) => {
      const title = (product.title || "").toLowerCase();
      const category = (product.category || "").toLowerCase();
      const price = Number(product.discounted_price || product.original_price || 0);
      const rating = Number(product.rating || 0);

      const matchesSearch =
        title.includes(searchQuery.toLowerCase()) ||
        category.includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        category.includes(selectedCategory.toLowerCase());

      let matchesPrice = true;
      if (selectedPriceRange === "under-299") matchesPrice = price <= 299;
      else if (selectedPriceRange === "300-699") matchesPrice = price >= 300 && price <= 699;
      else if (selectedPriceRange === "700-1499") matchesPrice = price >= 700 && price <= 1499;
      else if (selectedPriceRange === "1500-above") matchesPrice = price >= 1500;

      let matchesRating = true;
      if (selectedRating === "4.0") matchesRating = rating >= 4.0;
      else if (selectedRating === "3.5") matchesRating = rating >= 3.5;

      return matchesSearch && matchesCategory && matchesPrice && matchesRating;
    })
    .sort((a, b) => {
      const priceA = Number(a.discounted_price || a.original_price || 0);
      const priceB = Number(b.discounted_price || b.original_price || 0);
      const ratingA = Number(a.rating || 0);
      const ratingB = Number(b.rating || 0);

      if (sortBy === "price-low") return priceA - priceB;
      if (sortBy === "price-high") return priceB - priceA;
      if (sortBy === "rating") return ratingB - ratingA;
      return 0;
    });

  return (
    <div className={`min-h-screen ${liteMode ? 'bg-gray-100 font-sans' : 'bg-gray-50 font-sans'}`}>
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-pink-600 tracking-tight cursor-pointer" onClick={resetAllFilters}>
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

            {/* Cart Trigger with Bounce Animation */}
            <div className="relative">
              <button 
                onClick={() => setIsCartOpen(true)}
                className={`relative p-2 text-gray-700 hover:text-pink-600 transition-transform duration-200 ${
                  cartBouncing ? 'scale-125 text-pink-600' : 'scale-100'
                }`}
                title="Open Shopping Cart"
              >
                <ShoppingBag className="w-6 h-6" />
                {totalCartCount > 0 && (
                  <span className={`absolute top-0 right-0 bg-pink-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center transition-transform ${
                    cartBouncing ? 'scale-125 bg-green-600' : 'scale-100'
                  }`}>
                    {totalCartCount}
                  </span>
                )}
              </button>

              {/* +1 Floating Indicator */}
              {showFlyingBadge && (
                <span className="absolute -top-3 left-2 font-black text-xs text-pink-600 pointer-events-none animate-bounce">
                  +1
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* FILTER CONTROL BAR */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 text-xs font-bold text-gray-500 mr-1">
              <Filter className="w-3.5 h-3.5 text-pink-600" /> Filters:
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:border-pink-500"
            >
              <option value="All">All Categories</option>
              <option value="Home & Kitchen">Home & Kitchen</option>
              <option value="Sports & Fitness">Sports & Fitness</option>
              <option value="Books">Books</option>
              <option value="Kids Clothing">Kids Clothing</option>
              <option value="Women Clothing">Women Clothing</option>
            </select>

            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:border-pink-500"
            >
              <option value="All">Price: All Ranges</option>
              <option value="under-299">Under ₹299</option>
              <option value="300-699">₹300 - ₹699</option>
              <option value="700-1499">₹700 - ₹1,499</option>
              <option value="1500-above">₹1,500 and above</option>
            </select>

            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:border-pink-500"
            >
              <option value="All">Rating: All</option>
              <option value="4.0">4.0★ & above</option>
              <option value="3.5">3.5★ & above</option>
            </select>

            {(selectedCategory !== "All" || selectedPriceRange !== "All" || selectedRating !== "All" || searchQuery !== "" || sortBy !== "featured") && (
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1 text-[11px] font-semibold text-pink-600 hover:text-pink-700 border border-pink-200 bg-pink-50 px-2 py-1 rounded-md transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white font-medium text-gray-700 focus:outline-none focus:border-pink-500"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </section>

      {/* PRODUCT GRID */}
      <main className="max-w-6xl mx-auto px-4 py-4">
        <div className="text-xs text-gray-400 mb-3">
          Showing <span className="font-semibold text-gray-700">{filteredProducts.length}</span> products
        </div>

        {loading && <div className="text-center py-20 text-gray-500">Loading catalog...</div>}
        {error && <div className="text-center py-20 text-red-500">Failed to load: {error}</div>}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <Filter className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <h4 className="text-sm font-bold text-gray-700">No products match these filters</h4>
            <p className="text-xs text-gray-400 mt-1 mb-4">Try clearing filters or selecting another price range.</p>
            <button
              onClick={resetAllFilters}
              className="text-xs bg-pink-600 text-white font-semibold px-4 py-2 rounded-lg"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const showImage = !liteMode || revealedImages[product.product_id];
              const isAdded = recentlyAddedId === product.product_id;

              return (
                <div 
                  key={product.product_id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:border-gray-300 transition-shadow"
                >
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

                      {/* ADD TO CART: Feedback button without auto-opening drawer */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className={`mt-2.5 w-full py-1.5 rounded text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                          isAdded 
                            ? 'bg-green-600 text-white border border-green-600 scale-[0.98]' 
                            : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Added!
                          </>
                        ) : (
                          'Add to Cart'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col animate-in fade-in duration-150">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-pink-600" />
                <h3 className="font-bold text-gray-900 text-base">Delivery & Checkout</h3>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="p-5 overflow-y-auto space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-pink-600" /> Shipping Details
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Full Name *</label>
                    <input 
                      type="text" 
                      name="fullName" 
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={shippingForm.fullName}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Phone Number *</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      required
                      placeholder="e.g. 9876543210"
                      value={shippingForm.phone}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Flat / House No. / Street Address *</label>
                  <input 
                    type="text" 
                    name="street" 
                    required
                    placeholder="House No., Apartment, Colony"
                    value={shippingForm.street}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">City</label>
                    <input 
                      type="text" 
                      name="city" 
                      placeholder="City"
                      value={shippingForm.city}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">State</label>
                    <input 
                      type="text" 
                      name="state" 
                      placeholder="State"
                      value={shippingForm.state}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Pincode *</label>
                    <input 
                      type="text" 
                      name="pincode" 
                      required
                      placeholder="Pincode"
                      value={shippingForm.pincode}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-pink-600" /> Payment Option
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <label className={`border rounded-lg p-2.5 text-center cursor-pointer transition-colors ${shippingForm.paymentMethod === 'cod' ? 'border-pink-600 bg-pink-50 text-pink-700' : 'border-gray-200'}`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="cod" 
                      checked={shippingForm.paymentMethod === 'cod'} 
                      onChange={handleInputChange} 
                      className="hidden" 
                    />
                    <div className="text-xs font-bold">Cash On Delivery</div>
                  </label>
                  <label className={`border rounded-lg p-2.5 text-center cursor-pointer transition-colors ${shippingForm.paymentMethod === 'upi' ? 'border-pink-600 bg-pink-50 text-pink-700' : 'border-gray-200'}`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="upi" 
                      checked={shippingForm.paymentMethod === 'upi'} 
                      onChange={handleInputChange} 
                      className="hidden" 
                    />
                    <div className="text-xs font-bold">UPI / QR</div>
                  </label>
                  <label className={`border rounded-lg p-2.5 text-center cursor-pointer transition-colors ${shippingForm.paymentMethod === 'card' ? 'border-pink-600 bg-pink-50 text-pink-700' : 'border-gray-200'}`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="card" 
                      checked={shippingForm.paymentMethod === 'card'} 
                      onChange={handleInputChange} 
                      className="hidden" 
                    />
                    <div className="text-xs font-bold">Card / NetBanking</div>
                  </label>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Items Total ({totalCartCount}):</span>
                  <span>₹{totalCartPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Charges:</span>
                  <span className="text-green-600 font-bold">FREE</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 text-sm">
                  <span>Payable Total:</span>
                  <span>₹{totalCartPrice}</span>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirm & Place Order
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ORDER SUCCESS POPUP */}
      {orderPlaced && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">Order Placed Successfully!</h3>
            <p className="text-xs text-gray-500 mb-4">Order ID: <span className="font-semibold text-gray-800">{orderPlaced.orderId}</span></p>

            <div className="bg-gray-50 text-left p-3.5 rounded-lg border border-gray-100 text-xs space-y-2 mb-5">
              <div>
                <span className="text-gray-400 font-bold block">Delivery Address:</span>
                <p className="font-medium text-gray-800">{orderPlaced.shipping.fullName}, {orderPlaced.shipping.phone}</p>
                <p className="text-gray-600">{orderPlaced.shipping.street}, {orderPlaced.shipping.city} - {orderPlaced.shipping.pincode}</p>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span>Payment Mode:</span>
                <span className="font-bold uppercase text-gray-800">{orderPlaced.shipping.paymentMethod}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900">
                <span>Total Amount Paid:</span>
                <span>₹{orderPlaced.totalAmount}</span>
              </div>
            </div>

            <button 
              onClick={() => setOrderPlaced(null)}
              className="w-full bg-gray-900 hover:bg-black text-white py-2 rounded-lg text-xs font-bold transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

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
                }}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER (Opens strictly when clicking the navbar bag) */}
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
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Truck className="w-4 h-4" /> Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}