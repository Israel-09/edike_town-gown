const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("."));

// NeonDB connection
const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_EnFX0g5iMAuC@ep-autumn-art-ad9r1tat-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

// // Initialize database
// async function initializeDatabase() {
//   try {
//     // Create registrations table if it doesn't exist
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS registrations (
//         id SERIAL PRIMARY KEY,
//         first_name VARCHAR(100) NOT NULL,
//         last_name VARCHAR(100) NOT NULL,
//         email VARCHAR(100) UNIQUE NOT NULL,
//         phone VARCHAR(20) UNIQUE NOT NULL,
//         age VARCHAR(20) NOT NULL,
//         current_status VARCHAR(50) NOT NULL,
//         university VARCHAR(200) NOT NULL,
//         course VARCHAR(200) NOT NULL,
//         level VARCHAR(100) NOT NULL,
//         why_attend TEXT NOT NULL,
//         career_interest VARCHAR(100) NOT NULL,
//         hear_about VARCHAR(100) NOT NULL,
//         receive_updates VARCHAR(10) NOT NULL,
//         registration_date TIMESTAMP NOT NULL
//       )
//     `);
//     console.log("Database initialized successfully");
//   } catch (error) {
//     console.error("Error initializing database:", error);
//   }
// }

// // Initialize database on startup
// initializeDatabase();

// API endpoint to check for duplicate email or phone
app.post("/api/check-duplicate", async (req, res) => {
  try {
    const { email, phone } = req.body;

    // Check if email exists
    const emailResult = await pool.query(
      "SELECT email FROM registrations WHERE email = $1",
      [email]
    );

    if (emailResult.rows.length > 0) {
      return res.json({ duplicate: "email" });
    }

    // Check if phone exists
    const phoneResult = await pool.query(
      "SELECT phone FROM registrations WHERE phone = $1",
      [phone]
    );

    if (phoneResult.rows.length > 0) {
      return res.json({ duplicate: "phone" });
    }

    // No duplicates found
    return res.json({ duplicate: false });
  } catch (error) {
    console.error("Error checking for duplicates:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// API endpoint to submit registration
app.post("/api/submit-registration", async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      age,
      currentStatus,
      university,
      course,
      level,
      whyAttend,
      careerInterest,
      hearAbout,
      receiveUpdates,
      registrationDate,
    } = req.body;
    const [firstName, lastName] = fullName.split(" ");
    console.log(firstName, lastName);

    const countResponse = await pool.query(
      "SELECT COUNT(*) FROM registrations"
    );
    const registeredUsers = countResponse.rows[0].count;
    console.log("Registered users count:", registeredUsers);
    if (registeredUsers > 200) {
      res.status(403).json({
        message: "Maximum number of participants reached",
      });
      return;
    }

    // Insert registration into database
    await pool.query(
      `INSERT INTO registrations (
        first_name, last_name, email, phone, age, current_status,
        university, course, level, why_attend, career_interest, hear_about,
        receive_updates, registration_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        firstName,
        lastName,
        email,
        phone,

        age,
        currentStatus,
        university,
        course,
        level,
        whyAttend,
        careerInterest,
        hearAbout,
        receiveUpdates,
        registrationDate,
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error submitting registration:", error);
    let message = "Something went wrong. Please try again later.";
    if (error.code === "23505") {
      message =
        "You have already registered. Check your email for the next steps.";
    } else if (error.code === "23502") {
      message = "Please fill in all required fields.";
    }
    res.status(500).json({ error: message });
  }
});

// Test endpoint to verify database connection
app.get("/api/test-connection", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as current_time");
    res.json({
      success: true,
      message: "Database connection successful",
      timestamp: result.rows[0].current_time,
      database: "NeonDB",
    });
  } catch (error) {
    console.error("Database connection test failed:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// Endpoint to get all registrations (for testing only)
app.get("/api/registrations", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM registrations");
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

module.exports = app;
