import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { parseUrlParts } from '../helper/functions'
import StarVotes from './StarVotes'

const ProductCard = ({ product, imageSize }) => {
  const { _id, title, price, image, discount } = product

  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg">
      <Link to={`/product/${_id}`} state={{ productData: product }}>
        <div className="relative">
          <img
            src={parseUrlParts(image, imageSize)}
            alt={title}
            className="w-full h-64 object-cover"
          />
          {product.isNewProduct && <div className="absolute -rotate-45 top-1 left-1 bg-accent rounded-full w-10 h-10 flex items-center justify-center text-white">
            <p className="mb-1 uppercase text-sm">New</p>
          </div>}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-text mb-1 truncate">{title}</h3>

          <StarVotes product={product} />

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