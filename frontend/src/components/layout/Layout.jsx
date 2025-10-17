import React from "react";
// import { useTheme } from "../../context/ThemeContext";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Layout = ({ children, activePage }) => {
  // const { theme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-page">
      <Header />
      <div className="flex flex-1">
        <Sidebar activePage={activePage} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
