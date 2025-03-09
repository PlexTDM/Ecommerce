import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Search from './Search'
import { useState } from 'react'

const Navbar = () => {

    const state = useSelector(state => state.handleCart)
    console.log(state)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    return (
        <nav className="bg-white shadow-md py-3 sticky top-0 z-50">
            <div className="container mx-auto flex flex-col px-4 w-full">

                <div className="flex items-center justify-between w-full">
                    <Link to="/" className="text-2xl font-bold text-primary noEffect">
                        ShopEase
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-8">
                        <Search />
                        <Link to="/" className="text-text hover:text-primary transition-colors">
                            Home
                        </Link>
                        <Link to="/products" className="text-text hover:text-primary transition-colors">
                            Products
                        </Link>
                        <Link to="/categories" className="text-text hover:text-primary transition-colors">
                            Categories
                        </Link>
                        <Link to="/about" className="text-text hover:text-primary transition-colors">
                            About
                        </Link>
                    </div>

                    <div className="hidden lg:flex items-center space-x-4 *:p-2 *:text-gray-500 *:hover:text-primary">
                        <Link to="/cart" id='cart' className="p-2 text-gray-500 hover:text-primary relative group">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="absolute opacity-80 group-hover:opacity-100 duration-200 -top-1 -right-1 bg-orange-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {state.length}
                            </span>
                        </Link>
                        <Link to="/account" className="p-2 text-gray-500 hover:text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="lg:hidden p-2 text-gray-500 hover:text-primary"
                        onClick={toggleMenu}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                        </svg>
                    </button>
                </div>
                <div className={`${isMenuOpen ? 'max-h-[300px] pb-4 mt-4' : 'max-h-0'} overflow-hidden transition-all duration-300 lg:hidden space-y-4`}>
                    <Link to="/" className="block text-text hover:text-primary transition-colors max-w-[100px]">
                        Home
                    </Link>
                    <Link to="/products" className="block text-text hover:text-primary transition-colors max-w-[100px]">
                        Products
                    </Link>
                    <Link to="/categories" className="block text-text hover:text-primary transition-colors max-w-[100px]">
                        Categories
                    </Link>
                    <Link to="/about" className="block text-text hover:text-primary transition-colors max-w-[100px]">
                        About
                    </Link>
                    <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                        <Link to={'/search'} className="p-2 text-gray-500 hover:text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </Link>
                        <Link to="/cart" className="p-2 text-gray-500 hover:text-primary relative group">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="absolute opacity-80 group-hover:opacity-100 duration-200 -top-1 -right-1 bg-orange-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {state.length}
                            </span>
                        </Link>
                        <Link to="/account" className="p-2 text-gray-500 hover:text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar