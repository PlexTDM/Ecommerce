import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components";
import { ProductCardSkeleton } from "@/components/ui/skeletons";
import Carousel from "@/components/Carousel";
import { ProductsContext } from "@/context/ProductsContext";
import type { Product } from "@/types";

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

interface ProductRailProps {
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
  products: Product[] | null;
  loading: boolean;
  tone?: "muted" | "white";
}

const ProductRail = ({
  eyebrow,
  title,
  href,
  linkLabel,
  products,
  loading,
  tone = "muted",
}: ProductRailProps) => (
  <section className={`py-4 ${tone === "white" ? "bg-white" : ""}`}>
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-text sm:text-3xl">{title}</h2>
        </div>
        <Link
          to={href}
          className="noEffect inline-flex shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-colors hover:border-primary/30 hover:text-primary sm:text-sm"
        >
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5 lg:gap-6">
        {products?.map((product, index) => (
          <motion.div
            key={product.id}
            {...reveal}
            transition={{ ...reveal.transition, delay: index * 0.04 }}
          >
            <ProductCard product={product} imageSize="300.300" />
          </motion.div>
        ))}
        {loading && Array.from({ length: 5 }, (_, index) => <ProductCardSkeleton key={index} />)}
      </div>
    </div>
  </section>
);

const HomePage = () => {
  const {
    homeProducts,
    homeLoading,
    loadHomeProducts,
    popularProducts,
    popularLoading,
    loadPopularProducts,
    newestProducts,
    newestLoading,
    loadNewestProducts,
  } = useContext(ProductsContext);

  useEffect(() => {
    void loadHomeProducts();
    void loadPopularProducts();
    void loadNewestProducts();
  }, [loadHomeProducts, loadPopularProducts, loadNewestProducts]);

  return (
    <div className="min-h-screen bg-background pb-12 sm:pb-16">
      <section className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <Carousel />
      </section>

      <ProductRail
        eyebrow="Curated"
        title="Featured Products"
        href="/products"
        linkLabel="View all"
        products={homeProducts}
        loading={homeLoading}
      />

      <ProductRail
        eyebrow="Trending"
        title="Most Popular"
        href="/products?sort=rating"
        linkLabel="See top rated"
        products={popularProducts}
        loading={popularLoading}
        tone="white"
      />

      <ProductRail
        eyebrow="Fresh drops"
        title="Newest Arrivals"
        href="/products?sort=newest"
        linkLabel="See what's new"
        products={newestProducts}
        loading={newestLoading}
      />
    </div>
  );
};

export default HomePage;
