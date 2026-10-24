import type { ChangeEventHandler, FormEvent } from "react";
import { BadgeCheck, Check, Star, Tag, Truck } from "lucide-react";
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
            <Star className="h-4 w-4 shrink-0 text-yellow-500" fill="currentColor" />
            <span>Premium Member Exclusive Sale</span>
          </label>
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <input type="checkbox" id="onSale" />
          <label htmlFor="onSale" className="flex items-center space-x-1 text-sm">
            <Tag className="h-4 w-4 shrink-0 text-red-500" />
            <span>On Sale</span>
          </label>
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <input type="checkbox" id="freeShipping" />
          <label htmlFor="freeShipping" className="flex items-center space-x-1 text-sm">
            <Truck className="h-4 w-4 shrink-0 text-blue-500" />
            <span>Free Shipping</span>
          </label>
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <input type="checkbox" id="inStock" />
          <label htmlFor="inStock" className="flex items-center space-x-1 text-sm">
            <Check className="h-4 w-4 shrink-0 text-green-600" />
            <span>In Stock</span>
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="buyable" />
          <label htmlFor="buyable" className="flex items-center space-x-1 text-sm">
            <BadgeCheck className="h-4 w-4 shrink-0 text-gray-700" />
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
