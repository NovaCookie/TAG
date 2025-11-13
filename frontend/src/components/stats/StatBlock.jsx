const StatBlock = ({
  title,
  value,
  icon,
  color = "primary",
  loading = false,
  className = "",
  onClick,
  size = "medium",
}) => {
  const colorConfig = {
    primary: {
      bg: "bg-white",
      border: "border border-light-gray",
      text: "text-primary",
      iconBg: "bg-primary",
      value: "text-primary",
    },
    secondary: {
      bg: "bg-white",
      border: "border border-light-gray",
      text: "text-secondary",
      iconBg: "bg-secondary",
      value: "text-secondary",
    },
    success: {
      bg: "bg-white",
      border: "border border-light-gray",
      text: "text-success",
      iconBg: "bg-success",
      value: "text-success",
    },
    warning: {
      bg: "bg-white",
      border: "border border-light-gray",
      text: "text-warning",
      iconBg: "bg-warning",
      value: "text-warning",
    },
    danger: {
      bg: "bg-white",
      border: "border border-light-gray",
      text: "text-danger",
      iconBg: "bg-danger",
      value: "text-danger",
    },
  };

  const sizeConfig = {
    small: {
      padding: "p-4",
      title: "text-sm",
      value: "text-xl",
      iconSize: "w-2 h-2",
    },
    medium: {
      padding: "p-6",
      title: "text-lg",
      value: "text-3xl",
      iconSize: "w-3 h-3",
    },
    large: {
      padding: "p-8",
      title: "text-xl",
      value: "text-4xl",
      iconSize: "w-4 h-4",
    },
  };

  const config = colorConfig[color] || colorConfig.primary;
  const sizeStyle = sizeConfig[size] || sizeConfig.medium;

  if (loading) {
    return (
      <div
        className={`
          bg-white rounded-xl shadow-card border border-light-gray animate-pulse 
          ${sizeStyle.padding} ${className}
        `}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-xl shadow-card transition-transform hover:translate-y-[-2px]
        ${config.bg} ${config.border}
        ${sizeStyle.padding} 
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-semibold ${config.text} ${sizeStyle.title}`}>
          {title}
        </h3>
        <div
          className={`rounded-full ${config.iconBg} ${sizeStyle.iconSize}`}
        ></div>
      </div>

      <div className={`font-bold mb-2 ${config.value} ${sizeStyle.value}`}>
        {value}
      </div>
    </div>
  );
};

export default StatBlock;
