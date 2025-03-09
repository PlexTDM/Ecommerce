import axios from 'axios'
import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { parseUrlParts, getFullImage, calculateAverageRating, totalVotes } from '../helper/functions'
import { EasyZoomOnHover } from "easy-magnify"
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from 'swiper/react'
import "../custom-swiper.css"
import { useDispatch } from 'react-redux'
import { addCart } from "../redux/action"
import { animate } from "motion/react"
import { Loading } from '../components'

const ProductSinglePage = () => {

    const frontURL = import.meta.env.VITE_FRONT_END_API

    const location = useLocation()

    const { productData } = location.state

    const cartRef = useRef(null)
    const { id } = useParams()
    const dispatch = useDispatch()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [quantity, setQuantity] = useState(1)
    const [relatedProducts, setRelatedProducts] = useState([])
    const [mainImage, setMainImage] = useState(null)
    const [relatedLoading, setRelatedLoading] = useState(true)

    // fly to cart animation
    const [isFlying, setIsFlying] = useState(false)
    const imgRef = useRef(null)

    const smallImg = '80.80'
    const mediumImg = '500.600'
    const largeImg = '1668.2500'

    const addProduct = (product) => {
        dispatch(addCart(product))
    }

    useEffect(() => {
        setMainImage(null)
        setRelatedProducts([])
        setRelatedLoading(true)
        setLoading(true)
        if (productData) {
            console.log('pdata')
            setProduct(productData)
            setLoading(false)
            setMainImage(productData.image)

            if (!relatedProducts || relatedProducts.length === 0) {
                setRelatedLoading(true)
                axios.get(`${frontURL}/products/random/?limit=6&tag=${productData.tags[0]}`).then(res => {
                    setRelatedProducts(res.data)
                }).catch(err => {
                    console.error('getRelatedProductsError', err)
                }).finally(() => {
                    setRelatedLoading(false)
                })
            }

        } else {
            axios.get(`${frontURL}/products/product/${id}`).then(res => {
                setProduct(res.data)
                setMainImage(res.data.image)
                setRelatedLoading(true)
                axios.get(`${frontURL}/products/random/?limit=6&tag=${res.data.tags[0]}`).then(res => {
                    setRelatedProducts(res.data)
                }).catch(err => {
                    console.error('getRelatedProductsError', err)
                }).finally(() => {
                    setRelatedLoading(false)
                })
            }).catch(err => {
                console.error('getProductError', err)
            }).finally(() => {
                setLoading(false)
            })
        }
    }, [id])

    // preload Images
    useEffect(() => {
        if (!product) return
        product.moreImages?.map(src => {
            const img = new Image()
            const imgFull = new Image()
            img.src = getFullImage('https://resize.cdn.otakumode.com/ex/50.50/shop/product/' + src, mediumImg)
            imgFull.src = getFullImage('https://resize.cdn.otakumode.com/ex/50.50/shop/product/' + src, largeImg)
        });

    }, [product])

    const handleAddToCart = (e) => {
        if (isFlying) return

        setIsFlying(true);

        // Get button position
        const button = e.target.getBoundingClientRect();
        const cart = document.getElementById("cart")?.getBoundingClientRect()

        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        if (!cart) return

        // Create a floating button
        const floatingButton = document.createElement("img");
        floatingButton.className =
            "fixed w-12 h-12 bg-blue-500 text-white flex items-center justify-center rounded-full shadow-lg";
        floatingButton.innerText = "+";
        document.body.appendChild(floatingButton);
        floatingButton.src = product.image
        // Set initial position
        floatingButton.style.left = `${button.left + button.width / 2 - 24 + scrollX}px`
        floatingButton.style.top = `${button.top + button.height / 2 - 24 + scrollY}px`

        // Animate using Framer Motion
        animate(
            floatingButton,
            {
                left: cart.left + cart.width / 2 - 24 + scrollX,
                top: cart.top + cart.height / 2 - 24 + scrollY,
                scale: 0,
            },
            {
                duration: 0.6,
                ease: "easeInOut",
                onComplete: () => {
                    floatingButton.remove()
                    setIsFlying(false)
                    addProduct({ ...product, qty: quantity })
                },
            }
        );
    }


    if (loading) {
        return (
            <div className="container-custom py-16 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container-custom py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
                <p className="mb-8">The product you're looking for doesn't exist or has been removed.</p>
                <Link to="/products" className="btn btn-primary">
                    Back to Products
                </Link>
            </div>
        );
    }


    return (
        <div className="container-sp py-4 mx-auto overflow-x-hidden">

            <div ref={cartRef} className="absolute -top-20 -right-40 opacity-0" />
            {/* Breadcrumbs */}
            <nav className="mb-4">
                <ol className="flex text-sm pl-4">
                    <li className="flex items-center">
                        <Link to="/" className="text-gray-500 hover:text-primary noEffect">Home</Link>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </li>
                    <li className="flex items-center">
                        <Link to="/products" className="text-gray-500 hover:text-primary noEffect">Products</Link>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </li>
                    <li className="text-gray-700 font-medium truncate">{product.title}</li>
                </ol>
            </nav>

            {/* Product Details */}
            <div className="bg-white rounded-xl shadow-sm">
                <div className="md:flex">
                    {/* Images */}
                    <div className="p-6 pr-0 flex gap-3 relative z-50 h-[600px]">
                        <Swiper slidesPerView="6"
                            mousewheel={true}
                            direction="vertical"
                            modules={[Navigation]}
                            navigation={true}
                            scrollbar={{ draggable: false }}
                            slidesPerGroup={5}
                            speed={700}
                            className="h-full min-w-[64px]">
                            {product.moreImages?.map((img, i) => {
                                const src = 'https://resize.cdn.otakumode.com/ex/50.50/shop/product/' + img
                                return <SwiperSlide key={i} className='w-16 h-16 select-none'>
                                    <img
                                        src={src}
                                        alt={`Thumbnail ${i + 1}`}
                                        className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 ${mainImage === src ? "border-blue-500" : "border-transparent"
                                            }`}
                                        onClick={() => setMainImage(src)}
                                    />
                                </SwiperSlide>
                            })}

                            <SwiperSlide className='w-16 !h-0 select-none' />

                            {/* <button className="custom-swiper-button-prev absolute -top-8 left-1/2 -translate-x-1/2 z-10 text-black">↑</button>
                            <button className="custom-swiper-button-next absolute bottom-0 right-2 z-10">↓</button> */}
                        </Swiper>
                        <div className="mb-4 relative z-40 h-[600px] min-w-[500px]">
                            {/* <img
                                src='https://dzt1km7tv28ex.cloudfront.net/static/shop/product_no_image.png'
                                className="absolute top-0 left-0 w-full h-full object-cover"
                                alt="Loading placeholder"
                            /> */}
                            {mainImage && !loading &&
                                <EasyZoomOnHover {...{
                                    mainImage: {
                                        alt: product.title,
                                        src: getFullImage(mainImage, mediumImg)
                                    },
                                    zoomImage: {
                                        src: getFullImage(mainImage, largeImg),
                                    },
                                    zoomLensScale: 1.8,
                                    zoomContainerWidth: 500,
                                    zoomContainerHeight: 600,
                                    distance: 1
                                }} />}

                        </div>

                    </div>

                    {/* Product Info */}
                    <div className="md:w-1/2 p-6 md:p-8 relative z-0">

                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-text mb-2">{product.title}</h1>
                            {/* rating | stars */}
                            <div className="flex items-center mb-2">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <svg
                                            key={i}
                                            xmlns="http://www.w3.org/2000/svg"
                                            className={`h-6 w-6 ${i < Math.floor(calculateAverageRating(product.ratings)) ? 'text-yellow-400' : 'text-gray-300'}`}
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <span className="text-gray-500 text-xs ml-1">({totalVotes(product.ratings)})</span>
                            </div>

                            <p className="text-3xl font-bold text-primary mb-6">${product.price}</p>

                            <p className="text-gray-600 mb-6" dangerouslySetInnerHTML={{ __html: product.description.body1 }}></p>

                            {/* Quantity */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Quantity</h3>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 border border-gray-300 rounded-l-md flex items-center justify-center text-gray-600 hover:bg-gray-100"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="text"
                                        inputMode='numeric'
                                        pattern="[0-9]*"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-16 h-10 border-t border-b border-gray-300 text-center focus:outline-none appearance-none"
                                    />
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-10 h-10 border border-gray-300 rounded-r-md flex items-center justify-center text-gray-600 hover:bg-gray-100"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Stock Status */}
                            <div className="mb-6">
                                <span className={`inline-flex items-center ${product.inStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={product.inStock > 0 ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                                    </svg>
                                    {product.inStock ? `Available For Purchase` : 'Out of Stock'}
                                </span>
                            </div>

                            {/* Add to Cart Button */}
                            <div className="flex space-x-4">
                                <button
                                    className="bg-blue-600 rounded-lg font-bold text-lg text-white flex-grow cursor-pointer active:brightness-75 duration-200"
                                    disabled={!product.inStock}
                                    onClick={handleAddToCart}
                                    ref={imgRef}
                                >
                                    Add to Cart
                                </button>

                                <button className="w-12 h-12 rounded-md border cursor-pointer border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Features */}
                {product.description.body2 &&
                    <div className="border-t border-gray-200 px-12 md:p-4 md:px-6 mt-10">
                        <h2 className="text-xl font-bold mb-4">Desctiption</h2>
                        <div>

                            <p className="text-gray-700 mb-6" dangerouslySetInnerHTML={{ __html: product.description.body2 }} />
                            {product.description.warning &&
                                <p className="text-gray-600 mb-6 text-sm" dangerouslySetInnerHTML={{ __html: product.description.warning }} />}
                        </div>
                    </div>
                }
            </div>

            {/* Related Products */}
            <div className="mt-12 px-6">
                <h2 className="text-2xl font-bold mb-6 max-md:text-center">Related Products</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 max-lg:px-4">
                    {relatedProducts?.map(product => (
                        <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg">
                            <Link to={`/product/${product._id}`}>
                                <div className="relative">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-48 object-cover"
                                    />
                                </div>

                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-text mb-1 truncate">{product.title}</h3>

                                    <div className="flex items-center mb-2">
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <svg
                                                    key={i}
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className={`h-4 w-4 ${i < Math.floor(calculateAverageRating(product.ratings)) ? 'text-yellow-400' : 'text-gray-300'}`}
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <span className="text-gray-500 text-xs ml-1">({totalVotes(product.ratings)})</span>
                                    </div>

                                    <span className="text-primary font-bold">${product.price.toFixed(2)}</span>
                                </div>
                            </Link>
                        </div>
                    ))}

                    {relatedLoading && Array(6).fill(null).map((_, i) => <Loading key={i} />)}
                </div>
            </div>
        </div>
    );
}

export default ProductSinglePage