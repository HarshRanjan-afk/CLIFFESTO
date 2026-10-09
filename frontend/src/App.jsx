import { useState, useEffect } from 'react';
import { Search, ShoppingBag, Signal, SignalHigh, Star } from 'lucide-react';



const mockProducts = [
  { id: 1, title: "Men's Cotton Typography T-Shirt", price: 249, category: "men", rating: 4.2, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80" },
  { id: 2, title: "Women's Floral Anarkali Kurta", price: 499, category: "women", rating: 4.5, image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&q=80" },
  { id: 3, title: "Wireless Bluetooth Earbuds", price: 299, category: "electronics", rating: 3.8, image: "https://images.unsplash.com/photo-1590658268037-6f11a5d73b24?w=400&q=80" },
  { id: 4, title: "Orthopedic Heel Pain Slippers", price: 199, category: "health", rating: 4.6, image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=400&q=80" },
];


export default function App() {
  
  const [liteMode, setLiteMode] = useState(false); 
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState("All");
  
  
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('obsidian_cart');
    
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('obsidian_cart', JSON.stringify(cart));
  }, [cart]);



  


  const filteredProducts = mockProducts.filter(product => {

    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChip = 
      activeChip === "All" ? true :
      activeChip === "Under ₹299" ? product.price <= 299 :
      product.category === activeChip.toLowerCase();
    
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
          
          {/* Logo */}
          <h1 className="text-2xl font-bold text-pink-600 tracking-tight">Obsidian</h1>
          
          {/* Search Bar (Hinglish/Voice ready conceptually) */}
          <div className="flex-1 max-w-xl relative hidden md:block">
            <input 
              type="text" 
              placeholder="Search by product or problem (e.g. 'heel pain')"
              className="w-full border border-gray-300 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-pink-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            {/* Bharat Lite Mode Toggle */}
            <button 
              onClick={() => setLiteMode(!liteMode)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${liteMode ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
              title="Toggle Bharat Lite Mode"
            >
              {liteMode ? <Signal className="w-4 h-4" /> : <SignalHigh className="w-4 h-4" />}
              <span className="hidden sm:inline">{liteMode ? 'Lite Mode ON' : 'Lite Mode OFF'}</span>
            </button>

            {/* Cart Button */}
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

      {/* MOBILE SEARCH  */}
      <div className="md:hidden p-4 bg-white border-t border-gray-100">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search Hinglish or problems..."
            className="w-full border border-gray-300 rounded-lg py-2 pl-10 pr-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        </div>
      </div>

      {/* QUICK CHIPS */}
      <div className="max-w-6xl mx-auto p-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {["All", "Under ₹299", "Women", "Men", "Health"].map(chip => (
          <button 
            key={chip}
            onClick={() => setActiveChip(chip)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border ${activeChip === chip ? 'bg-pink-50 border-pink-200 text-pink-700' : 'bg-white border-gray-200 text-gray-600'}`}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* PRODUCT GRID */}
      <main className="max-w-6xl mx-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            
            {/*  Bharat Lite Mode */}
            {!liteMode ? (
              <img src={product.image} alt={product.title} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                [Image Hidden - Lite Mode]
              </div>
            )}

            <div className="p-3 flex flex-col flex-grow">
              <h3 className="text-sm text-gray-700 line-clamp-2 mb-1">{product.title}</h3>
              <div className="flex items-center gap-1 mb-2">
                <div className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs flex items-center font-bold">
                  {product.rating} <Star className="w-3 h-3 ml-0.5 fill-current" />
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900 mt-auto">₹{product.price}</div>
              <button 
                onClick={() => addToCart(product)}
                className="mt-3 w-full border border-pink-600 text-pink-600 hover:bg-pink-50 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </main>

    </div>
  );
}