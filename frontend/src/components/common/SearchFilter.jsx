import SelectField from "./dropdown/SelectField";

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

      {/* Filter Group avec le nouveau SelectField */}
      <div className="flex gap-4">
        {filterConfig.map((filter) => (
          <div key={filter.key} className="min-w-40">
            <SelectField
              value={filters[filter.key]}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              options={filter.options}
              placeholder={filter.placeholder || `Sélectionnez...`}
              fieldName={filter.key}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchFilter;
