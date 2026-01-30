import React from 'react';
import { SHIRT_OPTIONS } from '../constants';

interface ShirtSelectorProps {
  selectedIds: number[];
  onToggle: (id: number) => void;
}

export const ShirtSelector: React.FC<ShirtSelectorProps> = ({ selectedIds, onToggle }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {SHIRT_OPTIONS.map((shirt) => {
        const isSelected = selectedIds.includes(shirt.id);
        
        return (
          <div
            key={shirt.id}
            onClick={() => onToggle(shirt.id)}
            className={`
              relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 select-none
              ${isSelected ? 'ring-4 ring-orange-500 shadow-xl scale-[1.02]' : 'hover:shadow-lg border border-gray-200 opacity-90 hover:opacity-100'}
            `}
          >
            {/* Visual Representation of Shirt */}
            <div className={`h-48 w-full ${shirt.imageColor} flex items-center justify-center relative`}>
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/athletic-mesh.png')]"></div>
              
              {/* Fake Jersey SVG */}
              <svg viewBox="0 0 100 100" className="w-32 h-32 fill-white drop-shadow-md">
                <path d="M20,25 Q30,5 50,5 Q70,5 80,25 L95,35 L85,45 L75,35 V95 H25 V35 L15,45 L5,35 Z" />
                <text x="50" y="60" textAnchor="middle" fontSize="25" fill={shirt.imageColor === 'bg-slate-100' ? '#1e293b' : 'currentColor'} className="font-bold opacity-80">
                  {shirt.id}
                </text>
              </svg>
              
              {isSelected && (
                <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-1 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            <div className={`p-4 transition-colors ${isSelected ? 'bg-orange-50' : 'bg-white'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`font-bold text-lg ${isSelected ? 'text-orange-900' : 'text-gray-800'}`}>{shirt.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{shirt.description}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};