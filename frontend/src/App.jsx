import { useState, useEffect } from 'react';
import { 
  Search, ShoppingBag, Signal, SignalHigh, Star, X, Plus, Minus, Trash2, 
  CheckCircle2, MapPin, Truck, CreditCard, Filter, RotateCcw, Check, 
  QrCode, Loader2, ShieldCheck, Cpu, PackageCheck, History, Sparkles, 
  User, LogIn, LogOut, Lock, Mail
} from 'lucide-react';
import { supabase } from './supabaseClient';

// Production Render backend URL with local fallback
const API_URL = import.meta.env.VITE_API_URL || 'https://meesho-backend-wkbr.onrender.com';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User Auth State
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Filter & Lite Mode
  const [liteMode, setLiteMode] = useState(false);
  const [revealedImages, setRevealedImages] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState("All");
  const [selectedRating, setSelectedRating] = useState("All");
  const [sortBy, setSortBy] = useState("featured");

  // Interaction states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersHistoryOpen, setIsOrdersHistoryOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);

  // Payment & x402 states
  const [paymentGatewayOpen, setPaymentGatewayOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [x402Details, setX402Details] = useState(null);

  // Animations & Badges
  const [cartBouncing, setCartBouncing] = useState(false);
  const [showFlyingBadge, setShowFlyingBadge] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const [coinsEarnedPopup, setCoinsEarnedPopup] = useState(null);

  // Meesho Coins Wallet
  const [meeshoCoins, setMeeshoCoins] = useState(() => {
    const savedCoins = localStorage.getItem('meesho_wallet_coins');
    return savedCoins !== null ? Number(savedCoins) : 250;
  });

  const [redeemCoinsAtCheckout, setRedeemCoinsAtCheckout] = useState(false);

  // Form State
  const [shippingForm, setShippingForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'upi',
    bankName: 'HDFC Bank',
    cardLast4: '4242'
  });

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('meesho_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [ordersList, setOrdersList] = useState(() => {
    const saved = localStorage.getItem('meesho_orders_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Check Supabase Auth state on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch catalog from deployed Render Backend
  useEffect(() => {
    fetch(`${API_URL}/api/products`)
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
    localStorage.setItem('meesho_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('meesho_orders_history', JSON.stringify(ordersList));
  }, [ordersList]);

  useEffect(() => {
    localStorage.setItem('meesho_wallet_coins', meeshoCoins.toString());
  }, [meeshoCoins]);

  // Handle Login & Signup
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword
        });
        if (error) throw error;
        alert("Account created successfully!");
      }
      setIsAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

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

    setRecentlyAddedId(product.product_id);
    setTimeout(() => setRecentlyAddedId(null), 900);

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
  const rawCartPrice = cart.reduce(
    (sum, item) => sum + Number(item.discounted_price || item.original_price || 0) * item.quantity,
    0
  );

  const maxCoinsUsable = Math.min(meeshoCoins, rawCartPrice);
  const coinDiscountApplied = (redeemCoinsAtCheckout || shippingForm.paymentMethod === 'coins') ? maxCoinsUsable : 0;
  const totalCartPrice = Math.max(0, rawCartPrice - coinDiscountApplied);
  const coinsRewardToEarn = Math.max(5, Math.floor(rawCartPrice * 0.10));
  const estimatedAlgo = (totalCartPrice / 12.0).toFixed(2);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!shippingForm.fullName || !shippingForm.phone || !shippingForm.street || !shippingForm.pincode) {
      alert("Please fill all required address fields.");
      return;
    }

    if (shippingForm.paymentMethod === 'coins') {
      if (meeshoCoins < rawCartPrice) {
        alert(`Insufficient Meesho Coins! You need ${rawCartPrice} coins but currently have ${meeshoCoins}.`);
        return;
      }
      finalizeOrder({
        transactionId: 'COIN-PAY-' + Math.floor(100000 + Math.random() * 900000),
        details: { coinsDeducted: rawCartPrice, newBalance: meeshoCoins - rawCartPrice },
        usedCoinsAmount: rawCartPrice
      });
      return;
    }

    if (shippingForm.paymentMethod === 'cod') {
      finalizeOrder({
        transactionId: 'COD-' + Math.floor(100000 + Math.random() * 900000),
        details: { verificationPin: Math.floor(1000 + Math.random() * 9000) },
        usedCoinsAmount: coinDiscountApplied
      });
      return;
    }

    if (shippingForm.paymentMethod === 'x402') {
      setIsCheckoutOpen(false);
      setPaymentGatewayOpen(true);
      setIsProcessingPayment(true);

      try {
        const res = await fetch(`${API_URL}/api/orders/x402-checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart, totalAmount: totalCartPrice }),
        });

        const data = await res.json().catch(() => ({}));
        setX402Details(data);
      } catch (err) {
        console.error("x402 fetch error:", err);
      } finally {
        setIsProcessingPayment(false);
      }
      return;
    }

    setIsCheckoutOpen(false);
    setPaymentGatewayOpen(true);
  };

  const handleSimulatePayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentGatewayOpen(false);

      if (shippingForm.paymentMethod === 'upi') {
        finalizeOrder({
          transactionId: 'UPI-' + Math.floor(1000000000 + Math.random() * 9000000000),
          details: {
            utrNumber: 'UTR' + Date.now().toString().slice(-8),
            vpa: 'user@okhdfcbank',
            merchantVpa: 'meesho@icici'
          },
          usedCoinsAmount: coinDiscountApplied
        });
      } else if (shippingForm.paymentMethod === 'card') {
        finalizeOrder({
          transactionId: 'TXN-CARD-' + Math.floor(100000 + Math.random() * 900000),
          details: {
            bank: shippingForm.bankName,
            cardNetwork: 'Visa Platinum',
            last4: shippingForm.cardLast4,
            authCode: 'AUTH-' + Math.floor(10000 + Math.random() * 90000)
          },
          usedCoinsAmount: coinDiscountApplied
        });
      } else if (shippingForm.paymentMethod === 'x402') {
        finalizeOrder({
          transactionId: 'ALGO-TXN-' + Math.floor(100000000 + Math.random() * 900000000),
          details: {
            network: 'Algorand Testnet',
            paidAlgo: estimatedAlgo + ' ALGO',
            inrEquivalent: '₹' + totalCartPrice,
            rate: '1 ALGO = ₹12.00',
            merchantWallet: x402Details?.paymentRequirements?.[0]?.payTo || 'GD67YJBPNZWD5HXQXG32SZAXDL5KNOU4CV4TLJ76KSHN44B7JTV3G3V2VU',
            txHash: 'V7XW2L...99KZ'
          },
          usedCoinsAmount: coinDiscountApplied
        });
      }
    }, 1500);
  };

  const finalizeOrder = ({ transactionId, details, usedCoinsAmount = 0 }) => {
    let updatedCoins = meeshoCoins - usedCoinsAmount + coinsRewardToEarn;
    setMeeshoCoins(updatedCoins);

    const orderData = {
      orderId: transactionId,
      userId: user?.id || 'guest',
      userEmail: user?.email || shippingForm.phone,
      items: cart,
      shipping: shippingForm,
      totalAmount: totalCartPrice,
      originalAmount: rawCartPrice,
      coinsDiscount: usedCoinsAmount,
      coinsEarned: coinsRewardToEarn,
      paymentMethod: shippingForm.paymentMethod,
      paymentDetails: details,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setOrderPlaced(orderData);
    setOrdersList((prev) => [orderData, ...prev]);
    setCart([]);
    setIsCheckoutOpen(false);
    setRedeemCoinsAtCheckout(false);

    setCoinsEarnedPopup(coinsRewardToEarn);
    setTimeout(() => setCoinsEarnedPopup(null), 4000);
  };

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
      
      {/* COINS POPUP */}
      {coinsEarnedPopup && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs font-black animate-bounce">
          <Sparkles className="w-4 h-4 text-yellow-200" />
          <span>🎉 You earned +{coinsEarnedPopup} Meesho Coins!</span>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-[#9b2575] tracking-tight cursor-pointer" onClick={resetAllFilters}>
            meesho
          </h1>
          
          <div className="flex-1 max-w-lg relative hidden md:block">
            <input 
              type="text" 
              placeholder="Search products or categories..."
              className="w-full border border-gray-300 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#9b2575]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Coins Wallet */}
            <div 
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 px-2.5 py-1.5 rounded-full cursor-pointer hover:border-amber-400 shadow-sm"
              title="1 Coin = ₹1"
            >
              <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-[10px]">
                🪙
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[9px] font-bold text-amber-700 uppercase">Coins</span>
                <span className="text-xs font-black text-amber-900">{meeshoCoins}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setMeeshoCoins(prev => prev + 100);
                }}
                className="ml-1 text-[10px] text-amber-800 bg-amber-200/70 hover:bg-amber-300 px-1.5 py-0.5 rounded-full font-bold"
              >
                +100
              </button>
            </div>

            {/* User Profile / Login Button */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs">
                <User className="w-3.5 h-3.5 text-[#9b2575]" />
                <span className="font-semibold text-gray-800 max-w-[80px] sm:max-w-[120px] truncate" title={user.email}>
                  {user.email.split('@')[0]}
                </span>
                <button 
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-500 p-0.5 ml-0.5"
                  title="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold bg-pink-50 text-[#9b2575] hover:bg-pink-100 border border-pink-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            )}

            {/* Orders Button */}
            <button
              onClick={() => setIsOrdersHistoryOpen(true)}
              className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-[#9b2575] px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-pink-200"
            >
              <History className="w-3.5 h-3.5 text-[#9b2575]" />
              <span className="hidden sm:inline">Orders</span>
              {ordersList.length > 0 && (
                <span className="bg-pink-100 text-[#9b2575] text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                  {ordersList.length}
                </span>
              )}
            </button>

            {/* Lite Mode */}
            <button 
              onClick={() => setLiteMode(!liteMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                liteMode ? 'bg-green-100 border-green-300 text-green-800' : 'bg-gray-100 border-gray-300 text-gray-700'
              }`}
            >
              {liteMode ? <Signal className="w-3.5 h-3.5 text-green-600" /> : <SignalHigh className="w-3.5 h-3.5 text-gray-500" />}
              <span className="hidden sm:inline">{liteMode ? 'Lite Mode ON' : 'Lite Mode OFF'}</span>
            </button>

            {/* Cart Button */}
            <div className="relative">
              <button 
                onClick={() => setIsCartOpen(true)}
                className={`relative p-2 text-gray-700 hover:text-[#9b2575] transition-transform duration-200 ${
                  cartBouncing ? 'scale-125 text-[#9b2575]' : 'scale-100'
                }`}
              >
                <ShoppingBag className="w-6 h-6" />
                {totalCartCount > 0 && (
                  <span className={`absolute top-0 right-0 bg-[#9b2575] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center transition-transform ${
                    cartBouncing ? 'scale-125 bg-green-600' : 'scale-100'
                  }`}>
                    {totalCartCount}
                  </span>
                )}
              </button>

              {showFlyingBadge && (
                <span className="absolute -top-3 left-2 font-black text-xs text-[#9b2575] pointer-events-none animate-bounce">
                  +1
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* FILTER BAR */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 text-xs font-bold text-gray-500 mr-1">
              <Filter className="w-3.5 h-3.5 text-[#9b2575]" /> Filters:
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:border-[#9b2575]"
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
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:border-[#9b2575]"
            >
              <option value="All">Price: All</option>
              <option value="under-299">Under ₹299</option>
              <option value="300-699">₹300 - ₹699</option>
              <option value="700-1499">₹700 - ₹1,499</option>
              <option value="1500-above">₹1,500 and above</option>
            </select>

            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:border-[#9b2575]"
            >
              <option value="All">Rating: All</option>
              <option value="4.0">4.0★ & above</option>
              <option value="3.5">3.5★ & above</option>
            </select>

            {(selectedCategory !== "All" || selectedPriceRange !== "All" || selectedRating !== "All" || searchQuery !== "" || sortBy !== "featured") && (
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#9b2575] hover:underline border border-pink-200 bg-pink-50 px-2 py-1 rounded-md"
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
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white font-medium text-gray-700 focus:outline-none focus:border-[#9b2575]"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </section>

      {/* PRODUCTS GRID */}
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
            <button
              onClick={resetAllFilters}
              className="mt-3 text-xs bg-[#9b2575] text-white font-semibold px-4 py-2 rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const showImage = !liteMode || revealedImages[product.product_id];
              const isAdded = recentlyAddedId === product.product_id;
              const productPrice = Number(product.discounted_price || product.original_price || 0);

              return (
                <div 
                  key={product.product_id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:border-gray-300 transition-shadow relative"
                >
                  <div className="absolute top-2 right-2 z-10 bg-amber-500/95 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                    🪙 +{Math.max(5, Math.floor(productPrice * 0.1))} Coins
                  </div>

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
                      <span className="text-[11px] text-[#9b2575] bg-white px-2 py-0.5 rounded border border-pink-200">
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
                          ₹{productPrice}
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

                      <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 w-fit">
                        <span>🪙 Or buy for</span>
                        <span className="font-black text-amber-950">{productPrice} Coins</span>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className={`mt-2.5 w-full py-1.5 rounded text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                          isAdded 
                            ? 'bg-green-600 text-white border border-green-600' 
                            : 'bg-pink-50 hover:bg-pink-100 text-[#9b2575] border border-pink-200'
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

      {/* AUTHENTICATION MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button 
              onClick={() => setIsAuthModalOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2 text-[#9b2575]">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-gray-900">
                {authMode === 'login' ? 'Sign in to Meesho' : 'Create an Account'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {authMode === 'login' ? 'Access your orders, coins, and wishlist' : 'Sign up to earn starter coins & discounts'}
              </p>
            </div>

            {authError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs p-2.5 rounded-lg text-center font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Email Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    required
                    placeholder="name@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 pl-9 text-xs focus:outline-none focus:border-[#9b2575]"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 pl-9 text-xs focus:outline-none focus:border-[#9b2575]"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <button 
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#9b2575] hover:bg-[#831c62] text-white font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  authMode === 'login' ? 'Sign In' : 'Sign Up'
                )}
              </button>
            </form>

            <div className="text-center mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600">
              {authMode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button 
                    onClick={() => { setAuthMode('signup'); setAuthError(null); }} 
                    className="text-[#9b2575] font-bold hover:underline"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button 
                    onClick={() => { setAuthMode('login'); setAuthError(null); }} 
                    className="text-[#9b2575] font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#9b2575]" />
                <h3 className="font-bold text-gray-900 text-base">Delivery & Payment</h3>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="p-5 overflow-y-auto space-y-4">
              {!user && (
                <div className="bg-pink-50 border border-pink-200 p-2.5 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-gray-700">Checking out as Guest</span>
                  <button 
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="text-[#9b2575] font-bold underline"
                  >
                    Log in for Coins Sync
                  </button>
                </div>
              )}

              {/* Coins Redemption Widget */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm shadow-sm">
                    🪙
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">Redeem Meesho Coins</h4>
                    <p className="text-[11px] text-amber-700">
                      Balance: <span className="font-bold">{meeshoCoins} coins</span> (₹1 = 1 coin)
                    </p>
                  </div>
                </div>

                {meeshoCoins > 0 ? (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={redeemCoinsAtCheckout || shippingForm.paymentMethod === 'coins'}
                      disabled={shippingForm.paymentMethod === 'coins'}
                      onChange={(e) => setRedeemCoinsAtCheckout(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-amber-900">
                      Apply ₹{maxCoinsUsable} off
                    </span>
                  </label>
                ) : (
                  <span className="text-[11px] text-gray-400 italic">No coins yet</span>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#9b2575]" /> Shipping Details
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
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-[#9b2575]"
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
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-[#9b2575]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Flat / Street Address *</label>
                  <input 
                    type="text" 
                    name="street" 
                    required
                    placeholder="House No., Colony"
                    value={shippingForm.street}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-[#9b2575]"
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
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-[#9b2575]"
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
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-[#9b2575]"
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
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-[#9b2575]"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#9b2575]" /> Payment Option
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <label className={`border rounded-lg p-2.5 text-center cursor-pointer transition-colors ${shippingForm.paymentMethod === 'coins' ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400' : 'border-gray-200'}`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="coins" 
                      checked={shippingForm.paymentMethod === 'coins'} 
                      onChange={handleInputChange} 
                      className="hidden" 
                    />
                    <div className="text-xs font-black flex items-center justify-center gap-1 text-amber-900">
                      🪙 Pay 100% Coins
                    </div>
                    <div className="text-[10px] text-amber-700 font-semibold">
                      Cost: {rawCartPrice} Coins
                    </div>
                  </label>

                  <label className={`border rounded-lg p-2.5 text-center cursor-pointer transition-colors ${shippingForm.paymentMethod === 'upi' ? 'border-[#9b2575] bg-pink-50 text-[#9b2575]' : 'border-gray-200'}`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="upi" 
                      checked={shippingForm.paymentMethod === 'upi'} 
                      onChange={handleInputChange} 
                      className="hidden" 
                    />
                    <div className="text-xs font-bold">UPI / QR Code</div>
                    <div className="text-[10px] text-gray-400">PhonePe, GPay, Paytm</div>
                  </label>

                  <label className={`border rounded-lg p-2.5 text-center cursor-pointer transition-colors ${shippingForm.paymentMethod === 'card' ? 'border-[#9b2575] bg-pink-50 text-[#9b2575]' : 'border-gray-200'}`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="card" 
                      checked={shippingForm.paymentMethod === 'card'} 
                      onChange={handleInputChange} 
                      className="hidden" 
                    />
                    <div className="text-xs font-bold">Credit / Debit Card</div>
                    <div className="text-[10px] text-gray-400">HDFC, ICICI, SBI</div>
                  </label>

                  <label className={`border rounded-lg p-2.5 text-center cursor-pointer transition-colors ${shippingForm.paymentMethod === 'cod' ? 'border-[#9b2575] bg-pink-50 text-[#9b2575]' : 'border-gray-200'}`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="cod" 
                      checked={shippingForm.paymentMethod === 'cod'} 
                      onChange={handleInputChange} 
                      className="hidden" 
                    />
                    <div className="text-xs font-bold">Cash On Delivery</div>
                    <div className="text-[10px] text-gray-400">Doorstep Verification</div>
                  </label>

                  <label className={`border rounded-lg p-2.5 text-center cursor-pointer transition-colors col-span-2 ${shippingForm.paymentMethod === 'x402' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200'}`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="x402" 
                      checked={shippingForm.paymentMethod === 'x402'} 
                      onChange={handleInputChange} 
                      className="hidden" 
                    />
                    <div className="text-xs font-bold flex items-center justify-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-purple-600" /> Algorand x402 Web3
                    </div>
                    <div className="text-[10px] text-purple-500 font-semibold">{estimatedAlgo} ALGO (Zero KYC)</div>
                  </label>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Items Total ({totalCartCount}):</span>
                  <span>₹{rawCartPrice}</span>
                </div>

                {coinDiscountApplied > 0 && (
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>🪙 Coins Discount Applied:</span>
                    <span>- ₹{coinDiscountApplied}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-gray-200 pt-1">
                  <span>Payable Total:</span>
                  <span className="font-black text-gray-900 text-sm">
                    {shippingForm.paymentMethod === 'coins' ? `${rawCartPrice} Coins` : `₹${totalCartPrice}`}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-green-700 font-bold bg-green-50 p-1.5 rounded">
                  <Sparkles className="w-3 h-3 text-green-600" />
                  <span>Earn +{coinsRewardToEarn} Meesho Coins on this buy!</span>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#9b2575] hover:bg-[#831c62] text-white font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                {shippingForm.paymentMethod === 'coins' ? (
                  `Confirm & Pay with ${rawCartPrice} Coins`
                ) : shippingForm.paymentMethod === 'cod' ? (
                  'Confirm Doorstep Order'
                ) : (
                  'Proceed to Payment Gateway'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED PAYMENT MODAL */}
      {paymentGatewayOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {shippingForm.paymentMethod === 'x402' ? 'Algorand Web3 Gateway' : 'Secure Banking Gateway'}
                </span>
              </div>
              <button onClick={() => setPaymentGatewayOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4">
              <span className="text-xs text-gray-400">Total Payable</span>
              <div className="text-2xl font-black text-gray-900">
                ₹{totalCartPrice}
              </div>
              {coinDiscountApplied > 0 && (
                <div className="text-[11px] text-amber-700 font-bold">
                  (Includes ₹{coinDiscountApplied} Coins discount)
                </div>
              )}
              {shippingForm.paymentMethod === 'x402' && (
                <div className="text-xs font-bold text-purple-700 mt-0.5">
                  Equivalent: {estimatedAlgo} ALGO (1 ALGO = ₹12.00)
                </div>
              )}
            </div>

            {shippingForm.paymentMethod === 'upi' && (
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 inline-block mx-auto">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=meesho@icici&pn=MeeshoStore&am=${totalCartPrice}&cu=INR`} 
                    alt="UPI QR Code"
                    className="w-32 h-32 mx-auto rounded shadow-sm"
                  />
                  <div className="text-[11px] font-semibold text-gray-600 mt-2 flex items-center justify-center gap-1">
                    <QrCode className="w-3 h-3 text-[#9b2575]" /> Merchant VPA: meesho@icici
                  </div>
                </div>
                <div className="text-left text-xs bg-gray-50 p-2.5 rounded border border-gray-200 space-y-1 text-gray-600">
                  <div>Bank Partner: <span className="font-bold text-gray-800">ICICI Bank Ltd</span></div>
                  <div>Account Name: <span className="font-semibold text-gray-800">Meesho Payments Direct</span></div>
                </div>
              </div>
            )}

            {shippingForm.paymentMethod === 'card' && (
              <div className="space-y-3 text-left">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">Select Bank</label>
                  <select
                    name="bankName"
                    value={shippingForm.bankName}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2 text-xs bg-gray-50 text-gray-700"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">Card Details</label>
                  <input 
                    type="text" 
                    readOnly 
                    value="•••• •••• •••• 4242 (Visa Platinum)" 
                    className="w-full border rounded-lg p-2 text-xs bg-gray-50 text-gray-700 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">Expiry</label>
                    <input type="text" readOnly value="12 / 28" className="w-full border rounded-lg p-2 text-xs bg-gray-50 text-gray-700 font-mono" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">CVV</label>
                    <input type="password" readOnly value="•••" className="w-full border rounded-lg p-2 text-xs bg-gray-50 text-gray-700 font-mono" />
                  </div>
                </div>
              </div>
            )}

            {shippingForm.paymentMethod === 'x402' && (
              <div className="space-y-3 text-left bg-purple-50/70 p-3 rounded-xl border border-purple-200 text-xs">
                <div className="flex items-center justify-between border-b border-purple-100 pb-1.5">
                  <span className="font-bold text-gray-600">Calculated Asset:</span>
                  <span className="font-bold text-purple-800">{estimatedAlgo} ALGO</span>
                </div>
                <div className="flex items-center justify-between border-b border-purple-100 pb-1.5">
                  <span className="font-bold text-gray-600">Rupee Value:</span>
                  <span className="font-semibold text-gray-800">₹{totalCartPrice} (1 ALGO = ₹12)</span>
                </div>
                <div className="flex items-center justify-between border-b border-purple-100 pb-1.5">
                  <span className="font-bold text-gray-600">Blockchain Network:</span>
                  <span className="font-semibold text-gray-800">Algorand Testnet</span>
                </div>
                <div>
                  <span className="font-bold text-gray-600 block mb-0.5">Merchant Wallet Address:</span>
                  <span className="font-mono text-[9px] bg-white p-1.5 rounded border border-purple-200 block truncate text-gray-700 select-all">
                    {x402Details?.paymentRequirements?.[0]?.payTo || 'GD67YJBPNZWD5HXQXG32SZAXDL5KNOU4CV4TLJ76KSHN44B7JTV3G3V2VU'}
                  </span>
                </div>
              </div>
            )}

            <button 
              onClick={handleSimulatePayment}
              disabled={isProcessingPayment}
              className={`mt-5 w-full text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${
                shippingForm.paymentMethod === 'x402' 
                  ? 'bg-purple-700 hover:bg-purple-800' 
                  : 'bg-[#9b2575] hover:bg-[#831c62]'
              }`}
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Payment...
                </>
              ) : shippingForm.paymentMethod === 'x402' ? (
                `Approve & Pay ${estimatedAlgo} ALGO`
              ) : (
                `Approve & Pay ₹${totalCartPrice}`
              )}
            </button>
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
            <p className="text-xs text-gray-500 mb-3">Transaction ID: <span className="font-semibold text-gray-800">{orderPlaced.orderId}</span></p>

            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl mb-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" /> Coins Earned:
              </div>
              <span className="font-black text-amber-800 text-sm">+{orderPlaced.coinsEarned} Coins 🪙</span>
            </div>

            <div className="bg-gray-50 text-left p-3.5 rounded-lg border border-gray-100 text-xs space-y-2 mb-4">
              <div>
                <span className="text-gray-400 font-bold block">Delivery Address:</span>
                <p className="font-medium text-gray-800">{orderPlaced.shipping.fullName}, {orderPlaced.shipping.phone}</p>
                <p className="text-gray-600">{orderPlaced.shipping.street}, {orderPlaced.shipping.city} - {orderPlaced.shipping.pincode}</p>
              </div>

              <div className="border-t border-gray-200 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Mode:</span>
                  <span className="font-bold uppercase text-gray-800">{orderPlaced.paymentMethod}</span>
                </div>

                {orderPlaced.paymentMethod === 'coins' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Coins Deducted:</span>
                    <span className="font-bold text-amber-800">{orderPlaced.coinsDiscount} Coins</span>
                  </div>
                )}

                {orderPlaced.paymentMethod === 'upi' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">UTR / Ref:</span>
                    <span className="font-mono font-bold text-gray-800">{orderPlaced.paymentDetails?.utrNumber}</span>
                  </div>
                )}

                {orderPlaced.paymentMethod === 'card' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bank & Card:</span>
                    <span className="font-bold text-gray-800">{orderPlaced.paymentDetails?.bank} (•••• 4242)</span>
                  </div>
                )}

                {orderPlaced.paymentMethod === 'x402' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Asset Settled:</span>
                    <span className="font-bold text-purple-700">{orderPlaced.paymentDetails?.paidAlgo}</span>
                  </div>
                )}

                {orderPlaced.paymentMethod === 'cod' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Doorstep PIN:</span>
                    <span className="font-bold text-amber-700">{orderPlaced.paymentDetails?.verificationPin}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>Total Amount:</span>
                <span>{orderPlaced.paymentMethod === 'coins' ? `${orderPlaced.coinsDiscount} Coins` : `₹${orderPlaced.totalAmount}`}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setOrderPlaced(null);
                  setIsOrdersHistoryOpen(true);
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                View in Orders
              </button>
              <button 
                onClick={() => setOrderPlaced(null)}
                className="flex-1 bg-[#9b2575] hover:bg-[#831c62] text-white py-2 rounded-lg text-xs font-bold transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
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

              <div>
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

                <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 p-2 rounded-lg w-fit">
                  <span>🪙 Buy with Meesho Coins:</span>
                  <span className="font-black text-amber-800">
                    {selectedProduct.discounted_price || selectedProduct.original_price} Coins
                  </span>
                </div>
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
                className="w-full bg-[#9b2575] hover:bg-[#831c62] text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDERS HISTORY MODAL */}
      {isOrdersHistoryOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-[#9b2575]" />
                <h3 className="font-bold text-gray-900 text-base">Your Order History</h3>
              </div>
              <button onClick={() => setIsOrdersHistoryOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {ordersList.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <PackageCheck className="w-12 h-12 mx-auto mb-2 opacity-30 text-gray-400" />
                  <p className="text-sm font-semibold">No past orders found.</p>
                </div>
              ) : (
                ordersList.map((ord, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2 text-xs">
                      <div>
                        <span className="font-bold text-gray-800">Order ID: </span>
                        <span className="font-mono text-gray-600 select-all">{ord.orderId}</span>
                      </div>
                      <div className="text-gray-400">
                        {ord.date} at {ord.time}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {ord.items.map((it, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="text-gray-700 truncate max-w-xs">{it.quantity}x {it.title}</span>
                          <span className="font-bold text-gray-900">₹{(Number(it.discounted_price || it.original_price) * it.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-[11px] grid grid-cols-2 gap-2 text-gray-600">
                      <div>
                        <span className="font-bold block text-gray-500">Delivery Address:</span>
                        <span>{ord.shipping.fullName}, {ord.shipping.street}, {ord.shipping.city} - {ord.shipping.pincode}</span>
                      </div>

                      <div>
                        <span className="font-bold block text-gray-500">Payment Parameter Details:</span>
                        {ord.paymentMethod === 'coins' && (
                          <div>
                            <p>Mode: <span className="font-semibold text-amber-700">100% Meesho Coins</span></p>
                            <p>Coins Spent: <span className="font-bold text-amber-800">{ord.coinsDiscount} Coins</span></p>
                          </div>
                        )}
                        {ord.paymentMethod === 'upi' && (
                          <div>
                            <p>Mode: <span className="font-semibold text-green-700">UPI / QR</span></p>
                            <p>UTR No: <span className="font-mono font-semibold">{ord.paymentDetails?.utrNumber}</span></p>
                          </div>
                        )}
                        {ord.paymentMethod === 'card' && (
                          <div>
                            <p>Mode: <span className="font-semibold text-blue-700">Card</span></p>
                            <p>Bank: <span className="font-semibold">{ord.paymentDetails?.bank}</span></p>
                          </div>
                        )}
                        {ord.paymentMethod === 'x402' && (
                          <div>
                            <p>Mode: <span className="font-semibold text-purple-700">Algorand x402</span></p>
                            <p>Paid: <span className="font-bold text-purple-800">{ord.paymentDetails?.paidAlgo}</span></p>
                          </div>
                        )}
                        {ord.paymentMethod === 'cod' && (
                          <div>
                            <p>Mode: <span className="font-semibold text-amber-700">Cash On Delivery</span></p>
                            <p>Doorstep PIN: <span className="font-bold text-gray-800">{ord.paymentDetails?.verificationPin}</span></p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold pt-1">
                      <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        🪙 Earned +{ord.coinsEarned} Coins
                      </span>
                      <span className="text-sm font-black text-gray-900">
                        Total: {ord.paymentMethod === 'coins' ? `${ord.coinsDiscount} Coins` : `₹${ord.totalAmount}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#9b2575]" />
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
                      <div className="text-xs font-bold text-gray-900 mt-0.5">
                        ₹{item.discounted_price || item.original_price}
                      </div>
                      <div className="text-[10px] text-amber-800 font-semibold">
                        🪙 or {Number(item.discounted_price || item.original_price)} Coins
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 border border-gray-200 rounded px-1 py-0.5">
                      <button onClick={() => updateQuantity(item.product_id, -1)} className="p-1 hover:text-[#9b2575]">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold px-1">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product_id, 1)} className="p-1 hover:text-[#9b2575]">
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
                  <div className="text-right">
                    <div>₹{rawCartPrice}</div>
                    <div className="text-xs text-amber-800 font-semibold">or {rawCartPrice} Coins</div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full bg-[#9b2575] hover:bg-[#831c62] text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors"
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