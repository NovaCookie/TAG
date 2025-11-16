import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { faqAPI, themesAPI } from "../services/api";
import Layout from "./layout/Layout";
import Pagination from "./common/Pagination";
import SelectField from "./common/dropdown/SelectField";
import AlertMessage from "./common/feedback/AlertMessage";
import { useDebounce } from "../hooks/useDebounce";

const Faq = () => {
  const { user } = useAuth();
  const { callApi, loading } = useApi();
  const [faqs, setFaqs] = useState([]);
  const [themes, setThemes] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    theme: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [openFaq, setOpenFaq] = useState(null);

  const debouncedSearch = useDebounce(searchInput, 500);

  const loadFAQs = useCallback(
    async (searchTerm = "") => {
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
        };

        if (filters.theme !== "all") params.theme = filters.theme;
        if (searchTerm.trim() !== "") params.search = searchTerm;

        const data = await callApi(() => faqAPI.getAll(params));
        setFaqs(data.faqs || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.pages,
        }));
      } catch (err) {
        console.error("Erreur chargement Faq:", err);
        setErrorMessage("Erreur lors du chargement de la Faq");
      }
    },
    [pagination.page, pagination.limit, filters, callApi]
  );

  const loadThemes = useCallback(async () => {
    try {
      const data = await callApi(() => themesAPI.getAll());
      setThemes(data || []);
    } catch (err) {
      console.error("Erreur chargement thèmes:", err);
    }
  }, [callApi]);

  useEffect(() => {
    loadFAQs();
  }, [loadFAQs]);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  useEffect(() => {
    if (debouncedSearch !== undefined) {
      setPagination((prev) => ({ ...prev, page: 1 }));
      loadFAQs(debouncedSearch);
    }
  }, [debouncedSearch, loadFAQs]);

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      setPagination((prev) => ({ ...prev, page: 1 }));
      loadFAQs(searchInput);
    }
  };

  const handleSearchReset = () => {
    setSearchInput("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadFAQs("");
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const FAQItem = ({ faq, index }) => (
    <div className="border border-light rounded-lg p-6 mb-4 bg-white hover:shadow-md transition-shadow">
      <h3
        onClick={() => toggleFaq(index)}
        className="text-lg font-semibold text-primary cursor-pointer flex justify-between items-center"
      >
        {faq.titre}
        <span className="text-primary text-xl transform transition-transform">
          {openFaq === index ? "−" : "+"}
        </span>
      </h3>

      {openFaq === index && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-light">
          {faq.description && (
            <div className="mb-4">
              <h4 className="font-medium text-secondary mb-2">Question :</h4>
              <p className="text-tertiary whitespace-pre-wrap leading-relaxed">
                {faq.description}
              </p>
            </div>
          )}

          <div className="mb-4">
            <h4 className="font-medium text-secondary mb-2">Réponse :</h4>
            <p className="text-tertiary whitespace-pre-wrap leading-relaxed">
              {faq.reponse}
            </p>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-light text-sm">
            <span className="text-tertiary">
              Thème :{" "}
              <span className="font-medium text-secondary">
                {faq.theme?.designation}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const themeOptions = [
    { value: "all", label: "Tous les thèmes" },
    ...themes.map((theme) => ({
      value: theme.id.toString(),
      label: theme.designation,
    })),
  ];

  return (
    <Layout activePage="Faq">
      <AlertMessage
        type="success"
        message={successMessage}
        onClose={() => setSuccessMessage("")}
        autoClose
      />

      <AlertMessage
        type="error"
        message={errorMessage}
        onClose={() => setErrorMessage("")}
        autoClose
      />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Faq</h1>
          <p className="text-tertiary">
            Questions fréquemment posées - {pagination.total} question(s)
            trouvée(s)
          </p>
        </div>
        {(user?.role === "admin" || user?.role === "juriste") && (
          <Link
            to="/faq/new"
            className="bg-primary text-white rounded-lg px-6 py-3 font-semibold text-sm hover:bg-primary-light transition-colors shadow-md hover:shadow-lg"
          >
            Créer une question
          </Link>
        )}
      </div>

      {/* Filtres et Recherche */}
      <div className="card card-rounded p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Rechercher
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher dans la Faq..."
                className="w-full px-5 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light text-base"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              {searchInput && (
                <button
                  onClick={handleSearchReset}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Thème
            </label>
            <SelectField
              value={filters.theme}
              onChange={(e) => handleFilterChange("theme", e.target.value)}
              options={themeOptions}
              placeholder="Tous les thèmes"
            />
          </div>
        </div>
      </div>

      {/* Liste des Faq */}
      <div className="card card-rounded p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">
            Questions fréquentes
          </h2>
          <div className="text-sm">
            <span className="text-tertiary">Page </span>
            <span className="font-semibold text-primary">
              {pagination.page}
            </span>
            <span className="text-tertiary"> sur </span>
            <span className="font-semibold text-primary">
              {pagination.totalPages}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse py-6 px-6 border border-light rounded-lg bg-white"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="w-6 h-6 bg-gray-200 rounded"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.length > 0 ? (
              faqs.map((faq, index) => (
                <FAQItem key={faq.id} faq={faq} index={index} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-tertiary text-lg mb-2">
                  {searchInput || filters.theme !== "all"
                    ? "Aucune question trouvée avec ces critères"
                    : "Aucune question dans la Faq pour le moment"}
                </div>
                <p className="text-tertiary text-sm">
                  {searchInput || filters.theme !== "all"
                    ? "Ajustez vos filtres pour voir plus de résultats"
                    : user?.role === "admin" || user?.role === "juriste"
                    ? "Répondez à des questions pour les ajouter à la Faq"
                    : "Revenez plus tard pour consulter les questions fréquentes"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        />
      )}
    </Layout>
  );
};

export default Faq;
