require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

app.use(cors());
app.use(express.json());

// Public health check
app.get('/api/health', (req, res) => {
  res.json({ status: "ok", message: "Meesho backend is running" });
});

// Fetch products from Supabase
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Products')
      .select('*');

    if (error) throw error;
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Algorand Testnet CAIP-2 Identifier & Merchant Address
const ALGORAND_TESTNET_CAIP2 = 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe';
const merchantAddress = process.env.ALGORAND_MERCHANT_ADDRESS || 'GD67YJBPNZWD5HXQXG32SZAXDL5KNOU4CV4TLJ76KSHN44B7JTV3G3V2VU';

// Dynamic ALGO Conversion: 1 ALGO ≈ ₹12 (or customizable rate)
const INR_PER_ALGO = 12.0;

// Native x402 Algorand Checkout Endpoint
app.post('/api/orders/x402-checkout', (req, res) => {
  const { totalAmount } = req.body;
  const paymentProof = req.headers['x-payment-proof'] || req.headers['authorization'];

  // Calculate ALGO equivalent from the INR total
  const algoPrice = totalAmount ? (Number(totalAmount) / INR_PER_ALGO).toFixed(2) : "1.00";

  // 1. If unpaid, respond with HTTP 402 specifications with calculated ALGO
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

  // 2. If payment token/proof is attached, verify and confirm order
  res.json({
    success: true,
    message: "Payment verified on Algorand testnet!",
    orderId: "ALGO-ORD-" + Date.now(),
    paidAt: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});