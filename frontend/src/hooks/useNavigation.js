export const useNavigation = () => {
  const getBackLink = (entityType, isArchived) => {
    if (isArchived) {
      const tabMap = {
        intervention: "interventions",
        commune: "communes",
        user: "utilisateurs",
      };
      return `/archives?tab=${tabMap[entityType]}`;
    }

    const normalRoutes = {
      intervention: "/interventions",
      commune: "/communes",
      user: "/users",
    };
    return normalRoutes[entityType];
  };

  const getBackText = (entityType, isArchived) => {
    const entityNames = {
      intervention: "interventions",
      commune: "communes",
      user: "utilisateurs",
    };
    return `← Retour ${
      isArchived ? "aux archives" : `aux ${entityNames[entityType]}`
    }`;
  };

  return {
    getBackLink,
    getBackText,
  };
};
