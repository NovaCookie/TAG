const DataTable = ({
  data,
  loading,
  emptyMessage = "Aucune donnée disponible",
  renderItem,
  keyExtractor = (item) => item.id,
  className = "",
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse flex justify-between items-center py-5 border-b border-light"
          >
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-tertiary">{emptyMessage}</div>
    );
  }

  return (
    <div className={`space-y-0 ${className}`}>
      {data.map((item) => (
        <div key={keyExtractor(item)}>{renderItem(item)}</div>
      ))}
    </div>
  );
};

export default DataTable;
