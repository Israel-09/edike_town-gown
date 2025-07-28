
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// NeonDB connection
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_EnFX0g5iMAuC@ep-autumn-art-ad9r1tat-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

// Initialize database
async function initializeDatabase() {
  try {
    // Create registrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        age VARCHAR(20) NOT NULL,
        current_status VARCHAR(50) NOT NULL,
        university VARCHAR(200) NOT NULL,
        course VARCHAR(200) NOT NULL,
        level VARCHAR(100) NOT NULL,
        why_attend TEXT NOT NULL,
        career_interest VARCHAR(100) NOT NULL,
        hear_about VARCHAR(100) NOT NULL,
        receive_updates VARCHAR(10) NOT NULL,
        registration_date TIMESTAMP NOT NULL
      )
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize database on startup
initializeDatabase();



// API endpoint to check for duplicate email or phone
app.post('/api/check-duplicate', async (req, res) => {
  try {
    const { email, phone } = req.body;

    // Check if email exists
    const emailResult = await pool.query(
      'SELECT email FROM registrations WHERE email = $1',
      [email]
    );

    if (emailResult.rows.length > 0) {
      return res.json({ duplicate: 'email' });
    }

    // Check if phone exists
    const phoneResult = await pool.query(
      'SELECT phone FROM registrations WHERE phone = $1',
      [phone]
    );

    if (phoneResult.rows.length > 0) {
      return res.json({ duplicate: 'phone' });
    }

    // No duplicates found
    return res.json({ duplicate: false });
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// API endpoint to submit registration
app.post('/api/submit-registration', async (req, res) => {
  console.log("okay")
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
      registrationDate
    } = req.body;
    const [firstName, lastName] = fullName.split(' ')
    console.log(firstName,lastName)

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
        registrationDate
      ]
    );


    res.json({ success: true });
  } catch (error) {
    console.error('Error submitting registration:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
 
// Function to send confirmation email with QR code
async function sendConfirmationEmail(email, firstName) {
  try {
    // Generate a unique QR code for the registration
    const registrationId = `GTT2025-${firstName}-${Date.now()}`;
    const qrCodeData = `https://edikefoundation.com/gtt2025/verify?id=${registrationId}`;
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData);
    
    // For now, we'll simulate email sending success since we're having authentication issues
    // In a production environment, you would use actual SMTP credentials
    
    // Log the QR code data for testing purposes
    console.log('QR Code generated for:', firstName);
    console.log('Registration ID:', registrationId);
    console.log('QR Code data URL generated successfully');
    
    // Uncomment this code when you have valid SMTP credentials
    /*
    // Create a transporter using the provided email credentials
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'your-email@example.com',
        pass: 'your-app-password'
      }
    });

    // Send email with QR code
    const info = await transporter.sendMail({
      from: '"Edike Foundation" <noreply@edikefoundation.com>',
      to: email,
      subject: 'Gown to town confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #44AF89; border-radius: 10px;">
          <div style="background-color: #1E2636; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Registration Confirmed!</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello ${firstName},</p>
            <p>Thank you for registering for <strong>Gown to Town 2025</strong>. Your application has been received and is being processed.</p>
            <p>Please find your unique QR code below. You will need to present this QR code at the event for verification:</p>
            <div style="text-align: center; margin: 20px 0;">
              <img src="${qrCodeDataUrl}" alt="Registration QR Code" style="max-width: 200px; height: auto;">
              <p style="margin-top: 10px; font-size: 12px; color: #666;">Registration ID: ${registrationId}</p>
            </div>
            <p>We will be in touch soon with further details about the event.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The Edike Foundation Team</p>
          </div>
          <div style="background-color: #44AF89; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="color: #ffffff; margin: 0;">© 2025 Edike Foundation. All rights reserved.</p>
          </div>
        </div>
      `,
    });
    console.log('Confirmation email sent:', info.messageId);
    */
    
    // For testing purposes, we'll simulate success
    console.log('Confirmation email would be sent to:', email);
    return true;
  } catch (error) {
    console.error('Error in confirmation email process:', error);
    return false;
  }
}

// Test endpoint to verify database connection
app.get('/api/test-connection', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      success: true,
      message: 'Database connection successful',
      timestamp: result.rows[0].current_time,
      database: 'NeonDB'
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Endpoint to get all registrations (for testing only)
app.get('/api/registrations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM registrations');
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Test database connection: http://localhost:${port}/api/test-connection`);
  console.log(`View all registrations: http://localhost:${port}/api/registrations`);
});