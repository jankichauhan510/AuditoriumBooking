import React, { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/feedback")
      .then((res) => res.json())
      .then((data) => {
        setFeedbacks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching feedback:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="lg:mt-20 py-16 px-8 flex bg-gradient-to-b from-gray-100 to-white justify-center">
      <div className="w-full max-w-6xl">
        <h2 className="text-4xl font-extrabold text-center text-brown mb-12 tracking-wide">
          What Our Users Say
        </h2>

        {/* Show Loading Indicator */}
        {loading ? (
          <p className="text-center text-gray-500">Loading feedback...</p>
        ) : feedbacks.length === 0 ? (
          <p className="text-center text-gray-500">No feedback available.</p>
        ) : (
          <>
            {/* Custom Navigation Buttons */}
            <div className="flex justify-between items-center mb-4">
              {/* Left Navigation Button */}
              <button
                className="prev-btn absolute lg:left-[20px] lg:top-top-1/2 -translate-y-1/2 bg-brown text-white px-4 py-2 rounded-md shadow-md hover:bg-brown-light transition"
                onClick={() => swiperRef.current?.slidePrev()}
              >
                &#10094;
              </button>

              <Swiper
                spaceBetween={30}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
                loop={true}
                autoplay={{ delay: 4000 }}
                pagination={{ el: ".custom-pagination", clickable: true }}
                navigation={{
                  prevEl: ".prev-btn",
                  nextEl: ".next-btn",
                }}
                onSwiper={(swiper) => (swiperRef.current = swiper)}
                modules={[Pagination, Autoplay, Navigation]}
                className="pb-8"
              >
                {feedbacks.map((feedback, index) => (
                  <SwiperSlide key={index}>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between h-[250px]">
                      {/* Top section - Name, Auditorium Name, Profile Pic */}
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{feedback.username}</h3>
                          <p className="text-sm text-gray-600">{feedback.auditoriumName}</p>
                        </div>
                        <img
                          src={feedback.profilePic || "/default-user.png"}
                          alt={feedback.username}
                          className="w-12 h-12 rounded-full border-2 border-brown-light object-cover"
                        />
                      </div>

                      {/* Feedback Text */}
                      <p className="text-gray-700 mt-2 text-center italic leading-relaxed">
                        {feedback.feedbackText}
                      </p>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              <button
                className="next-btn absolute lg:right-[20px] lg:top-top-1/2 transform -translate-y-1/2 bg-brown text-white px-4 py-2 rounded-md shadow-md hover:bg-brown-light transition"
                onClick={() => swiperRef.current?.slideNext()}
              >
                &#10095;
              </button>
            </div>
            <div className="custom-pagination flex justify-center gap-2"></div>
          </>
        )}
      </div>

      {/* Add Custom Styles */}
      <style>
        {`
          /* Brown Pagination Dots */
          .custom-pagination .swiper-pagination-bullet {
            background-color: #8B4513 !important; /* Brown */
            opacity: 0.5;
            width: 10px;
            height: 10px;
            transition: all 0.3s ease;
          }

          /* Active Dot - Darker Brown */
          .custom-pagination .swiper-pagination-bullet-active {
            background-color: #A0522D !important; /* Darker Brown */
            opacity: 1;
            width: 12px;
            height: 12px;
          }
        `}
      </style>
    </div>
  );
};

export default Feedback;
