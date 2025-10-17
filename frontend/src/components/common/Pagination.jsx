import React from "react";

const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages } = pagination;

  return (
    <div className="flex justify-center items-center gap-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-4 py-2 border border-light-gray rounded-lg text-secondary hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ← Précédent
      </button>

      <div className="flex gap-2">
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index + 1}
            onClick={() => onPageChange(index + 1)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
              page === index + 1
                ? "bg-primary text-white"
                : "text-secondary hover:bg-light"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-4 py-2 border border-light-gray rounded-lg text-secondary hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Suivant →
      </button>
    </div>
  );
};

export default Pagination;
