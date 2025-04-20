import { useEffect, useState } from "react";
import axios from "axios";
import FixedLayout from "../components/FixedLayout";
import { useModal } from "../components/ModalContext";

function UpcomingBookings() {
    const { showModal, showConfirmationModal } = useModal();
    const [isCancelling, setIsCancelling] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [activeTab, setActiveTab] = useState("Upcoming");
    const [activeSubTab, setActiveSubTab] = useState("Pending");

    useEffect(() => {
        const storedUserId = localStorage.getItem("userId");
        if (storedUserId) {
            setUserId(storedUserId);
            fetchBookings(storedUserId);
        } else {
            console.error("❌ No user ID found in localStorage.");
            setLoading(false);
        }
    }, []);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseDates = (dates) => (typeof dates === "string" ? JSON.parse(dates) : dates);

    const upcomingBookings = bookings.filter((b) => {
        const dates = parseDates(b.Dates);
        return dates.some((d) => new Date(d.date_range?.split(" - ")[0] || d.date) >= today);
    });


    // for format date and time
    const formatDateTime = (isoString) => {
        if (!isoString) return "N/A"; // Handle empty values

        const date = new Date(isoString);

        // Extract UTC parts manually
        const day = date.getUTCDate();
        const month = date.toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
        const year = date.getUTCFullYear();

        let hours = date.getUTCHours();
        const minutes = date.getUTCMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12; // Convert 24-hour to 12-hour format

        return `${day} ${month} ${year} at ${hours}:${minutes} ${ampm}`;
    };

    const fetchBookings = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:5001/user/bookings/${userId}`);
            setBookings(response.data);
        } catch (error) {
            console.error("❌ Error fetching bookings:", error);
            showModal("❌ Error fetching bookings. Please try again later.", "error");
        } finally {
            setLoading(false);
        }
    };

    const cancelBooking = async (bookingId) => {
        showConfirmationModal(
            "Are you sure you want to cancel this booking?",
            async () => {
                setIsCancelling(true); // Start spinner
                try {
                    await axios.get(`http://localhost:5001/cancel-booking/${bookingId}`);
                    showModal("✅ Booking cancelled successfully!", "success");

                    // Refresh bookings after cancellation
                    if (userId) fetchBookings(userId);
                } catch (error) {
                    console.error("❌ Error cancelling booking:", error);
                    showModal("❌ Failed to cancel booking. Try again later.", "error");
                }
                finally {
                    setIsCancelling(false); // Stop spinner
                }
            }
        );
    };

    const PaymentBooking = async (bookingId) => {
        showConfirmationModal(
            "Are you sure you want to proceed with the payment?",
            async () => {
                setIsPaying(true); // Start spinner
                try {
                    await axios.post(`http://localhost:5001/make-payment/${bookingId}`);
                    showModal("✅ Payment successful!", "success");

                    // Refresh bookings after payment
                    if (userId) fetchBookings(userId);
                } catch (error) {
                    console.error("❌ Error processing payment:", error);
                    showModal("❌ Failed to make payment. Try again later.", "error");
                }
                finally {
                    setIsPaying(false); // Stop spinner
                }
            }
        );
    };

    const pendingBookings = upcomingBookings.filter((b) => b.booking_status === "Pending");
    const approvedBookings = upcomingBookings.filter((b) => b.booking_status === "approved");
    const rejectedBookings = upcomingBookings.filter((b) => b.booking_status === "rejected");
    const cancelledBookings = upcomingBookings.filter((b) => b.booking_status === "cancelled");
    const confirmbookings = upcomingBookings.filter((b) => b.booking_status === "confirm");

    const getFilteredBookings = () => {
        switch (activeSubTab) {
            case "Pending":
                return pendingBookings;
            case "Approved":
                return approvedBookings;
            case "Confirm":
                return confirmbookings;
            case "Rejected":
                return rejectedBookings;
            case "Cancelled":
                return cancelledBookings;
            default:
                return [];
        }
    };

    return (
        <div className="bg-gray-100">

            <div className="min-h-screen flex flex-col items-center bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">

                {/* Upcoming Events Section */}
                {activeTab === "Upcoming" && (
                    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl">
                        <h2 className="text-2xl font-bold text-center mb-4">Upcoming Events</h2>

                        {/* Sub-tabs (Pending, Approved, Rejected, Cancelled) */}
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-4">
                            {["Pending", "Approved", "Confirm", "Rejected", "Cancelled"].map((subTab) => (
                                <button
                                    key={subTab}
                                    onClick={() => setActiveSubTab(subTab)}
                                    className={`px-4 py-2 rounded-lg shadow transition duration-300 
        ${activeSubTab === subTab ? "bg-brown text-white" : "bg-gray-300 text-black"}
        w-full sm:w-auto`}
                                >
                                    {subTab}
                                </button>
                            ))}
                        </div>

                        {/* Booking List */}
                        {loading ? (
                            <p className="text-center text-gray-600">Loading bookings...</p>
                        ) : getFilteredBookings().length > 0 ? (
                            <ul className="space-y-4">
                                {/* Loop through filtered bookings */}
                                {getFilteredBookings().map((booking) => (
                                    <li
                                        key={booking.id}
                                        className="p-4 bg-gray-50 rounded-lg shadow flex justify-between items-center"
                                    >
                                        <div>
                                            {/* Auditorium name */}
                                            <p className="text-lg font-medium">
                                                <strong>Auditorium:</strong> {booking.auditorium_name}
                                            </p>

                                            {/* Event name */}
                                            <p className="text-gray-600">
                                                <strong>Event:</strong> {booking.event_name}
                                            </p>

                                            {/* Date & Time */}
                                            <p className="text-gray-600 font-medium">
                                                <strong>Date & Time:</strong>{" "}
                                                {(() => {
                                                    if (!Array.isArray(booking.Dates) || booking.Dates.length === 0) {
                                                        return <p className="text-gray-500">No dates available</p>;
                                                    }

                                                    const sortedDates = booking.Dates
                                                        .map((dateObj) => ({
                                                            date: dateObj.date || null,
                                                            date_range: dateObj.date_range || null,
                                                            time_slots: Array.isArray(dateObj.time_slots)
                                                                ? dateObj.time_slots.sort()
                                                                : [],
                                                        }))
                                                        .sort(
                                                            (a, b) =>
                                                                new Date(a.date || a.date_range.split(" - ")[0]) -
                                                                new Date(b.date || b.date_range.split(" - ")[0])
                                                        );

                                                    const formattedDates = [];
                                                    let tempStart = sortedDates[0]?.date || sortedDates[0]?.date_range;
                                                    let prevTimeSlots = sortedDates[0]?.time_slots;
                                                    let currentRange = [tempStart];

                                                    for (let i = 1; i < sortedDates.length; i++) {
                                                        const { date, date_range, time_slots } = sortedDates[i];
                                                        const currentDate = date || date_range;

                                                        if (JSON.stringify(prevTimeSlots) === JSON.stringify(time_slots)) {
                                                            currentRange.push(currentDate);
                                                        } else {
                                                            formattedDates.push({
                                                                date_range: formatDateRange(currentRange),
                                                                time_slots: formatTimeSlots(prevTimeSlots),
                                                            });

                                                            currentRange = [currentDate];
                                                            prevTimeSlots = time_slots;
                                                        }
                                                    }

                                                    formattedDates.push({
                                                        date_range: formatDateRange(currentRange),
                                                        time_slots: formatTimeSlots(prevTimeSlots),
                                                    });

                                                    return formattedDates.map((entry, index) => (
                                                        <div key={index} className="text-xs mb-1 p-1 bg-gray-100 rounded">
                                                            <span className="font-semibold">📅 {entry.date_range}</span>
                                                            <br />
                                                            🕒 {entry.time_slots}
                                                        </div>
                                                    ));

                                                    function formatDateRange(dateStr) {
                                                        if (Array.isArray(dateStr)) {
                                                            const startDate = formatDate(dateStr[0].split(" - ")[0]);
                                                            const endDate = formatDate(dateStr[dateStr.length - 1].split(" - ").pop());
                                                            return startDate === endDate ? startDate : `${startDate} to ${endDate}`;
                                                        }
                                                        return formatDate(dateStr.split(" - ")[0]) + " to " + formatDate(dateStr.split(" - ")[1]);
                                                    }

                                                    function formatDate(dateStr) {
                                                        if (!dateStr) return "Invalid Date";
                                                        const date = new Date(dateStr.trim());
                                                        return isNaN(date.getTime())
                                                            ? "Invalid Date"
                                                            : date.toLocaleDateString("en-GB", {
                                                                day: "2-digit",
                                                                month: "long",
                                                                year: "numeric",
                                                            });
                                                    }

                                                    function formatTimeSlots(timeSlots) {
                                                        if (timeSlots.length === 0) return "No time slots";
                                                        if (timeSlots.length === 1) return timeSlots[0];

                                                        let groupedSlots = [];
                                                        let startSlot = timeSlots[0].split(" - ")[0];
                                                        let endSlot = timeSlots[0].split(" - ")[1];

                                                        for (let i = 1; i < timeSlots.length; i++) {
                                                            const [currentStart, currentEnd] = timeSlots[i].split(" - ");

                                                            if (currentStart === endSlot) {
                                                                endSlot = currentEnd;
                                                            } else {
                                                                groupedSlots.push(`${startSlot} - ${endSlot}`);
                                                                startSlot = currentStart;
                                                                endSlot = currentEnd;
                                                            }
                                                        }
                                                        groupedSlots.push(`${startSlot} - ${endSlot}`);

                                                        return groupedSlots.join(", ");
                                                    }
                                                })()}
                                            </p>

                                            {/* Amenities list */}
                                            <p className="text-gray-600">
                                                <strong>Amenities:</strong> {booking.amenities}
                                            </p>

                                            {/* Total amount only if not confirmed */}
                                            {booking.booking_status !== "confirm" && (
                                                <p className="text-lg font-medium text-gray-800">
                                                    <strong>Total Amount:</strong> ₹{booking.total_amount}
                                                </p>
                                            )}

                                            {/* Booking request creation date */}
                                            <p className="text-lg text-gray-800">
                                                <strong>Booking Request Date:</strong> {formatDateTime(booking.created_at)}
                                            </p>

                                            {/* Show rejected date if applicable */}
                                            {booking.booking_status === "rejected" && booking.updated_date && (
                                                <p className="text-lg text-gray-800">
                                                    <strong>Rejected Date:</strong> {formatDateTime(booking.updated_date)}
                                                </p>
                                            )}

                                            {/* Show cancelled date if applicable */}
                                            {booking.booking_status === "cancelled" && booking.updated_date && (
                                                <p className="text-lg text-gray-800">
                                                    <strong>Cancelled Date:</strong> {formatDateTime(booking.updated_date)}
                                                </p>
                                            )}

                                            {/* Refund info for cancelled + successful payment */}
                                            {booking.booking_status === "cancelled" &&
                                                booking.payment_status === "successful" &&
                                                booking.refund_amount !== null && (
                                                    <>
                                                        {/* Show discount if greater than 0 */}
                                                        {booking.approved_discount > 0 && (
                                                            <>
                                                                <p className="text-gray-700">
                                                                    <strong>Discount Applied:</strong> {booking.approved_discount}%
                                                                </p>
                                                                <p className="text-lg font-medium">
                                                                    <strong>Final Payable Amount:</strong> ₹{booking.discount_amount}
                                                                </p>
                                                            </>
                                                        )}
                                                        {/* Refund amount */}
                                                        <p className="text-gray-700">
                                                            <strong>Refund Amount:</strong> ₹{booking.refund_amount}
                                                        </p>
                                                    </>
                                                )}

                                            {/* Booking status with dynamic color */}
                                            <p
                                                className={`text-lg font-semibold ${booking.booking_status === "Pending"
                                                    ? "text-yellow-500"
                                                    : booking.booking_status === "approved"
                                                        ? "text-green-500"
                                                        : booking.booking_status === "rejected"
                                                            ? "text-red-500"
                                                            : "text-gray-500"
                                                    }`}
                                            >
                                                <strong>Booking Status:</strong> {booking.booking_status}
                                                {/* Show reason if rejected */}
                                                {booking.booking_status === "rejected" && (
                                                    <span className="ml-2 text-sm text-red-400">({booking.reject_reason})</span>
                                                )}
                                            </p>

                                            {/* Approved date */}
                                            {booking.booking_status === "approved" && booking.updated_date && (
                                                <p className="text-lg text-gray-800">
                                                    <strong>Approved Date:</strong> {formatDateTime(booking.updated_date)}
                                                </p>
                                            )}

                                            {/* Payment due info */}
                                            {booking.booking_status === "approved" && booking.payment_due && (
                                                <p className="text-lg">
                                                    <strong>Payment Due:</strong> {formatDateTime(booking.payment_due)}
                                                </p>
                                            )}

                                            {/* Discount and final amount if approved and discount exists */}
                                            {booking.booking_status === "approved" && booking.approved_discount > 0 && (
                                                <>
                                                    <p className="text-gray-700">
                                                        <strong>Discount Applied:</strong> {booking.approved_discount}%
                                                    </p>
                                                    <p className="text-lg font-medium">
                                                        <strong>Final Payable Amount:</strong> ₹{booking.discount_amount}
                                                    </p>
                                                </>
                                            )}

                                            {/* Payment status when approved */}
                                            {booking.booking_status === "approved" && (
                                                <p>
                                                    <strong>Payment Status:</strong> {booking.payment_status}
                                                </p>
                                            )}

                                            {/* if booking request approved and payment not made then show */}
                                            {booking.booking_status === "cancelled" && booking.payment_status === "Not Paid" && (
                                                <>
                                                    <p className="text-lg text-gray-800">
                                                        <strong>Payment Status:</strong> {booking.payment_status}
                                                    </p>
                                                    <p className="text-lg text-gray-800">
                                                        <strong>Event Status:</strong> {booking.event_status}
                                                    </p>
                                                </>
                                            )}

                                            {/* Info when booking is confirmed */}
                                            {booking.booking_status === "confirm" && (
                                                <div className="text-lg font-semibold">
                                                    {/* Payment Status with dynamic color */}
                                                    <p
                                                        className={`text-lg font-semibold ${booking.payment_status === "Pending"
                                                            ? "text-yellow-500"
                                                            : booking.payment_status === "successful"
                                                                ? "text-green-500"
                                                                : "text-red-500"
                                                            }`}
                                                    >
                                                        <strong>Payment Status:</strong> {booking.payment_status}
                                                    </p>

                                                    {/* Confirmed amount */}
                                                    <p className="text-lg font-medium text-gray-800">
                                                        <strong>Amount:</strong> ₹{booking.discount_amount}
                                                    </p>

                                                    {/* Payment date */}
                                                    {booking.payment_date && (
                                                        <p className="text-lg text-gray-800">
                                                            <strong>Payment Date:</strong> {formatDateTime(booking.payment_date)}
                                                        </p>
                                                    )}

                                                    {/* Event status */}
                                                    <p className="text-lg text-blue-600">
                                                        <strong>Event Status:</strong> {booking.event_status || "Pending"}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right side buttons (Cancel/Payment) - only show if payment is NOT "Not Paid" */}
                                        {!(booking.booking_status === "approved" && booking.payment_status === "Not Paid") && (
                                            <div className="flex flex-col items-end space-y-2">
                                                {/* Cancel button for eligible statuses */}
                                                {["Pending", "approved", "confirm"].includes(booking.booking_status) && (
                                                    <button
                                                        onClick={() => cancelBooking(booking.id)}
                                                        disabled={isCancelling}
                                                        className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
                                                    >
                                                        {isCancelling ? (
                                                            <span className="flex items-center gap-2">
                                                                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></span>
                                                                Cancelling Booking...
                                                            </span>
                                                        ) : (
                                                            "Cancel Booking"
                                                        )}
                                                    </button>
                                                )}

                                                {/* Make Payment button only if approved and paid status is not "Paid" */}
                                                {booking.booking_status === "approved" && booking.payment_status !== "Paid" && (
                                                    <button
                                                        onClick={() => PaymentBooking(booking.id)}
                                                        disabled={isPaying}
                                                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                                    >
                                                        {isPaying ? (
                                                            <span className="flex items-center gap-2">
                                                                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></span>
                                                                Processing Payment...
                                                            </span>
                                                        ) : (
                                                            "Make Payment"
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-600">
                                No {activeSubTab.toLowerCase()} bookings found.
                            </p>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

export default UpcomingBookings;
