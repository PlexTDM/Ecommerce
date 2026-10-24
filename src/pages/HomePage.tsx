import { Link } from "react-router-dom";
import { ProductCard, Loading } from "../components";
import { useEffect, useContext } from "react";
import Carousel from "../components/Carousel";
import { ProductsContext } from "../context/ProductsContext";

const HomePage = () => {
  const { homeProducts, homeLoading, loadHomeProducts } = useContext(ProductsContext);

  useEffect(() => {
    void loadHomeProducts();
  }, [loadHomeProducts]);

  return (
    <div className="container mx-auto lg:pt-20">
      <Carousel />

      {/* Featured Products */}
      <section className="py-16 bg-background">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-text">Featured Products</h2>
            <Link to="/products" className="text-primary hover:underline">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {homeProducts &&
              homeProducts.map((product) => (
                <ProductCard key={product.id} product={product} imageSize="300.300" />
              ))}
            {homeLoading &&
              Array(5)
                .fill(null)
                .map((_, i) => <Loading key={i} />)}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-text mb-8 text-center">
            Shop by Category
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* categories placeholder */}
          </div>
        </div>
      </section>

      {/* Promotion Banner */}
      <section className="py-16 px-4 bg-accent/10">
        <div className="container-custom">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                <div className="uppercase tracking-wide text-sm text-accent font-semibold">
                  Special Offer
                </div>
                <h2 className="mt-2 text-3xl leading-tight font-bold text-text">
                  Get 20% Off Your First Purchase
                </h2>
                <p className="mt-4 text-gray-500">
                  Sign up for our newsletter and receive a special discount code for your first
                  order.
                </p>
                <div className="mt-6">
                  <div className="flex">
                    <input
                      type="email"
                      placeholder="Your email address"
                      className="px-4 py-3 w-full border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button className="bg-primary text-white px-6 py-3 rounded-r-md hover:bg-primary/90 transition-colors">
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>
              <div
                className="md:w-1/2 h-64 md:h-auto bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1607082350899-7e105aa886ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80')",
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
