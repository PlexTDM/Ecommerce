import { createContext, useState, useEffect } from 'react'
import PropTypes from 'prop-types'

export const ProductsContext = createContext()

export const ProductsProvider = ({ children }) => {
    const [homeProducts, setHomeProducts] = useState(null)
    const [productsPage, setProductsPage] = useState([])

    useEffect(() => {
        const fetchHomeProducts = async () => {

            ProductsProvider.propTypes = {
                children: PropTypes.node.isRequired,
            }
        }

        fetchHomeProducts()
    }, [])

    return (
        <ProductsContext.Provider value={{ homeProducts, setHomeProducts, productsPage, setProductsPage }}>
            {children}
        </ProductsContext.Provider>
    )
}