import { Routes, Route } from "react-router-dom";
import { CartProvider } from './context/CartContext';
import Home from "./pages/Home";
import Products from "./pages/Products";
import SignIn from "./pages/Signin";
import SignUp from "./pages/Signup";
import Support from "./pages/Support";
import Contact from "./pages/Contact";
import Document from "./pages/Documents";
import Client from "./pages/Client";
import Admin from "./pages/AdminDashboard";
import KeyManagement from "./KeyManagement";
import ProductDetail from './pages/ProductDetail';
import Status from "./pages/Status";
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';
import OrdersPage from './pages/OrdersPage.jsx';
import ProductKeysPage from "./pages/ProductKeysPage.jsx";

function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/support" element={<Support />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/documents" element={<Document />} />
        <Route path="/client" element={<Client />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/status" element={<Status />} />
        <Route path="/cart" element={<Cart />} />\
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/keys" element={<ProductKeysPage />} />
      </Routes>
    </CartProvider>
  );
}

export default App;
