const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    //  MONGO_URI connection string
    const connect = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`mongoDB connection: ${connect.connection.host} `);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};


module.exports = connectDB;