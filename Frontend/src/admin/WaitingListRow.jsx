import React from "react";
import BookingDateDisplay from "../admin/BookingDateDisplay";

const WaitingListRow = ({ index, entry }) => {

    const formatDateTime = (isoString) => {
        if (!isoString) return "N/A"; // Handle empty values
    
        const date = new Date(isoString);
    
        // Extract UTC parts manually
        const day = date.getUTCDate();
        const month = date.toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
        const year = date.getUTCFullYear();
    
        let hours = date.getUTCHours();
        const minutes = date.getUTCMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12; // Convert 24-hour to 12-hour format
    
        return `${day} ${month} ${year} at ${hours}:${minutes} ${ampm}`;
      };

  return (
    <tr>
        <td className="border p-2">{index + 1}</td>
      <td className="border p-2">{entry.user_name}</td>
      <td className="border p-2">{entry.auditorium_name}</td>
      <td className="border p-2"><BookingDateDisplay dates={entry.dates} /></td>
      <td className="border p-2">{entry.event_name}</td>
      <td className="border p-2">{formatDateTime(entry.created_at)}</td> 
    </tr>
  );
};

export default WaitingListRow;
