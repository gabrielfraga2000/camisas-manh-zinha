import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Order, Gender, AvailabilityCheck } from "../types";
import { USE_MOCK_DB } from "../constants";

const COLLECTION_NAME = "orders";

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
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600)); 
    
    const orders = getMockOrders();
    const exists = orders.some(o => o.number === number && o.gender === gender);
    
    if (exists) {
      return { available: false, message: `O número ${number} já foi escolhido para o gênero ${gender === 'MASCULINO' ? 'Masculino' : 'Feminino'}.` };
    }
    return { available: true };
  } else {
    try {
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
      // Fallback or error handling
      return { available: false, message: "Erro ao verificar disponibilidade. Verifique a configuração do Firebase." };
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
      await addDoc(collection(db, COLLECTION_NAME), order);
      return true;
    } catch (error) {
      console.error("Firebase Submit Error:", error);
      throw error;
    }
  }
};