import { useEffect, useMemo, useRef, useState } from "react";
import { Edit, Search, Plus, Trash2, RotateCcw, Popcorn, AlertTriangle } from "lucide-react";
import Pagination from "../../../components/Pagination";
import AddConcessionModal from "./add/AddConcessionModal";
import EditConcessionModal from "./edit/EditConcessionModal";
import DeleteConcessionModal from "./delete/DeleteConcessionModal";
import {
  PAGE_SIZE,
  ITEM_TYPE_META,
  CONCESSION_SERVICE_BY_TYPE,
  SIZE_OPTIONS,
  getApiErrorMessage,
  mapConcessionApiError,
  getConcessionStatusBadge,
  formatPriceSummary,
} from "./shared/concessionFormConstants";
import { CONCESSION_LABELS } from "../../../constants/labels";

const SIZE_LABEL_BY_VALUE = SIZE_OPTIONS.reduce((acc, opt) => {
  acc[opt.value] = opt.label;
  return acc;
}, {});

const TABS = [
  { key: "food", label: CONCESSION_LABELS.tabFood },
  { key: "drink", label: CONCESSION_LABELS.tabDrink },
  { key: "combo", label: CONCESSION_LABELS.tabCombo },
];

const ComboComposition = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-600">
        <AlertTriangle size={12} />
        {CONCESSION_LABELS.comboEmptyWarning}
      </p>
    );
  }
  const summary = items
    .map((i) => `${i.foodName || i.drinkName} (${SIZE_LABEL_BY_VALUE[i.size] || i.size}) x${i.quantity}`)
    .join(", ");
  return (
    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 truncate" title={summary}>
      {CONCESSION_LABELS.comboCompositionLabel}: {summary}
    </p>
  );
};

const ConcessionManagement = () => {
  const [activeTab, setActiveTab] = useState("food");
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState({ id: null, msg: "" });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const searchTimeoutRef = useRef(null);
  const meta = ITEM_TYPE_META[activeTab];
  const service = CONCESSION_SERVICE_BY_TYPE[activeTab];

  const fetchAll = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await service.getAll();
      setItems(res.data?.data || res.data || []);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, CONCESSION_LABELS.errorLoadList));
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSearch = async (kw) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await service.search(kw);
      setItems(res.data?.data || res.data || []);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, CONCESSION_LABELS.errorSearch));
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setKeyword("");
    setCurrentPage(1);
    fetchAll();
  }, [activeTab]);

  const handleRefresh = () => {
    if (keyword.trim()) {
      fetchSearch(keyword.trim());
    } else {
      fetchAll();
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setKeyword(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (val.trim()) {
        fetchSearch(val.trim());
      } else {
        fetchAll();
      }
    }, 300);
  };

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleRestore = async (item) => {
    setActionError({ id: null, msg: "" });
    try {
      await service.restore(item[meta.idKey]);
      handleRefresh();
    } catch (error) {
      setActionError({ id: item[meta.idKey], msg: mapConcessionApiError(error, CONCESSION_LABELS.errorRestore) });
    }
  };

  const thClass = "px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-bold overflow-hidden";
  const tdClass = "px-4 py-3 text-sm text-gray-600 dark:text-gray-300 overflow-hidden";

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-950 font-sans -m-8 md:-m-10 transition-colors duration-300">
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 shrink-0 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white shrink-0">{CONCESSION_LABELS.pageTitle}</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <input
              type="text"
              value={keyword}
              onChange={handleSearchChange}
              maxLength={100}
              placeholder={CONCESSION_LABELS.searchPlaceholder}
              className="bg-gray-100 dark:bg-gray-800/60 dark:text-white text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 w-48"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#C00000] hover:bg-[#a00000] text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors shrink-0"
          >
            <Plus size={16} />
            {CONCESSION_LABELS.addButton}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-4 flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-1.5 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                activeTab === tab.key ? "bg-[#C00000] text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed text-left border-collapse">
              <colgroup>
                <col className="w-20" />
                <col className="w-64" />
                <col className="w-48" />
                <col className="w-32" />
                <col className="w-32" />
              </colgroup>
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                  <th className={thClass}>{CONCESSION_LABELS.columnImage}</th>
                  <th className={thClass}>{CONCESSION_LABELS.columnName}</th>
                  <th className={thClass}>{CONCESSION_LABELS.columnPrice}</th>
                  <th className={`${thClass} text-center`}>{CONCESSION_LABELS.columnStatus}</th>
                  <th className={`${thClass} text-center`}>{CONCESSION_LABELS.columnActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-16 text-center text-gray-500 dark:text-gray-400">
                      {CONCESSION_LABELS.loadingList}
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-16 text-center text-[#C00000] font-black text-2xl tracking-widest uppercase">
                      {CONCESSION_LABELS.noItemFound}
                    </td>
                  </tr>
                ) : (
                  paginated.map((item) => {
                    const id = item[meta.idKey];
                    const name = item[meta.nameKey];
                    const statusBadge = getConcessionStatusBadge(item.status);
                    const isDeleted = item.status === "DELETED";
                    return (
                      <tr key={id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                        <td className={tdClass}>
                          <div className="w-14 h-14 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                                <Popcorn size={18} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className={tdClass}>
                          <p className="font-semibold text-gray-900 dark:text-white truncate" title={name}>
                            {name}
                          </p>
                          {activeTab === "combo" && (
                            <ComboComposition items={item.items} />
                          )}
                        </td>
                        <td className={tdClass}>{formatPriceSummary(item.prices)}</td>
                        <td className={tdClass}>
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadge.cls}`}>
                              {statusBadge.label}
                            </span>
                          </div>
                        </td>
                        <td className={tdClass}>
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1">
                              {!isDeleted && (
                                <button
                                  type="button"
                                  onClick={() => setEditingItem(item)}
                                  className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                                  title={CONCESSION_LABELS.actionEdit}
                                >
                                  <Edit size={15} />
                                </button>
                              )}
                              {isDeleted ? (
                                <button
                                  type="button"
                                  onClick={() => handleRestore(item)}
                                  className="text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1.5 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md transition-colors"
                                  title={CONCESSION_LABELS.actionRestore}
                                >
                                  <RotateCcw size={15} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeletingItem(item)}
                                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                                  title={CONCESSION_LABELS.actionDelete}
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                            {actionError.id === id && (
                              <p className="text-xs text-red-500 dark:text-red-400 text-center max-w-[120px] leading-tight">
                                {actionError.msg}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && items.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={items.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel={CONCESSION_LABELS.itemLabel}
            />
          )}
        </div>
      </main>

      {isAddModalOpen && (
        <AddConcessionModal itemType={activeTab} onClose={() => setIsAddModalOpen(false)} onSuccess={handleRefresh} />
      )}

      {editingItem && (
        <EditConcessionModal
          itemType={activeTab}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={handleRefresh}
        />
      )}

      {deletingItem && (
        <DeleteConcessionModal
          itemType={activeTab}
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
};

export default ConcessionManagement;
