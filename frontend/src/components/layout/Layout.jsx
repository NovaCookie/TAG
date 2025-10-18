import { useContext} from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { SidebarContext } from "../../context/SidebarContext";

const Layout = ({ children, activePage }) => {
  const {isOpen, setIsOpen} = useContext(SidebarContext);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-page">
      <Header />
      <div className="flex flex-1">
        <Sidebar
          activePage={activePage}
          isOpen={isOpen}
          onToggle={toggleSidebar}
        />
        <main className={`flex-1 p-8  ${isOpen ? "ml-0" : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
