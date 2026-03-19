import React from 'react'
import { Link } from 'react-router-dom'

const categories = [
    {
        name: "Men's Clothing",
        image: "https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg?auto=compress&cs=tinysrgb&w=800",
        path: "/products"
    },
    {
        name: "Women's Clothing",
        image: "https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800",
        path: "/products"
    },
    {
        name: "Jewelery",
        image: "https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg?auto=compress&cs=tinysrgb&w=800",
        path: "/products"
    },
    {
        name: "Electronics",
        image: "https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=800",
        path: "/products"
    }
]

const Categories = () => {
    return (
        <div className="bg-gray-50 min-h-screen py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                        Shop by Category
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto">
                        Discover our comprehensive collection of premium products across various categories.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {categories.map((category, index) => (
                        <Link
                            key={index}
                            to={category.path}
                            className="group relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 aspect-4/3 sm:aspect-video block"
                        >
                            <img
                                src={category.image}
                                alt={category.name}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-gray-900/90 via-gray-900/30 to-transparent"></div>

                            <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-2 transform sm:translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    {category.name}
                                </h3>
                                <div className="flex items-center text-indigo-300 opacity-100 sm:opacity-0 group-hover:opacity-100 transform sm:translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                                    <span className="text-lg font-bold mr-2">Explore Collection</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Categories
