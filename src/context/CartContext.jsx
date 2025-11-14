import { createContext, useReducer, useContext } from 'react';
import { createOrder, getOrders, deleteCartItem, updateCartQuantity } from '../api/orders';
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
      const existingIndex = state.items.findIndex(i => i.product_id === action.payload.product_id);
      if (existingIndex !== -1) {
        const updatedItems = [...state.items];
        updatedItems[existingIndex].quantity += action.payload.quantity;
        return { ...state, items: updatedItems };
      }
      return { ...state, items: [...state.items, action.payload] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(item => item.cart_id !== action.payload) };
    case 'UPDATE_QUANTITY':
      return { ...state, items: state.items.map(item => 
        item.cart_id === action.payload.cart_id ? { ...item, quantity: action.payload.quantity } : item
      ) };
    case 'LOAD_CART':
      // Аггрегируем по product_id
      const aggregated = action.payload.reduce((acc, item) => {
        const existing = acc.find(i => i.product_id === item.product_id);
        if (existing) {
          existing.quantity += item.quantity;
          existing.cart_id = item.cart_id; // Последний cart_id для удаления/обновления
        } else {
          acc.push({ ...item });
        }
        return acc;
      }, []);
      return { ...state, items: aggregated, loading: false };
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
    await createOrder(user.id, [{ product_id: item.id, quantity: 1 }]);
    dispatch({ type: 'ADD_ITEM', payload: { ...item, product_id: item.id, quantity: 1 } });
    loadCart(); // Перезагрузить для синхронизации
  };

  const removeItem = async (cart_id, currentQuantity) => {
    if (!user) return;
    try {
      if (currentQuantity > 1) {
        const newQuantity = currentQuantity - 1;
        await updateCartQuantity(cart_id, newQuantity);
        dispatch({ type: 'UPDATE_QUANTITY', payload: { cart_id, quantity: newQuantity } });
      } else {
        await deleteCartItem(cart_id);
        dispatch({ type: 'REMOVE_ITEM', payload: cart_id });
      }
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