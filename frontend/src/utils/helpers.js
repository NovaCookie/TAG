export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "Il y a 1 jour";
  if (diffDays > 1) return `Il y a ${diffDays} jours`;

  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  if (diffHours === 1) return "Il y a 1 heure";
  if (diffHours > 1) return `Il y a ${diffHours} heures`;

  return "À l'instant";
};

export const getBadgeColor = (status) => {
  const colors = {
    'en_attente': 'bg-warning/10 text-warning',
    'in_progress': 'bg-primary/10 text-primary',
    'repondu': 'bg-primary/10 text-primary',
    'urgent': 'bg-danger/10 text-danger',
    'completed': 'bg-success/10 text-success',
    'termine': 'bg-success/10 text-success',
    'online': 'bg-success/10 text-success',
    'offline': 'bg-light-gray text-secondary'
  };
  return colors[status] || 'bg-light-gray text-secondary';
};

export const getStatusLabel = (status) => {
  const labels = {
    'en_attente': 'En attente',
    'in_progress': 'En cours',
    'repondu': 'Répondu',
    'urgent': 'Urgent',
    'completed': 'Terminé',
    'termine': 'Terminé',
    'online': 'En ligne',
    'offline': 'Hors ligne'
  };
  return labels[status] || status;
};

export const getRoleColor = (role) => {
  const colors = {
    'admin': 'bg-primary/10 text-primary',
    'juriste': 'bg-success/10 text-success',
    'commune': 'bg-warning/10 text-warning'
  };
  return colors[role] || 'bg-light-gray text-secondary';
};

export const getRoleLabel = (role) => {
  const labels = {
    'admin': 'Administrateur',
    'juriste': 'Juriste',
    'commune': 'Commune'
  };
  return labels[role] || role;
};