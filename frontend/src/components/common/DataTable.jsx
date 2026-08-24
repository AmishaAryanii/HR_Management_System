import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { HiOutlineSearch, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineFilter, HiOutlineChevronDoubleLeft, HiOutlineChevronDoubleRight } from 'react-icons/hi';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function DataTable({
  columns,
  data = [],
  searchable = true,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  onRowClick,
  actions,
  loading = false,
  emptyMessage = 'No data found',
  filters,

  // Server-side pagination props
  serverPagination = false,
  pagination,
  onPageChange,
  onSearchChange,
}) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [pageSizeSelect, setPageSizeSelect] = useState(pageSize);

  // Server-side mode helpers
  const serverPage = pagination?.page || 1;
  const serverTotalPages = pagination?.totalPages || 1;
  const serverTotal = pagination?.total || 0;
  const actualPageSize = serverPagination ? (pagination?.pageSize || pageSizeSelect) : pageSizeSelect;

  // Client-side filtering & sorting (only used when serverPagination is false)
  const processedData = useMemo(() => {
    if (serverPagination) return data; // In server mode, pass data as-is

    let result = data;

    // Filter
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(row =>
        columns.some(col => {
          const val = col.accessor ? row[col.accessor] : '';
          return val && String(val).toLowerCase().includes(lower);
        })
      );
    }

    // Sort
    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === 'string') {
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    return result;
  }, [data, search, sortField, sortOrder, columns, serverPagination]);

  // Client-side pagination (only when serverPagination is false)
  const displayData = useMemo(() => {
    if (serverPagination) return data;
    const start = (currentPage - 1) * pageSizeSelect;
    return processedData.slice(start, start + pageSizeSelect);
  }, [processedData, currentPage, pageSizeSelect, serverPagination, data]);

  const clientTotalPages = Math.ceil(processedData.length / pageSizeSelect);
  const totalPages = serverPagination ? serverTotalPages : clientTotalPages;
  const totalItems = serverPagination ? serverTotal : processedData.length;

  const handleSort = (field) => {
    if (serverPagination) return; // No client-side sort in server mode
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Debounce search for server-side mode
  const searchTimeoutRef = useRef(null);

  const handleSearchInput = useCallback((value) => {
    setSearch(value);
    if (serverPagination) {
      setCurrentPage(1);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        onSearchChange?.(value);
      }, 300);
    } else {
      setCurrentPage(1);
    }
  }, [serverPagination, onSearchChange]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const handlePageChange = useCallback((newPage, newPageSize) => {
    const size = newPageSize ?? pageSizeSelect;
    if (serverPagination) {
      onPageChange?.(newPage, size);
    } else {
      setCurrentPage(newPage);
      if (newPageSize) setPageSizeSelect(newPageSize);
    }
  }, [serverPagination, onPageChange, pageSizeSelect]);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, serverPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const currentDisplayPage = serverPagination ? serverPage : currentPage;

  if (loading) {
    return (
      <div className="table-container">
        <div className="animate-pulse p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {columns.map((_, j) => (
                <div key={j} className="h-6 bg-gray-100 rounded flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      {/* Header with search, filters, page size selector */}
      <div className="table-header">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {searchable && (
              <div className="relative flex-1 max-w-sm">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="table-search"
                />
              </div>
            )}
            {filters && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary btn-sm"
              >
                <HiOutlineFilter className="w-4 h-4 mr-1" /> Filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {serverPagination && (
              <div className="flex items-center gap-2 text-sm text-secondary-500 mr-2">
                <span>Rows:</span>
                <select
                  value={pageSizeSelect}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    handlePageChange(1, val);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            )}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
        {showFilters && filters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            {filters}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-6 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider ${
                    !serverPagination && col.sortable !== false ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                  }`}
                  onClick={() => !serverPagination && col.sortable !== false && col.accessor && handleSort(col.accessor)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {!serverPagination && sortField === col.accessor && (
                      <span className="text-primary-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-secondary-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayData.map((row, i) => (
                <tr
                  key={row.id || i}
                  className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, j) => (
                    <td key={j} className="px-6 py-4 text-sm text-secondary-700 whitespace-nowrap">
                      {col.render ? col.render(row) : col.accessor ? row[col.accessor] : '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-t border-gray-200 gap-3">
          <p className="text-sm text-secondary-500">
            Showing {((currentDisplayPage - 1) * actualPageSize) + 1}-{Math.min(currentDisplayPage * actualPageSize, totalItems)} of {totalItems}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* First page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentDisplayPage === 1}
                className="btn-secondary btn-sm !px-2 disabled:opacity-50"
                title="First page"
              >
                <HiOutlineChevronDoubleLeft className="w-4 h-4" />
              </button>

              {/* Previous */}
              <button
                onClick={() => handlePageChange(currentDisplayPage - 1)}
                disabled={currentDisplayPage === 1}
                className="btn-secondary btn-sm disabled:opacity-50"
              >
                <HiOutlineChevronLeft className="w-4 h-4" />
              </button>

              {/* Page numbers */}
              <div className="hidden sm:flex items-center gap-1 mx-1">
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`min-w-[32px] h-8 text-sm font-medium rounded-md transition-colors ${
                      pageNum === currentDisplayPage
                        ? 'bg-primary-600 text-white'
                        : 'text-secondary-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              {/* Mobile page indicator */}
              <span className="sm:hidden text-sm text-secondary-600 px-2">
                {currentDisplayPage} / {totalPages}
              </span>

              {/* Next */}
              <button
                onClick={() => handlePageChange(currentDisplayPage + 1)}
                disabled={currentDisplayPage === totalPages}
                className="btn-secondary btn-sm disabled:opacity-50"
              >
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>

              {/* Last page */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentDisplayPage === totalPages}
                className="btn-secondary btn-sm !px-2 disabled:opacity-50"
                title="Last page"
              >
                <HiOutlineChevronDoubleRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
