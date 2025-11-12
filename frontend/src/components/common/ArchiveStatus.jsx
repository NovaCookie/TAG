import React from "react";
import { archivesAPI } from "../../services/api";

const ArchiveStatus = ({ table, id, onStatusChange }) => {
  const [isArchived, setIsArchived] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    checkArchiveStatus();
  }, [table, id]);

  const checkArchiveStatus = async () => {
    try {
      const response = await archivesAPI.checkStatus(table, id);
      setIsArchived(response.data.archived);
    } catch (error) {
      console.error("Erreur vérification statut archivage:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="text-gray-500 text-sm">Chargement...</div>;

  if (isArchived) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-1 rounded text-sm">
        Archivé
      </div>
    );
  }

  return null;
};

export default ArchiveStatus;
