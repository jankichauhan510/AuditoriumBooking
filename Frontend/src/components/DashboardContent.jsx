import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DashboardContent = () => {
  const [stats, setStats] = useState({
    totalAuditoriums: 0,
    maintenanceAuditoriums: 0,
    totalUsers: 0,
    pendingRequests: 0,
    approvedBeforePayment: 0,
    completedBookings: 0,
    rejectBookings: 0,
    cancelledBookings: 0,
    totalFeedback: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get("http://localhost:5002/api/dashboard-stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-100 justify-center items-start pt-5">
      <div className="flex flex-col w-full max-w-5xl p-5 bg-white shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dashboard Overview</h2>
        <p className="text-gray-700">Manage all auditorium bookings and requests from here.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {/* Dashboard Cards with Tooltips */}
          {[
            { label: "Total Auditoriums", value: stats.totalAuditoriums, color: "bg-indigo-600", tooltip: "Total number of auditoriums available" }, 
            // Indigo represents professionalism and stability, suitable for showing total available resources.
            
            { label: "Under Maintenance Auditoriums", value: stats.maintenanceAuditoriums, color: "bg-yellow-500", tooltip: "Auditoriums currently under maintenance" }, 
            // Yellow symbolizes caution and warning, indicating that these auditoriums are temporarily unavailable.
            
            { label: "Total Users", value: stats.totalUsers, color: "bg-blue-600", tooltip: "Total number of registered users" }, 
            // Blue signifies trust and reliability, making it a good choice for displaying total user count.
            
            { label: "Pending Requests", value: stats.pendingRequests, color: "bg-orange-500", tooltip: "Total pending booking requests" }, 
            // Orange conveys urgency and attention, highlighting pending booking requests that need action.
            
            { label: "Approved Requests", value: stats.approvedBeforePayment, color: "bg-green-400", tooltip: "Approved bookings awaiting payment" }, 
            // Light green symbolizes progress and positivity, indicating that bookings have been approved and are awaiting payment.
            
            { label: "Rejected Requests", value: stats.rejectBookings, color: "bg-red-600", tooltip: "Total rejected booking requests by Admin" }, 
            // Red is commonly associated with errors or negative actions, making it ideal for rejected booking requests.
            
            { label: "Cancelled Bookings", value: stats.cancelledBookings, color: "bg-gray-500", tooltip: "Bookings cancelled by users " }, 
            // Gray represents neutrality and inactivity, fitting for bookings that users have voluntarily canceled.
            
            { label: "Completed Bookings", value: stats.completedBookings, color: "bg-green-700", tooltip: "Bookings successfully completed after payment" }, 
            // Dark green indicates success and accomplishment, representing bookings that have been successfully completed.
            
            { label: "Feedback", value: stats.totalFeedback, color: "bg-purple-600", tooltip: "Total feedback received from users" } 
            // Purple is often linked to creativity and communication, making it a good choice for user feedback.
            
          ].map((item, index) => (
            <div
              key={index}
              className={`${item.color} text-white p-6 rounded-lg shadow-lg text-center relative group`}
            >
              <h3 className="text-lg font-semibold">{item.label}</h3>
              <p className="text-3xl mt-2">{item.value}</p>
              {/* Tooltip */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform duration-200 bg-gray-900 text-white text-xs py-2 px-4 rounded-md shadow-lg opacity-90">
                {item.tooltip}
                {/* Tooltip Arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
