import React, { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

// Начальное состояние корзины
const initialCartState = {
  items: [],
  totalAmount: 0,
  totalItems: 0
};

// Функция-редьюсер для управления состоянием корзины
const cartReducer = (state, action) => {
  switch (action.type) {
    
    // Добавление товара в корзину 
    case 'ADD_ITEM': {
      const { name, price } = action.payload;
      
      // Создаём ГЛУБОКУЮ копию массива items
      const currentItems = [...state.items];
      const existingItemIndex = currentItems.findIndex(item => item.name === name);
      
      // Если товар уже есть в корзине
      if (existingItemIndex >= 0) {
        // Создаём новый объект товара с обновлённым количеством
        const updatedItem = {
          ...currentItems[existingItemIndex],
          quantity: currentItems[existingItemIndex].quantity + 1
        };
        
        // Создаём новый массив с обновлённым товаром
        const updatedItems = [
          ...currentItems.slice(0, existingItemIndex),
          updatedItem,
          ...currentItems.slice(existingItemIndex + 1)
        ];
        
        return {
          ...state,
          items: updatedItems,
          totalAmount: Math.round((state.totalAmount + price) * 100) / 100, // Округление
          totalItems: state.totalItems + 1
        };
      } 
      // Если товара нет в корзине
      else {
        const newItem = { 
          name, 
          price: Math.round(price * 100) / 100, // Округление цены
          quantity: 1 
        };
        
        return {
          ...state,
          items: [...currentItems, newItem],
          totalAmount: Math.round((state.totalAmount + price) * 100) / 100, // Округление
          totalItems: state.totalItems + 1
        };
      }
    }
    
    // Удаление одной единицы товара
    case 'REMOVE_ONE_ITEM': {
      const { name, price } = action.payload;
      const currentItems = [...state.items];
      const existingItemIndex = currentItems.findIndex(item => item.name === name);
      
      if (existingItemIndex >= 0) {
        const existingItem = currentItems[existingItemIndex];
        
        // Если количество больше 1 - уменьшаем
        if (existingItem.quantity > 1) {
          const updatedItem = {
            ...existingItem,
            quantity: existingItem.quantity - 1
          };
          
          const updatedItems = [
            ...currentItems.slice(0, existingItemIndex),
            updatedItem,
            ...currentItems.slice(existingItemIndex + 1)
          ];
          
          return {
            ...state,
            items: updatedItems,
            totalAmount: Math.round((state.totalAmount - price) * 100) / 100,
            totalItems: state.totalItems - 1
          };
        } 
        // Если количество = 1 - удаляем товар полностью
        else {
          const filteredItems = currentItems.filter((item, index) => index !== existingItemIndex);
          
          return {
            ...state,
            items: filteredItems,
            totalAmount: Math.round((state.totalAmount - price) * 100) / 100,
            totalItems: state.totalItems - 1
          };
        }
      }
      return state;
    }
    
    // Полное удаление товара из корзины
    case 'REMOVE_ITEM': {
      const { name } = action.payload;
      const currentItems = [...state.items];
      const existingItemIndex = currentItems.findIndex(item => item.name === name);
      
      if (existingItemIndex >= 0) {
        const existingItem = currentItems[existingItemIndex];
        const itemTotal = existingItem.price * existingItem.quantity;
        const filteredItems = currentItems.filter((item, index) => index !== existingItemIndex);
        
        return {
          ...state,
          items: filteredItems,
          totalAmount: Math.round((state.totalAmount - itemTotal) * 100) / 100,
          totalItems: state.totalItems - existingItem.quantity
        };
      }
      return state;
    }
    
    // Очистка всей корзины
    case 'CLEAR_CART': {
      return initialCartState;
    }
    
    // Действие по умолчанию
    default: {
      return state;
    }
  }
};

// Провайдер контекста корзины
export const CartProvider = ({ children }) => {
  const [cartState, dispatch] = useReducer(cartReducer, initialCartState);

  // Функция для добавления товара в корзину
  const addItem = (item) => {
    // Округляем цену перед добавлением
    const roundedItem = {
      ...item,
      price: Math.round(item.price * 100) / 100
    };
    
    dispatch({ 
      type: 'ADD_ITEM', 
      payload: roundedItem 
    });
  };

  // Функция для удаления одной единицы товара
  const removeOneItem = (item) => {
    const roundedItem = {
      ...item,
      price: Math.round(item.price * 100) / 100
    };
    
    dispatch({ 
      type: 'REMOVE_ONE_ITEM', 
      payload: roundedItem 
    });
  };

  // Функция для полного удаления товара из корзины
  const removeItem = (item) => {
    dispatch({ 
      type: 'REMOVE_ITEM', 
      payload: item 
    });
  };

  // Функция для очистки всей корзины
  const clearCart = () => {
    dispatch({ 
      type: 'CLEAR_CART' 
    });
  };

  // Функция для вычисления общей суммы
  const getTotalPrice = () => {
    return cartState.totalAmount;
  };

  // Функция для получения количества товаров в корзине
  const getItemCount = () => {
    return cartState.totalItems;
  };

  // Функция для проверки наличия товара в корзине
  const isItemInCart = (itemName) => {
    return cartState.items.some(item => item.name === itemName);
  };

  // Значение контекста 
  const cartContextValue = {
    cart: {
      items: cartState.items
    },
    cartState,
    addItem,
    removeOneItem,
    removeItem,
    clearCart,
    getTotalPrice,
    getItemCount,
    isItemInCart
  };

  return (
    <CartContext.Provider value={cartContextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Кастомный хук для использования контекста корзины
export const useCart = () => {
  const context = useContext(CartContext);
  
  return context;
};


