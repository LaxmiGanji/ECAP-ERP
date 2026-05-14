require("dotenv").config();
const mongoose = require("mongoose");

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error("❌ ERROR: MONGODB_URI not defined in .env file");
  process.exit(1);
}

const connectToMongo = () => {
  mongoose
    .connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: "majority"
    })
    .then(() => {
      console.log("✅ Connected to MongoDB Atlas Cloud Successfully");
      console.log("Database:", mongoose.connection.name);
    })
    .catch((error) => {
      console.error("❌ Error connecting to MongoDB Atlas:", error.message);
      process.exit(1);
    });
};
 
module.exports = connectToMongo;
