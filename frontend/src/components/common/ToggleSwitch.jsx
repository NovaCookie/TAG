const ToggleSwitch = ({ checked, onChange, className = "", title = "" }) => {
  const handleChange = (e) => {
    onChange(e.target.checked);
  };
  return (
    <label
      className={`relative inline-flex items-center cursor-pointer ${className}`}
      title={title}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="sr-only peer"
      />
      <div className="w-12 h-6 bg-light-gray peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
  );
};

export default ToggleSwitch;
