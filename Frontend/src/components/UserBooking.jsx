import { useEffect, useState } from "react";
import axios from "axios";
import FixedLayout from "../components/FixedLayout";
import { useModal } from "../components/ModalContext";
import UpcomingBookings from './UpcomingBookings';
import BookingHistory from './BookingHistory';

function UserBooking() {
  const { showModal } = useModal();
  const [bookings, setBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("Upcoming");

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchBookings(storedUserId);
    } else {
      console.error("❌ No user ID found in localStorage.");
      setLoading(false);
    }
  }, []);

  const fetchBookings = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5001/user/bookings/${userId}`);
      setBookings(response.data);
      separateBookings(response.data);
    } catch (error) {
      console.error("❌ Error fetching bookings:", error);
      showModal("❌ Error fetching bookings. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  const separateBookings = (bookingsData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = [];
    const history = [];

    bookingsData.forEach((booking) => {
      const dates = typeof booking.Dates === "string" ? JSON.parse(booking.Dates) : booking.Dates;

      const isUpcoming = dates.some((d) => {
        const date = new Date(d.date_range?.split(" - ")[0] || d.date);
        return date >= today;
      });

      if (isUpcoming) {
        upcoming.push(booking);
      } else {
        history.push(booking);
      }
    });

    setUpcomingBookings(upcoming);
    setBookingHistory(history);
  };

  return (
    <div className="bg-gray-100">
      <FixedLayout>
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mt-6">
          Your Bookings
        </h1>

        <div className="min-h-screen flex flex-col items-center bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">

          {/* Tabs */}
          <div className="w-full max-w-4xl flex justify-center mb-6 border-b border-gray-300">
            {["Upcoming", "History"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-3 text-lg font-semibold transition-all duration-300 ${
                  activeTab === tab
                    ? "text-brown border-b-4 border-brown"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab} Events
              </button>
            ))}
          </div>

          {/* Render content based on active tab */}
          {loading ? (
            <p className="text-gray-600">Loading bookings...</p>
          ) : (
            <>
              {activeTab === "Upcoming" && (
                <UpcomingBookings upcomingBookings={upcomingBookings} />
              )}
              {activeTab === "History" && (
                <BookingHistory bookingHistory={bookingHistory} />
              )}
            </>
          )}
        </div>
      </FixedLayout>
    </div>
  );
}

export default UserBooking;
