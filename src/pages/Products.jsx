import React, { useContext, useEffect, useRef, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { useDispatch } from "react-redux"
import { addCart } from "../redux/action"
import axios from 'axios'
import { SideSearchBar, Pagination, Loading } from "../components"
import { animate, motion } from "motion/react"
import { parseUrlParts } from '../helper/functions'
import { ProductsContext } from "../context/ProductsContext"

const Product = () => {
  const { page = 1 } = useParams()
  const { productsPage, setProductsPage } = useContext(ProductsContext)
  const dispatch = useDispatch()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [pages, setPages] = useState(0)
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState({})
  const [productsLength, setProductsLength] = useState({})
  const [notFound, setNotFound] = useState(false)

  const addProduct = (product) => {
    dispatch(addCart(product))
  }

  useEffect(() => {
    setLoading(true)
    if (productsPage && productsPage.length > 0) {
      console.log('cachesds', productsPage)
      setLoading(false)
      return setProducts(productsPage)
    }

    axios.get(`${import.meta.env.VITE_FRONT_END_API}/products/${page}`)
      .then(res => {
        setPages(res.data.totalPages)
        setProductsPage(res.data.products)
        setProducts(res.data.products)
        setProductsLength(res.data.totalProducts)
        setNotFound(res.data.products.length === 0)
      }).catch(err => {
        console.error("Error fetching products:", err)
      }).finally(() => {
        setLoading(false)
      })

  }, [])

  useEffect(() => {
    if (!searchParams.get('q')) return
    setLoading(true)
    setProducts([])
    axios.get(`${import.meta.env.VITE_FRONT_END_API}/products/${1}?q=${searchParams.get('q')}`)
      .then(res => {
        setPages(res.data.totalPages)
        setProductsPage(res.data.prodcuts)
        setProducts(res.data.products)
        setProductsLength(res.data.totalProducts)
        setNotFound(res.data.products.length === 0)
      }).catch(err => {
        console.error("Error fetching products:", err)
      }).finally(() => {
        setLoading(false)
      })
  }, [searchParams])


  const handleFilterChange = async (e) => {
    const { name, checked, value } = e.target
    // const price = document.querySelectorAll('input[name="price"]:checked')
    let priceVal = value
    const queryString = new URLSearchParams({
      ...Object.fromEntries(searchParams),
      ...{ ...filters, [name]: `0,${priceVal}` },
    }).toString()
    console.log(queryString)
    setLoading(true)
    setProducts([])
    axios.get(`${import.meta.env.VITE_FRONT_END_API}/products/${1}?${queryString}`).then(res => {
      console.log(res)
      setPages(res.data.totalPages)
      setProducts(res.data.products)
      setProductsLength(res.data.totalProducts)
      setNotFound(res.data.products.length === 0)
    }).catch(err => {
      console.error("Error fetching products:", err)
    }).finally(() => {
      setLoading(false)
    })
  }

  const handleCustomPrice = (e) => {
    e.preventDefault();
    const minPrice = e.target.elements.minPrice.value;
    const maxPrice = e.target.elements.maxPrice.value;
    if (minPrice || maxPrice) setFilters({ ...filters, price: [minPrice, maxPrice] })
  }

  const ShowProduct = ({ product, index }) => {
    const [isFlying, setIsFlying] = useState(false)
    const imgRef = useRef(null)


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
            addProduct({ ...product })
          },
        }
      );
    }

    return (
      <div className="border border-gray-200 relative rounded-md shadow-xl hover:shadow-sh2 duration-200 text-sm xl:text-base group">

        {/* img */}
        <Link className="relative cursor-pointer min-h-[256px] w-full overflow-hidden" to={`/product/${product._id}`} state={{ productData: product }}>
          <img
            src='https://dzt1km7tv28ex.cloudfront.net/static/shop/product_no_image.png'
            className="absolute top-0 left-0 w-full h-full object-cover blur-md"
            alt="Loading placeholder"
          />
          <img src={parseUrlParts(product.image)} ref={imgRef} loading="lazy" className="w-full h-auto min-h-[172px]" />

          {product.isNewProduct && <div className="absolute -rotate-45 top-1 left-1 bg-accent rounded-full w-10 h-10 flex items-center justify-center text-white">
            <p className="mb-1 uppercase text-sm">New</p>
          </div>}
        </Link>

        <div className="p-4">
          <Link to={`/products/${product._id}`} className="hover:text-gray-500 cursor-pointer duration-100">{product.title}</Link>

          {/* price */}
          <div className="">
            {product.discount ? (
              <p className="line-through text-gray-500 text-sm">${product.price}</p>
            ) : (
              <p className="text-red-600">${product.price}</p>
            )}
          </div>

          {/* discount */}
          {product.discount && (
            <p className="flex items-center gap-2 text-red-600">
              ${Math.round(product.price * (1 - product.discount / 100) * 100) / 100}
              <span className="text-xs">({product.discount}% OFF)</span>
            </p>
          )}

        </div>
        <button
          onClick={handleAddToCart}
          className="mt-2 bg-gray-300/70 shadow-2xl absolute bottom-2 right-2 flex opacity-0 duration-100 group-hover:opacity-100 transition-all text-white p-2 items-center justify-center rounded hover:bg-gray-300 cursor-pointer"
        >
          <i className="fa fa-shopping-cart text-black" />
        </button>
      </div>
    );
  };


  return (
    <>
      <div className="w-full px-6 md:8 lg:px-12 mx-auto mt-20 flex gap-4">
        <div className="w-full">
          <div className="w-full grid max-[864px]:grid-cols-2 grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 justify-center">
            {loading ?
              Array(20).fill(null).map((_, index) => (
                <Loading key={index} />
              ))
              : products.map((p, i) => <ShowProduct key={p.id} product={p} index={i} />)}
            {
              notFound && <h1>Not Found</h1>
            }
          </div>
          {pages > 1 && <Pagination pages={pages} page={page} />}
        </div>
        <div className="">
          <SideSearchBar onFilterChange={handleFilterChange} onSubmit={handleCustomPrice} productsLength={productsLength} />
        </div>
      </div>
    </>
  )
}


export default Product
