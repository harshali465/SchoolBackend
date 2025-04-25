const cron = require('node-cron');
const { sendMessage } = require('../controllers/whatsappController');
const UserModel = require('../models/user.model'); // Adjust the path as necessary

cron.schedule('0 21 * * *', async () => {
  console.log("Cron job started");
  try {
    // Get current date in 'YYYY-MM-DD' format in "America/New_York" timezone
    const currentDate = new Date().toLocaleString("en-US", { timeZone: "America/New_York" }).split(',')[0];

    // Construct the start and end of the day in New York time
    const [month, day, year] = currentDate.split('/');
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));

    const getUsers = await UserModel.aggregate([
      {
        $match: { role: "student" }
      },
      {
        $lookup: {
          from: "aadatData",
          localField: "_id",
          foreignField: "studentId",
          as: "aadatDataInfo"
        }
      },
      {
        $match: {
          "aadatDataInfo": {
            $not: {
              $elemMatch: {
                createdAt: {
                  $gte: startOfDay,
                  $lte: endOfDay
                }
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: "schools",
          localField: "schoolId",
          foreignField: "_id",
          as: "schoolData"
        }
      },
      {
        $unwind: "$schoolData"
      },
      {
        $project: {
          aadatDataInfo: 0
        }
      }
    ]);

    for (let user of getUsers) {
      const message = `Dear ${user.firstName + ' ' + user.lastName},

      A gentle reminder to submit your Daily Aadat Form.

      Login from : ${process.env.BASE_URL}login

      Thank you

      ${user.schoolData.schoolName}`;
      const number = user.familyDetails.motherPhone;
      await sendMessage(number, message);
    }
  } catch (error) {
    console.error("Catch error", error);
  }
}, {
  timezone: "America/New_York" // The cron job will run at 9:00 PM in the "America/New_York" timezone
});
