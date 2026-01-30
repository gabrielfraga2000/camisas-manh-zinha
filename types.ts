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
  customerName: string;
  email: string; // Useful for contact
  shirtId: number;
  size: ShirtSize;
  gender: Gender;
  number: number;
  createdAt: number;
}

export interface AvailabilityCheck {
  available: boolean;
  message?: string;
}