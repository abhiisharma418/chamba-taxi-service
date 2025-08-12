import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

// CORS middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Mock user data
const mockUsers = [
  { id: '1', email: 'customer@test.com', password: 'password', name: 'Test Customer', role: 'customer' },
  { id: '2', email: 'driver@test.com', password: 'password', name: 'Test Driver', role: 'driver' }
];

// Mock JWT token
const mockToken = 'mock-jwt-token-' + Date.now();

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email, password });
  
  const user = mockUsers.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  
  res.json({
    success: true,
    data: {
      token: mockToken,
      refresh: 'mock-refresh-token',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  console.log('Register attempt:', { name, email, role });
  
  const newUser = {
    id: String(mockUsers.length + 1),
    name,
    email,
    password,
    role: role || 'customer'
  };
  mockUsers.push(newUser);
  
  res.json({
    success: true,
    data: {
      token: mockToken,
      refresh: 'mock-refresh-token'
    }
  });
});

app.post('/api/auth/refresh', (req, res) => {
  res.json({
    success: true,
    data: {
      token: mockToken,
      refresh: 'mock-refresh-token'
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// Mock rides endpoints
app.post('/api/rides/estimate', (req, res) => {
  res.json({
    success: true,
    data: {
      distance: '5.2 km',
      duration: '12 mins',
      price: 15.50,
      vehicleTypes: ['standard', 'premium']
    }
  });
});

app.post('/api/rides', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'ride-' + Date.now(),
      status: 'pending',
      pickup: req.body.pickup,
      destination: req.body.destination,
      price: 15.50
    }
  });
});

app.get('/api/rides/history', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'ride-1',
        status: 'completed',
        pickup: { address: 'Downtown', coordinates: [-74.006, 40.7128] },
        destination: { address: 'Airport', coordinates: [-73.9857, 40.7484] },
        price: 25.00,
        date: new Date().toISOString()
      }
    ]
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Mock backend running on http://localhost:${PORT}`);
});
