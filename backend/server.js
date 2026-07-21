const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Allow requests from any local frontend (live-server, file://, etc.)
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/recruiter', require('./routes/recruiter'));
app.use('/api/candidate', require('./routes/candidate'));
app.use('/api/admin', require('./routes/admin'));

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexthire')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));