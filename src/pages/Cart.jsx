import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { INCREASE_QTY, DECREASE_QTY, DELETE_ITEM } from "../redux/action"

const Cart = () => {
  const cart = useSelector(state => state.handleCart)
  const dispatch = useDispatch()

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const discountedPrice = item.price * (1 - (parseInt(item.discount) || 0) / 100)
      return total + discountedPrice * item.qty
    }, 0).toFixed(2)
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">Your cart is empty</p>
            <Link to="/" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {cart.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow p-6 flex items-center">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="ml-6 flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">{item.title}</h2>
                  <div className="mt-2 flex items-center">
                    <span className="text-gray-900">
                      ${(item.price * (1 - (parseInt(item.discount) || 0) / 100)).toFixed(2)}
                    </span>
                    {item.discount && (
                      <span className="ml-2 text-sm text-gray-500 line-through">
                        ${item.price}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center">
                    <button
                      onClick={() => dispatch(DECREASE_QTY(item._id))}
                      className="px-3 py-1 border rounded-l cursor-pointer active:brightness-90 bg-white duration-100"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 border-t border-b">{item.qty}</span>
                    <button
                      onClick={() => dispatch(INCREASE_QTY(item._id))}
                      className="px-3 py-1 border rounded-r cursor-pointer active:brightness-90 bg-white duration-100"
                    >
                      +
                    </button>
                    <button
                      onClick={() => dispatch(DELETE_ITEM(item._id))}
                      className="ml-4 text-red-600 hover:text-red-800 cursor-pointer active:text-red-900 bg-white duration-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold">Total:</span>
                <span className="text-2xl font-bold">${calculateTotal()}</span>
              </div>
              <Link
                to="/checkout"
                className="mt-4 w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 flex items-center justify-center"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart