const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const db = require("./db");
const jwt = require("jsonwebtoken");
const cors = require("cors"); 
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 8888;

const app = express();
app.use(cors("*")); 
app.use(express.json());
app.use(bodyParser.json());

// SIGNUP endpoint
app.post("/signup", async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body;

    if (!name || !email || !mobile || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Checks if email already exists
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
      if (err) {
        console.error("DB error (check email):", err);
        return res.status(500).json({ error: "DB error" });
      }
      if (result.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hashing password by using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // Inserts new user into DB after validating and hashing the password
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

//  LOGIN endpoint
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Checks if user already exists
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result[0];

    // Compares password with the hashed password stored in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generates JWT(JSON web token)
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "mysecretkey",  // creates a token containing the user's ID and email, signed with a secret key
      { expiresIn: "1h" } // valid for 1 hour
    );

    res.json({
      success: true,
      message: "Login successful",
      token: token,
    });
  });
});

// Admin login
app.post("/admin/login", (req, res) => {   
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Checks if admin exists
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



// DB Events
app.get("/events", (req, res) => {
  const query = "SELECT * FROM events"; 
  db.query(query, (err, results) => {
    if (err) {
      console.error("DB error (events):", err);
      return res.status(500).json({ error: "DB error" });
    }
    res.json(results);
  });
});

// Registration

// To handle and store event registration data submitted by users.
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

// to fetch and view all event registrations from the database.
app.get("/registrations", (req, res) => {
  const sql = "SELECT * FROM registrations ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

//  tells the server to listen for HTTP requests on port 8888.
app.listen(8888, () => {
  console.log(`🚀 Server is running on port ${8888}`);
});

// create event 
app.post("/events", (req, res) => {
  const { 
    title, 
    date, 
    time, 
    total_seats, 
    left_seats, 
    location, 
    tags, 
    highlights, 
    organizer, 
    description, 
    banner_image 
  } = req.body;

  if (!title || !date || !time || !total_seats || !left_seats) {
    return res.status(400).json({ error: "Title, date, time, and seat info are required" });
  }

  const sql = `
    INSERT INTO events 
    (title, date, time, total_seats, left_seats, location, tags, highlights, organizer, description, banner_image) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [title, date, time, total_seats, left_seats, location, tags, highlights, organizer, description, banner_image],
    (err, result) => {
      if (err) {
        console.error("❌ Database error (create event):", err);
        return res.status(500).json({ error: "Database error while creating event" });
      }
      res.status(201).json({ success: true, message: "Event created successfully!" });
    }
  );
});


// delete event
app.delete("/events/:id", (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Event ID is required" });
  }

  const sql = "DELETE FROM events WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("DB error (delete event):", err);
      return res.status(500).json({ error: "Database error while deleting event" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ success: true, message: "Event deleted successfully!" });
  });
});


