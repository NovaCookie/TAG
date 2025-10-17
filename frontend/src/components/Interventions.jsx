import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import StatusBadge from "./common/StatusBadge";
import Pagination from "./common/Pagination";
import SearchFilter from "./common/SearchFilter";
import { formatDate } from "../utils/helpers";

const Interventions = () => {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    commune: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 5,
  });

  // Permission functions
  const canViewAllInterventions = () => {
    return ["admin", "juriste"].includes(user?.role);
  };

  useEffect(() => {
    fetchInterventions();
  }, [user, pagination.page]);

  const fetchInterventions = async () => {
    try {
      // Simulation data - replace with your API
      const interventionsData = [
        {
          id: 1,
          title: "Contrat de prestation 2025",
          reference: "REF-2025-001",
          commune: "Nuuk",
          status: "in_progress",
          date: "2024-08-02",
          theme: "Contrats",
        },
        {
          id: 2,
          title: "Litige foncier Nuuk",
          reference: "REF-2024-156",
          commune: "Nuuk",
          status: "urgent",
          date: "2024-08-01",
          theme: "Urbanisme",
        },
        {
          id: 3,
          title: "Accord commercial Sisimiut",
          reference: "REF-2024-098",
          commune: "Sisimiut",
          status: "completed",
          date: "2024-07-28",
          theme: "Commerce",
        },
        {
          id: 4,
          title: "Révision du règlement communal",
          reference: "REF-2024-201",
          commune: "Ilulissat",
          status: "in_progress",
          date: "2024-07-25",
          theme: "Règlementation",
        },
      ];

      // Filter by role
      if (user?.role === "commune") {
        setInterventions(
          interventionsData
            .filter((i) => i.commune === user.commune?.nom)
            .slice(0, 2)
        );
      } else {
        setInterventions(interventionsData);
      }
    } catch (error) {
      console.error("Error loading interventions:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const InterventionRow = ({ intervention }) => (
    <div className="flex justify-between items-center py-5 border-b border-light last:border-b-0 hover:bg-light/50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex-1">
        <div className="flex flex-col gap-2 mb-2">
          <div className="font-medium text-secondary">
            {intervention.title}
          </div>
          <div className="text-sm text-tertiary">
            {intervention.reference}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-tertiary">
          <span className="text-secondary">{intervention.commune}</span>
          <StatusBadge status={intervention.status} />
          <span>{formatDate(intervention.date)}</span>
          {intervention.theme && (
            <span className="text-primary-light">{intervention.theme}</span>
          )}
        </div>
      </div>
      <div className="flex gap-2 ml-4">
        <button className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary-light hover:text-white transition-colors dark:bg-gray-700 dark:hover:bg-primary-light">
          👁️
        </button>
        <button className="w-8 h-8 rounded-full bg-light text-primary flex items-center justify-center hover:bg-primary-light hover:text-white transition-colors dark:bg-gray-700 dark:hover:bg-primary-light">
          ✏️
        </button>
      </div>
    </div>
  );

  return (
    <Layout activePage="interventions">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-primary">
          {user?.role === "commune" ? "Mes Questions" : "Interventions"}
        </h1>
        {user?.role === "commune" && (
          <button className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors">
            Nouvelle question
          </button>
        )}
      </div>

      {/* Filters */}
      <SearchFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Rechercher un dossier..."
        showCommuneFilter={canViewAllInterventions()}
      />

      {/* Interventions List */}
      <div className="card p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">
            {user?.role === "commune" ? "Mes questions" : "Toutes les interventions"}
          </h2>
          <Link
            to="#"
            className="text-primary-light text-sm font-medium hover:text-primary transition-colors"
          >
            Voir tout
          </Link>
        </div>

        <div className="space-y-0">
          {interventions.map((intervention) => (
            <InterventionRow 
              key={intervention.id} 
              intervention={intervention} 
            />
          ))}

          {interventions.length === 0 && (
            <div className="text-center py-12 text-tertiary">
              {user?.role === "commune"
                ? "Aucune question pour le moment"
                : "Aucune intervention trouvée"}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
      />
    </Layout>
  );
};

export default Interventions;