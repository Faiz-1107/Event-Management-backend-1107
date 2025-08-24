const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",       // mysql username
  password: "syedfz1107SQL", // mysql password
  database: "ems"      // db name
});

db.connect((err) => {
  if (err) {
    console.log("DB connection error:", err);
  } else {
    console.log("✅ MySQL Connected...");
  }
});

module.exports = db;