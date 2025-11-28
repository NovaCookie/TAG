const ToggleSwitch = ({
  checked,
  onChange,
  className = "",
  title = "",
  disabled = false,
}) => {
  const handleChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(e.target.checked);
  };

  return (
    <label
      className={`relative inline-flex items-center cursor-pointer ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      title={title}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className="w-12 h-6 bg-light-gray peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
  );
};

export default ToggleSwitch;
