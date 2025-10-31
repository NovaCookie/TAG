import { useState, useRef, useEffect } from "react";

const SelectField = ({
  value,
  onChange,
  options = [],
  placeholder = "Sélectionnez...",
  error = "",
  className = "",
  label = "",
  required = false,
  fieldName  = "",
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

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (selectedValue) => {
    const syntheticEvent = {
      target: {
        name: fieldName  || "select-field",
        value: selectedValue,
      },
    };
    onChange(syntheticEvent);
    setIsOpen(false);
  };

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label optionnel */}
      {label && (
        <label className="block text-sm font-medium text-secondary mb-2">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}

      {/* Bouton du dropdown */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`w-full px-4 py-3 border rounded-lg bg-white flex justify-between items-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary/10 ${
          error ? "border-danger" : "border-light-gray hover:border-primary"
        }`}
      >
        <span className={selectedOption ? "text-secondary" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`fill-current h-4 w-4 text-gray-700 transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </button>

      {/* Message d'erreur */}
      {error && <p className="text-danger text-sm mt-1">{error}</p>}

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-light-gray rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {options.length > 0 ? (
              options.map((option) => {
                const isSelected = value === option.value;
                return (
                  <div
                    key={option.value}
                    tabIndex={0}
                    role="button"
                    onClick={() => handleSelect(option.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSelect(option.value)
                    }
                    className={`group px-4 py-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors duration-150
                      ${
                        isSelected
                          ? "bg-primary text-white"
                          : "bg-white hover:bg-primary/70 hover:text-white focus:bg-primary/70 focus:text-white"
                      }`}
                  >
                    <span
                      className={`truncate font-medium ${
                        isSelected
                          ? "text-white"
                          : "text-black group-hover:text-white"
                      }`}
                    >
                      {option.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-3 text-center text-gray-500">
                Aucune option disponible
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectField;
