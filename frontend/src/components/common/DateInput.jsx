import { useState, useRef, useEffect } from "react";
import { CalendarDays } from "lucide-react";

const DateInput = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || "");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    onChange(date);
    setOpen(false);
  };

  const generateCalendarDays = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // jours vides avant le premier jour
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    return days;
  };

  const today = new Date();
  const displayMonth = selectedDate ? new Date(selectedDate) : today;
  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  const days = generateCalendarDays(year, month);

  const formatDate = (y, m, d) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${dd}/${mm}/${y}`;
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-secondary mb-2">
          {label}
        </label>
      )}
      <div
        className="relative w-full cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <input
          type="text"
          value={selectedDate ? selectedDate : ""}
          readOnly
          placeholder="jj/mm/aaaa"
          className="w-full px-4 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light text-secondary bg-white pr-10 dark:bg-dark-card dark:text-dark-primary"
        />
        <CalendarDays
          className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary dark:text-dark-tertiary pointer-events-none"
          size={18}
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-72 bg-white dark:bg-dark-card border border-light dark:border-dark-card-light rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-secondary dark:text-dark-secondary">
              {monthNames[month]} {year}
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm text-secondary dark:text-dark-tertiary mb-2">
            {["D", "L", "M", "M", "J", "V", "S"].map((d) => (
              <div key={d} className="font-medium">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) =>
              day ? (
                <button
                  key={idx}
                  onClick={() => handleDateSelect(formatDate(year, month, day))}
                  className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-light hover:text-white
                    ${
                      selectedDate === formatDate(year, month, day)
                        ? "bg-primary text-white"
                        : "text-secondary dark:text-dark-secondary"
                    }`}
                >
                  {day}
                </button>
              ) : (
                <div key={idx}></div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateInput;
