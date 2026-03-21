import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Order, Gender, AvailabilityCheck } from '../types';
import { USE_MOCK_DB, CURRENT_SEASON } from '../constants';

const COLLECTION_NAME = 'orders';

// Simplified mock storage for the listener
let mockOrders: Order[] = [];
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('manhazinha_orders');
  if (saved) mockOrders = JSON.parse(saved);
}

export const subscribeToTakenNumbers = (
  gender: Gender,
  currentPhone: string, // Added to exclude user's own numbers from being "taken"
  onUpdate: (taken: number[]) => void
) => {
  if (USE_MOCK_DB) {
    // Show numbers taken by OTHERS across all seasons
    const filtered = mockOrders
      .filter(o => o.gender === gender && o.phoneNumber !== currentPhone)
      .map(o => o.number);
    onUpdate(Array.from(new Set(filtered))); // Unique numbers
    return () => {}; 
  }

  if (!db || !gender) return () => {};

  // Check all orders for this gender
  const q = query(
    collection(db, COLLECTION_NAME),
    where("gender", "==", gender)
  );

  return onSnapshot(q, (snapshot) => {
    // Filter in JS to easily handle the phone exclusion
    const orders = snapshot.docs.map(doc => doc.data() as Order);
    const taken = orders
      .filter(o => o.phoneNumber !== currentPhone)
      .map(o => o.number);
    onUpdate(Array.from(new Set(taken)));
  }, (error) => {
    console.error("Firestore Subscribe Error:", error);
  });
};

export const subscribeToAllOrders = (
  onUpdate: (orders: (Order & { id: string })[]) => void
) => {
  if (USE_MOCK_DB) {
    onUpdate(mockOrders.map((o, i) => ({ ...o, id: `mock-${i}` })));
    return () => {};
  }

  if (!db) return () => {};

  const q = query(collection(db, COLLECTION_NAME));

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Order & { id: string }));
    orders.sort((a, b) => b.createdAt - a.createdAt);
    onUpdate(orders);
  }, (error) => {
    console.error("Firestore All Orders Error:", error);
  });
};

/**
 * MOCK IMPLEMENTATION (LOCAL STORAGE)
 */
const getMockOrders = (): Order[] => {
  const stored = localStorage.getItem('manhazinha_orders');
  return stored ? JSON.parse(stored) : [];
};

const saveMockOrder = (order: Order) => {
  const orders = getMockOrders();
  orders.push({ ...order, id: Math.random().toString(36).substr(2, 9) });
  localStorage.setItem('manhazinha_orders', JSON.stringify(orders));
};

/**
 * REAL IMPLEMENTATION (FIREBASE)
 */

export const checkNumberAvailability = async (
  number: number,
  gender: Gender,
  currentPhone: string // Now requires current phone
): Promise<AvailabilityCheck> => {
  if (USE_MOCK_DB) {
    const orders = getMockOrders();
    // Taken if exists with DIFFERENT phone
    const exists = orders.some(o => o.number === number && o.gender === gender && o.phoneNumber !== currentPhone);
    if (exists) return { available: false, message: "No seu gênero, este número já está reservado." };
    return { available: true };
  } else {
    try {
      if (!db) throw new Error("Firebase logic error: db not initialized");
      const q = query(
        collection(db, COLLECTION_NAME),
        where("number", "==", number),
        where("gender", "==", gender)
      );
      const querySnapshot = await getDocs(q);
      
      // If someone else has it, it's unavailable
      const someoneElseHasIt = querySnapshot.docs.some(doc => (doc.data() as Order).phoneNumber !== currentPhone);
      
      if (someoneElseHasIt) {
        return { available: false, message: "No seu gênero, este número já está reservado." };
      }
      return { available: true };
    } catch (error) {
      console.error("Firebase Check Error:", error);
      return { available: false, message: "Erro ao verificar disponibilidade. Verifique sua conexão." };
    }
  }
};

export const submitOrder = async (order: Order): Promise<boolean> => {
  if (USE_MOCK_DB) {
    saveMockOrder(order);
    return true;
  } else {
    try {
      if (!db) throw new Error("Firebase logic error: db not initialized");
      await addDoc(collection(db, COLLECTION_NAME), order);
      return true;
    } catch (error) {
      console.error("Firebase Submit Error:", error);
      throw error;
    }
  }
};

export const updateOrder = async (orderId: string, updates: Partial<Order>): Promise<boolean> => {
  if (USE_MOCK_DB) {
    const orders = getMockOrders();
    const index = orders.findIndex(o => (o as any).id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      localStorage.setItem('manhazinha_orders', JSON.stringify(orders));
      return true;
    }
    return false;
  } else {
    try {
      if (!db) throw new Error("Firebase logic error: db not initialized");
      const orderRef = doc(db, COLLECTION_NAME, orderId);
      await updateDoc(orderRef, updates as any);
      return true;
    } catch (error) {
      console.error("Firebase Update Error:", error);
      throw error;
    }
  }
};

export const deleteOrder = async (orderId: string): Promise<boolean> => {
  if (USE_MOCK_DB) {
    const orders = getMockOrders();
    const filtered = orders.filter(o => (o as any).id !== orderId);
    localStorage.setItem('manhazinha_orders', JSON.stringify(filtered));
    return true;
  } else {
    try {
      if (!db) throw new Error("Firebase logic error: db not initialized");
      const orderRef = doc(db, COLLECTION_NAME, orderId);
      await deleteDoc(orderRef);
      return true;
    } catch (error) {
      console.error("Firebase Delete Error:", error);
      throw error;
    }
  }
};