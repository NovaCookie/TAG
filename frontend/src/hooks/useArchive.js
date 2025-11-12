import { useState } from 'react';
import { archivesAPI } from '../services/api';

export const useArchive = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const archiveEntity = async (table, id, raison = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await archivesAPI.archiveEntity(table, id, raison);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'archivage');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const restoreEntity = async (table, id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await archivesAPI.restoreEntity(table, id);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la restauration');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    archiveEntity,
    restoreEntity,
    loading,
    error,
  };
};