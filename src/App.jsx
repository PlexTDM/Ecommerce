import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Provider } from "react-redux"
import store from "./redux/store"
import {
  Products,
  AboutPage,
  ContactPage,
  Cart,
  Login,
  Register,
  Checkout,
  PageNotFound,
  Home,
  Product,
} from "./pages"
import ScrollToTop from "./components/ScrollToTop"
import { Toaster } from "react-hot-toast"
import { ProductsProvider } from "./context/ProductsContext"
import { Footer, Navbar } from "./components"

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop>
        <Provider store={store}>
          <ProductsProvider>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:page" element={<Products />} />
              <Route path="/product/:id" element={<Product />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="*" element={<PageNotFound />} />
              <Route path="/product/*" element={<PageNotFound />} />
            </Routes>
            <Footer />
          </ProductsProvider>
        </Provider>
      </ScrollToTop>
      <Toaster />
    </BrowserRouter>
  );
}

export default App
