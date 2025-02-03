// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(cors());
connectDB();

app.use((req, res, next) => {
    console.log('Request URL:', req.method, req.url);
    next();
  });
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/steps', require('./routes/steps'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/history', require('./routes/history'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));