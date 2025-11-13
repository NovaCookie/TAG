import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "./layout/Layout";
import InterventionArchives from "./archives/InterventionArchives";
import CommuneArchives from "./archives/CommuneArchives";
import UserArchives from "./archives/UserArchives";
import { useAuth } from "../context/AuthContext";

const Archives = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("interventions");
  const { user } = useAuth();

  // Synchroniser l'onglet actif avec les paramètres d'URL
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");

    // Définir les onglets disponibles selon le rôle
    let availableTabs = ["interventions", "communes"];
    if (user?.role === "admin") {
      availableTabs.push("utilisateurs");
    }

    if (tabFromUrl && availableTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else {
      setActiveTab(availableTabs[0]);
      setSearchParams({ tab: availableTabs[0] });
    }
  }, [searchParams, user]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Définir les onglets disponibles selon le rôle
  const getAvailableTabs = () => {
    const baseTabs = [
      {
        id: "interventions",
        label: "Interventions",
        component: InterventionArchives,
      },
      { id: "communes", label: "Communes", component: CommuneArchives },
    ];

    if (user?.role === "admin") {
      baseTabs.push({
        id: "utilisateurs",
        label: "Utilisateurs",
        component: UserArchives,
      });
    }

    return baseTabs;
  };

  const tabs = getAvailableTabs();
  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <Layout activePage="archives">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-primary mb-2">Archives</h1>
          <p className="text-tertiary">Consultation des données archivées</p>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="card card-rounded p-6 mb-6">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "bg-light text-secondary hover:bg-primary-light hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {ActiveComponent && <ActiveComponent />}
    </Layout>
  );
};

export default Archives;
