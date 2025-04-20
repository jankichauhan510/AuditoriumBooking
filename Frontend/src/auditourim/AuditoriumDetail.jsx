import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { motion } from "framer-motion";
import { Edit, Trash2, Check } from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import BookAuditorium from "./BookAuditorium";
import FixedLayout from "../components/FixedLayout";
import { useModal } from "../components/ModalContext";

function AuditoriumDetail() {
  const { showModal, showConfirmationModal } = useModal();
  const { id } = useParams();
  const navigate = useNavigate();
  const [auditorium, setAuditorium] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [loggedInUserID, setLoggedInUserID] = useState(null); // Store logged-in user ID
  const [editableFeedbackID, setEditableFeedbackID] = useState(null);
  const [editedFeedbackText, setEditedFeedbackText] = useState("");


  useEffect(() => {

    //fetch UserID
    const storedUserID = localStorage.getItem("user_id");
    //console.log(`Logged-in User ID: ${storedUserID}`);
    if (!storedUserID) {
      showModal("User not logged in. Please log in first!", "error");
      return;
    }
    setLoggedInUserID(storedUserID); // Store user ID in state

    //fetch auditorium Details
    fetch(`http://localhost:5002/api/auditoriums?id=${id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data) {
          data.images = Array.isArray(data.images)
            ? data.images.map((img) => `data:${img.mimetype};base64,${img.data}`)
            : [];
          data.start_time = formatTime(data.start_time);
          data.end_time = formatTime(data.end_time);
          setAuditorium(data);
        }
      })
      .catch((error) => console.error("Error fetching auditorium:", error));

    // Fetch feedback data
    fetch(`http://localhost:5001/api/feedback/${id}`)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFeedback(data);
        } else {
          setFeedback([]);
        }
      })
      .catch((error) => console.error("Error fetching feedback:", error));
  }, [id]);

  const formatTime = (timeString) => {
    return timeString ? timeString.substring(11, 16) : "Not Available";
  };

  const handleEditClick = (feedbackID, currentText) => {
    setEditableFeedbackID(feedbackID);
    setEditedFeedbackText(currentText);
  };

  const handleUpdateFeedback = async (feedbackID) => {
    try {
      const response = await fetch(`http://localhost:5001/api/feedback/update/${feedbackID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackText: editedFeedbackText }),
      });

      // 🔍 Check if response is actually JSON
      const textResponse = await response.text();
      //console.log("Server Response:", textResponse);

      // Try to parse JSON
      const data = JSON.parse(textResponse);

      if (response.ok) {
        showModal("Feedback updated successfully!", "success");
        //alert("");
        setFeedback(feedback.map((item) =>
          item.id === feedbackID ? { ...item, feedbackText: editedFeedbackText } : item
        ));
        setEditableFeedbackID(null); // Exit edit mode
      } else {
        showModal(data.message || "Failed to update feedback", "error");
        //alert(data.message || "Failed to update feedback");
      }
    } catch (error) {
      showModal(error.response?.data?.message || "Error updating feedback", "error");
    }
  };

const handleDelete = async (feedbackID) => {
  showConfirmationModal("Are you sure you want to delete this feedback?", async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/feedback/delete/${feedbackID}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        showModal("Feedback deleted successfully!", "success");
        setFeedback((prev) => prev.filter((item) => item.id !== feedbackID));
      } else {
        showModal(data.message || "Failed to delete feedback", "error");
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
      showModal("Error deleting feedback", "error");
    }
  });
};

  if (!auditorium)
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-white">
        <div className="w-10 h-10 border-4 border-t-transparent border-[#8B4513] rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="bg-gray-100">
      <FixedLayout>
        <div className="min-h-screen flex flex-col lg:flex-row items-start justify-center gap-6 lg:mb-10 relative">
          {/* Feedback Section */}
          <div className="w-full max-w-md lg:w-1/3 bg-white shadow-lg rounded-lg p-6 border border-gray-200 order-2 lg:order-1">
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">📝 User Feedback</h2>

            {feedback.length > 0 ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {feedback.map((item) => (
                  <div key={item.id} className="bg-gray-100 p-4 rounded-lg border relative">
                    <p className="font-semibold text-gray-800">{item.user_name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>

                    {editableFeedbackID === item.id ? (
                      <textarea
                        value={editedFeedbackText}
                        onChange={(e) => setEditedFeedbackText(e.target.value)}
                        className="border p-2 w-full resize-none rounded-md"
                        rows="3" // Allows better multiline editing
                      ></textarea>
                    ) : (
                      <p>{item.feedbackText}</p>
                    )}

                    {/* Show Edit/Delete buttons only if the logged-in user matches feedback's UserID */}
                    {String(loggedInUserID) === String(item.userId) && (
                      <div className="absolute top-2 right-2 flex space-x-2">

                        {/* Edit Icon (Toggles Input Field) */}
                        {editableFeedbackID === item.id ? (
                          <button
                            className="text-green-500 hover:text-green-700"
                            onClick={() => handleUpdateFeedback(item.id)}
                          >
                            <Check size={18} /> {/* Use Check icon from lucide-react */}
                          </button>
                        ) : (
                          // <button
                          //   className="text-blue-500 hover:text-blue-700"
                          //   onClick={() => handleEditClick(item.id, item.feedbackText)}
                          // >
                          //   ✏️ {/* Edit Icon */}
                          // </button>
                          <button
                            className="text-blue-500 hover:text-blue-700"
                            onClick={() => handleEditClick(item.id, item.feedbackText)}
                          >
                            <Edit size={18} /> {/* Use Edit icon from lucide-react */}
                          </button>

                        )}

                        {/* Delete Icon */}
                        {/* <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(item.id)}
                        >
                          🗑️ 
                        </button> */}
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={18} /> {/* Use Trash icon from lucide-react */}
                        </button>

                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 italic">No feedback available.</p>
            )}
          </div>


          {/* Auditorium Details */}
          <div className="w-full max-w-screen-lg lg:w-2/3 order-1 lg:order-2">
            <div className="bg-white shadow-lg rounded-lg p-6 relative border border-gray-200">
              <h1 className="text-3xl font-bold text-center flex-grow text-gray-800 tracking-wide">{auditorium.name}</h1>

              {/* Image Slider */}
              <div className="mt-6">
                {auditorium.images.length > 0 ? (
                  <Swiper modules={[Navigation, Pagination]} navigation pagination={{ clickable: true }} spaceBetween={10} slidesPerView={1} className="rounded-lg overflow-hidden">
                    {auditorium.images.map((image, index) => (
                      <SwiperSlide key={index}>
                        <img src={image} alt={`Auditorium-${index + 1}`} className="w-full object-cover rounded-lg h-[300px]" />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                ) : (
                  <img src="default-image.jpg" alt="Default Auditorium" className="w-full object-cover rounded-lg h-[300px]" />
                )}
              </div>

              {/* Details Section */}
              <div className="mt-4 space-y-4 text-gray-700 text-lg bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <p className="text-center italic text-gray-600">{auditorium.description || "No description available."}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Row - Location (spans both columns) */}
                  <p className="sm:col-span-2"><strong>📍 Location:</strong> {auditorium.location}</p>
                  {/* Second Row - Open Time & Close Time */}
                  <p><strong>⏰ Open Time:</strong> {auditorium.start_time}</p>
                  <p><strong>⏳ Close Time:</strong> {auditorium.end_time}</p>
                  {/* Third Row - Price per Hour & Capacity */}
                  <p><strong>💰 Price per Hour:</strong> ₹{auditorium.price_per_hour}</p>
                  <p><strong>👥 Capacity:</strong> {auditorium.capacity} people</p>
                  {/* Fourth Row - Amenities (spans both columns) */}
                  <p className="sm:col-span-2"><strong>🏢 Amenities:</strong></p>
                  <ul className="list-disc list-inside">
                    {auditorium.amenities?.length > 0 ? (
                      auditorium.amenities.map((amenity, index) => (
                        <li key={index}>
                          {amenity.name} - {amenity.cost === "0" ? "(Free)" : `₹${amenity.cost}`}
                        </li>
                      ))
                    ) : (
                      <li>No amenities available</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Book Button */}
              <button
                onClick={() => {
                  navigate(`/book-auditorium/${auditorium.id}`, { state: { auditorium } });
                  setShowBooking(true);
                }}
                className="mt-6 w-full bg-brown hover:bg-brown-light text-white p-3 rounded-md text-lg font-semibold shadow-lg transition-transform transform hover:scale-105"
              >
                Book Auditorium
              </button>
            </div>
          </div>

          {/* Booking Panel */}
          {showBooking && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.5 }}
              className="fixed top-0 right-0 h-full w-full md:w-[50%] lg:w-[40%] bg-white shadow-xl p-6 overflow-y-auto z-50 border-l-4 border-brown"
            >
              <button onClick={() => setShowBooking(false)} className="absolute top-4 right-4 bg-gray-300 hover:bg-gray-400 text-gray-800 p-2 rounded-md transition-transform transform hover:scale-110">❌ Close</button>
              <BookAuditorium auditorium={auditorium} setFlip={setShowBooking} />
            </motion.div>
          )}
        </div>
      </FixedLayout>
    </div>
  );
}

export default AuditoriumDetail;
