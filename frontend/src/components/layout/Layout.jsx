import { useContext } from "react";
import Header from "./Header";
import Sidebar from "../sidebar/Sidebar";
import { SidebarContext } from "../../context/SidebarContext";

const Layout = ({ children }) => {
  const { isOpen } = useContext(SidebarContext);

  return (
    <div className="h-screen flex flex-col bg-page font-sans overflow-hidden">
      {/* Header en haut */}
      <Header />

      {/* Contenu principal */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Zone de contenu */}
        <main
          className={`
            flex-1 p-6 md:p-8 overflow-y-auto
            ${isOpen ? "md:ml-16" : "md:ml-16"} 
          `}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
