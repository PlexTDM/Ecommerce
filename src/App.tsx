import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import store from "@/redux/store";
import ScrollToTop from "@/components/ScrollToTop";
import { ProductsProvider } from "@/context/ProductsContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Home = lazy(() => import("@/pages/HomePage"));
const Products = lazy(() => import("@/pages/Products"));
const Product = lazy(() => import("@/pages/ProductSinglePage"));
const Categories = lazy(() => import("@/pages/Categories"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Profile = lazy(() => import("@/pages/Profile"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const PageNotFound = lazy(() => import("@/pages/PageNotFound"));

const RouteFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div
      role="status"
      aria-label="Loading page"
      className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600"
    />
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop>
        <Provider store={store}>
          <ProductsProvider>
            <Navbar />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:page" element={<Products />} />
                <Route path="/product/:id" element={<Product />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/account" element={<Profile />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </Suspense>
            <Footer />
          </ProductsProvider>
        </Provider>
      </ScrollToTop>
      <Toaster />
    </BrowserRouter>
  );
};

export default App;
