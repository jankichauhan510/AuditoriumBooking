import React, { useState } from "react";
import { useModal } from "../components/ModalContext";
import axios from "axios";
import BookingDateDisplay from "../admin/BookingDateDisplay";

function BookingRow({ index, booking, refetch }) {
  const { showModal } = useModal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState("");
  const [discount, setDiscount] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const openModal = () => {
    setActionType("");
    setDiscount("");
    setRejectReason("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleAction = async () => {
    if (actionType === "approve" && !discount) {
      showModal("Enter discount percentage!", "error");
      return;
    }
    if (actionType === "reject" && !rejectReason) {
      showModal("Enter rejection reason!", "error");
      return;
    }

    setIsProcessing(true);

    try {
      if (actionType === "approve") {
        const res = await axios.get(`http://localhost:5001/booked-slots/${booking.auditorium_id}`);
        const bookedSlots = res.data;
        const requestedSlots = booking.dates;

        for (let entry of requestedSlots) {
          const { date, time_slots } = entry;
          if (bookedSlots[date]?.some(slot => time_slots.includes(slot))) {
            showModal("Slot already booked!", "error");
            setIsProcessing(false);
            return;
          }
        }
      }

      await axios.post("http://localhost:5001/update-booking-status", {
        booking_id: booking.id,
        action: actionType,
        approved_discount: actionType === "approve" ? parseFloat(discount) : null,
        reject_reason: actionType === "reject" ? rejectReason : null,
        user_email: booking.user_email,
        event_name: booking.event_name,
        discount_amount: booking.discount_amount,
        dates: JSON.stringify(booking.dates),
      });

      showModal(`Booking ${actionType}d successfully!`, "success");
      closeModal();
      refetch();
    } catch (err) {
      showModal("Error updating booking", "error");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="border p-2 text-center">{index + 1}</td>
        <td className="border p-2">
          {booking.user_name}
          <br />
          <span className="text-xs text-gray-500">{booking.user_email}</span>
        </td>
        <td className="border p-2">{booking.auditorium_name}</td>
        <td className="border p-2">
          <BookingDateDisplay dates={booking.dates} />
        </td>
        <td className="border p-2">{booking.event_name}</td>
        <td className="border p-2">₹{booking.total_amount}</td>
        <td className="border p-2">{formatDateTime(booking.created_at)}</td>
        <td className="border p-2 text-center">
          {booking.booking_status === "Pending" && (
            <button
              onClick={openModal}
              className="bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600"
            >
              Manage
            </button>
          )}
        </td>
      </tr>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-lg font-semibold mb-2">Manage Booking</h2>
            <p><strong>User:</strong> {booking.user_name} ({booking.user_email})</p>
            <p><strong>Auditorium:</strong> {booking.auditorium_name}</p>
            <p><strong>Event:</strong> {booking.event_name}</p>
            <p><strong>Dates:</strong> <BookingDateDisplay dates={booking.dates} /></p>
            <p><strong>Cost:</strong> ₹{booking.total_amount}</p>

            {!actionType && (
              <div className="flex justify-center gap-3 mt-4">
                <button onClick={() => setActionType("approve")} className="bg-green-500 text-white px-4 py-1 rounded">Approve</button>
                <button onClick={() => setActionType("reject")} className="bg-red-500 text-white px-4 py-1 rounded">Reject</button>
              </div>
            )}

            {actionType === "approve" && (
              <div className="mt-3">
                <label>Discount (%)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full border p-2 rounded mt-1"
                />
              </div>
            )}

            {actionType === "reject" && (
              <div className="mt-3">
                <label>Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border p-2 rounded mt-1"
                />
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeModal} className="bg-gray-500 text-white px-4 py-1 rounded">Cancel</button>
              {actionType && (
                <button
                  onClick={handleAction}
                  disabled={isProcessing}
                  className={`${actionType === "approve" ? "bg-green-600" : "bg-red-600"} text-white px-4 py-1 rounded`}
                >
                  {isProcessing ? "Processing..." : `${actionType === "approve" ? "Approve" : "Reject"} Booking`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BookingRow;
