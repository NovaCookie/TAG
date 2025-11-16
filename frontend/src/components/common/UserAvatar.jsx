const UserAvatar = ({
  prenom = "",
  nom = "",
  avatar = null,
  online = false,
  size = "md",
  className = "",
}) => {
  // Gère la taille de l'avatar - Tailles responsive
  const sizeClasses = {
    sm: "w-6 h-6 text-xs", // Plus petit pour mobile
    md: "w-8 h-8 text-xs sm:w-10 sm:h-10 sm:text-sm", // Adaptatif
    lg: "w-10 h-10 text-sm sm:w-12 sm:h-12 sm:text-base",
    xl: "w-12 h-12 text-base sm:w-16 sm:h-16 sm:text-lg",
  };

  // Génère les initiales
  const getInitiales = (prenom, nom) => {
    const p = prenom?.trim()?.[0] || "";
    const n = nom?.trim()?.[0] || "";
    return (p + n).toUpperCase() || "U";
  };

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {avatar ? (
        <img
          src={avatar}
          alt={`${prenom} ${nom}`}
          className={`rounded-full object-cover ${sizeClasses[size]}`}
        />
      ) : (
        <div
          className={`rounded-full bg-primary text-white flex items-center justify-center font-semibold uppercase ${sizeClasses[size]}`}
        >
          {getInitiales(prenom, nom)}
        </div>
      )}

      {online && (
        <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 bg-success rounded-full border-2 border-white"></div>
      )}
    </div>
  );
};

export default UserAvatar;
