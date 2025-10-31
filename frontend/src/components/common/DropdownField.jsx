import { useState, useRef, useEffect } from "react";

const DropdownField = ({
  id,
  name,
  label,
  value,
  onChange,
  children,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-secondary mb-2"
      >
        {label}
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg cursor-pointer flex justify-between items-center bg-white
          ${
            error ? "border-danger" : "border-light"
          } focus:outline-none focus:ring-2 focus:ring-primary-light`}
      >
        {children}
      </div>
      {isOpen && <div className="absolute z-10 w-full mt-1">{children}</div>}
      {error && <p className="text-danger text-sm mt-1">{error}</p>}
      <input type="hidden" name={name} value={value} />
    </div>
  );
};

export default DropdownField;
