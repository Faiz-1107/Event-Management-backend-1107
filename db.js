const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",       // apna mysql user
  password: "syedfz1107SQL", // apna mysql password
  database: "ems"      // apna db name
});

db.connect((err) => {
  if (err) {
    console.log("DB connection error:", err);
  } else {
    console.log("✅ MySQL Connected...");
  }
});

module.exports = db;