import React, { useEffect, useState } from "react";
import axios from "axios";

function ViewPaymentStatus() {
    const [paymentRequests, setPaymentRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterAuditorium, setFilterAuditorium] = useState("");
    const [filterStatus, setFilterStatus] = useState(""); // New filter for status

    useEffect(() => {
        axios.get("http://localhost:5001/admin/view-payment-status")
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
            (filterStatus === "" || request.payment_status === filterStatus)
        );
    });

    return (
        <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-6 shadow-md w-full max-w-6xl mx-auto lg:ml-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-black-700 mb-6">View Payment Status</h2>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row justify-between mb-4 space-y-4 sm:space-y-0">
                    <input
                        type="text"
                        placeholder="Search by username or auditorium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-4 py-2 border rounded-md w-full sm:w-1/3"
                    />

                    {/* Auditorium Filter */}
                    <select
                        value={filterAuditorium}
                        onChange={(e) => setFilterAuditorium(e.target.value)}
                        className="px-4 py-2 border rounded-md w-full sm:w-1/3"
                    >
                        <option value="">All Auditoriums</option>
                        {[...new Set(paymentRequests.map((request) => request.auditorium_name))].map(
                            (auditorium) => (
                                <option key={auditorium} value={auditorium}>
                                    {auditorium}
                                </option>
                            )
                        )}
                    </select>

                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border p-2">SR NO</th>
                                <th className="border p-2">User Name</th>
                                <th className="border p-2">Auditorium</th>
                                <th className="border p-2">Event</th>
                                {/* <th className="border p-2">Booking Status</th> */}
                                <th className="border p-2">Payment Status</th>
                                <th className="border p-2">Amount</th>
                                <th className="border p-2">Payment Date</th>

                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center p-4 text-gray-500">
                                        No payment requests found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((request, index) => (
                                    <tr key={index} className="text-center border-b">
                                        <td className="border p-2">{index + 1}</td>
                                        <td className="border p-2">{request.user_name}
                                            <br />
                                            <span className="text-xs text-gray-500 break-words">
                                                {request.user_email}
                                            </span>
                                        </td>
                                        <td className="border p-2">{request.auditorium_name}</td>
                                        <td className="border p-2">{request.event_name}</td>
                                        <td className="border p-2">{request.payment_status}</td>
                                        <td className="border p-2 font-semibold">₹{request.discount_amount}</td>
                                        {/* <td className="border p-2 font-semibold">{request.booking_status}</td> */}
                                        <td className="border p-2">{formatDateTime(request.payment_date)}</td>
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

export default ViewPaymentStatus;
