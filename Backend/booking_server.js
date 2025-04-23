import sql from 'mssql';
import express from 'express';
import cors from 'cors';
import nodemailer from "nodemailer";
import axios from 'axios';
import moment from 'moment';

const router = express.Router();
const app = express();

app.use(express.json());
app.use(cors());


// ✅ Define database connection ONCE
const poolPromise = new sql.ConnectionPool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,  // Use encryption for security (optional)
    trustServerCertificate: true,  // Adjust based on your setup
  }
}).connect();

// Get All Auditoriums (excluding those marked as deleted)
// Only fetch `id` and `name`
app.get("/auditoriums", async (req, res) => {
  try {
    const id = req.query.id ? parseInt(req.query.id, 10) : null;
    const pool = await poolPromise;

    let query = "SELECT id, name FROM auditoriums WHERE is_deleted <> 1";
    const request = pool.request();

    if (id) {
      query += " AND id = @id";
      request.input("id", id);
    }

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: id ? "Auditorium not found" : "No auditoriums found" });
    }

    res.status(200).json(id ? result.recordset[0] : result.recordset);
  } catch (err) {
    console.error("Error fetching auditoriums:", err);
    res.status(500).json({ message: "Failed to retrieve auditoriums", error: err.message });
  }
});

// GET: Fetch all feedback for an auditorium
app.get("/api/feedback/:auditoriumId", async (req, res) => {
  let { auditoriumId } = req.params;

  if (isNaN(auditoriumId)) {
    return res.status(400).json({ message: "Invalid auditorium ID" });
  }

  try {
    const pool = await poolPromise; // Ensure connection is awaited
    const result = await pool  // 🔹 Store query result in 'result' variable
      .request()
      .input("auditoriumId", sql.Int, parseInt(auditoriumId, 10))
      .query(`SELECT 
              f.id AS id,
              f.userId,
              ud.name AS user_name,
              ud.email AS user_email,
              f.feedbackText,
              f.createdAt,
              f.is_visible
          FROM Feedback f
          INNER JOIN UsersDetails ud ON f.UserId = ud.id
          WHERE f.auditoriumId = @auditoriumId
          AND f.is_visible = 0`);

    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset);
    } else {
      res.status(404).json({ message: "No feedback found for this auditorium." });
    }
  } catch (err) {
    console.error("Error fetching feedback:", err);
    res.status(500).json({ message: "Failed to fetch feedback", error: err.message });
  }
});

// DELETE Feedback API
app.delete("/api/feedback/delete/:id", async (req, res) => {
  const { id } = req.params; // Get feedback ID from URL

  try {
    const pool = await poolPromise; // Ensure poolPromise is correctly set up in dbConfig.js

    // Check if feedback exists
    const checkFeedback = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM feedback WHERE id = @id");

    if (checkFeedback.recordset.length === 0) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Delete feedback
    await pool.request().input("id", sql.Int, id).query("DELETE FROM feedback WHERE id = @id");

    res.status(200).json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//update Feedback
app.put("/api/feedback/update/:id", async (req, res) => {
  const { id } = req.params;
  const { feedbackText } = req.body;

  try {
    const pool = await poolPromise;

    const checkFeedback = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM feedback WHERE id = @id");

    if (checkFeedback.recordset.length === 0) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("feedbackText", sql.NVarChar, feedbackText)
      .query("UPDATE feedback SET feedbackText = @feedbackText WHERE id = @id");

    res.status(200).json({ message: "Feedback updated successfully" });
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Get all bookings using the stored procedure on admin side
app.get('/get-all-bookings', async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().execute('GetAllBookings');

    const bookings = result.recordset.map(booking => ({
      ...booking,
      dates: JSON.parse(booking.dates) // Convert stored JSON dates back to array
    }));

    res.status(200).json(bookings);
  } catch (err) {
    console.error("❌ Error fetching bookings:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

//get auditorium time slot for booked like in approved,confirm
app.get("/booked-slots/:auditoriumId", async (req, res) => {
  try {
    const { auditoriumId } = req.params;
    const pool = await poolPromise;

    const query = `
      SELECT 
        b.Dates,
        b.event_name,
        u.name AS user_name
      FROM 
        bookings b
      JOIN 
        UsersDetails u ON b.UserID = u.id
      WHERE 
        b.AuditoriumID = @auditoriumId 
        AND b.booking_status IN ('approved', 'confirm')
    `;

    const result = await pool.request()
      .input('auditoriumId', sql.Int, auditoriumId)
      .query(query);

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(200).json([]);
    }

    let detailedSlots = [];

    result.recordset.forEach((booking) => {
      if (!booking.Dates) return;

      try {
        const parsedDates = JSON.parse(booking.Dates);

        if (!Array.isArray(parsedDates)) throw new Error("Invalid JSON");

        parsedDates.forEach((entry) => {
          if (!entry.date || !Array.isArray(entry.time_slots)) return;

          detailedSlots.push({
            date: entry.date,
            time_slots: entry.time_slots,
            user_name: booking.user_name,
            event_name: booking.event_name,
          });
        });

      } catch (err) {
        console.error("❌ JSON Parsing Error:", err);
      }
    });

    res.status(200).json(detailedSlots); // now includes all details

  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//check conflict
app.get('/check-only-conflicts/:auditoriumId', async (req, res) => {
  try {
    const { auditoriumId } = req.params;

    // 1. Fetch all pending bookings
    const pendingRes = await axios.get('http://localhost:5001/get-all-bookings');
    const pendingBookings = pendingRes.data;

    // 2. Fetch booked slots (approved/confirmed)
    const bookedRes = await axios.get(`http://localhost:5001/booked-slots/${auditoriumId}`);
    const bookedSlotsArray = bookedRes.data;

    // Transform into a date-based map for easier conflict checking
    const bookedSlotsByDate = {};

    bookedSlotsArray.forEach(slot => {
      const { date, time_slots, user_name, event_name } = slot;

      if (!bookedSlotsByDate[date]) {
        bookedSlotsByDate[date] = [];
      }

      time_slots.forEach(ts => {
        bookedSlotsByDate[date].push({
          slot: ts,
          eventName: event_name,
          bookedBy: user_name
        });
      });
    });

    const parseSlot = (slot) => {
      const [start, end] = slot.split('-').map(t => moment(t.trim(), 'HH:mm'));
      return { start, end };
    };

    const slotsOverlap = (slot1, slot2) => {
      const a = parseSlot(slot1);
      const b = parseSlot(slot2);
      return a.start.isBefore(b.end) && b.start.isBefore(a.end);
    };

    const conflicts = [];

    // Checking conflicts for each pending booking
    for (const booking of pendingBookings) {
      const { id, event_name, dates } = booking;

      let conflictDetails = {
        bookingId: id,
        eventName: event_name,
        comparisons: []
      };

      for (const { date, time_slots } of dates) {
        const approvedSlots = bookedSlotsByDate[date] || [];

        for (const slot of time_slots) {
          for (const approved of approvedSlots) {
            if (slotsOverlap(slot, approved.slot)) {
              conflictDetails.comparisons.push({
                requestedSlot: slot,
                approvedSlot: approved.slot,
                conflictDetected: true,
                date: date,
                approvedBooking: {
                  date: date,
                  approvedSlot: approved.slot,
                  approvedEventName: approved.eventName,
                  bookedBy: approved.bookedBy
                }
              });
            }
          }
        }
      }

      if (conflictDetails.comparisons.length > 0) {
        conflicts.push(conflictDetails);
      }
    }

    res.json({
      message: `✅ Conflict check completed.`,
      totalConflicts: conflicts.length,
      conflicts
    });

  } catch (error) {
    console.error("❌ Error checking conflicts:", error.message);
    res.status(500).json({ error: "Something went wrong during conflict check." });
  }
});

// Email notification function with event name
async function sendNotificationEmail(userEmail, eventName) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Booking Status Update - Waiting List',
    text: `Your booking for the event "${eventName}" has been added to the waiting list. Please wait for further confirmation.`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Notification email sent successfully.');
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
}

// Update booking conflict status and notify the user
app.post('/update-booking-conflict-status', async (req, res) => {
  const { bookingId, status } = req.body;

  try {
    const pool = await poolPromise;
    const bookingIdInt = parseInt(bookingId, 10);

    // Get booking info
    const checkBooking = await pool.query(`SELECT * FROM bookings WHERE id = ${bookingIdInt}`);

    if (!checkBooking || !checkBooking.recordset || checkBooking.recordset.length === 0) {
      return res.status(404).send({ message: 'Booking not found' });
    }

    const booking = checkBooking.recordset[0];
    const userId = booking.UserID;
    const eventName = booking.event_name;

    // Get user email
    const userQuery = await pool.query(`SELECT email FROM UsersDetails WHERE id = ${userId}`);
    const userEmail = userQuery.recordset[0].User_Email;

    // Update booking status
    const result = await pool.query(
      `UPDATE bookings SET booking_status = '${status}' WHERE id = ${bookingIdInt}`
    );

    if (result.rowsAffected > 0) {
      // Notify the user
      await sendNotificationEmail(userEmail, eventName);
      res.status(200).send({ message: 'Booking status updated to "waiting" and user notified' });
    } else {
      res.status(404).send({ message: 'Booking not found' });
    }
  } catch (error) {
    console.error("❌ Error updating booking status:", error);
    res.status(500).send({ message: 'Failed to update booking status' });
  }
});

// Route for booking the auditorium
app.post('/book-auditorium', async (req, res) => {
  try {
    console.log("🔵 Received Booking Data:", req.body); // Debugging Step 1

    const { user_id, auditorium_id, event_name, dates, amenities, total_price } = req.body;

    if (!user_id || !auditorium_id || !event_name || !dates || dates.length === 0 || total_price === undefined) {
      return res.status(400).json({ message: '❌ Missing required fields!' });
    }

    const pool = await poolPromise;

    // Convert the dates array into a JSON string for storage
    const datesJson = JSON.stringify(dates);

    await pool.request()
      .input('UserId', sql.Int, user_id)
      .input('AuditoriumId', sql.Int, auditorium_id)
      .input('EventName', sql.VarChar, event_name)
      .input('Dates', sql.NVarChar, datesJson) // Store dates as JSON
      .input('Amenities', sql.NVarChar, amenities ? amenities.join(", ") : "")
      .input('TotalAmount', sql.Decimal(10, 2), total_price)
      .execute('InsertBooking'); // Call stored procedure

    res.status(200).json({ message: '✅ Booking Created Successfully' });
  } catch (err) {
    console.error("❌ Error inserting booking:", err); // Debugging Step 2
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// API to Approve or Reject Booking
app.post("/update-booking-status", async (req, res) => {
  //console.log("Received Request Body:", req.body); // Debugging line
  const { booking_id, action, approved_discount, reject_reason, user_email, event_name, dates } = req.body;

  if (!booking_id || !action || !user_email) {
    return res.status(400).json({ error: "Booking ID and action ,  and user email are required" });
  }

  try {
    const pool = await poolPromise;
    let request = pool.request();

    request.input("BookingID", sql.Int, booking_id);
    request.input("Action", sql.VarChar(10), action);

    if (action === "approve") {
      if (approved_discount === undefined) {
        return res.status(400).json({ error: "Approved discount is required for approval" });
      }
      request.input("ApprovedDiscount", sql.Decimal(10, 2), approved_discount);
    } else {
      request.input("ApprovedDiscount", sql.Decimal(10, 2), null);
    }

    if (action === "reject") {
      if (!reject_reason) {
        return res.status(400).json({ error: "Reject reason is required for rejection" });
      }
      request.input("RejectReason", sql.Text, reject_reason);
    } else {
      request.input("RejectReason", sql.Text, null);
    }

    let result = await request.execute("UpdateBookingStatus");

    // ✅ Fetch the updated discount amount from the database
    let discountQuery = await pool
      .request()
      .input("BookingID", sql.Int, booking_id)
      .query("SELECT discount_amount,total_amount FROM bookings WHERE id = @BookingID");

    let updatedDiscountAmount = discountQuery.recordset[0]?.discount_amount || 0; // Ensure value is not null
    let beforeDiscountAmount = discountQuery.recordset[0]?.total_amount || 0;
    // ✅ Send Email Notification with the updated amount
    if (user_email) {
      await sendEmailNotification(user_email, action, event_name, JSON.parse(dates), reject_reason, approved_discount, updatedDiscountAmount, beforeDiscountAmount);
    }

    res.json(result.recordset[0]); // Return the message from the stored procedure
  } catch (error) {
    console.error("❌ Database Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Function to merge time slots and handle both 'date' and 'date_range'
function mergeTimeSlots(dates) {
  return dates.map(entry => {
    let dateFormatted;

    if (entry.date) {
      // Format single date as "21 March 2025"
      dateFormatted = new Date(entry.date).toLocaleDateString("en-GB", {
        day: "2-digit", month: "long", year: "numeric"
      });
    } else if (entry.date_range) {
      // Format date range as "21 March 2025 - 22 March 2025"
      let [startDate, endDate] = entry.date_range.split(" - ");
      let formattedStartDate = new Date(startDate).toLocaleDateString("en-GB", {
        day: "2-digit", month: "long", year: "numeric"
      });
      let formattedEndDate = new Date(endDate).toLocaleDateString("en-GB", {
        day: "2-digit", month: "long", year: "numeric"
      });
      dateFormatted = `<strong>${formattedStartDate} - ${formattedEndDate}</strong>`;
    } else {
      return "Invalid date format";
    }

    // Merge time slots into a single range
    let timeSlots = entry.time_slots;
    if (timeSlots.length === 0) return `${dateFormatted} (No time slots)`;

    let startTime = timeSlots[0].split(" - ")[0]; // First slot start time
    let endTime = timeSlots[timeSlots.length - 1].split(" - ")[1]; // Last slot end time

    return `<strong>${dateFormatted}</strong> from <strong>${startTime} to ${endTime}</strong>`;
  }).join("<br>");
}

// Function to Send Email Notification
async function sendEmailNotification(email, action, eventName, dates, rejectReason, discount, discount_amount, total_amount) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // ✅ Merge time slots before formatting
  let formattedDates = mergeTimeSlots(dates);

  let subject, message;

  if (action === "approve") {
    subject = "Booking Approved 🎉";

    //console.log(`📩 Payable Amount: ${discount_amount}`);
    //console.log(`📩 Total Amount before Discount: ${total_amount}`);

    message = `
      <p>Your booking request for <strong>${eventName}</strong> on:<br><br>${formattedDates}<br></p>`;

    if (discount === 100) {
      message += `
          <p>🎉 <strong>Your booking is confirmed!</strong> No payment is required.</p>
          <p>Enjoy your event at our auditorium! If you have any questions, feel free to contact us.</p>`;
    } else if (discount > 0) {
      message += `
          <p>has been approved! 🎉</p>
          <p>🎊 <strong>You have received a ${discount}% discount!</strong></p>
          <p><strong>Original Price:</strong> ₹<s>${total_amount}</s></p>
          <p><strong>Final Payable Amount:</strong> ₹<strong>${discount_amount}</strong></p>
          <p>Please complete the payment using the QR code provided within <strong>24 hours</strong> to confirm your booking.</p>
          <p><strong>Failure to pay within the time limit will result in automatic cancellation.</strong></p>`;
    } else {
      message += `
          <p>has been approved! 🎉</p>
          <p>The total amount payable is ₹<strong>${discount_amount}</strong>.</p>
          <p><strong>Please complete the payment using the QR code</strong> within <strong>24 hours</strong> to confirm your booking.</p>
          <p><strong>Failure to pay within the time limit will result in automatic cancellation.</strong></p>`;
    }
  } else {
    subject = "Booking Rejected ❌";
    message = `
      <p> <strong>Unfortunately, your booking request for ${eventName}</strong> on:</p>
      <p><strong>${formattedDates}</strong></p>
      <p><strong>has been rejected</strong> due to: <strong>${rejectReason}</strong>.</p>
      <p>If you have any questions, you can reply to this message for further clarification.</p>
      <p>We apologize for any inconvenience caused.</p>`;
  }

  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    //console.log("✅ Email Sent Successfully!");
  } catch (error) {
    console.error("❌ Error Sending Email:", error);
  }
}

// Cancel booking API
app.get('/cancel-booking/:bookingId', async (req, res) => {
  const bookingId = req.params.bookingId;

  try {
    const pool = await sql.connect(process.env.DB_CONNECTION_STRING);

    // Execute stored procedure to cancel the booking
    await pool.request()
      .input('bookingId', sql.Int, bookingId)
      .execute('sp_CancelBooking');

    // Fetch user details, auditorium name, and refund amount
    const queryResult = await pool.request()
      .input('bookingId', sql.Int, bookingId)
      .query(`
        SELECT 
          u.name, 
          u.email, 
          a.name AS auditorium_name,
          b.refund_amount
        FROM bookings b
        JOIN UsersDetails u ON b.UserID = u.id
        JOIN auditoriums a ON b.AuditoriumID = a.id
        WHERE b.id = @bookingId
      `);

    if (queryResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const { username, email, auditorium_name, refund_amount } = queryResult.recordset[0];

    // Send cancellation email
    await sendCancellationEmail(username, email, bookingId, auditorium_name, refund_amount);

    res.json({
      message: 'Booking successfully cancelled. Email sent to user.'
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Error cancelling booking' });
  }
});

// Function to send cancellation email
async function sendCancellationEmail(username, email, bookingId, auditoriumName, refundAmount) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Booking Cancellation Confirmation',
    text: `
      
      Your booking at ${auditoriumName} has been successfully cancelled.

      Refund Details:
      - If cancelled before 24 hours, you will receive a full refund.
      - If cancelled between 24 to 12 hours, you will receive a 50% refund.
      - If cancelled between 12 to 6 hours, you will receive a 30% refund.
      - If cancelled after 6 hours, no refund is applicable.

      Your refund amount is ₹${refundAmount} and will be reflected back to your account within 24 hours. 
      If you do not receive it, please contact the administrator.

      Regards,
      Maharaja Sayajirao University,vadodara
    `
  };

  await transporter.sendMail(mailOptions);
}

//update status of payment in DB
app.post("/make-payment/:bookingId", async (req, res) => {
  const { bookingId } = req.params;

  try {
    const pool = await poolPromise;

    // Fetch booking and user details
    const query = `
      SELECT b.id, b.event_name, u.email 
      FROM bookings b 
      JOIN UsersDetails u ON b.UserID = u.id 
      WHERE b.id = @bookingId
    `;
    const request = pool.request();
    request.input("bookingId", sql.Int, bookingId);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Booking not found!" });
    }

    const booking = result.recordset[0];

    // Update booking status without passing payment_date
    await pool.request()
      .input("bookingId", sql.Int, bookingId)
      .execute("UpdateBookingPayment"); // Call the stored procedure

    // Send confirmation email
    await sendConfirmationEmail(booking.email, booking.event_name);

    res.status(200).json({ success: true, message: "Payment successful! Email sent." });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ success: false, message: "Payment failed. Try again." });
  }
});

const sendConfirmationEmail = async (email, eventName, paymentDate) => {
  let formattedDate = new Date(paymentDate).toLocaleString(); // Format date for email

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Use environment variables for security
      pass: process.env.EMAIL_PASS,
    },
  });

  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Booking Confirmation & Payment Receipt",
    text: `Your booking for "${eventName}" has been successfully confirmed! 
    Payment Date: ${formattedDate} 
    Thank you for your payment.`,
  };

  await transporter.sendMail(mailOptions);
};

//admin View Payment Status
app.get('/admin/view-payment-status', async (req, res) => {
  try {
    const pool = await poolPromise;
    const query = `
      SELECT 
        b.id AS booking_id, 
        ud.name AS user_name, 
        ud.email AS user_email,
        a.name AS auditorium_name,
		b.event_name,
        b.payment_status,
		b.payment_date,
		b.discount_amount
      FROM Bookings b
      INNER JOIN UsersDetails ud ON b.UserId = ud.id
      INNER JOIN Auditoriums a ON b.AuditoriumId = a.id
      WHERE b.payment_status = 'successful';
    `;

    const result = await pool.request().query(query);

    res.json(result.recordset); // ✅ Send formatted JSON response

  } catch (error) {
    console.error('Error fetching booking requests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//admin View Feedback
app.get('/admin/view-feedback', async (req, res) => {
  try {
    const pool = await poolPromise;
    const query = `
              SELECT 
                f.id AS id, 
                ud.name AS user_name, 
                ud.email AS user_email,
                a.name AS auditorium_name,
            f.feedbackText,
            f.createdAt,
            f.is_visible
        FROM Feedback f
        INNER JOIN UsersDetails ud ON f.UserId = ud.id
        INNER JOIN Auditoriums a ON f.AuditoriumId = a.id;
    `;

    const result = await pool.request().query(query);

    res.json(result.recordset); // ✅ Send formatted JSON response

  } catch (error) {
    console.error('Error fetching booking requests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//set Feedback show and unshow on HOmePage
app.put("/api/feedback/:id/status", async (req, res) => {
  const { id } = req.params;
  const { is_visible } = req.body;

  try {
    const pool = await poolPromise; // Ensure you await poolPromise
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("is_visible", sql.TinyInt, is_visible) // Ensure TinyInt (0 or 1)
      .query("UPDATE Feedback SET is_visible = @is_visible WHERE id = @id");

    res.status(200).json({ message: "Feedback visibility updated successfully" });
  } catch (error) {
    console.error("Database update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//admin View Booking Status
app.get('/admin/view-booking-status', async (req, res) => {
  try {
    const pool = await poolPromise;
    const query = `
                SELECT 
              b.id AS booking_id, 
              ud.name AS user_name, 
              a.name AS auditorium_name, 
              b.event_name,
              b.Dates,
              b.booking_status,
              b.discount_amount,
              b.approved_discount,
              b.refund_amount,
              b.updated_date,
              b.reject_reason
          FROM Bookings b
          INNER JOIN UsersDetails ud ON b.UserId = ud.id
          INNER JOIN Auditoriums a ON b.AuditoriumId = a.id
          WHERE b.booking_status <> 'Pending';
    `;

    const result = await pool.request().query(query);

    res.json(result.recordset); // ✅ Send formatted JSON response

  } catch (error) {
    console.error('Error fetching booking requests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch bookings for a specific user
app.get("/user/bookings/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const pool = await poolPromise; // Use the existing database connection
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(
        `SELECT b.*, a.name AS auditorium_name
            FROM bookings b
            JOIN auditoriums a ON b.AuditoriumID = a.id
            WHERE b.UserID = @userId
            ORDER BY b.Dates DESC;`
      );

    const bookings = result.recordset.map(booking => ({
      ...booking,
      Dates: JSON.parse(booking.Dates) // Convert stored JSON dates back to array
    }));
    res.status(200).json(bookings);
    //res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/admin/completed-events', async (req, res) => {
  try {
    const pool = await poolPromise;

    // Update the status of past bookings before fetching completed events
    // await pool.request().query(`
    //   UPDATE bookings 
    //   SET status = 'Completed' 
    //   WHERE status = 'Pending' 
    //   AND date < CAST(GETDATE() AS DATE)
    //   OR (date = CAST(GETDATE() AS DATE) AND end_time < CAST(GETDATE() AS TIME));
    // `);

    // Fetch completed bookings
    const result = await pool.request().query(`
      SELECT b.id, b.date, b.start_time, b.end_time, b.event_name, b.status, 
             a.name AS auditorium_name, u.name AS booked_by
      FROM bookings b
      JOIN auditoriums a ON b.AuditoriumID = a.id
      JOIN UsersDetails u ON b.UserID = u.id
      WHERE b.status = 'Complete'
      ORDER BY b.date DESC;
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching completed events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Start the server
const PORT = 5001;
app.get('/', (req, res) => {
  res.send('Booking is running...');
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
