/** @format */

// /** @format */
// import express from 'express';
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import cors from 'cors';
// dotenv.config();

// const app = express();

// import activatewithAddress from './src/routes/Common/activateSubscriberWithAddress.js';
// import DeActivateSubscriber from './src/routes/Common/deActivateSubscriber.js';
// import UpdateE911address from './src/routes/Common/updateE911address.js';
// import adminUserControlRoutes from './src/routes/AdminRoutes/adminUserControlRoutes.js';
// import signinRoutes from './src/routes/Auth/signin.js';
// import signupRoutes from './src/routes/Auth/signup.js';
// import userRoutes from './src/routes/UserRoutes/userRoutes.js';
// import addWfc from './src/routes/Common/addWfc.js';
// app.use(express.json());

// app.use(
//   cors({
//     origin: ['*'],
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: [
//       'Content-Type',
//       'Authorization',
//       'Access-Control-Allow-Origin',
//       'transaction-id,client-id,client-api-key,x-api-key',
//     ],
//     credentials: true,
//   })
// );
// app.options('*', cors());

// // MongoDB connection
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log('✅ Connected to MongoDB'))
//   .catch((err) => {
//     console.error('❌ Failed to connect to MongoDB:', err.message);
//     process.exit(1);
//   });

// //API Routes
// app.use('/activatewithAddressRoutes', activatewithAddress);
// app.use('/DeActivateSubscriber', DeActivateSubscriber);
// app.use('/UpdateE911address', UpdateE911address);
// app.use('/add-wfc', addWfc);
// app.use('/auth', signinRoutes);

// //Auth routes
// app.use('/admin-user', adminUserControlRoutes);
// app.use('/auth', signinRoutes);
// app.use('/auth/signup', signupRoutes);
// app.use('/user', userRoutes);

// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });
// // Server start
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

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
    origin: ['http://localhost:3000', 'https://www.jf-mobile.com'],
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

// Handle preflight requests for all routes
app.options('*', cors());

// Routes
import activatewithAddress from './src/routes/Common/activateSubscriberWithAddress.js';
import DeActivateSubscriber from './src/routes/Common/deActivateSubscriber.js';
import UpdateE911address from './src/routes/Common/updateE911address.js';
import adminUserControlRoutes from './src/routes/AdminRoutes/adminUserControlRoutes.js';
import signinRoutes from './src/routes/Auth/signin.js';
import signupRoutes from './src/routes/Auth/signup.js';
import userRoutes from './src/routes/UserRoutes/userRoutes.js';
import addWfc from './src/routes/Common/addWfc.js';

app.use('/activatewithAddressRoutes', activatewithAddress);
app.use('/DeActivateSubscriber', DeActivateSubscriber);
app.use('/UpdateE911address', UpdateE911address);
app.use('/add-wfc', addWfc);
app.use('/auth', signinRoutes);
app.use('/auth/signup', signupRoutes);
app.use('/admin-user', adminUserControlRoutes);
app.use('/user', userRoutes);

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
