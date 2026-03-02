'use client';

import { Wine } from '@/lib/basket';
import { basketUtils } from '@/lib/basket';
import { ShoppingCart, Star, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface WineCardProps {
  wine: Wine;
  onAddToBasket?: () => void;
}

export default function WineCard({ wine, onAddToBasket }: WineCardProps) {
  const handleAddToBasket = () => {
    basketUtils.addItem(wine, 1);
    onAddToBasket?.();
  };

  const getBottleImage = (wineName: string, wineType: string) => {
    // High-quality champagne bottle images for each wine type
    const imageMap: { [key: string]: string } = {
      'brut tradition': 'https://images.unsplash.com/photo-1509470954-4d5c6e3c5f6d?w=400&h=600&fit=crop&auto=format',
      'blanc de blancs': 'https://images.unsplash.com/photo-1567906193903-9c6075d9f5d5?w=400&h=600&fit=crop&auto=format',
      'rosé': 'https://images.unsplash.com/photo-1578667426690-a6a4bd3b6c5e?w=400&h=600&fit=crop&auto=format',
      'vintage': 'https://images.unsplash.com/photo-1556439415-35307e8b5d2a?w=400&h=600&fit=crop&auto=format',
      'cuvée prestige': 'https://images.unsplash.com/photo-1592834758-6c5d5e8f5d2a?w=400&h=600&fit=crop&auto=format',
      'brut': 'https://images.unsplash.com/photo-1509470954-4d5c6e3c5f6d?w=400&h=600&fit=crop&auto=format',
      'classic': 'https://images.unsplash.com/photo-1578985847113-fd9c0b4b3c5e?w=400&h=600&fit=crop&auto=format',
      'chardonnay': 'https://images.unsplash.com/photo-1567906193903-9c6075d9f5d5?w=400&h=600&fit=crop&auto=format',
      'fresh': 'https://images.unsplash.com/photo-1578667426690-a6a4bd3b6c5e?w=400&h=600&fit=crop&auto=format',
      'limited': 'https://images.unsplash.com/photo-1556439415-35307e8b5d2a?w=400&h=600&fit=crop&auto=format',
      'selection': 'https://images.unsplash.com/photo-1592834758-6c5d5e8f5d2a?w=400&h=600&fit=crop&auto=format'
    };

    const name = wineName.toLowerCase();
    const type = (wineType || '').toLowerCase();
    
    // Try to match by wine name first, then by type
    for (const [key, value] of Object.entries(imageMap)) {
      if (name.includes(key) || type.includes(key)) {
        return value;
      }
    }
    
    // Default to a beautiful champagne bottle
    return 'https://images.unsplash.com/photo-1509470954-4d5c6e3c5f6d?w=400&h=600&fit=crop&auto=format';
  };

  const isPremium = wine.name.toLowerCase().includes('prestige') || wine.name.toLowerCase().includes('vintage');

  return (
    <div className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden">
      {/* Premium Badge */}
      {isPremium && (
        <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Sparkles size={16} className="flex-shrink-0" />
          Premium
        </div>
      )}

      {/* Bottle Image */}
      <div className="relative h-80 bg-gradient-to-b from-amber-50 to-amber-100 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <Image
          src={getBottleImage(wine.name, wine.meta || '')}
          alt={wine.name}
          fill
          className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-center gap-1 text-white">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className={`flex-shrink-0 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
            ))}
            <span className="text-xs ml-1">4.5</span>
          </div>
        </div>
      </div>
      
      {/* Wine Details */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-700 transition-colors">
            {wine.name}
          </h3>
          {wine.meta && (
            <p className="text-sm text-amber-600 font-medium mb-1">{wine.meta}</p>
          )}
          {wine.vintage && (
            <p className="text-sm text-gray-600">{wine.vintage}</p>
          )}
        </div>
        
        {/* Price and Add to Basket */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              €{wine.priceEUR.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">per bottle</p>
          </div>
          
          <button
            onClick={handleAddToBasket}
            disabled={wine.inStock === false}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-105 shadow-md"
          >
            <ShoppingCart size={20} className="flex-shrink-0" />
            <span className="font-medium">Add</span>
          </button>
        </div>

        {/* Additional Info */}
        {wine.description && (
          <div className="border-t pt-3">
            <p className="text-xs text-gray-600 line-clamp-2 italic">{wine.description}</p>
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
}
