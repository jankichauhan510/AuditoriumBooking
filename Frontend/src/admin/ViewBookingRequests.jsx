import React, { useEffect, useState } from "react";
import axios from "axios";
import BookingRow from "../admin/BookingRow";
import WaitingListRow from "../admin/WaitingListRow";
import CheckConflictBookingModal from "../admin/CheckConflictBookings";

function BookingRequests() {
  const [bookings, setBookings] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("requests");
  const [showConflictModal, setShowConflictModal] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchWaitingList();
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

  const fetchWaitingList = async () => {
    try {
      const response = await axios.get("http://localhost:5001/get-waiting-list");
      setWaitingList(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("❌ Error fetching waiting list:", error);
    }
  };

  const openConflictModal = () => setShowConflictModal(true);
  const closeConflictModal = () => setShowConflictModal(false);

  const renderTableRows = (data, type = "booking") =>
    data.length === 0 ? (
      <p className="text-center text-gray-500 mt-4">No data found.</p>
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
              {type === "booking" && <th className="border p-2">Cost</th>}
              <th className="border p-2">Request At</th>
              {type === "booking" && <th className="border p-2 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) =>
              type === "booking" ? (
                <BookingRow key={item.id} index={index} booking={item} refetch={fetchBookings} />
              ) : (
                <WaitingListRow key={item.id} index={index} entry={item} />
              )
            )}
          </tbody>
        </table>
      </div>
    );

  if (loading) return <p className="text-center mt-5">Loading bookings...</p>;

  return (
    <div className="p-6 bg-white shadow-md mt-6 mx-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Manage Booking Requests</h2>
        <button
          onClick={openConflictModal}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Check Conflict Booking
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 rounded ${
            activeTab === "requests" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Booking Requests
        </button>
        <button
          onClick={() => setActiveTab("waiting")}
          className={`px-4 py-2 rounded ${
            activeTab === "waiting" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Waiting List
        </button>
      </div>

      {/* Tables */}
      {activeTab === "requests" && renderTableRows(bookings, "booking")}
      {activeTab === "waiting" && renderTableRows(waitingList, "waiting")}

      {/* Conflict Modal */}
      {showConflictModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
            <CheckConflictBookingModal closeModal={closeConflictModal} />
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingRequests;
