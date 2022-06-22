import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const {data: productData} = await api.get(`products/${productId}`);
      const {data: stockItemByIdData} = await api.get(`stock/${productId}`);
      
      let newCart = [...cart];
      let newAmount = 0;
      
      const productIndex = newCart.findIndex((product) => product.id === productId)
      
      if(productIndex === -1){
        newCart.push({...productData, amount: 1})
        newAmount = 1;
      } else {
        newAmount = newCart[productIndex].amount + 1;
        if(stockItemByIdData.amount >= newAmount) newCart[productIndex].amount = newAmount;
      }
      
      if(stockItemByIdData.amount < newAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const newCart = [...cart]
      const productIndex = newCart.findIndex((product) => product.id === productId)

      if(productIndex === -1) {
        toast.error('Erro na remoção do produto');
        return;
      }

      newCart.splice(productIndex, 1);
      
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if(amount <= 0) return;
      const {data: stockItemByIdData} = await api.get(`stock/${productId}`);

      if(amount > stockItemByIdData.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      let newCart = [...cart];
      const productIndex = newCart.findIndex((product) => product.id === productId)
      newCart[productIndex].amount = amount;

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
