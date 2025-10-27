import { Link } from "react-router-dom";

const SidebarLink = ({ to, icon, title, isOpen, isActive }) => {
  return (
    <Link
      to={to}
      className={`flex items-center transition-all ${
        isActive
          ? "bg-light text-primary font-medium"
          : "text-tertiary hover:bg-light-gray"
      } ${isOpen ? "px-4 py-3" : "p-3 justify-center"} mb-2 min-h-[44px]`}
      title={title}
    >
      <span className="text-xl flex-shrink-0">{icon}</span>
      {isOpen && <span className="ml-3 opacity-100 w-auto">{title}</span>}
    </Link>
  );
};

export default SidebarLink;
