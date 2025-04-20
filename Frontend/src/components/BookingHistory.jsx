import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

function BookingHistory({ bookingHistory }) {
  const [expandedId, setExpandedId] = useState(null);

  // Auto-expand the first booking on mount
  useEffect(() => {
    if (bookingHistory.length > 0) {
      setExpandedId(bookingHistory[0].id);
    }
  }, [bookingHistory]);

  // Format date/time
  const formatDateTime = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    const day = date.getUTCDate();
    const month = date.toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
    const year = date.getUTCFullYear();
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${day} ${month} ${year} at ${hours}:${minutes} ${ampm}`;
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-center mb-4">Booking History</h2>

      {bookingHistory.length > 0 ? (
        <ul className="space-y-4">
          {bookingHistory.map((booking) => (
            <li key={booking.id} className="p-4 bg-gray-50 rounded-lg shadow">
              {/* Header - toggle area */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(booking.id)}
              >
                <span className="text-lg font-semibold text-stone-700">
                  {booking.event_name}
                </span>
                {expandedId === booking.id ? <ChevronDown /> : <ChevronRight />}
              </div>

              {/* Details */}
              {expandedId === booking.id && (
                <div className="mt-4 space-y-2 text-sm">
                  <p><strong>Auditorium:</strong> {booking.auditorium_name}</p>
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
                  <p><strong>Amenities:</strong> {booking.amenities}</p>
                  <p><strong>Booking Status:</strong> {booking.booking_status}</p>
                  <p><strong>Payment Status:</strong> {booking.payment_status}</p>
                  <p><strong>Total Amount:</strong> ₹{booking.total_amount}</p>

                  {booking.booking_status === "confirm" && booking.approved_discount > 0 && (
                    <>
                      <p><strong>Discount Applied:</strong> {booking.approved_discount}%</p>
                      <p><strong>Final Payable Amount:</strong> ₹{booking.discount_amount}</p>
                    </>
                  )}

                  {booking.refund_amount > 0 && (
                    <p><strong>Refunded Amount:</strong> ₹{booking.refund_amount}</p>
                  )}

                  {booking.booking_status === "rejected" && booking.reject_reason && (
                    <p className="text-red-600"><strong>Rejection Reason:</strong> {booking.reject_reason}</p>
                  )}

                  {booking.payment_status === "successful" && booking.payment_date && (
                    <p className="text-green-600"><strong>Paid On:</strong> {formatDateTime(booking.payment_date)}</p>
                  )}

                  <p className="text-gray-500"><strong>Requested On:</strong> {formatDateTime(booking.created_at)}</p>
                  {booking.updated_date && (
                    <p className="text-gray-500"><strong>Last Updated:</strong> {formatDateTime(booking.updated_date)}</p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-600">No past bookings found.</p>
      )}
    </div>
  );
}

export default BookingHistory;
