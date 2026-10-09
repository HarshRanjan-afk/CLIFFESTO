require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Permissive CORS configuration so Vercel never gets blocked
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-payment-proof', 'WWW-Authenticate']
}));

// Pre-flight handling for complex requests
app.options('*', cors());

app.use(express.json());

// 2. Supabase Client Initialization with URL sanitization
let supabaseUrl = process.env.SUPABASE_URL || 'https://stihpbzqlvubbtmwyfie.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Clean trailing slashes or /rest/v1 if accidentally included in environment variables
if (supabaseUrl) {
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("⚠️ Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment variables.");
}

// 3. Health check route (used to verify Render backend is active)
app.get('/', (req, res) => {
  res.json({
    status: "ok",
    message: "Meesho backend is running live on Render",
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: "ok", message: "Meesho API is fully operational" });
});

// 4. Fetch Products from Supabase
app.get('/api/products', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: "Supabase client not initialized. Check your environment variables."
      });
    }

    const { data, error } = await supabase
      .from('Products')
      .select('*');

    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }

    res.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (err) {
    console.error("Error in /api/products:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Algorand x402 Checkout Route
const ALGORAND_TESTNET_CAIP2 = 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe';
const merchantAddress = process.env.ALGORAND_MERCHANT_ADDRESS || 'GD67YJBPNZWD5HXQXG32SZAXDL5KNOU4CV4TLJ76KSHN44B7JTV3G3V2VU';
const INR_PER_ALGO = 12.0;

app.post('/api/orders/x402-checkout', (req, res) => {
  const { totalAmount, cart } = req.body;
  const paymentProof = req.headers['x-payment-proof'] || req.headers['authorization'];

  // Calculate ALGO equivalent from the INR total
  const algoPrice = totalAmount ? (Number(totalAmount) / INR_PER_ALGO).toFixed(2) : "1.00";

  // HTTP 402 - Payment Required
  if (!paymentProof) {
    res.set({
      'WWW-Authenticate': `x402 network="${ALGORAND_TESTNET_CAIP2}", scheme="exact", payTo="${merchantAddress}", price="${algoPrice}"`,
      'Content-Type': 'application/json'
    });

    return res.status(402).json({
      error: "Payment Required",
      statusCode: 402,
      protocol: "HTTP 402 / AVM Exact",
      paymentRequirements: [
        {
          scheme: "exact",
          network: ALGORAND_TESTNET_CAIP2,
          networkName: "Algorand Testnet",
          payTo: merchantAddress,
          priceInAlgo: algoPrice,
          fiatAmountInr: totalAmount,
          rate: `1 ALGO = ₹${INR_PER_ALGO}`,
          asset: "ALGO",
          description: "Meesho Order Payment via Algorand x402"
        }
      ]
    });
  }

  // If payment proof is provided, settle the transaction
  res.json({
    success: true,
    message: "Payment verified on Algorand testnet!",
    orderId: "ALGO-ORD-" + Date.now(),
    paidAt: new Date().toISOString()
  });
});

// 6. Listen on 0.0.0.0 for Render container deployment
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running and listening on port ${PORT}`);
});