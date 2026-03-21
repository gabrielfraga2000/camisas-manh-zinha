export type Gender = 'MASCULINO' | 'FEMININO';

export type ShirtSize = 'PP' | 'P' | 'M' | 'G' | 'GG' | 'XG';

export interface ShirtOption {
  id: number;
  name: string;
  description: string;
  imageColor: string; // Used for the placeholder visualization
}

export interface Order {
  id?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  shirtName: string; // Name to be printed on the shirt
  shirtId: number;
  size: ShirtSize;
  gender: Gender;
  number: number;
  totalPrice: number;
  createdAt: number;
  season: string;
}

export interface AvailabilityCheck {
  available: boolean;
  message?: string;
}