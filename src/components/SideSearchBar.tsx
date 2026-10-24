import type { ChangeEventHandler, FormEvent } from "react";
import type { ProductsTotal } from "@/types";

export interface SideSearchBarProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFilterChange: ChangeEventHandler<HTMLInputElement>;
  productsLength?: ProductsTotal;
}

const SideSearchBar = ({ onSubmit, onFilterChange, productsLength }: SideSearchBarProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(event);
  };

  const priceOptions = [10, 20, 50, 100] as const;

  return (
    <aside className="w-64 border-l shadow-2xl border-gray-200 p-4 space-y-6 max-sm:hidden block">
      {/* Refine By */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Refine by</h2>
        <div className="flex items-center space-x-2 mb-2">
          <input type="checkbox" id="premiumSale" />
          <label htmlFor="premiumSale" className="flex items-center space-x-1 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 shrink-0 text-yellow-500"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>Premium Member Exclusive Sale</span>
          </label>
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <input type="checkbox" id="onSale" />
          <label htmlFor="onSale" className="flex items-center space-x-1 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 shrink-0 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <span>On Sale</span>
          </label>
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <input type="checkbox" id="freeShipping" />
          <label htmlFor="freeShipping" className="flex items-center space-x-1 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 shrink-0 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7h11v8H3V7zm11 3h3l4 4v1h-7v-5z"
              />
              <circle cx="7" cy="17" r="1.5" />
              <circle cx="17" cy="17" r="1.5" />
            </svg>
            <span>Free Shipping</span>
          </label>
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <input type="checkbox" id="inStock" />
          <label htmlFor="inStock" className="flex items-center space-x-1 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 shrink-0 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>In Stock</span>
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="buyable" />
          <label htmlFor="buyable" className="flex items-center space-x-1 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 shrink-0 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Buyable</span>
          </label>
        </div>
      </section>

      {/* Release Month */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Release Month</h2>
        <select className="w-full border border-gray-300 rounded px-2 py-1 text-sm">
          <option value="">-</option>
          <option value="January">January</option>
          <option value="February">February</option>
          <option value="March">March</option>
        </select>
      </section>

      {/* Price */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Price</h2>
        <form onSubmit={handleSubmit} className="text-sm space-y-2">
          <div>
            <input
              onChange={onFilterChange}
              type="radio"
              name="price"
              value=""
              defaultChecked
              className="mr-2"
            />
            <label htmlFor="priceAll">All ({productsLength?.all ?? 0})</label>
          </div>
          {priceOptions.map((price) => {
            const bucket = String(price) as keyof ProductsTotal["lessThan"];

            return (
              <div key={price}>
                <input
                  type="radio"
                  name="price"
                  value={price}
                  className="mr-2"
                  onChange={onFilterChange}
                />
                <label htmlFor={`price${price}`}>
                  Under ${price} ({productsLength?.lessThan[bucket] ?? 0})
                </label>
              </div>
            );
          })}
          {/* Custom Price Range */}
          <div className="flex items-center mt-2 gap-2">
            <input
              type="number"
              name="minPrice"
              placeholder="$"
              className="w-16 border border-gray-300 rounded px-1 text-sm"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              name="maxPrice"
              placeholder="$"
              className="w-16 border border-gray-300 rounded px-1 text-sm"
            />
            <button type="submit" className="bg-blue-600 text-white text-sm px-3 py-1 rounded">
              Go
            </button>
          </div>
        </form>
      </section>
    </aside>
  );
};

export default SideSearchBar;
