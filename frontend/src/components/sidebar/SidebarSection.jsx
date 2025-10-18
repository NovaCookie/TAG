import React from "react";

const SidebarSection = ({ title, isOpen, children }) => {
  return (
    <div className="mb-4">
      {isOpen && (
        <div className="font-medium uppercase mb-3 text-tertiary text-lg">
          {title}
        </div>
      )}
      <div className="space-y-3">{children}</div>
      {!isOpen ? <hr className="mt-4" /> : null}
    </div>
  );
};

export default SidebarSection;
