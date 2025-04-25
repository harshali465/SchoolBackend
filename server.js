const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const http = require('http');
const dotenv = require('dotenv').config({ path: path.join(__dirname, './config.env') });
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/school/errorController');
const { initializeClient } = require('./controllers/school/whatsappController');
// 1. Setup for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err);
  process.exit(1);
});

// 2. Create the Express app
const app = express();
const server = http.createServer(app);

// 3. Initialize Socket.IO
const io = new Server(server, {
  path: "/socket.io/",
  cors: {
    origin: "*", // Replace with your allowed origins
    methods: ["GET", "POST"],
    allowedHeaders: ["*"]
  },
  transports: ['websocket']
});

// 4. Configure MongoDB connection
const DB = process.env.DATABASE;
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 100,
  })
  .then(() => console.log('Successfully connected to the global database!'))
  .catch((err) => console.error('Error connecting to the global database:', err));

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to the global database');
});

mongoose.connection.on('error', (err) => {
  console.error(`Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from the global database');
  setTimeout(() => {
    mongoose.connect(DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 100,
    }).catch((err) => console.error('Reconnection attempt failed:', err));
  }, 1000);
});

// 5. Load common models
require('./commonDbModels/school.model');
require('./commonDbModels/admin-user.model');
require('./commonDbModels/modules-master.model');
require('./commonDbModels/surat.model');

// 6. Socket.IO connection logic
io.on("connection", (socket) => {
  console.log("Socket is running. A user connected:", socket.id);

  socket.on('receiveNotificationArr', (data) => {
    console.log('Notification received:', data);
  });

  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${reason}`);
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });

  socket.on('close', () => {
    console.log('Connection closed');
    socket.disconnect(true);
  });
});

module.exports = { io }

// 7. Global middlewares
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'] }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.set('trust proxy', 1);

// 8. Logging middleware for development environment
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 9. Rate-limiting middleware
const limiter = rateLimit({
  max: 10000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// 10. Body parser and security
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());

// 11. Request time middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 12. API Routes
const apiRouter = require('./routes/apiRouter');
const School = require('./commonDbModels/school.model');
const User = require('./models/user.model');
const { connectToSchoolDB, waitForConnection } = require('./utils/connectSchoolDb');
app.use('/test', (req, res) => {
  res.send("test");
});
app.use('/api/v1', apiRouter);

// 13. Global error handler
app.use(globalErrorHandler);

// 14. Error handling middleware
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (`${err.statusCode}`.startsWith('5')) {
    res.status(err.statusCode).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  } else {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
});

// 15. Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// 16. Unhandled rejection handler
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err, "errr");
  server.close(() => {
    process.exit(1);
  });
});


// const aa= async ()=> {
//   const schoolsData =await School.find();

//   for (let school of schoolsData) {
//     const schoolConnection = await connectToSchoolDB(school.dbURI);
//     await waitForConnection(schoolConnection);
//     const UserModel = schoolConnection.model("user", User.schema);
//     const result = await UserModel.updateMany({}, { $set: { notificationPreference: "both" } });
//     console.log(result);
//   }
// }
// aa();
