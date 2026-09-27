/**
 * Pagination - Navigation entre pages d'une liste paginée côté serveur
 *
 * Props :
 *  - total, limit, offset : état de pagination renvoyé par l'API
 *  - onChange(offset)     : appelé avec le nouvel offset
 *  - itemLabel            : libellé des éléments (ex. "clients")
 */

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const Pagination = ({ total = 0, limit = 50, offset = 0, onChange, itemLabel = "éléments" }) => {
  if (total <= limit && offset === 0) return null;

  const first = total === 0 ? 0 : offset + 1;
  const last = Math.min(offset + limit, total);
  const hasPrevious = offset > 0;
  const hasNext = offset + limit < total;

  const buttonClass =
    "inline-flex items-center px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-slate-100 bg-white">
      <p className="text-sm text-slate-500">
        <span className="font-medium text-slate-700">
          {first}–{last}
        </span>{" "}
        sur <span className="font-medium text-slate-700">{total}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, offset - limit))}
          disabled={!hasPrevious}
          className={buttonClass}
        >
          <ChevronLeftIcon className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Précédent</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(offset + limit)}
          disabled={!hasNext}
          className={buttonClass}
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRightIcon className="h-4 w-4 sm:ml-1" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
