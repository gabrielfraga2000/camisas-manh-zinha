import { ShirtOption, ShirtSize } from './types';

export const SHIRT_OPTIONS: ShirtOption[] = [
  {
    id: 1,
    name: "Titular Oficial",
    description: "Azul Marinho com detalhes dourados. O clássico.",
    imageColor: "bg-blue-900"
  },
  {
    id: 2,
    name: "Visitante (Branca)",
    description: "Branca com faixas laterais azuis. Leve e respirável.",
    imageColor: "bg-slate-100"
  },
  {
    id: 3,
    name: "Treino (Laranja)",
    description: "Laranja vibrante para visibilidade em quadra.",
    imageColor: "bg-orange-500"
  },
  {
    id: 4,
    name: "Libero (Vermelha)",
    description: "Vermelho intenso, destaque total na defesa.",
    imageColor: "bg-red-600"
  },
  {
    id: 5,
    name: "Edição Especial (Preta)",
    description: "All-black com logos em cinza fosco. Estilo puro.",
    imageColor: "bg-zinc-900"
  }
];

export const SIZES: ShirtSize[] = ['PP', 'P', 'M', 'G', 'GG', 'XG'];

// This flag controls whether we use LocalStorage (Demo) or Firebase (Real)
// Set to FALSE to use Real Firebase after configuring it.
export const USE_MOCK_DB = true;