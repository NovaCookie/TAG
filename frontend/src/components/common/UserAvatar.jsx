import React from 'react';

const UserAvatar = ({ 
  name, 
  avatar, 
  online = false, 
  size = "md",
  className = "" 
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg"
  };

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div
        className={`rounded-full bg-primary-light text-white flex items-center justify-center font-semibold ${sizeClasses[size]}`}
      >
        {avatar || (name ? name.charAt(0) : "U")}
      </div>
      {online && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white"></div>
      )}
    </div>
  );
};

export default UserAvatar;