import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  page: number | string;
  pages: number | string;
}

type PaginationItem = { type: "page"; value: number } | { type: "ellipsis"; id: "start" | "end" };

const PAGE_WINDOW = 2;

const getPageItems = (currentPage: number, totalPages: number): PaginationItem[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => ({
      type: "page",
      value: index + 1,
    }));
  }

  const start = Math.max(2, Math.min(currentPage - PAGE_WINDOW, totalPages - 4));
  const end = Math.min(totalPages - 1, Math.max(currentPage + PAGE_WINDOW, 5));
  const items: PaginationItem[] = [{ type: "page", value: 1 }];

  if (start > 2) {
    items.push({ type: "ellipsis", id: "start" });
  }

  for (let value = start; value <= end; value += 1) {
    items.push({ type: "page", value });
  }

  if (end < totalPages - 1) {
    items.push({ type: "ellipsis", id: "end" });
  }

  items.push({ type: "page", value: totalPages });

  return items;
};

const Pagination = ({ page, pages }: PaginationProps) => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const totalPages = Math.trunc(Number(pages));
  const parsedPage = Math.trunc(Number(page));

  if (!Number.isFinite(totalPages) || totalPages < 1) return null;

  const currentPage = Math.min(
    Math.max(1, Number.isFinite(parsedPage) ? parsedPage : 1),
    totalPages,
  );

  const goToPage = (value: number) => {
    if (value < 1 || value > totalPages || value === currentPage) return;

    void navigate({ pathname: `/products/${value}`, search });
  };

  const items = getPageItems(currentPage, totalPages);
  const baseButton =
    "inline-flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav aria-label="Pagination" className="w-full my-8 flex justify-center">
      <div className="flex flex-wrap items-center justify-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`${baseButton} border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:hover:bg-white`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {items.map((item) =>
          item.type === "ellipsis" ? (
            <span
              key={`ellipsis-${item.id}`}
              aria-hidden="true"
              className="inline-flex h-10 min-w-10 items-center justify-center px-1 text-gray-500"
            >
              &hellip;
            </span>
          ) : (
            <button
              key={item.value}
              type="button"
              aria-label={`Page ${item.value}`}
              aria-current={item.value === currentPage ? "page" : undefined}
              onClick={() => goToPage(item.value)}
              className={`${baseButton} ${
                item.value === currentPage
                  ? "border-[#a3a3a3] bg-[#b4b4b4] text-black hover:bg-[#a3a3a3]"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.value}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="Next page"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`${baseButton} border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:hover:bg-white`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
