import { useState, useRef, useEffect } from "react";

const SelectFieldCommune = ({
  communes = [],
  value,
  onChange,
  error,
  required = false,
  label = "Commune",
}) => {
  const [listeOuverteCommune, setListeOuverteCommune] = useState(false);
  const [rechercheCommune, setRechercheCommune] = useState("");
  const dropdownRefCommune = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRefCommune.current &&
        !dropdownRefCommune.current.contains(event.target)
      ) {
        setListeOuverteCommune(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleListe = () => {
    setListeOuverteCommune((prev) => !prev);
  };

  const communesFiltrees = communes.filter((commune) => {
    if (!rechercheCommune) return true;
    const recherche = rechercheCommune.toLowerCase();
    return (
      commune.nom.toLowerCase().includes(recherche) ||
      (commune.code_postal &&
        commune.code_postal.toLowerCase().includes(recherche)) ||
      (commune.population && commune.population.toString().includes(recherche))
    );
  });

  const communeSelectionnee = communes.find((c) => c.id.toString() === value);

  const selectionnerCommune = (commune) => {
    onChange({ target: { name: "commune_id", value: commune.id.toString() } });
    setListeOuverteCommune(false);
    setRechercheCommune("");
  };

  // Fonction pour formater l'affichage de la commune sélectionnée
  const getDisplayText = () => {
    if (!communeSelectionnee) {
      return "Sélectionnez une commune";
    }

    const parts = [];
    if (communeSelectionnee.code_postal) {
      parts.push(communeSelectionnee.code_postal);
    }
    parts.push(communeSelectionnee.nom);
    if (communeSelectionnee.population) {
      parts.push(`${communeSelectionnee.population.toLocaleString()} hab.`);
    }
    if (communeSelectionnee.actif === false) {
      parts.push("• inactive");
    }

    return parts.join(" ");
  };

  return (
    <div className="relative" ref={dropdownRefCommune}>
      <label className="block text-sm font-medium text-secondary mb-2">
        {label} {required && "*"}
      </label>
      <div
        onClick={toggleListe}
        className={`w-full px-3 py-2 border rounded-lg cursor-pointer bg-white flex justify-between items-center ${
          error ? "border-danger" : "border-light-gray"
        }`}
      >
        <span
          className={communeSelectionnee ? "text-secondary" : "text-gray-400"}
        >
          {getDisplayText()}
        </span>
        <svg
          className={`fill-current h-4 w-4 text-gray-700 transition-transform duration-200 ${
            listeOuverteCommune ? "rotate-180" : "rotate-0"
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>

      {error && <p className="text-danger text-sm mt-1">{error}</p>}

      {listeOuverteCommune && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-light-gray rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-light-gray">
            <input
              type="text"
              placeholder="Rechercher par nom, code postal, habitants..."
              value={rechercheCommune}
              onChange={(e) => setRechercheCommune(e.target.value)}
              className="w-full px-3 py-2 border border-light-gray rounded-lg focus:outline-none focus:border-primary text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {communesFiltrees.length > 0 ? (
              communesFiltrees.map((commune) => {
                const estSelectionnee = value === commune.id.toString();
                return (
                  <div
                    key={commune.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => selectionnerCommune(commune)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && selectionnerCommune(commune)
                    }
                    className={`group px-4 py-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors duration-150
                      ${
                        estSelectionnee
                          ? "bg-primary text-white"
                          : "bg-white hover:bg-primary/70 hover:text-white"
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          {commune.code_postal && (
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold
                                ${
                                  estSelectionnee
                                    ? "bg-white/25 text-white"
                                    : "bg-primary/10 text-primary group-hover:bg-white/25 group-hover:text-white"
                                }`}
                            >
                              {commune.code_postal}
                            </span>
                          )}
                          <span
                            className={`font-medium truncate ${
                              estSelectionnee
                                ? "text-white"
                                : "text-black group-hover:text-white"
                            }`}
                          >
                            {commune.nom}
                          </span>
                          <span
                            className={`text-xs ${
                              estSelectionnee
                                ? "text-white/80"
                                : "text-gray-400 group-hover:text-white/80"
                            }`}
                          >
                            •
                          </span>
                          <span
                            className={`text-sm ${
                              estSelectionnee
                                ? "text-white/90"
                                : "text-gray-600 group-hover:text-white/90"
                            }`}
                          >
                            {commune.population?.toLocaleString() || 0} hab.
                          </span>
                        </div>
                      </div>
                      {commune.actif !== undefined && (
                        <div
                          className={`flex-shrink-0 text-xs px-2 py-1 rounded font-semibold
                            ${
                              commune.actif
                                ? "bg-success text-white"
                                : "bg-warning text-white"
                            }`}
                        >
                          {commune.actif ? "active" : "inactive"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-secondary-light text-sm">
                {rechercheCommune
                  ? `Aucune commune trouvée avec "${rechercheCommune}"`
                  : "Aucune commune disponible"}
              </div>
            )}
          </div>
        </div>
      )}
      <input type="hidden" name="commune_id" value={value} />
    </div>
  );
};

export default SelectFieldCommune;
