import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { calculateAverageRating, totalVotes, parseUrlParts } from '../helper/functions'


const ProductCard = ({ product, imageSize }) => {
  const { _id, name, price, image, ratings, discount } = product

  const navigate = useNavigate()


  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg">
      <Link to={`/product/${_id}`} state={{ productData: product }}>
        <div className="relative">
          <img
            src={parseUrlParts(image, imageSize)}
            alt={name}
            className="w-full h-64 object-cover"
          />
          {product.isNewProduct && <div className="absolute -rotate-45 top-1 left-1 bg-accent rounded-full w-10 h-10 flex items-center justify-center text-white">
            <p className="mb-1 uppercase text-sm">New</p>
          </div>}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-text mb-1 truncate">{name}</h3>

          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 ${i < Math.floor(calculateAverageRating(ratings)) ? 'text-yellow-400' : 'text-gray-300'}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-gray-500 text-xs ml-1">({totalVotes(ratings)})</span>

          </div>


          <div className="flex justify-between gap-2 items-center">
            <div className='xl:flex xl:gap-3'>
              {discount ? (
                <p className="line-through text-gray-500 text-sm">${price}</p>
              ) : (
                <p className="text-red-600">${price}</p>
              )}
              {discount && (
                <p className="flex items-center gap-2 text-red-600">
                  ${Math.round(price * (1 - discount / 100) * 100) / 100}
                </p>
              )}
            </div>
            <button onClick={() => navigate(`/products/${_id}`)} className="bg-primary text-white px-3 py-1 rounded-md text-sm cursor-pointer hover:bg-primary/90 transition-colors">
              View Details
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
ProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    image: PropTypes.string.isRequired,
    ratings: PropTypes.object.isRequired,
    discount: PropTypes.number.isRequired,
    isNewProduct: PropTypes.bool.isRequired,
    category: PropTypes.string.isRequired,
  }).isRequired,
};

export default ProductCard;