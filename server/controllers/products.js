import express from 'express'
import corsConfig from '../middleware/cors.js'
import Product from '../models/product.js'
import redisClient from '../middleware/cache.js'

const app = express.Router()

app.use(corsConfig)

app.get('/random', async (req, res) => {

    const { limit, tag } = req.query

    try {
        const randomProduct = await Product.aggregate([
            { $match: { tags: { $regex: tag, "$options": "i" } } },
            { $sample: { size: parseInt(limit) } }
        ])

        if (!randomProduct) res.status(404).json({ error: 'No products found' })

        res.json(randomProduct)

    } catch (err) {
        console.error('Error fetching filtered random product:', err)
        res.status(500).json({ error: 'Failed to fetch filtered random product' })
    }

})

app.get('/product/:id', async (req, res) => {
    const { id } = req.params

    try {
        const cachedProduct = await redisClient.get(`product:${id}`)
        if (cachedProduct) {
            return res.status(200).json(JSON.parse(cachedProduct))
        }

        const product = await Product.findById(id)
        if (!product) {
            return res.status(404).json({ error: 'Product not found' })
        }

        await redisClient.set(`product:${id}`, JSON.stringify(product))
        console.log('product cached')

        res.status(200).json(product)
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch product' })
    }
})

app.get('/:page', async (req, res) => {
    const page = parseInt(req.params.page)
    const { limit = 40, sort, price, discount, inStock, isNewProduct, q, tags } = req.query

    let query = {}
    try {
        if (discount) query.discount = { $ne: null }
        if (inStock) query.inStock = true
        if (isNewProduct) query.isNewProduct = true
        if (tags) {
            query.tags = { $regex: tags.split(',').join('|'), $options: 'i' }
        }
        if (price) {
            const [min, max] = price.split(',').map(Number)
            query.price = { ...(min && { $gte: min }), ...(max && { $lte: max }) }
        }
        if (q) {
            query.$or = [
                { title: { $regex: q.toLowerCase(), $options: 'i' } },
                { description: { $regex: q.toLowerCase(), $options: 'i' } },
            ]
        }

        const cacheKey = `products:page:${page}:${JSON.stringify(req.query)}`
        const cachedProducts = await redisClient.get(cacheKey)

        if (cachedProducts) {
            return res.json(JSON.parse(cachedProducts))
        }

        const products = await Product.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort(sort ? { price: sort === 'asc' ? 1 : -1 } : {})

        const totalProducts = {
            all: await Product.countDocuments(query),
            discount: await Product.countDocuments({ ...query, discount: { $ne: null } }),
            inStock: await Product.countDocuments({ ...query, inStock: true }),
            isNewProduct: await Product.countDocuments({ ...query, isNewProduct: true }),
            lessThan: {
                10: await Product.countDocuments({ ...query, price: { $lte: 10 } }),
                20: await Product.countDocuments({ ...query, price: { $lte: 20 } }),
                50: await Product.countDocuments({ ...query, price: { $lte: 50 } }),
                100: await Product.countDocuments({ ...query, price: { $lte: 100 } }),
            }
        }

        const totalPages = Math.ceil(totalProducts.all / limit)

        const response = {
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages,
            totalProducts,
            products,
        }
        await redisClient.set(cacheKey, JSON.stringify(response))
        res.json(response)

    } catch (error) {
        console.error("Error in /products/:page", error)
        res.status(500).json({ error: 'Failed to fetch products' })
    }
})

export default app
