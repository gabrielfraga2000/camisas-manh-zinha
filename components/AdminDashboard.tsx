import React, { useState, useEffect } from 'react';
import { subscribeToAllOrders } from '../services/orderService';
import { Order } from '../types';
import { SHIRT_OPTIONS } from '../constants';

const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<(Order & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToAllOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter(o => 
    o.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.phoneNumber.includes(searchTerm) ||
    o.number.toString().includes(searchTerm)
  );

  const getShirtName = (id: number) => SHIRT_OPTIONS.find(s => s.id === id)?.name || 'N/A';

  const exportCSV = () => {
    const headers = ['Nome', 'Sobrenome', 'Genero', 'WhatsApp', 'Modelo', 'Tamanho', 'Numero', 'Preco Total'];
    const rows = filteredOrders.map(o => [
      o.firstName,
      o.lastName,
      o.gender,
      o.phoneNumber,
      getShirtName(o.shirtId),
      o.size,
      o.number,
      o.totalPrice
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pedidos_manhazinha_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Painel de Pedidos</h1>
          <div className="flex items-center gap-3">
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-orange-200">
              {orders.length} Pedidos Totais
            </span>
            <span className="text-gray-400 text-sm font-medium italic">Manhãzinha 2026</span>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Pesquisar por nome, tel ou número..."
            className="flex-1 md:w-64 p-4 bg-white/80 border border-orange-100 rounded-2xl shadow-sm focus:border-orange-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={exportCSV}
            className="bg-purple-900 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-purple-800 transition-all shadow-xl flex items-center gap-2"
          >
            <span>📥</span> Exportar CSV
          </button>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-orange-50/50">
                <th className="p-6 text-xs font-black text-orange-900 uppercase tracking-widest">Cliente</th>
                <th className="p-6 text-xs font-black text-orange-900 uppercase tracking-widest">Gênero</th>
                <th className="p-6 text-xs font-black text-orange-900 uppercase tracking-widest">Produto</th>
                <th className="p-6 text-xs font-black text-orange-900 uppercase tracking-widest">Número</th>
                <th className="p-6 text-xs font-black text-orange-900 uppercase tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100/30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                      <p className="text-gray-400 font-bold text-sm animate-pulse">Carregando pedidos...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <p className="text-gray-400 font-bold italic">Nenhum pedido encontrado.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-orange-50/30 transition-colors group">
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-lg">{order.firstName} {order.lastName}</span>
                        <span className="text-xs text-gray-400 font-medium group-hover:text-orange-500 transition-colors">{order.phoneNumber}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        order.gender === 'MASCULINO' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                      }`}>
                        {order.gender}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-700 text-sm">{getShirtName(order.shirtId)}</span>
                        <span className="text-[10px] text-orange-600 font-black uppercase tracking-widest">Tamanho {order.size}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="w-10 h-10 bg-white border-2 border-orange-100 rounded-xl flex items-center justify-center font-black text-orange-900 shadow-sm group-hover:scale-110 group-hover:border-orange-300 transition-all">
                        {order.number.toString().padStart(2, '0')}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <span className="font-black text-gray-900">R$ {order.totalPrice.toFixed(2)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Gerenciamento de Pedidos Manhãzinha • v1.0</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
