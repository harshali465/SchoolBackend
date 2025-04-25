const qrcode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");
const SchoolConnection = require("../../models/schoolConnection.model"); 
const {connectToSchoolDB, waitForConnection} = require("../../utils/connectSchoolDb");

let clients = {}; // Store the WhatsApp client instances temporarily

const initializeClient = async (schoolId, schoolConnection) => {
  return new Promise(async (resolve, reject) => {
    const SchoolConnectionModel = schoolConnection.model("SchoolConnection", SchoolConnection.schema);
    if (clients[schoolId]) {
      resolve(clients[schoolId]);
      return;
    }

    // Check if school data exists in the database
    let schoolData = await SchoolConnectionModel.findOne({ schoolId });

    if (!schoolData) {
      schoolData = await SchoolConnectionModel.create({ schoolId });
    }

    clients[schoolId] = new Client({
      puppeteer: { headless: true, args: ["--no-sandbox"] },
      authStrategy: new LocalAuth({ clientId: schoolId }),
    });

    clients[schoolId].on("qr", async (qr) => {
      qrcode.toDataURL(qr, async (err, url) => {
        if (err) {
          console.error("Error generating QR code", err);
          return reject(err);
        }
        // Update QR code in the database
        await SchoolConnectionModel.updateOne(
          { schoolId },
          { qrCodeData: url }
        );
      });
    });

    clients[schoolId].on("ready", async () => {
      await SchoolConnectionModel.updateOne(
        { schoolId },
        { connectionStatus: true, qrCodeData: "" } // Clear QR code once connected
      );
      resolve(clients[schoolId]); // Resolve once ready
    });

    clients[schoolId].on("auth_failure", async (msg) => {
      console.error("Authentication failed", msg);
      await SchoolConnectionModel.updateOne(
        { schoolId },
        { connectionStatus: false }
      );
      reject(new Error("Authentication failure"));
    });

    clients[schoolId].on("disconnected", async () => {
      await SchoolConnectionModel.updateOne(
        { schoolId },
        { connectionStatus: false, qrCodeData: "" }
      );
      delete clients[schoolId]; // Remove client from memory
      initializeClient(schoolId,schoolConnection).catch(console.error); // Reinitialize on disconnection
    });

    clients[schoolId].initialize().catch((error) => {
      console.error("Error initializing client:", error);
      reject(error);
    });

    resolve(clients[schoolId]);
  });
};

module.exports.getQr = async (req, res, next) => {

  let schoolConnection = await connectToSchoolDB(req.user.dbURI);
  await waitForConnection(schoolConnection);
  const SchoolConnectionModel = schoolConnection.model("SchoolConnection", SchoolConnection.schema);
  const { schoolId } = req.query;
  // Ensure client is initialized
  if (!clients[schoolId]) {
    await initializeClient(schoolId, schoolConnection);
  }
  try {
    const schoolData = await SchoolConnectionModel.findOne({ schoolId });
    if (!schoolData) {
      return res.status(400).json({ error: "School not found" });
    }
    res.status(200).json({
      qr: schoolData.qrCodeData || "",
      connection_status: schoolData.connectionStatus,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports.sendMessage = async (schoolId, number, message, connection) => {
  const SchoolConnectionModel = connection.model("SchoolConnection", SchoolConnection.schema);
  const schoolData = await SchoolConnectionModel.findOne({schoolId : schoolId});

  if (!schoolData || !schoolData.connectionStatus) {
    return false;
  }

  // Initialize client if not already connected
  if (!clients[schoolId]) {
    await initializeClient(schoolId);
  }

  const chatId = `${number}@c.us`;
  try {
    await clients[schoolId].sendMessage(chatId, message);
    return true;
  } catch (error) {
    console.error("Failed to send message:", error);
    return false;
  }
};

// Check connection status for a specific school
module.exports.checkConnection = async (req, res) => {
  let schoolConnection = await connectToSchoolDB(req.user.dbURI);
  await waitForConnection(schoolConnection);
  const SchoolConnectionModel = schoolConnection.model("SchoolConnection", SchoolConnection.schema);
  const { schoolId } = req.query;

  try {
    await initializeClient(schoolId,schoolConnection)
    // Retrieve school connection data from the database
    const schoolData = await SchoolConnectionModel.findOne({ schoolId });

    if (!schoolData) {
      return res.status(200).json({  status: true,
      connection_status: false, });
    }

    // Send the connection status as response
    res.status(200).json({
      status: true,
      connection_status: schoolData.connectionStatus,
    });
  } catch (error) {
    console.error("Error checking connection:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};