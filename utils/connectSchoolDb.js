const mongoose = require('mongoose');

// Retry connection logic
const connectToSchoolDB = async (dbURI, retries = 5, retryDelay = 5000) => {
  try {
    if (!dbURI) {
      throw new Error('Database URI is required');
    }

    // Attempt to create a connection to the school database
    const schoolConnection = await mongoose.createConnection(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 60000, // Increased timeout
      socketTimeoutMS: 60000,          // Increased socket timeout
      connectTimeoutMS: 20000,         // Increased connection timeout
      maxPoolSize: 100,
    });

    console.log('Successfully connected to the school database');
    return schoolConnection;

  } catch (error) {
    console.error('Error connecting to the school database:', error);

    if (retries === 0) {
      throw new Error('Failed to connect to the database after multiple attempts');
    }

    // Wait before retrying
    console.log(`Retrying connection (${retries} attempts left)...`);
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    return connectToSchoolDB(dbURI, retries - 1, retryDelay); // Retry connection
  }
};

// Helper function to wait until the connection is established
const waitForConnection = async (connection, timeout = 20000) => {
  const startTime = Date.now();

  while (connection.readyState !== 1) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Database connection timeout');
    }

    console.log('Waiting for connection...');

    // Handle disconnected state or disconnecting
    if (connection.readyState === 0 || connection.readyState === 3) {
      throw new Error('Connection is not available or disconnected');
    }

    await new Promise(resolve => setTimeout(resolve, 100)); // wait 100ms and check again
  }

  console.log('Database connection established');
};

// Generate a 4-digit unique number
const generateShortId = () => Math.floor(1000 + Math.random() * 9000); // Generates a number between 1000-9999

// Function to generate a unique database name
const generateUniqueDbName = async (sName) => {
  const adminDb = mongoose.connection.useDb('admin'); // Connect to the admin database
  const dbList = await adminDb.db.admin().listDatabases(); // Get the list of existing databases
  const existingDbNames = dbList.databases.map(db => db.name);

  let dbName = `${sName}_db`;
  while (existingDbNames.includes(dbName)) {
    const shortId = generateShortId();
    dbName = `${sName}_${shortId}_db`;
  }
  return dbName;
};

module.exports = { connectToSchoolDB, waitForConnection, generateUniqueDbName };
