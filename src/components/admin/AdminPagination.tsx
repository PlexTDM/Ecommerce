import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  summary: string;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}

const AdminPagination = ({
  page,
  totalPages,
  summary,
  disabled = false,
  onPageChange,
}: AdminPaginationProps) => {
  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">{summary}</p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        <span className="min-w-24 text-center text-xs font-medium text-slate-400">
          Page {page} of {safeTotalPages}
        </span>

        <button
          type="button"
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= safeTotalPages}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;
