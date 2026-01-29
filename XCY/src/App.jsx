import { Routes, Route } from "react-router-dom";
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

function App() {
  return (
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
      <Route path="/key-management" element={<KeyManagement />} />
    </Routes>
  );
}

export default App;
