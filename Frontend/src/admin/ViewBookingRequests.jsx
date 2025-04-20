import React, { useEffect, useState } from "react";
import axios from "axios";
import BookingRow from "../admin/BookingRow";
import { useModal } from "../components/ModalContext";

function BookingRequests() {
  const { showModal } = useModal();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p className="text-center mt-5">Loading bookings...</p>;

  return (
    <div className="p-6 bg-white shadow-md mt-6 mx-4">
      <h2 className="text-2xl font-bold mb-6">View Booking Requests</h2>
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
    </div>
  );
}

export default BookingRequests;
