import dotenv from "dotenv";
const express = require('express');
const sql = require('mssql');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

dotenv.config();

const router = express.Router();

// MS SQL Server configuration
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        trustServerCertificate: true
    }
};

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Merge time slots (optional depending on your data structure)
function mergeTimeSlots(dates) {
    return dates.map(entry => {
        let dateFormatted;
        if (entry.date) {
            dateFormatted = new Date(entry.date).toLocaleDateString("en-GB", {
                day: "2-digit", month: "long", year: "numeric"
            });
        } else if (entry.date_range) {
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

        let timeSlots = entry.time_slots;
        if (timeSlots.length === 0) return `${dateFormatted} (No time slots)`;

        let startTime = timeSlots[0].split(" - ")[0];
        let endTime = timeSlots[timeSlots.length - 1].split(" - ")[1];

        return `<strong>${dateFormatted}</strong> from <strong>${startTime} to ${endTime}</strong>`;
    }).join("<br>");
}

// Function to cancel unpaid bookings
const cancelUnpaidBookings = async () => {
    try {
        await sql.connect(dbConfig);

        const result = await sql.query(`
            UPDATE bookings
            SET 
                booking_status = 'cancelled',
                event_status = 'Cancelled because of not payment',
                payment_status = 'Not Paid'
            OUTPUT 
                inserted.id, inserted.event_name, inserted.date, inserted.UserID
            WHERE 
                payment_due < GETDATE()
                AND payment_status = 'Pending'
        `);

        const cancelledBookings = result.recordset;

        for (let booking of cancelledBookings) {
            const userEmailResult = await sql.query`
                SELECT email FROM UsersDetails WHERE id = ${booking.UserID}
            `;

            const userEmail = userEmailResult.recordset[0]?.email;

            if (userEmail) {
                await transporter.sendMail({
                    from: '"Auditorium Booking" <your_email@gmail.com>',
                    to: userEmail,
                    subject: `Event "${booking.event_name}" Cancelled`,
                    text: `Dear user, your event scheduled on ${booking.date} has been cancelled due to non-payment.`,
                });

                console.log(`Cancellation email sent to ${userEmail} for Booking ID: ${booking.id}`);
            }
        }
    } catch (err) {
        console.error('Error in cancelling bookings:', err);
    }
};

// Function to reject pending bookings older than 24 hours
const rejectStalePendingBookings = async () => {
    try {
        await sql.connect(dbConfig);

        const result = await sql.query(`
            UPDATE bookings
            SET 
                booking_status = 'rejected',
                reject_reason = 'Admin did not perform any action (Approve/Reject)'
            OUTPUT 
                inserted.id, inserted.event_name, inserted.created_at, inserted.UserID
            WHERE 
                booking_status = 'Pending'
                AND DATEDIFF(HOUR, created_at, GETDATE()) > 24
        `);

        const rejectedBookings = result.recordset;

        for (let booking of rejectedBookings) {
            const userEmailResult = await sql.query`
                SELECT email FROM UsersDetails WHERE id = ${booking.UserID}
            `;

            const userEmail = userEmailResult.recordset[0]?.email;

            if (userEmail) {
                await transporter.sendMail({
                    from: '"Auditorium Booking" <your_email@gmail.com>',
                    to: userEmail,
                    subject: `Event "${booking.event_name}" Rejected`,
                    text: `Dear user, your booking request for the event "${booking.event_name}" has been rejected because no action was taken by the admin within 24 hours.`,
                });

                console.log(`Rejection email sent to ${userEmail} for Booking ID: ${booking.id}`);
            }
        }
    } catch (err) {
        console.error('Error in rejecting stale pending bookings:', err);
    }
};

// CRON JOB: Cancel unpaid bookings every 2 hours
cron.schedule('0 */2 * * *', () => {
    console.log('⏰ Running cron job to cancel unpaid bookings...');
    cancelUnpaidBookings();
});

// CRON JOB: Reject stale pending bookings every hour
cron.schedule('0 * * * *', () => {
    console.log('⏰ Running cron job to reject stale pending bookings...');
    rejectStalePendingBookings();
});

// API endpoint to manually trigger unpaid booking cancellations
router.post('/cancel-unpaid-bookings', async (req, res) => {
    try {
        await cancelUnpaidBookings();
        res.status(200).json({ message: 'Unpaid bookings cancelled and emails sent.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to cancel bookings' });
    }
});

// API endpoint to manually trigger stale pending booking rejections
router.post('/reject-pending-bookings', async (req, res) => {
    try {
        await rejectStalePendingBookings();
        res.status(200).json({ message: 'Stale pending bookings rejected and emails sent.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject stale pending bookings' });
    }
});

module.exports = router;
