import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: String, required: false },
    image: { type: String, required: true },
    id: { type: String, required: true },
    isNewProduct: { type: Boolean, required: true },
    inStock: { type: Boolean, required: true },
    moreImages: [String],
    tags: [String],
    description: {
        warning: { type: String, required: false },
        body1: { type: String, required: false },
        body2: { type: String, required: false }
    },
    ratings: [
        {
            "1": { type: Number, required: false },
            "2": { type: Number, required: false },
            "3": { type: Number, required: false },
            "4": { type: Number, required: false },
            "5": { type: Number, required: false }
        }
    ]
});

export default mongoose.model('Product', productSchema);