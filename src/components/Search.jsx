import { useState, useRef, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ProductsContext } from "../context/ProductsContext";

const Search = () => {
    const navigate = useNavigate();
    const { searchProducts, products, productsLoading } = useContext(ProductsContext);

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    // Auto-focus
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    // Esc to close
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "Escape") {
                setOpen(false);
                setQuery("");
                setResults([]);
            }
        };
        if (open) {
            window.addEventListener("keydown", handleKey);
            return () => window.removeEventListener("keydown", handleKey);
        }
    }, [open]);

    // Debounced search as user types
    const handleInputChange = useCallback(
        (e) => {
            const value = e.target.value;
            setQuery(value);

            if (debounceRef.current) clearTimeout(debounceRef.current);

            if (!value.trim()) {
                setResults([]);
                return;
            }

            debounceRef.current = setTimeout(async () => {
                try {
                    await searchProducts(value.trim());
                } catch { }
            }, 300);
        },
        [searchProducts],
    );

    useEffect(() => {
        if (open && query.trim() && products) {
            setResults(products.slice(0, 6));
        } else if (!query.trim()) {
            setResults([]);
        }
    }, [products, open, query]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && query.trim()) {
            navigate(`/products?q=${encodeURIComponent(query.trim())}`);
            closeModal();
        }
    };

    const closeModal = () => {
        setOpen(false);
        setQuery("");
        setResults([]);
    };

    const handleResultClick = (product) => {
        navigate(`/product/${product._id}`, { state: { productData: product } });
        closeModal();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="p-2 text-gray-500 hover:text-primary transition-colors"
                aria-label="Search"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </button>

            {createPortal(
                <AnimatePresence>
                    {open && (
                        <motion.div
                            className="fixed inset-0 z-9999 flex justify-center pt-24 px-4"
                            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                            onClick={handleBackdropClick}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <motion.div
                                className="w-full max-w-xl h-fit"
                                onClick={(e) => e.stopPropagation()}
                                initial={{ opacity: 0, y: -30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                            >
                                {/* Search bar */}
                                <div className="relative">
                                    <div className="flex items-center bg-white rounded-lg shadow-2xl">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 ml-4 text-gray-400 shrink-0"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={query}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Search products..."
                                            className="w-full p-4 text-lg text-gray-900 bg-transparent outline-none rounded-lg"
                                        />
                                        <button
                                            onClick={closeModal}
                                            className="p-4 text-gray-400 hover:text-gray-600 shrink-0"
                                            aria-label="Close search"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Results dropdown */}
                                    {query.trim() && (
                                        <div className="bg-white mt-1 rounded-lg shadow-2xl overflow-hidden">
                                            {productsLoading ? (
                                                <div className="p-6 text-center text-gray-500">
                                                    <div className="animate-spin inline-block w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                                                    <span className="ml-2">Searching...</span>
                                                </div>
                                            ) : results.length > 0 ? (
                                                <ul className="divide-y divide-gray-100">
                                                    {results.map((product) => (
                                                        <li key={product._id}>
                                                            <button
                                                                onClick={() => handleResultClick(product)}
                                                                className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors text-left
                                                                cursor-pointer"
                                                            >
                                                                <img
                                                                    src={product.image}
                                                                    alt={product.title}
                                                                    className="w-12 h-12 object-cover rounded shrink-0"
                                                                />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                                        {product.title}
                                                                    </p>
                                                                    <p className="text-sm text-red-600">
                                                                        ${product.price}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="p-6 text-center text-gray-500">
                                                    {query.trim()
                                                        ? "No results found"
                                                        : "Type to search..."}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}
        </>
    );
};

export default Search;