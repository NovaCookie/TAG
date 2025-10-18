import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Layout = ({ children, activePage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-page">
      <Header />
      <div className="flex flex-1">
        <Sidebar
          activePage={activePage}
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
        />
        <main
          className={`flex-1 p-8 transition-all duration-300 ${
            sidebarOpen ? "" : ""
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
