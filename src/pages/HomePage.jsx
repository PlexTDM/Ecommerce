import { Link } from 'react-router-dom'
import { ProductCard, Loading } from '../components'
import { useEffect, useState, useContext } from 'react'
import Carousel from '../components/Carousel'
import axios from 'axios'
import { ProductsContext } from '../context/ProductsContext'


const HomePage = () => {


    const [loading, setLoading] = useState(false)
    const { homeProducts, setHomeProducts } = useContext(ProductsContext)

    useEffect(() => {
        if (homeProducts) return
        setLoading(true)
        axios.get(`${import.meta.env.VITE_BACK_END_API}/products/1?limit=5`).then(res => {
            setHomeProducts(res.data.products)
            console.log('fetched')
        }).catch(err => {
            console.error(err)
        }).finally(() => {
            setLoading(false)
        })

    }, [])


    return (
        <div className='container mx-auto lg:pt-20'>

            <Carousel />

            {/* Featured Products */}
            <section className="py-16 bg-background">
                <div className="container-custom">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-text">Featured Products</h2>
                        <Link to="/products" className="text-primary hover:underline">View All</Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                        {homeProducts && homeProducts.map((product, i) => (
                            <ProductCard key={product.id} product={product} index={i} imageSize='300.300' />
                        ))}
                        {loading && Array(5).fill(null).map((_, i) => (
                            <Loading key={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-16 bg-white">
                <div className="container-custom">
                    <h2 className="text-2xl md:text-3xl font-bold text-text mb-8 text-center">Shop by Category</h2>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* {categories.map(category => (
                            <Link
                                key={category}
                                to={`/products?category=${category}`}
                                className="bg-background rounded-lg p-6 text-center hover:shadow-md transition-shadow"
                            >
                                <div className="text-primary text-3xl mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-lg">{category}</h3>
                            </Link>
                        ))} */}
                    </div>
                </div>
            </section>

            {/* Promotion Banner */}
            <section className="py-16 px-4 bg-accent/10">
                <div className="container-custom">
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="md:flex">
                            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                                <div className="uppercase tracking-wide text-sm text-accent font-semibold">Special Offer</div>
                                <h2 className="mt-2 text-3xl leading-tight font-bold text-text">Get 20% Off Your First Purchase</h2>
                                <p className="mt-4 text-gray-500">
                                    Sign up for our newsletter and receive a special discount code for your first order.
                                </p>
                                <div className="mt-6">
                                    <div className="flex">
                                        <input
                                            type="email"
                                            placeholder="Your email address"
                                            className="px-4 py-3 w-full border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                        <button className="bg-primary text-white px-6 py-3 rounded-r-md hover:bg-primary/90 transition-colors">
                                            Subscribe
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="md:w-1/2 h-64 md:h-auto bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1607082350899-7e105aa886ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80')" }}>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default HomePage;