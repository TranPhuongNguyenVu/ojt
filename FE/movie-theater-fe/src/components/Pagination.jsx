import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const getScrollParent = (node) => {
  let el = node?.parentElement;
  while (el) {
    const style = window.getComputedStyle(el);
    if ((style.overflowY === "auto" || style.overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
};

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = "mục",
}) => {
  if (totalItems === 0) return null;

  // Changing page should bring the new rows into view, but only within the table's
  // own scroll container — not the whole admin page (sidebar/header stay put since
  // they live outside this scrollable ancestor).
  const handlePageChange = (page, event) => {
    const scrollParent = getScrollParent(event.currentTarget);
    onPageChange(page);
    if (scrollParent) {
      requestAnimationFrame(() => {
        scrollParent.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  };

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Hiển thị <span className="font-medium text-gray-700 dark:text-gray-200">{start}</span>–
        <span className="font-medium text-gray-700 dark:text-gray-200">{end}</span> trong{" "}
        <span className="font-medium text-gray-700 dark:text-gray-200">{totalItems}</span> {itemLabel}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => handlePageChange(currentPage - 1, e)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Trang trước"
          >
            <ChevronLeft size={16} />
          </button>

          {getPageNumbers().map((page) => (
            <button
              key={page}
              type="button"
              onClick={(e) => handlePageChange(page, e)}
              className={`min-w-[32px] h-8 px-2 text-xs font-semibold rounded-md transition-colors ${
                page === currentPage
                  ? "bg-[#C00000] text-white"
                  : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={(e) => handlePageChange(currentPage + 1, e)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Trang sau"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
