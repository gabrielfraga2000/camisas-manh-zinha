import { ShirtOption, ShirtSize } from './types';

export const SHIRT_OPTIONS: ShirtOption[] = [
  {
    id: 1,
    name: "Manga",
    description: "Toque macio e acabamento premium. Ideal para eventos formais.",
    imageColor: "bg-orange-100", // Light sunrise color
    type: 'MANGA'
  },
  {
    id: 2,
    name: "Regata",
    description: "Frescor e conforto para o dia a dia. Perfeita para o calor.",
    imageColor: "bg-yellow-50", // Soft morning sun
    type: 'REGATA'
  }
];

export const SIZES: ShirtSize[] = ['PP', 'P', 'M', 'G', 'GG', 'XG'];

export const PRICES: Record<number, number> = {
  1: 70,
  2: 60
};

export const PIX_KEY = "voleimanhazinha@gmail.com";

export const CURRENT_SEASON = "#6"; // Identified as the 6th ordering cycle

export const INSTALLMENT_INFO = {
  first: "50% (agora para reserva)",
  second: "50% (na entrega - previsão Abril/2026)",
};

// Set to FALSE to use Real Firebase with user credentials
export const USE_MOCK_DB = false;