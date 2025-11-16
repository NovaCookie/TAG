import { useEffect } from "react";

const AlertMessage = ({
  type = "info",
  message,
  onClose,
  autoClose = false,
  duration = 5000,
  className = "",
}) => {
  const typeClasses = {
    success: "bg-success/10 border-success/20 text-success",
    error: "bg-danger/10 border-danger/20 text-danger",
    warning: "bg-warning/10 border-warning/20 text-warning",
    info: "bg-primary/10 border-primary/20 text-primary",
  };

  useEffect(() => {
    if (autoClose && message) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, message, duration, onClose]);

  if (!message) return null;

  return (
    <div
      className={`p-3 sm:p-4 rounded-lg border ${typeClasses[type]} ${className} mb-4 sm:mb-6`}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm sm:text-base pr-2">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 sm:ml-4 text-lg hover:opacity-70 transition-opacity flex-shrink-0"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertMessage;
