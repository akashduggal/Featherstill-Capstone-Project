const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/api/battery-readings', (req, res) => {
  console.log('Received battery reading:', req.body);
  res.json({
    success: true,
    message: 'Mock server received battery reading',
    data: req.body,
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('Mock server is running!');
});

app.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
});