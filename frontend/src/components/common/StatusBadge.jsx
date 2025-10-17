import React from "react";
import { getBadgeColor, getStatusLabel } from "../../utils/helpers";

const StatusBadge = ({ status, className = "" }) => {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${getBadgeColor(
        status
      )} ${className}`}
    >
      {getStatusLabel(status)}
    </span>
  );
};

export default StatusBadge;
