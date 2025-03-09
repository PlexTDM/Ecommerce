// For Add Item to Cart
export const addCart = (product) => {
    return {
        type: "ADDITEM",
        payload: product
    }
}

// For Delete Item to Cart
export const DELETE_ITEM = (product) => {
    return {
        type: "DELITEM",
        payload: product
    }
}

export const INCREASE_QTY = (productId) => {
    return {
        type: "INCREASE_QTY",
        payload: { _id: productId }
    }
}

export const DECREASE_QTY = (productId) => {
    return {
        type: "DECREASE_QTY",
        payload: { _id: productId }
    }
}