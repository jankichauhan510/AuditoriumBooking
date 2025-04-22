import React, { useEffect, useState } from "react";
import axios from "axios";
import BookingRow from "../admin/BookingRow";
import CheckConflictBookingModal from "../admin/CheckConflictBookings";

function BookingRequests() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConflictModal, setShowConflictModal] = useState(false); // State to control the modal visibility

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get("http://localhost:5001/get-all-bookings");
      setBookings(response.data);
    } catch (error) {
      console.error("❌ Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const openConflictModal = () => {
    setShowConflictModal(true); // Show the conflict modal
  };

  const closeConflictModal = () => {
    setShowConflictModal(false); // Close the conflict modal
  };

  if (loading) return <p className="text-center mt-5">Loading bookings...</p>;

  return (
    <div className="p-6 bg-white shadow-md mt-6 mx-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">View Booking Requests</h2>
        <button
          onClick={openConflictModal}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Check Conflict Booking
        </button>
      </div>

      {bookings.length === 0 ? (
        <p className="text-center text-gray-500">No bookings found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border p-2">SR NO</th>
                <th className="border p-2">User</th>
                <th className="border p-2">Auditorium</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Event Name</th>
                <th className="border p-2">Cost</th>
                <th className="border p-2">Request At</th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking, index) => (
                <BookingRow
                  key={booking.id}
                  index={index}
                  booking={booking}
                  refetch={fetchBookings}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Conditionally render the conflict booking modal */}
      {showConflictModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
            <button
              onClick={closeConflictModal}
              className="absolute top-0 right-0 p-2 text-red-500"
            >
              X
            </button>
            <CheckConflictBookingModal />
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingRequests;
