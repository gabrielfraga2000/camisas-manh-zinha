import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Order, Gender, AvailabilityCheck } from '../types';
import { USE_MOCK_DB } from '../constants';

const COLLECTION_NAME = 'orders';

// Simplified mock storage for the listener
let mockOrders: Order[] = [];
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('manhazinha_orders');
  if (saved) mockOrders = JSON.parse(saved);
}

export const subscribeToTakenNumbers = (
  gender: Gender,
  onUpdate: (taken: number[]) => void
) => {
  if (USE_MOCK_DB) {
    // Simulate initial call
    const filtered = mockOrders.filter(o => o.gender === gender).map(o => o.number);
    onUpdate(filtered);
    return () => {}; // Nothing to unsubscribe in mock
  }

  if (!db) return () => {};

  const q = query(
    collection(db, COLLECTION_NAME),
    where("gender", "==", gender)
  );

  return onSnapshot(q, (snapshot) => {
    const taken = snapshot.docs.map(doc => (doc.data() as Order).number);
    onUpdate(taken);
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
    onUpdate(orders);
  }, (error) => {
    console.error("Firestore All Orders Error:", error);
  });
};

/**
 * MOCK IMPLEMENTATION (LOCAL STORAGE)
 * Allows the user to test the logic without setting up Firebase immediately.
 */
const getMockOrders = (): Order[] => {
  const stored = localStorage.getItem('mock_orders');
  return stored ? JSON.parse(stored) : [];
};

const saveMockOrder = (order: Order) => {
  const orders = getMockOrders();
  orders.push({ ...order, id: Math.random().toString(36).substr(2, 9) });
  localStorage.setItem('mock_orders', JSON.stringify(orders));
};

/**
 * REAL IMPLEMENTATION (FIREBASE)
 */

export const checkNumberAvailability = async (
  number: number,
  gender: Gender
): Promise<AvailabilityCheck> => {
  if (USE_MOCK_DB) {
    await new Promise(resolve => setTimeout(resolve, 600)); 
    const orders = getMockOrders();
    const exists = orders.some(o => o.number === number && o.gender === gender);
    if (exists) return { available: false, message: `O número ${number} já foi escolhido para o gênero ${gender === 'MASCULINO' ? 'Masculino' : 'Feminino'}.` };
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
      if (!querySnapshot.empty) {
        return { available: false, message: `O número ${number} já foi escolhido para o gênero ${gender === 'MASCULINO' ? 'Masculino' : 'Feminino'}.` };
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
    await new Promise(resolve => setTimeout(resolve, 1000));
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