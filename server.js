// server.js
const cors = require('cors');
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = 3000;
app.use(cors());


app.get('/api/trends', async (req, res) => {
  const apiKey = '5931454588995e9739bcbf39b05bc7449a069d638587140b73a9337110fb5b02';
  const keyword = req.query.keyword;
  console.log(keyword)
  if (!keyword) {
    return res.status(400).json({ error: 'Missing keyword parameter' });
  }
  const apiUrl = `https://serpapi.com/search?engine=google_trends&q=${encodeURIComponent(keyword)}&api_key=${apiKey}`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    res.json(data);
    console.log(data)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});