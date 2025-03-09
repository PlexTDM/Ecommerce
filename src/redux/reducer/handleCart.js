// Retrieve initial state from localStorage if available
const getInitialCart = () => {
  const storedCart = localStorage.getItem("cart");
  return storedCart ? JSON.parse(storedCart) : [];
};

const handleCart = (state = getInitialCart(), action) => {
  const product = action.payload;
  let updatedCart;

  const exist = state.find((x) => x._id === product?._id)
  switch (action.type) {
    case "ADDITEM":
      if (exist) {
        updatedCart = state.map((x) =>
          x._id === product._id ? { ...x, qty: product.qty ? x.qty + product.qty : x.qty + 1 } : x
        )
      } else {
        updatedCart = [...state, { ...product, qty: product.qty ? product.qty : 1 }]
      }

      localStorage.setItem("cart", JSON.stringify(updatedCart))
      return updatedCart

    case "DELITEM":
      if (exist) {
        updatedCart = state.filter((x) => x._id !== exist._id)
        localStorage.setItem("cart", JSON.stringify(updatedCart))
        return updatedCart
      }
      return state

    case "INCREASE_QTY":
      if (exist) {
        updatedCart = state.map((x) =>
          x._id === product._id ? { ...x, qty: x.qty + 1 } : x
        )
        localStorage.setItem("cart", JSON.stringify(updatedCart))
        return updatedCart
      }
      return state
    case "DECREASE_QTY":
      if (exist) {
        if (exist.qty > 1) {
          updatedCart = state.map((x) =>
            x._id === product._id ? { ...x, qty: x.qty - 1 } : x
          )
        } else if (exist.qty <= 1) {
          updatedCart = state.filter((x) => x._id !== exist._id)
        }
        localStorage.setItem("cart", JSON.stringify(updatedCart))
        return updatedCart
      }
      return state
    default:
      return state
  }
}

export default handleCart
