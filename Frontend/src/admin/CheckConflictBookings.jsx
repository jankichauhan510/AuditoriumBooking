import React, { useState } from "react";
import axios from "axios";
import BookingDateDisplay from "../admin/BookingDateDisplay";
import { useModal } from "../components/ModalContext";

function CheckConflictBookings({ booking, refetch }) {
    const [conflicts, setConflicts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showModal } = useModal();

    const checkConflicts = async () => {
        try {
            // Ensure 'booking' is being passed correctly
            if (!booking) {
                showModal("No booking data available", "error");
                return;
            }

            const auditoriumId = booking.auditorium_id;

            // Call the '/check-only-conflicts/:auditoriumId' route on your backend
            const res = await axios.get(`http://localhost:5001/check-only-conflicts/${auditoriumId}`);

            const { totalConflicts, conflicts } = res.data;

            if (totalConflicts > 0) {
                const conflictIds = conflicts.map(conflict => conflict.id);
                showModal(`Conflicts detected for booking(s): ${conflictIds.join(', ')}`, "error");
                setIsProcessing(false);
                return;
            }

            showModal("No conflicts detected! Proceeding with booking.", "success");
        }
        catch (error) {
            console.error(error);
            showModal("Error checking conflicts", "error");
        }
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <button
                    onClick={checkConflicts}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                    Check Conflict Bookings
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full overflow-y-auto max-h-[90vh]">
                        <h2 className="text-lg font-bold mb-4">Conflict Bookings</h2>
                        <table className="w-full table-auto border">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-2 border">User</th>
                                    <th className="p-2 border">Auditorium</th>
                                    <th className="p-2 border">Event</th>
                                    <th className="p-2 border">Dates</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conflicts.map((booking, idx) => (
                                    <tr key={idx} className="text-center">
                                        <td className="border p-2">
                                            {booking.user_name}
                                            <br />
                                            <span className="text-xs text-gray-500">{booking.user_email}</span>
                                        </td>
                                        <td className="border p-2">{booking.auditorium_name}</td>
                                        <td className="border p-2">{booking.event_name}</td>
                                        <td className="border p-2">
                                            <BookingDateDisplay dates={booking.dates} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-4 text-right">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-gray-600 text-white px-4 py-1 rounded hover:bg-gray-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CheckConflictBookings;
