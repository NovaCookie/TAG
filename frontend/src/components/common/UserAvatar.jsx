const UserAvatar = ({
  prenom = "",
  nom = "",
  avatar = null,
  online = false,
  size = "md",
  className = "",
}) => {
  // Gère la taille de l'avatar
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
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
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white"></div>
      )}
    </div>
  );
};

export default UserAvatar;
