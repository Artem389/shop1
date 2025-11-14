import { createContext, useReducer, useContext } from 'react';
import { createOrder, getOrders, deleteCartItem } from '../api/orders';
import { useAuth } from './AuthContext'; // Для проверки auth

const CartContext = createContext();

const initialState = {
  items: [],
  loading: false,
  error: null,
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(item => item.cart_id !== action.payload) };
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
    if (!user) return dispatch({ type: 'SET_ERROR', payload: 'Авторизуйтесь для просмотра корзины' });
    dispatch({ type: 'SET_LOADING' });
    try {
      const orders = await getOrders(user.id);
      dispatch({ type: 'LOAD_CART', payload: orders });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  };

  const addItem = async (item) => {
    if (!user) return dispatch({ type: 'SET_ERROR', payload: 'Авторизуйтесь для добавления в корзину' });
    dispatch({ type: 'ADD_ITEM', payload: item });
    // Синхронизировать с БД (создать заказ если нужно)
    await createOrder(user.id, [{ product_id: item.id, quantity: 1 }]);
  };

  const removeItem = async (cart_id) => {
    if (!user) return;
    try {
      await deleteCartItem(cart_id);
      dispatch({ type: 'REMOVE_ITEM', payload: cart_id });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  };

  return (
    <CartContext.Provider value={{ ...state, addItem, removeItem, loadCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);