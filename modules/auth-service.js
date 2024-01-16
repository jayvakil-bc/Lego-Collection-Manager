require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  userName: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  loginHistory: [{ dateTime: Date, userAgent: String }],
});

let User;

function initialize() {
  return new Promise((resolve, reject) => {
    mongoose.connect(process.env.MONGODB);

    const db = mongoose.connection;

    db.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      reject(err);
    });

    db.once("open", () => {
      console.log("Connected to MongoDB");
      User = db.model("users", userSchema);
      resolve();
    });
  });
}

async function RegisterUser(userData) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(userData.password, userData.password2);
      if (userData.password !== userData.password2) {
        reject("Passwords do not match");
        return;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      console.log(hashedPassword, userData);
      const newUser = new User({
        userName: userData.userName,
        password: hashedPassword,
        email: userData.email,
      });
      console.log(newUser);

      await newUser.save();
      resolve("User created successfully");
    } catch (error) {
      reject(error.message || "An unexpected error occurred");
    }
  });
}

async function checkUser(userData) {
  return new Promise(async (resolve, reject) => {
    try {
      const users = await User.find({ userName: userData.userName });
      if (users.length === 0) {
        reject(`Unable to find user: ${userData.userName}`);
        return;
      }
      const foundUser = users[0];
      const passwordMatch = await bcrypt.compare(
        userData.password,
        foundUser.password
      );
      if (!passwordMatch) {
        reject(`Incorrect password for user:, ${userData.userName}`);
        return;
      }
      if (foundUser.loginHistory.length === 8) {
        foundUser.loginHistory.pop();
      }
      foundUser.loginHistory.unshift({
        dateTime: new Date().toString(),
        userAgent: userData.userAgent,
      });
      User.updateOne(
        { userName: foundUser.userName },
        { $set: { loginHistory: foundUser.loginHistory } }
      )
        .exec()
        .then(() => {
          resolve(foundUser);
        })
        .catch((err) => {
          reject(err);
        });
    } catch (error) {
      reject(error.message || "An unexpected error occurred");
    }
  });
}

module.exports = {
  initialize,
  RegisterUser,
  checkUser,
};
