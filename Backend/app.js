import dotenv from "dotenv";
import express from "express";
import sql from "mssql";
import bcrypt from "bcryptjs";
import cors from "cors";
import cookieParser from "cookie-parser";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import multer from "multer";
import './dashboard_server.js'; // Automatically starts the dashboard
import './booking_server.js'; // Automatically starts the booking
import twilio from "twilio";
//const bookingCronRoute = require('./booking_cron');

dotenv.config(); // Load environment variables

const app = express();

// Use JSON body parser
app.use(express.json());

//for cancel automatic Booking
//app.use('/api/booking', bookingCronRoute);

// Use cookie parser for handling cookies
app.use(cookieParser());

// CORS setup to allow frontend requests and handle credentials (cookies)
const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Database configuration
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true, // For Azure use true, for local use false
    trustServerCertificate: true // Change to false for production if using a valid certificate
  },
  port: 1433,
};

// Connect to the database
sql.connect(dbConfig)
  .then(() => console.log("Connected to the database"))
  .catch((err) => console.error("Database connection failed:", err.message));

// JWT authentication middleware
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Extract the token from the Authorization header

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });

    req.user = decoded; // Attach decoded user data to the request
    next(); // Proceed to the next middleware/route handler
  });
};

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const otpStore = {}; // Temporary storage for OTPs
const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate OTP

// Sign-Up Route
app.post("/api/signup", async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    if (otpStore[email]) {
      return res.status(400).json({ message: "OTP already sent. Please verify it." });
    }

    otpStore[email] = { otp, name, email, password, phone };

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Signup Verification",
      text: `Your OTP is: ${otp}`,
    });

    res.status(200).json({ message: "OTP sent to email. Please verify to complete signup." });
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// OTP Verification Route
// Send OTP
app.post("/api/send-otp", async (req, res) => {
  console.log("Received request to /api/send-otp with data:", req.body);

  const { email, name, password, phone } = req.body;

  if (!email || !name || !password || !phone) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const currentTime = Date.now();

  if (otpStore[email] && otpStore[email].requestedAt + 60000 > currentTime) {
    return res.status(400).json({ message: "Please wait for 3 minutes before requesting a new OTP." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000); // Generate new OTP
  otpStore[email] = { otp, name, password, phone, requestedAt: currentTime }; // Store OTP with timestamp

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}. It will expire in 3 minutes.`,
    });

    res.json({ message: "OTP sent successfully. It expires in 3 minutes.If it is expired or Invalid then wai tfor 3 minutes for new OTP requests." });
  } catch (error) {
    res.status(500).json({ message: "Error sending OTP email", error: error.message });
  }
});

// Resend OTP
app.post("/api/resend-otp", async (req, res) => {
  const { email } = req.body;

  if (!otpStore[email]) {
    return res.status(400).json({ message: "No previous OTP found. Register first." });
  }

  const currentTime = Date.now();
  if (currentTime < otpStore[email].requestedAt + 60000) {
    return res.status(400).json({ message: "Please wait before requesting a new OTP." });
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email].otp = newOtp;
  otpStore[email].requestedAt = currentTime; // Update timestamp

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "New OTP Code",
      text: `Your new OTP is: ${newOtp}. It will expire in 3 minutes.`,
    });

    res.json({ message: "New OTP sent. It expires in 3 minutes." });
  } catch (error) {
    res.status(500).json({ message: "Error sending new OTP", error: error.message });
  }
});

// Verify OTP
app.post("/api/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email]) {
    return res.status(400).json({ message: "OTP expired. Request a new one." });
  }

  const { otp: storedOtp, name, password, phone, requestedAt } = otpStore[email];

  if (Date.now() > requestedAt + 600000) { // Expiry check
    delete otpStore[email];
    return res.status(400).json({ message: "OTP expired. Request a new one." });
  }

  if (parseInt(otp) !== storedOtp) {
    return res.status(400).json({ message: "Invalid OTP,Wait for3 minutes for requesting new OTP" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const pool = await sql.connect(dbConfig);
  await pool
    .request()
    .input("name", sql.NVarChar, name)
    .input("email", sql.NVarChar, email)
    .input("password", sql.NVarChar, hashedPassword)
    .input("phone", sql.NVarChar, phone)
    .query("INSERT INTO UsersDetails (name, email, password, phone) VALUES (@name, @email, @password, @phone)");

  delete otpStore[email]; // Remove OTP after successful verification

  res.status(201).json({ message: "User registered successfully." });
});

//check already registered email and phone
app.post("/api/check-existence", async (req, res) => {
  const { email, phone } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    let query = "SELECT email, phone FROM UsersDetails WHERE ";
    const inputs = [];

    if (email) {
      query += "email = @email";
      inputs.push({ name: "email", type: sql.NVarChar, value: email });
    }

    if (phone) {
      if (email) query += " OR "; // Add OR if both email and phone are provided
      query += "phone = @phone";
      inputs.push({ name: "phone", type: sql.NVarChar, value: phone });
    }

    const request = pool.request();
    inputs.forEach(input => request.input(input.name, input.type, input.value));

    const result = await request.query(query);

    // Check if email or phone exists
    const emailExists = result.recordset.some((row) => row.email === email);
    const phoneExists = result.recordset.some((row) => row.phone === phone);

    res.json({ emailAvailable: !emailExists, phoneAvailable: !phoneExists });

  } catch (error) {
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

// Login Route with Role-Based Authentication
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const pool = await sql.connect(dbConfig);

    // Check in UsersDetails table
    const userResult = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query("SELECT * FROM UsersDetails WHERE LOWER(email) = LOWER(@email)");
    let user = userResult.recordset[0];
    let role = "user";

    // If not in UsersDetails, check in AdminDetails
    if (!user) {
      const adminResult = await pool
        .request()
        .input("email", sql.NVarChar, email)
        .query("SELECT * FROM AdminDetails WHERE LOWER(email) = LOWER(@email)");

      user = adminResult.recordset[0];
      role = "admin";
    }
    // const adminResult = await pool
    //   .request()
    //   .input("email", sql.NVarChar, email)
    //   .query("SELECT * FROM AdminDetails WHERE LOWER(email) = LOWER(@email)");

    // let user = userResult.recordset[0] || adminResult.recordset[0];
    // let role = userResult.recordset[0] ? "user" : "admin";

    if (!user) {
      return res.status(400).json({ message: "User or Admin not found" });
    }

    // ✅ For users, check status is "active"
    if (role === "user" && user.status?.toLowerCase() !== "active") {
      return res.status(403).json({ message: "Account is inactive. Please contact support." });
    }

    // if (user.status?.toLowerCase() !== "active") {
    //   return res.status(403).json({ message: "Account is inactive. Please contact support." });
    // }

    // Validate password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );

    res.status(200).json({ message: "Login successful", token, role, userId: user.id });
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

//for fetch user information
app.get('/api/get-user', async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token

    const pool = await sql.connect(dbConfig);

    // Fetch user from UsersDetails table using the decoded user ID
    const userResult = await pool
      .request()
      .input("id", sql.Int, decoded.id)
      .query("SELECT * FROM UsersDetails WHERE id = @userId");

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.recordset[0];
    res.status(200).json({ userId: user.id, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Profile Route
const storage = multer.memoryStorage(); // Use memory storage to keep the file in memory (no disk storage)

const upload = multer({ storage });

// Route to update user profile including the profile picture
app.put("/api/user/update", verifyToken, upload.single("profilePic"), async (req, res) => {
  const { name, email, phone } = req.body;
  const newProfilePic = req.file ? req.file.buffer : null; // Get new image if uploaded

  try {
    const pool = await sql.connect(dbConfig);

    // Fetch existing profilePic if no new image is uploaded
    let profilePic = newProfilePic;
    if (!newProfilePic) {
      const result = await pool
        .request()
        .input("id", sql.Int, req.user.id)
        .query("SELECT profilePic FROM UsersDetails WHERE id = @id");

      profilePic = result.recordset[0]?.profilePic || null; // Retain existing image if available
    }

    await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("email", sql.NVarChar, email)
      .input("phone", sql.NVarChar, phone)
      .input("profilePic", sql.VarBinary, profilePic) // Store as binary
      .input("id", sql.Int, req.user.id)
      .query(`
        UPDATE UsersDetails
        SET name = @name, email = @email, phone = @phone, profilePic = @profilePic
        WHERE id = @id
      `);

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});

//for get profile pic
app.get('/api/user/profile-pic/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input('userId', sql.Int, parseInt(userId))
      .query('SELECT profilePic FROM UsersDetails WHERE id = @userId');

    if (result.recordset.length > 0 && result.recordset[0].profilePic) {
      const profilePic = result.recordset[0].profilePic;

      res.setHeader('Content-Type', 'image/jpeg');  // Assuming the image is in JPEG format
      res.status(200).send(profilePic);  // Send binary data as the image
    } else {
      res.status(404).json({ message: 'Profile picture not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile picture', error: error.message });
  }
});

// Step 1: Send Reset OTP
app.post("/api/send-reset-otp", async (req, res) => {
  const { email } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("Email", sql.NVarChar, email)
      .query("SELECT * FROM UsersDetails WHERE Email = @Email");

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: "Email not registered" });
    }

    // Check if OTP already exists and is still valid
    const existingOTP = otpStore[email];
    if (existingOTP && Date.now() - existingOTP.timestamp < 3 * 60 * 1000) {
      return res.status(400).json({ message: "OTP already sent. Try again later." });
    }

    // Generate a new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with timestamp
    otpStore[email] = { otp, timestamp: Date.now() };

    // Send OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is:${otp}. It is valid for 3 minutes.`,
    });

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ message: "Error sending OTP", error: error.message });
  }
});

// Step 2: Verify OTP
app.post("/api/verify-reset-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email]) {
    return res.status(400).json({ message: "No OTP found. Request a new OTP." });
  }

  const { otp: storedOtp, timestamp } = otpStore[email];

  if (Date.now() - timestamp > 3 * 60 * 1000) {
    delete otpStore[email]; // Remove expired OTP
    return res.status(400).json({ message: "OTP expired. Request a new OTP." });
  }

  if (storedOtp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // OTP verified, allow password reset
  delete otpStore[email]; // Remove OTP after successful verification
  res.status(200).json({ message: "OTP verified successfully" });
});

// Step 3: Reset Password
app.post("/api/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const pool = await sql.connect(dbConfig);
    await pool
      .request()
      .input("Email", sql.NVarChar, email)
      .input("NewPassword", sql.NVarChar, hashedPassword)
      .execute("UpdatePassword");

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating password", error: error.message });
  }
});

//User give feedback and stored in DB
app.post("/api/feedback", async (req, res) => {
  //console.log("Incoming feedback data:", req.body);

  const { auditoriumId, userId, feedback } = req.body;

  if (!auditoriumId || !userId || !feedback.trim()) {
    console.log("Missing fields:", { auditoriumId, userId, feedback });
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("auditoriumId", sql.Int, auditoriumId)
      .input("userId", sql.Int, userId)
      .input("feedbackText", sql.NVarChar, feedback)
      .execute("InsertFeedback");

    //console.log("Feedback saved successfully!", result);
    res.status(201).json({ message: "Feedback submitted successfully!" });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Failed to save feedback", error: err.message });
  }
});

//Fetch Feedback on Homepage
app.get("/api/feedback", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .query(
        `SELECT F.id, U.name AS username, 
                CONCAT('http://localhost:5000/api/user/avatar/', U.id) AS profilePic, 
                A.name AS auditoriumName, 
                F.feedbackText, F.createdAt 
         FROM Feedback F
         JOIN UsersDetails U ON F.userId = U.id
         JOIN Auditoriums A ON F.auditoriumId = A.id
         WHERE F.is_visible <> 1   -- Fetch only feedback where is_visible is NOT 1
         ORDER BY F.createdAt DESC `
      );

    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching feedback:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//For ProfileImage on Feedback
app.get("/api/user/avatar/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("userId", sql.Int, parseInt(userId))
      .query("SELECT profilePic FROM UsersDetails WHERE id = @userId");

    if (result.recordset.length > 0 && result.recordset[0].profilePic) {
      const profilePicBuffer = result.recordset[0].profilePic;

      res.writeHead(200, { "Content-Type": "image/jpeg" });
      res.end(profilePicBuffer, "binary"); // Send image as binary
    } else {
      res.status(404).json({ message: "Profile picture not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile picture", error: error.message });
  }
});


// Protected Route: Get user info
app.get("/api/me", verifyToken, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    let result;
    if (req.user.role === "user") {
      result = await pool
        .request()
        .input("id", sql.Int, req.user.id)
        .query("SELECT * FROM UsersDetails WHERE id = @id");
    } else if (req.user.role === "admin") {
      result = await pool
        .request()
        .input("id", sql.Int, req.user.id)
        .query("SELECT * FROM AdminDetails WHERE id = @id");
    } else {
      return res.status(400).json({ message: "Invalid role detected" });
    }

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user data", error: err.message });
  }
});

// Logout Route: Clears token
app.post("/api/logout", (req, res) => {
  res.status(200).json({ message: "User logged out successfully" });
});

// Start the server
const PORT = process.env.PORT || 5000;
// Main App Route
app.get('/', (req, res) => {
  res.send('Main App is running...');
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});