import React, { useEffect, useState } from "react";
import axios from "axios";

function CheckConflictBookings() {
  const [auditoriums, setAuditoriums] = useState([]);
  const [selectedAuditorium, setSelectedAuditorium] = useState("");
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    fetchAuditoriums();
  }, []);

  const fetchAuditoriums = async () => {
    try {
      const res = await axios.get("http://localhost:5001/auditoriums");
      setAuditoriums(res.data);
    } catch (err) {
      console.error("❌ Error fetching auditoriums:", err);
    }
  };

  const handleCheckConflicts = async () => {
    if (!selectedAuditorium) return;
    try {
      const res = await axios.get(
        `http://localhost:5001/check-only-conflicts/${selectedAuditorium}`
      );
      setConflicts(res.data.conflicts || []);
    } catch (error) {
      console.error("❌ Error checking conflicts:", error);
    }
  };

  return (
    <div className="p-6 w-full max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Check Conflict Bookings</h2>

      <label className="block mb-2 text-sm font-medium">Select Auditorium:</label>
      <select
        className="border p-2 mb-4 w-full"
        value={selectedAuditorium}
        onChange={(e) => setSelectedAuditorium(e.target.value)}
      >
        <option value="">-- Select --</option>
        {auditoriums.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      <button
        onClick={handleCheckConflicts}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Check Conflict
      </button>

      {conflicts.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-2">Conflicting Bookings:</h3>
          <ul className="list-disc list-inside text-sm">
            {conflicts.map((conflict) => (
              <li
                key={conflict.id}
                className="border-b pb-3 mb-3"
                style={{ color: "red" }} // Adding red color for emphasis
              >
                <div className="font-bold text-lg">{conflict.event_name}</div>
                <div>
                  <strong>Date:</strong>{" "}
                  {conflict.dates
                    .map(
                      (d) => `${d.date} (${d.time_slots.join(", ")})`
                    )
                    .join(", ")}
                </div>
                <div>
                  <strong>Booked by:</strong> {conflict.user_name} (
                  {conflict.user_email})
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {conflicts.length === 0 && selectedAuditorium && (
        <p className="mt-4 text-green-600 font-medium">✅ No conflicts found.</p>
      )}
    </div>
  );
}

export default CheckConflictBookings;
