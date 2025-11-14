import { createContext, useReducer, useContext } from 'react';
import { createOrder, getOrders, deleteCartItem, updateCartQuantity, addToCart } from '../api/orders';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const initialState = {
  items: [],
  loading: false,
  error: null,
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'LOAD_CART':
      return { ...state, items: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: true };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user } = useAuth();

  const loadCart = async () => {
    if (!user) {
      dispatch({ type: 'SET_ERROR', payload: 'Авторизуйтесь для просмотра корзины' });
      return;
    }
    dispatch({ type: 'SET_LOADING' });
    try {
      const orders = await getOrders(user.id);
      const cartItems = orders.filter(o => !o.payment_date);
      dispatch({ type: 'LOAD_CART', payload: cartItems });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  };

  const addItem = async (item) => {
    if (!user) {
      dispatch({ type: 'SET_ERROR', payload: 'Авторизуйтесь для добавления в корзину' });
      return;
    }
    try {
      let orders_id = state.items[0]?.id_orders;
      if (!orders_id) {
        const newOrder = await createOrder(user.id, [{ product_id: item.id, quantity: 1 }]);
        orders_id = newOrder.id_orders;
      } else {
        await addToCart(orders_id, item.id, 1);
      }
      await loadCart();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  };

  const removeItem = async (cart_id) => {
    if (!user) return;
    try {
      await deleteCartItem(cart_id);
      await loadCart();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  };

  const updateQuantity = async (cart_id, newQuantity) => {
    if (!user) return;
    try {
      if (newQuantity <= 0) {
        await deleteCartItem(cart_id);
      } else {
        await updateCartQuantity(cart_id, newQuantity);
      }
      await loadCart();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  };

  return (
    <CartContext.Provider value={{ ...state, addItem, removeItem, updateQuantity, loadCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);