import React, { useEffect, useState } from "react";
import axios from "axios";

function CheckConflictBookings({ closeModal }) {
    const [auditoriums, setAuditoriums] = useState([]);
    const [selectedAuditorium, setSelectedAuditorium] = useState("");
    const [conflicts, setConflicts] = useState([]);

    useEffect(() => {
        fetchAuditoriums();
    }, []);

    const fetchAuditoriums = async () => {
        try {
            const res = await axios.get("http://localhost:5001/auditoriums");
            setAuditoriums(res.data);
        } catch (err) {
            console.error("❌ Error fetching auditoriums:", err);
        }
    };

    const handleCheckConflicts = async () => {
        if (!selectedAuditorium) return;
        try {
            const res = await axios.get(
                `http://localhost:5001/check-only-conflicts/${selectedAuditorium}`
            );
            setConflicts(res.data.conflicts || []);
        } catch (error) {
            console.error("❌ Error checking conflicts:", error);
        }
    };

    return (
        <div className="p-6 w-full max-w-2xl relative max-h-[400px] overflow-y-auto">
            {/* Close Button */}
            <button
                onClick={closeModal} // Close the modal when clicked
                className="absolute top-2 right-2 text-2xl text-red-600"
            >
                &times;
            </button>

            <h2 className="text-xl font-semibold mb-4">Check Conflict Bookings</h2>

            <label className="block mb-2 text-sm font-medium">Select Auditorium:</label>
            <select
                className="border p-2 mb-4 w-full"
                value={selectedAuditorium}
                onChange={(e) => setSelectedAuditorium(e.target.value)}
            >
                <option value="">-- Select --</option>
                {auditoriums.map((a) => (
                    <option key={a.id} value={a.id}>
                        {a.name}
                    </option>
                ))}
            </select>

            <button
                onClick={handleCheckConflicts}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Check Conflict
            </button>

            <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-md">
                {conflicts.length > 0 ? (
                    <div>
                        <h3 className="font-semibold text-xl mb-4 text-gray-800">Conflicting Bookings</h3>
                        <ul className="space-y-4">
                            {conflicts.map((conflict) => (
                                <li
                                    key={conflict.bookingId}
                                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-300"
                                    style={{ color: "red" }}
                                >
                                    <div className="font-bold text-lg text-red-600 mb-2">{conflict.eventName}</div>

                                    {/* Loop through the conflicts and display the requested time slots */}
                                    {conflict.comparisons.length > 0 ? (
                                        <div>
                                            <div className="text-sm">
                                                <strong className="text-gray-700">Conflicting with:</strong>
                                                <ul className="list-disc list-inside pl-5">
                                                    {conflict.comparisons.map((comparison, index) => (
                                                        <li key={index} className="mb-3">
                                                            <div>
                                                                <strong className="text-gray-600">Requested Slot:</strong> {comparison.requestedSlot}
                                                            </div>
                                                            <div>
                                                                <strong className="text-gray-600">Approved Slot:</strong> {comparison.approvedSlot}
                                                            </div>
                                                            <div>
                                                                <strong className="text-gray-600">Booking Details:</strong>
                                                                <div className="pl-4">
                                                                    <strong className="text-gray-500">Booked by:</strong> {comparison.approvedBooking.approvedUserName}
                                                                    <br />
                                                                    <strong className="text-gray-500">Date:</strong> {comparison.approvedBooking.date}
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-600">No conflict with approved bookings.</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="mt-4 text-green-600 font-medium">✅ No conflicts found.</p>
                )}
            </div>

        </div>
    );
}

export default CheckConflictBookings;
