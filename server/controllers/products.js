import Product from '../models/product.js'
import { redis } from 'bun'
import { Hono } from 'hono'

const app = new Hono()

app.get('/random', async (c) => {

    const limit = c.req.query('limit') || 10
    const tag = c.req.query('tag') || ''

    try {
        const randomProduct = await Product.aggregate([
            { $match: { tags: { $regex: tag, "$options": "i" } } },
            { $sample: { size: parseInt(limit) } }
        ])

        if (!randomProduct) return c.json({ error: 'No products found' }, 404)

        return c.json(randomProduct, 200)

    } catch (err) {
        console.error('Error fetching filtered random product:', err)
        return c.json({ error: 'Failed to fetch filtered random product' }, 500)
    }

})

app.get('/product/:id', async (c) => {
    const { id } = c.req.param()

    try {
        const cachedProduct = await redis.get(`product:${id}`)
        if (cachedProduct) {
            return c.json(JSON.parse(cachedProduct), 200)
        }

        const product = await Product.findById(id)
        if (!product) {
            return c.json({ error: 'Product not found' }, 404)
        }

        await redis.set(`product:${id}`, JSON.stringify(product))

        return c.json(product, 200)
    }
    catch (err) {
        console.error(err)
        return c.json({ error: 'Failed to fetch product' }, 500)
    }
})

app.get('/:page', async (c) => {
    const page = parseInt(c.req.param('page'))
    const limit = parseInt(c.req.query('limit') || '40')
    const sort = c.req.query('sort')
    const price = c.req.query('price')
    const discount = c.req.query('discount')
    const inStock = c.req.query('inStock')
    const isNewProduct = c.req.query('isNewProduct')
    const q = c.req.query('q')
    const tags = c.req.query('tags')

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

        const cacheKey = `products:page:${page}:${JSON.stringify(c.req.query())}`
        const cachedProducts = Bun.env.NODE_ENV === 'test' ? null : await (redis ? redis.get(cacheKey) : null)


        if (cachedProducts) {
            return c.json(JSON.parse(cachedProducts), 200)
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
        if (redis) {
            await redis.set(cacheKey, JSON.stringify(response))
        }
        return c.json(response, 200)

    } catch (error) {
        console.error("Error in /products/:page", error)
        return c.json({ error: 'Failed to fetch products' }, 500)
    }
})

export default app
