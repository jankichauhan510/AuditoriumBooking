import React from "react";

function BookingDateDisplay({ dates }) {
  if (!Array.isArray(dates) || dates.length === 0) {
    return <span className="text-gray-500">No dates available</span>;
  }

  const sortedDates = dates
    .map((d) => ({
      date: d.date || null,
      date_range: d.date_range || null,
      time_slots: Array.isArray(d.time_slots) ? d.time_slots.sort() : [],
    }))
    .sort((a, b) =>
      new Date(a.date || a.date_range.split(" - ")[0]) -
      new Date(b.date || b.date_range.split(" - ")[0])
    );

  const formattedDates = [];
  let tempStart = sortedDates[0].date || sortedDates[0].date_range;
  let prevTimeSlots = sortedDates[0].time_slots;
  let currentRange = [tempStart];

  for (let i = 1; i < sortedDates.length; i++) {
    const { date, date_range, time_slots } = sortedDates[i];
    const currentDate = date || date_range;

    if (JSON.stringify(prevTimeSlots) === JSON.stringify(time_slots)) {
      currentRange.push(currentDate);
    } else {
      formattedDates.push({
        date_range: formatDateRange(currentRange),
        time_slots: formatTimeSlots(prevTimeSlots),
      });
      currentRange = [currentDate];
      prevTimeSlots = time_slots;
    }
  }

  formattedDates.push({
    date_range: formatDateRange(currentRange),
    time_slots: formatTimeSlots(prevTimeSlots),
  });

  function formatDate(dateStr) {
    if (!dateStr) return "Invalid Date";
    const date = new Date(dateStr.trim());
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
  }

  function formatDateRange(dateStrArr) {
    const start = formatDate(dateStrArr[0].split(" - ")[0]);
    const end = formatDate(dateStrArr[dateStrArr.length - 1].split(" - ").pop());
    return start === end ? start : `${start} to ${end}`;
  }

  function formatTimeSlots(slots) {
    if (slots.length === 0) return "No time slots";
    let grouped = [];
    let start = slots[0].split(" - ")[0];
    let end = slots[0].split(" - ")[1];

    for (let i = 1; i < slots.length; i++) {
      const [s, e] = slots[i].split(" - ");
      if (s === end) {
        end = e;
      } else {
        grouped.push(`${start} - ${end}`);
        start = s;
        end = e;
      }
    }

    grouped.push(`${start} - ${end}`);
    return grouped.join(", ");
  }

  return (
    <>
      {formattedDates.map((entry, index) => (
        <div key={index} className="text-xs p-1 bg-gray-100 rounded mb-1">
          📅 <strong>{entry.date_range}</strong>
          <br />
          🕒 {entry.time_slots}
        </div>
      ))}
    </>
  );
}

export default BookingDateDisplay;
