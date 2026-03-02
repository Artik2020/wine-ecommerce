'use client';

import { useState, useEffect } from 'react';
import { basketUtils } from '@/lib/basket';
import { ShoppingCart } from 'lucide-react';

interface BasketButtonProps {
  onClick: () => void;
}

export default function BasketButton({ onClick }: BasketButtonProps) {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    const updateItemCount = () => {
      setItemCount(basketUtils.getItemCount());
    };

    updateItemCount();

    const handleStorageChange = () => {
      updateItemCount();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('basket-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('basket-updated', handleStorageChange);
    };
  }, []);

  return (
    <button
      onClick={onClick}
      className="relative p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition-all duration-300 border border-white/30 group"
    >
      <ShoppingCart size={24} className="text-white group-hover:scale-110 transition-transform" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-pulse">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}
