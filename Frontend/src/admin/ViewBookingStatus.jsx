import React, { useEffect, useState } from "react";
import axios from "axios";


function ViewBookingStatus() {
    const [paymentRequests, setPaymentRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterAuditorium, setFilterAuditorium] = useState("");
    const [filterStatus, setFilterStatus] = useState(""); // New filter for status

    useEffect(() => {
        axios.get("http://localhost:5001/admin/view-booking-status")
            .then((response) => {
                setPaymentRequests(response.data);
            })
            .catch((error) => console.error("Error fetching payment requests:", error));
    }, []);

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

    // Filter payment requests based on searchQuery, auditorium, and status
    const filteredRequests = paymentRequests.filter((request) => {
        return (
            (searchQuery === "" ||
                request.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.auditorium_name.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (filterAuditorium === "" || request.auditorium_name === filterAuditorium) &&
            (filterStatus === "" || request.booking_status === filterStatus)
        );
    });

    return (
        <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-6 shadow-md w-full max-w-6xl mx-auto">
                {/* Heading & Search Bar */}
                <div className="pb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                        <h2 className="text-2xl sm:text-3xl font-bold text-black-700 mb-6">View Booking Status</h2>
                        <input
                            type="text"
                            placeholder="Search by username or auditorium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2 border rounded-md w-full md:w-1/3 mt-3 md:mt-0"
                        />
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                            value={filterAuditorium}
                            onChange={(e) => setFilterAuditorium(e.target.value)}
                            className="px-4 py-2 border rounded-md w-full"
                        >
                            <option value="">All Auditoriums</option>
                            {[...new Set(paymentRequests.map((request) => request.auditorium_name))].map((auditorium) => (
                                <option key={auditorium} value={auditorium}>{auditorium}</option>
                            ))}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border rounded-md w-full"
                        >
                            <option value="">All Status</option>
                            {[...new Set(paymentRequests.map((request) => request.booking_status))].map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Responsive Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm sm:text-base">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border p-2">SR NO</th>
                                <th className="border p-2">User Name</th>
                                <th className="border p-2">Auditorium</th>
                                <th className="border p-2">Date</th>
                                <th className="border p-2">Booking Status</th>
                                <th className="border p-2">Discount %</th>
                                <th className="border p-2">Reject Reason</th>
                                <th className="border p-2">Pay Amount</th>
                                <th className="border p-2">
                                    Refund Amount<br />
                                    <span className="text-[10px] text-gray-600">
                                        Canceled After Payment
                                    </span>
                                </th>

                                <th className="border p-2">Status Update</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center p-4 text-gray-500">No booking requests found.</td>
                                </tr>
                            ) : (
                                filteredRequests.map((request, index) => (
                                    <tr key={index} className="text-center border-b">
                                        <td className="border p-2">{index + 1}</td>
                                        <td className="border p-2">{request.user_name}
                                        </td>
                                        <td className="border p-2">{request.auditorium_name}</td>
                                        <td className="border p-2 text-xs sm:text-sm">

                                            {(() => {
                                                if (!request.Dates) {
                                                    return <p className="text-gray-500">No dates available</p>;
                                                }

                                                let parsedDates;
                                                try {
                                                    parsedDates = JSON.parse(request.Dates);
                                                } catch (error) {
                                                    console.error("Error parsing Dates JSON:", error);
                                                    return <p className="text-red-500">Invalid date format</p>;
                                                }

                                                if (!Array.isArray(parsedDates) || parsedDates.length === 0) {
                                                    return <p className="text-gray-500">No valid dates available</p>;
                                                }

                                                const sortedDates = parsedDates
                                                    .map((dateObj) => ({
                                                        date: dateObj.date || null,
                                                        date_range: dateObj.date_range || null,
                                                        time_slots: Array.isArray(dateObj.time_slots) ? mergeTimeSlots(dateObj.time_slots) : [],
                                                    }))
                                                    .sort((a, b) => {
                                                        const dateA = new Date(a.date || a.date_range?.split(" - ")[0]);
                                                        const dateB = new Date(b.date || b.date_range?.split(" - ")[0]);
                                                        return dateA - dateB;
                                                    });

                                                return sortedDates.map(({ date, date_range, time_slots }, index) => (
                                                    <div key={index} className="text-xs mb-1 p-1 bg-gray-100 rounded">
                                                        <span className="font-semibold">
                                                            📅 {date_range ? formatDateRange(date_range) : formatDate(date)}
                                                        </span>
                                                        <br />
                                                        🕒 {time_slots.join(", ")}
                                                    </div>
                                                ));

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

                                                function formatDateRange(dateRangeStr) {
                                                    if (!dateRangeStr) return "Invalid Date";
                                                    const [startDate, endDate] = dateRangeStr.split(" - ").map((d) => new Date(d.trim()));
                                                    if (isNaN(startDate) || isNaN(endDate)) return "Invalid Date";

                                                    return `${startDate.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })} to ${endDate.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`;
                                                }

                                                function mergeTimeSlots(timeSlots) {
                                                    if (!Array.isArray(timeSlots) || timeSlots.length === 0) return [];

                                                    // Sort time slots before merging
                                                    const sortedSlots = timeSlots
                                                        .map((slot) => {
                                                            const [start, end] = slot.split(" - ");
                                                            return { start, end };
                                                        })
                                                        .sort((a, b) => (a.start > b.start ? 1 : -1));

                                                    let mergedSlots = [];
                                                    let tempSlot = sortedSlots[0];

                                                    for (let i = 1; i < sortedSlots.length; i++) {
                                                        if (tempSlot.end === sortedSlots[i].start) {
                                                            // If the end time of the previous slot matches the start of the next, merge them
                                                            tempSlot.end = sortedSlots[i].end;
                                                        } else {
                                                            mergedSlots.push(`${tempSlot.start} - ${tempSlot.end}`);
                                                            tempSlot = sortedSlots[i];
                                                        }
                                                    }

                                                    mergedSlots.push(`${tempSlot.start} - ${tempSlot.end}`);
                                                    return mergedSlots;
                                                }
                                            })()}


                                        </td>
                                        <td className="border p-2 font-semibold">
                                            <span
                                                className={`px-2 py-1 rounded text-white 
                                                    ${request.booking_status === "approved" ? "bg-green-500" :
                                                        request.booking_status === "pending" ? "bg-yellow-500" :
                                                            request.booking_status === "rejected" ? "bg-red-500" :
                                                                request.booking_status === "cancelled" ? "bg-gray-500" :
                                                                    request.booking_status === "confirm" ? "bg-blue-600" :
                                                                        "bg-gray-500"}`}
                                            >
                                                {request.booking_status.charAt(0).toUpperCase() + request.booking_status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="border p-2">{request.approved_discount ? `${request.approved_discount}%` : "—"}</td>
                                        <td className="border p-2">{request.reject_reason || "—"}</td>
                                        <td className="border p-2">{request.discount_amount ? `₹${request.discount_amount}` : "—"}</td>
                                        <td className="border p-2">{request.refund_amount ? `₹${request.refund_amount}` : "—"}</td>
                                        <td className="border p-2">{formatDateTime(request.updated_date)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ViewBookingStatus;