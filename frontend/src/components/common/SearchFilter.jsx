const SearchFilter = ({
  filters,
  onFilterChange,
  searchPlaceholder = "Rechercher...",
  filterConfig = [],
}) => {
  return (
    <div className="flex gap-6 mb-8 items-center">
      {/* Search Box */}
      <div className="flex-1">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className="w-full px-4 py-3 border border-light-gray rounded-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      {/* Filter Group */}
      <div className="flex gap-4">
        {filterConfig.map((filter) => (
          <select
            key={filter.key}
            value={filters[filter.key]}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            className="px-4 py-3 border border-light-gray rounded-lg bg-white focus:outline-none focus:border-primary"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}
      </div>
    </div>
  );
};

export default SearchFilter;
