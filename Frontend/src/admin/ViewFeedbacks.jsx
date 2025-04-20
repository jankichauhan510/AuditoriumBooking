import React, { useEffect, useState } from "react";
import axios from "axios";
import { useModal } from "../components/ModalContext";

function ViewFeedbacks() {
    const [Feedback, setFeedback] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterAuditorium, setFilterAuditorium] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const { showModal, showConfirmationModal } = useModal();

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            const response = await axios.get("http://localhost:5001/admin/view-feedback");
            setFeedback(response.data || []);
        } catch (error) {
            console.error("Error fetching feedbacks:", error);
            setFeedback([]);
        }
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return "N/A"; 
        const date = new Date(isoString);
        const day = date.getUTCDate();
        const month = date.toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
        const year = date.getUTCFullYear();
        let hours = date.getUTCHours();
        const minutes = date.getUTCMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12; 
        return `${day} ${month} ${year} at ${hours}:${minutes} ${ampm}`;
    };

    const filteredRequests = (Feedback || []).filter((request) => {
        return (
            (searchQuery === "" ||
                request.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.auditorium_name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (filterAuditorium === "" || request.auditorium_name === filterAuditorium) &&
            (filterStatus === "" || request.is_visible.toString() === filterStatus)
        );
    });

    const handleToggleStatus = async (feedbackId, currentStatus) => {
        const newStatus = Number(currentStatus) === 1 ? 0 : 1;
        showConfirmationModal(
            `Are you sure you want to ${newStatus === 1 ? "hide" : "show"} this feedback on the homepage??`,
            async () => {
                try {
                    await axios.put(`http://localhost:5001/api/feedback/${feedbackId}/status`, { is_visible: newStatus });
                    fetchFeedbacks();
                    showModal("Feedback status updated successfully", "success");
                } catch (error) {
                    console.error("Error updating feedback visibility:", error);
                    showModal("Failed to update feedback status", "error");
                }
            }
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-6 shadow-md w-full max-w-6xl mx-auto lg:ml-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-black-700 mb-6">View Feedback</h2>

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
                        {[...new Set(Feedback.map((request) => request.auditorium_name))].map(
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
                                <th className="border p-2">User</th>
                                <th className="border p-2">Auditorium</th>
                                <th className="border p-2">Feedback</th>
                                <th className="border p-2">Feedback Date</th>
                                <th className="border p-2">Status</th>
                                <th className="border p-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center p-4 text-gray-500">
                                        No feedbacks found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((request, index) => (
                                    <tr key={index} className="text-center border-b">
                                        <td className="border p-2">{index + 1}</td>
                                        <td className="border p-2">
                                            {request.user_name}
                                            <br />
                                            <span className="text-xs text-gray-500 break-words">
                                                {request.user_email}
                                            </span>
                                        </td>
                                        <td className="border p-2">{request.auditorium_name}</td>
                                        <td className="border p-2">{request.feedbackText}</td>
                                        <td className="border p-2">{formatDateTime(request.createdAt)}</td>
                                        <td className={`border p-2 font-semibold ${request.is_visible ? "text-red-600" : "text-green-600"}`}>
                                            {request.is_visible ? "Unshow" : "Show"}
                                        </td>

                                        <td className="border p-2 font-semibold">
                                            <button
                                                onClick={() => handleToggleStatus(request.id, request.is_visible)}
                                                className={`px-3 py-1 rounded-md transition text-xs sm:text-sm ${
                                                    request.is_visible
                                                        ? "bg-green-600 text-white hover:bg-green-500"
                                                        : "bg-red-600 text-white hover:bg-red-500"
                                                }`}
                                            >
                                                {request.is_visible ? "Show" : "Unshow"}
                                            </button>
                                        </td>
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

export default ViewFeedbacks;
