import React from 'react'

const SideSearchBar = ({ onSubmit, onFilterChange, productsLength }) => {

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(e);
    }

    return (
        <aside className="w-64 border-l shadow-2xl border-gray-200 p-4 space-y-6 max-sm:hidden block">
            {/* Refine By */}
            <section>
                <h2 className="text-lg font-semibold mb-2">Refine by</h2>
                <div className="flex items-center space-x-2 mb-2">
                    <input type="checkbox" id="premiumSale" />
                    <label htmlFor="premiumSale" className="flex items-center space-x-1 text-sm">
                        <i className="text-yellow-500 fa-solid fa-star" />
                        <span>Premium Member Exclusive Sale</span>
                    </label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                    <input type="checkbox" id="onSale" />
                    <label htmlFor="onSale" className="flex items-center space-x-1 text-sm">
                        <i className="text-red-500 fa-solid fa-tag" />
                        <span>On Sale</span>
                    </label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                    <input type="checkbox" id="freeShipping" />
                    <label htmlFor="freeShipping" className="flex items-center space-x-1 text-sm">
                        <i className="text-blue-500 fa-solid fa-truck" />
                        <span>Free Shipping</span>
                    </label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                    <input type="checkbox" id="inStock" />
                    <label htmlFor="inStock" className="flex items-center space-x-1 text-sm">
                        <i className="text-green-600 fa-solid fa-check" />
                        <span>In Stock</span>
                    </label>
                </div>
                <div className="flex items-center space-x-2">
                    <input type="checkbox" id="buyable" />
                    <label htmlFor="buyable" className="flex items-center space-x-1 text-sm">
                        <i className="text-gray-700 fa-solid fa-check" />
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
                    {/* Add more months as needed */}
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
                            value=''
                            defaultChecked
                            className="mr-2"
                        />
                        <label htmlFor="priceAll">All ({productsLength && productsLength.all})</label>
                    </div>
                    <div>
                        <input type="radio" name="price" value={10} className="mr-2" onChange={onFilterChange} />
                        <label htmlFor="price10">Under $10 ({productsLength && productsLength?.lessThan?.['10']})</label>
                    </div>
                    <div>
                        <input type="radio" name="price" value={20} className="mr-2" onChange={onFilterChange} />
                        <label htmlFor="price20">Under $20 ({productsLength && productsLength?.lessThan?.['20']})</label>
                    </div>
                    <div>
                        <input type="radio" name="price" value={50} className="mr-2" onChange={onFilterChange} />
                        <label htmlFor="price50">Under $50 ({productsLength && productsLength?.lessThan?.['50']})</label>
                    </div>
                    <div>
                        <input type="radio" name="price" value={100} className="mr-2" onChange={onFilterChange} />
                        <label htmlFor="priceOver100">Under $100 ({productsLength && productsLength?.lessThan?.['100']})</label>
                    </div>
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
}

export default SideSearchBar