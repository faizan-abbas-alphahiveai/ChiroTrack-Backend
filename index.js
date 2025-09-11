import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import { initializeFirebase } from './config/firebase.js';
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patient.js';
import userRoutes from './routes/user.js';

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));





// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ChiroTrack Backend API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      patients: '/api/patients',
      users: '/api/users'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/users', userRoutes);




const startServer = async () => {
  try {
    await connectDB();
    initializeFirebase();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      
    });
  } catch (error) {
    console.error('Server error:', error);
    process.exit(1);
  }
};



startServer();
