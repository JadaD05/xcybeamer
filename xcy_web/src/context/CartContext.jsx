import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // IMPORTANT: Initialize with empty array immediately
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        console.log('Loading cart from localStorage:', savedCart);
        
        if (savedCart && savedCart !== 'undefined' && savedCart !== 'null') {
          const parsed = JSON.parse(savedCart);
          console.log('Parsed cart:', parsed);
          
          if (Array.isArray(parsed)) {
            setCart(parsed);
          } else {
            console.warn('Saved cart is not an array, resetting to empty');
            setCart([]);
            localStorage.removeItem('cart');
          }
        } else {
          console.log('No valid cart in localStorage, starting fresh');
          setCart([]);
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        setCart([]);
        localStorage.removeItem('cart'); // Remove corrupted data
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading && Array.isArray(cart)) {
      try {
        console.log('Saving cart to localStorage:', cart);
        localStorage.setItem('cart', JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cart, isLoading]);

  const addToCart = (product) => {
    if (!product || !product._id) {
      console.error('Invalid product:', product);
      return { success: false, message: 'Invalid product' };
    }

    const existingItemIndex = cart.findIndex(item => item._id === product._id);
    
    if (existingItemIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity = (updatedCart[existingItemIndex].quantity || 1) + 1;
      setCart(updatedCart);
      return { success: true, message: 'Quantity increased!' };
    }

    setCart([...cart, { ...product, quantity: 1 }]);
    return { success: true, message: 'Added to cart!' };
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => 
      item._id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const getCartTotal = () => {
    if (!Array.isArray(cart)) return 0;
    
    return cart.reduce((total, item) => {
      const price = parseFloat(item?.price) || 0;
      const quantity = parseInt(item?.quantity) || 1;
      return total + (price * quantity);
    }, 0);
  };

  const getCartCount = () => {
    if (!Array.isArray(cart)) return 0;
    
    return cart.reduce((count, item) => {
      const quantity = parseInt(item?.quantity) || 1;
      return count + quantity;
    }, 0);
  };

  // Ensure cart is always an array before providing
  const safeCart = Array.isArray(cart) ? cart : [];

  return (
    <CartContext.Provider value={{
      cart: safeCart,
      isLoading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};