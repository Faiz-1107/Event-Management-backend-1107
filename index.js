

const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const db = require("./db");
const jwt = require("jsonwebtoken");
const cors = require("cors"); 
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 786;

const app = express();
app.use(cors("*")); 
app.use(express.json());
app.use(bodyParser.json());

// ------------------- SIGNUP -------------------
app.post("/signup", async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body;

    if (!name || !email || !mobile || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if email already exists
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
      if (err) {
        console.error("DB error (check email):", err);
        return res.status(500).json({ error: "DB error" });
      }
      if (result.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert into DB
      db.query(
        "INSERT INTO users (name, email, mobile, password, role) VALUES (?, ?, ?, ?, ?)",
        [name, email, mobile, hashedPassword, role],
        (err, result) => {
          if (err) {
            console.error("DB error (insert):", err);
            return res.status(500).json({ error: "Insert error" });
          }

          return res
            .status(201)
            .json({ success: true, message: "User registered successfully!" });
        }
      );
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ------------------- LOGIN -------------------
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Check if user exists
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "mysecretkey",  // ✅ safer way
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token: token,
    });
  });
});
// ------------------- ⭐ ADMIN LOGIN -------------------
app.post("/admin/login", (req, res) => {   // ⭐ Added for Admin Login
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // ✅ Check if admin exists
  db.query("SELECT * FROM users WHERE email = ? AND role = 'admin'", [email], async (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result.length === 0) {
      return res.status(401).json({ error: "Admin not found or invalid email" });
    }

    const admin = result[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "2h" }
    );

    res.json({
      success: true,
      message: "Admin login successful",
      token: token,
      role: admin.role
    });
  });
});



// ------------------- EVENTS -------------------
app.get("/events", (req, res) => {
  const query = "SELECT * FROM events"; // ✅ assumes you have events table
  db.query(query, (err, results) => {
    if (err) {
      console.error("DB error (events):", err);
      return res.status(500).json({ error: "DB error" });
    }
    res.json(results);
  });
});

// ------------------- REGISTRATION -------------------  // ⬅️ NEW SECTION

// API route: Register user
app.post("/registrations", (req, res) => {
  const { name, email, mobile, message } = req.body;

  if (!name || !email || !mobile) {
    return res.status(400).json({ error: "Name, email, and mobile are required" });
  }

  const sql = "INSERT INTO registrations (name, email, mobile, message) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, email, mobile, message], (err, result) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ error: "Database error while registering" });
    }
    res.json({ success: true, message: "Registration successful!" });
  });
});

// API route: Get all registrations (optional, for admin)
app.get("/registrations", (req, res) => {
  const sql = "SELECT * FROM registrations ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// ------------------- SERVER -------------------
app.listen(8888, () => {
  console.log(`🚀 Server is running on port ${8888}`);
});



