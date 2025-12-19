/** @format */
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// CORS setup
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://www.jf-mobile.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'transaction-id',
      'client-id',
      'client-api-key',
      'x-api-key',
    ],
    credentials: true,
  })
);

app.options('*', cors());

// Routes
import ActivateSubscriber from './src/routes/Common/ActivateSubscriber.js';
import activatewithAddress from './src/routes/Common/activateSubscriberWithAddress.js';
import DeActivateSubscriber from './src/routes/Common/deActivateSubscriber.js';
import ReActivateSubscriber from './src/routes/Common/ReActivateSubscriber.js';
import AdjustBalance from './src/routes/Common/AdjustBalance.js';
import CancelDeviceLocation from './src/routes/Common/CancelDeviceLocation.js';
import CancelPortIn from './src/routes/Common/CancelPortIn.js';
import UpdateE911address from './src/routes/Common/updateE911address.js';
import adminUserControlRoutes from './src/routes/AdminRoutes/adminUserControlRoutes.js';
import signinRoutes from './src/routes/Auth/signin.js';
import signupRoutes from './src/routes/Auth/signup.js';
import userRoutes from './src/routes/UserRoutes/userRoutes.js';
import addWfc from './src/routes/Common/addWfc.js';
import bulkActivateSubscriberWithAddress from './src/routes/Common/bulkActivateSubscriberWithAddress.js';
import ActivationReport from './src/routes/Reports/ActivationReport.js';
import bulkDeactivateSubscriber from './src/routes/Common/bulkDeactivateSubscriber.js';
import bulkReactivateSubscriber from './src/routes/Common/bulkReactivateSubscriber.js';
import bulkUpdateE911 from './src/routes/Common/bulkUpdateE911.js';
app.use('/ActivateSubscriber', ActivateSubscriber);
app.use('/activatewithAddressRoutes', activatewithAddress);
app.use('/ReActivateSubscriber', ReActivateSubscriber);
app.use('/DeActivateSubscriber', DeActivateSubscriber);
app.use('/AdjustBalance', AdjustBalance);
app.use('/CancelDeviceLocation', CancelDeviceLocation);
app.use('/CancelPortIn', CancelPortIn);
app.use('/UpdateE911address', UpdateE911address);
app.use('/add-wfc', addWfc);
app.use('/auth', signinRoutes);
app.use('/auth/signup', signupRoutes);
app.use('/admin-user', adminUserControlRoutes);
app.use('/user', userRoutes);
app.use(
  '/bulkActivateSubscriberWithAddress',
  bulkActivateSubscriberWithAddress
);
app.use('/activateSubscriber', ActivateSubscriber);
app.use(
  '/bulkDeactivateSubscriber',
  bulkDeactivateSubscriber
);
app.use(
  '/bulkReactivateSubscriber',
  bulkReactivateSubscriber
);
app.use(
  '/bulkUpdateE911Address',
  bulkUpdateE911
);
// Report Routes
app.use('/activationReport', ActivationReport);
// Test route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
