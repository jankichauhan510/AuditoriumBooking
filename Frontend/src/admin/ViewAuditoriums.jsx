import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEdit, FaTrashAlt, FaUndo } from "react-icons/fa";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { useModal } from "../components/ModalContext";

function ViewAuditoriums() {
  const [auditoriums, setAuditoriums] = useState([]);
  const [maintenanceAuditoriums, setMaintenanceAuditoriums] = useState([]);
  const [selectedAuditorium, setSelectedAuditorium] = useState(null);
  const navigate = useNavigate();
  const { showModal, showConfirmationModal } = useModal();

  useEffect(() => {
    fetch("http://localhost:5002/api/auditoriums")
      .then((response) => response.json())
      .then((data) => setAuditoriums(data))
      .catch((error) => console.error("Error fetching auditoriums:", error));
  }, []);

  const formatTime = (isoString) => {
    return isoString.split("T")[1].slice(0, 5);
  };

  const handleViewDetails = (auditorium) => {
    setSelectedAuditorium(auditorium);
  };

  const handleToggleMaintenance = (id, isUnderMaintenance) => {
    const confirmationMessage = isUnderMaintenance
      ? "Are you sure you want to restore this auditorium?"
      : "Are you sure you want to move this auditorium to maintenance?";

    showConfirmationModal(confirmationMessage, () => {
      fetch(`http://localhost:5002/api/auditoriums/${id}/toggle-maintenance`, {
        method: "POST",
      })
        .then((response) => response.json())
        .then((data) => {
          showModal(data.message || "Operation successful", "success");

          setAuditoriums((prev) => {
            if (isUnderMaintenance) {
              const restoredAuditorium = maintenanceAuditoriums.find(a => a.id === id);
              return [...prev, restoredAuditorium];
            } else {
              return prev.filter((auditorium) => auditorium.id !== id);
            }
          });

          setMaintenanceAuditoriums((prev) => {
            if (isUnderMaintenance) {
              return prev.filter((auditorium) => auditorium.id !== id);
            } else {
              const movedAuditorium = auditoriums.find(a => a.id === id);
              return [...prev, movedAuditorium];
            }
          });
        })
        .catch((error) => {
          console.error("Error toggling maintenance:", error);
          showModal("Failed to update maintenance status.", "error");
        });
    });
  };

  const handleEdit = (id) => {
    navigate(`/DashBoard/create-auditorium/${id}`);
  };

  return (
    <div className="h-screen flex flex-col bg-white text-black mt-5 ml-10">
      <h1 className="text-3xl font-bold mb-6 text-center md:text-left px-6 pt-6">Admin - View Auditoriums</h1>
      <div className="flex-1 overflow-auto px-6">
        <div className="w-full overflow-x-auto bg-gray-100 shadow-lg rounded-lg p-4">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-gray-300 p-3 text-left whitespace-nowrap">Name</th>
                <th className="border border-gray-300 p-3 text-left whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {auditoriums.map((auditorium) => (
                <tr key={auditorium.id} className="border border-gray-300 hover:bg-gray-100 transition-all">
                  <td className="p-3 text-sm md:text-base font-medium">{auditorium.name}</td>
                  <td className="p-3 flex space-x-4 text-lg">
                    <FaEye className="text-blue-600 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleViewDetails(auditorium)} />
                    <FaEdit className="text-yellow-600 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleEdit(auditorium.id)} />
                    <FaTrashAlt className="text-red-600 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleToggleMaintenance(auditorium.id, false)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedAuditorium && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-2">
            <div className="bg-white text-black p-4 rounded-md shadow-lg w-full max-w-md relative">
              {/* Close Button */}
              <button
                onClick={() => setSelectedAuditorium(null)}
                className="absolute top-0 right-0 text-gray-600 hover:text-gray-900 text-lg"
              >
                ✖
              </button>

              {/* Image Swiper */}
              <Swiper
                modules={[Navigation, Pagination, EffectFade]}
                navigation
                pagination={{ clickable: true }}
                effect="fade"
                loop={true}
                className="rounded-md overflow-hidden"
              >
                {selectedAuditorium.images.map((image, index) => (
                  <SwiperSlide key={index}>
                    <img
                      src={`data:${image.mimetype};base64,${image.data}`}
                      alt={`Slide ${index + 1}`}
                      className="w-full h-40 object-cover rounded-md"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Auditorium Details */}
              <h2 className="text-lg font-bold mt-3">{selectedAuditorium.name}</h2>
              <p className="text-sm mt-1">{selectedAuditorium.description}</p>
              <p className="mt-1"><strong>📍 Location:</strong> {selectedAuditorium.location}</p>
              <div className="text-sm mt-1 grid grid-cols-2 gap-x-8 gap-y-1">
                <p><strong>👥 Capacity:</strong> {selectedAuditorium.capacity} People</p>
                <p><strong>💰 Price per Hour:</strong> ₹{selectedAuditorium.price_per_hour}</p>
                <p><strong>⏰ Open Time:</strong> {formatTime(selectedAuditorium.start_time)}</p>
                <p><strong>⏳ Close Time:</strong> {formatTime(selectedAuditorium.end_time)}</p>
              </div>

              {/* Amenities Section */}
              <p className="text-sm font-semibold mt-2">🎗 Amenities:</p>
              <ul className="list-disc list-inside text-xs text-gray-700">
                {selectedAuditorium.amenities.map((item, index) => (
                  <li key={index}>{item.name} - ₹{item.cost}</li>
                ))}
              </ul>
            </div>
          </div>


        )}

        <h2 className="text-xl font-semibold mt-8 text-center md:text-left">Under Maintenance</h2>
        <div className="overflow-x-auto bg-gray-100 shadow-lg rounded-lg p-4">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-gray-300 p-3 text-left">Name</th>
                <th className="border border-gray-300 p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceAuditoriums.map((auditorium) => (
                <tr key={auditorium.id} className="border border-gray-300 hover:bg-gray-100 transition-all">
                  <td className="p-3 text-sm md:text-base font-medium">{auditorium.name}</td>
                  <td className="p-3">
                    <FaUndo className="text-green-600 cursor-pointer hover:scale-110 transition-transform" onClick={() => handleToggleMaintenance(auditorium.id, true)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

}

export default ViewAuditoriums;