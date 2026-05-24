import React from 'react';

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="pagination-container" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginTop: '20px',
      padding: '10px'
    }}>
      <button
        className="secondary-btn"
        disabled={currentPage === 1}
        onClick={() => onPageChange(1)}
        title="Go to First"
        style={{ padding: '0 10px', minWidth: '40px' }}
      >
        <span className="ti ti-chevrons-left" />
      </button>
      <button
        className="secondary-btn"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        title="Previous"
        style={{ padding: '0 10px', minWidth: '40px' }}
      >
        <span className="ti ti-chevron-left" />
      </button>

      {getPageNumbers().map(page => (
        <button
          key={page}
          className={currentPage === page ? "primary-btn" : "secondary-btn"}
          onClick={() => onPageChange(page)}
          style={{ minWidth: '40px', padding: '0' }}
        >
          {page}
        </button>
      ))}

      <button
        className="secondary-btn"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        title="Next"
        style={{ padding: '0 10px', minWidth: '40px' }}
      >
        <span className="ti ti-chevron-right" />
      </button>
      <button
        className="secondary-btn"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(totalPages)}
        title="Go to Last"
        style={{ padding: '0 10px', minWidth: '40px' }}
      >
        <span className="ti ti-chevrons-right" />
      </button>
    </div>
  );
}

export default Pagination;
