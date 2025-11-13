import { createContext, useReducer, useContext } from 'react';
import { addToCart, getCart, deleteFromCart } from '../api/cart';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const initialState = {
  items: [],
  loading: false,
  error: null,
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(item => item.product_id === action.payload.product_id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(item =>
            item.product_id === action.payload.product_id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(item => item.product_id !== action.payload) };
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
      const cartItems = await getCart(user.id);
      // Map to have id = product_id for consistency
      const mapped = cartItems.map(item => ({ ...item, id: item.product_id }));
      dispatch({ type: 'LOAD_CART', payload: mapped });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  };

  const addItem = async (item) => {
    if (!user) return dispatch({ type: 'SET_ERROR', payload: 'Авторизуйтесь для добавления в корзину' });
    try {
      await addToCart(user.id, item.id); // id = product_id
      dispatch({ type: 'ADD_ITEM', payload: { product_id: item.id, ...item } });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  };

  const removeItem = async (product_id) => {
    if (!user) return;
    try {
      await deleteFromCart(user.id, product_id);
      dispatch({ type: 'REMOVE_ITEM', payload: product_id });
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