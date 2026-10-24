import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ProductCard } from "@/components";
import { ProductCardSkeleton } from "@/components/ui/skeletons";
import Carousel from "@/components/Carousel";
import { ProductsContext } from "@/context/ProductsContext";
import { storeCategories } from "@/data/categories";

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

const HomePage = () => {
  const { homeProducts, homeLoading, loadHomeProducts } = useContext(ProductsContext);

  useEffect(() => {
    void loadHomeProducts();
  }, [loadHomeProducts]);

  return (
    <div className="min-h-screen bg-background pb-12 sm:pb-16">
      <section className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <Carousel />
      </section>

      {/* Featured Products */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                Curated
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-text sm:text-3xl">
                Featured Products
              </h2>
            </div>
            <Link
              to="/products"
              className="noEffect inline-flex shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-colors hover:border-primary/30 hover:text-primary sm:text-sm"
            >
              View all
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5 lg:gap-6">
            {homeProducts?.map((product, index) => (
              <motion.div
                key={product.id}
                {...reveal}
                transition={{ ...reveal.transition, delay: index * 0.04 }}
              >
                <ProductCard product={product} imageSize="300.300" />
              </motion.div>
            ))}
            {homeLoading &&
              Array.from({ length: 5 }, (_, index) => <ProductCardSkeleton key={index} />)}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-10 sm:py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                Collections
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-text sm:text-3xl">
                Shop by Category
              </h2>
            </div>
            <Link
              to="/categories"
              className="noEffect inline-flex shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-colors hover:border-primary/30 hover:text-primary sm:text-sm"
            >
              Browse all
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {storeCategories.map((category, index) => (
              <motion.div
                key={category.name}
                {...reveal}
                transition={{ ...reveal.transition, delay: index * 0.05 }}
              >
                <Link
                  to={category.path}
                  className="noEffect group relative flex aspect-4/3 overflow-hidden rounded-2xl bg-gray-100 shadow-sm"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div aria-hidden="true" className="absolute inset-0 bg-slate-950/40" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3">
                    <span className="text-xs font-semibold text-white sm:text-sm">
                      {category.name}
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm text-white backdrop-blur transition-colors group-hover:bg-white/30"
                    >
                      →
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Promotion Banner */}
      <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white bg-white shadow-sm">
          <div className="md:flex">
            <div className="p-6 sm:p-8 md:w-1/2 md:p-12">
              <span className="inline-flex rounded-full bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                Special offer
              </span>
              <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-text sm:text-3xl">
                Get 20% off your first purchase
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
                Sign up for our newsletter and receive a special discount code for your first order.
              </p>
              <form
                className="mt-5 flex flex-col gap-2 sm:flex-row"
                onSubmit={(event) => event.preventDefault()}
              >
                <input
                  type="email"
                  placeholder="Your email address"
                  aria-label="Email address"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Subscribe
                </button>
              </form>
            </div>
            <div
              className="h-56 bg-cover bg-center md:h-auto md:w-1/2"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1607082350899-7e105aa886ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80')",
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
