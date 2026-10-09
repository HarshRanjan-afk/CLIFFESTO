require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing from .env");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ message: "Obsidian Backend is live and running!" });
});

// Fetch Products from Supabase
app.get('/api/Products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Products')
      .select('*')
      .limit(50); // initial 50 Products

    if (error) {
      throw error;
    }

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});