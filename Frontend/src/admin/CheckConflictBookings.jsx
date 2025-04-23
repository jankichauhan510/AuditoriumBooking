import React, { useEffect, useState } from "react";
import axios from "axios";
import { useModal } from "../components/ModalContext";

function CheckConflictBookings({ closeModal }) {
    const { showModal } = useModal();
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
            const foundConflicts = res.data.conflicts || [];
            setConflicts(foundConflicts);
        } catch (error) {
            console.error("❌ Error checking conflicts:", error);
        }
    };

    const handleMakeWaiting = async (bookingId) => {
        try {
            // Call API to update booking status to 'waiting'
            const res = await axios.post("http://localhost:5001/update-booking-conflict-status", {
                bookingId: bookingId,
                status: "waiting",
            });
            if (res.status === 200) {
                // Update local state to reflect the change
                setConflicts((prevConflicts) =>
                    prevConflicts.map((conflict) =>
                        conflict.bookingId === bookingId
                            ? { ...conflict, status: "waiting" }
                            : conflict
                    )
                );
                showModal("✅ Booking status updated to 'waiting'.", "success");
                //console.log("✅ Booking status updated to 'waiting'.");
            }
        } catch (err) {
            console.error("❌ Error updating booking status:", err);
        }
    };

    return (
        <div className="p-6 w-full max-w-2xl relative max-h-[400px] overflow-y-auto">
            {/* Close Button */}
            <button
                onClick={closeModal}
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
                    <div className="p-4 rounded-lg shadow-md">
                        <h3 className="font-semibold text-xl mb-4 text-gray-800">Conflicting Bookings</h3>
                        <ul className="space-y-6">
                            {conflicts.map((conflict) => (
                                <li
                                    key={conflict.bookingId}
                                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-300"
                                >
                                    <div className="text-red-600 font-bold text-lg mb-2">
                                        🎤 Event: {conflict.eventName}
                                    </div>
                                    {/* Group by Date */}
                                    {Object.entries(
                                        conflict.comparisons.reduce((acc, curr) => {
                                            acc[curr.date] = acc[curr.date] || [];
                                            acc[curr.date].push(curr);
                                            return acc;
                                        }, {})
                                    ).map(([date, slots], idx) => (
                                        <div key={idx} className="mb-4">
                                            <div className="text-gray-800 font-semibold mb-2 border-b border-gray-300 pb-1">
                                                📅 Date: {date}
                                            </div>
                                            <ul className="list-disc list-inside pl-4 space-y-2 text-sm text-gray-700">
                                                {slots.map((slot, i) => (
                                                    <li key={i}>
                                                        <div><strong>⏰ Requested:</strong> {slot.requestedSlot}</div>
                                                        <div><strong>✅ Approved:</strong> {slot.approvedSlot}</div>
                                                        <div><strong>🎤 Event Name:</strong> {slot.approvedBooking.approvedEventName}</div>
                                                        <div><strong>👤 Booked By:</strong> {slot.approvedBooking.bookedBy}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                    
                                    {/* Button to make the booking status "waiting" */}
                                    <button
                                        onClick={() => handleMakeWaiting(conflict.bookingId)}
                                        className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                                    >
                                        Make Waiting
                                    </button>
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
