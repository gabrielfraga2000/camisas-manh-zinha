import React, { useState, useEffect } from 'react';
import { subscribeToAllOrders, deleteOrder, updateOrder } from '../services/orderService';
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

  const totalRecebido = orders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  const totalPendente = orders.reduce((sum, o) => sum + (o.totalPrice - (o.paidAmount || 0)), 0);

  const handleUpdatePaidAmount = async (id: string, amount: string) => {
    const val = parseFloat(amount);
    if (isNaN(val)) return;
    try {
      await updateOrder(id, { paidAmount: val });
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar pagamento.");
    }
  };

  const getShirtName = (id: number) => SHIRT_OPTIONS.find(s => s.id === id)?.name || 'N/A';

  const exportCSV = () => {
    const headers = ['Nome', 'Sobrenome', 'Nome na Camisa', 'Genero', 'WhatsApp', 'Modelo', 'Tamanho', 'Numero', 'Temporada', 'Preco Total', 'Valor Pago'];
    const rows = filteredOrders.map(o => [
      o.firstName,
      o.lastName,
      o.shirtName,
      o.gender,
      o.phoneNumber,
      getShirtName(o.shirtId),
      o.size,
      o.number,
      o.season,
      o.totalPrice,
      o.paidAmount || 0
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

  const exportWhatsApp = () => {
    let text = "*LISTA DE PEDIDOS MANHÃZINHA*\n\n";
    
    SHIRT_OPTIONS.forEach(shirt => {
      const shirtOrders = filteredOrders.filter(o => o.shirtId === shirt.id);
      if (shirtOrders.length > 0) {
        text += `*--- ${shirt.name.toUpperCase()} ---*\n`;
        shirtOrders.forEach(o => {
          text += `${o.firstName} ${o.lastName} - ${o.shirtName} - #${o.number} - ${o.size}\n`;
        });
        text += "\n";
      }
    });

    navigator.clipboard.writeText(text);
    alert("Lista formatada para WhatsApp copiada para a área de transferência!");
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("🚨 Tem certeza que deseja EXCLUIR este pedido? Esta ação é permanente e removerá o horário/número escolhido do sistema.")) {
      try {
        await deleteOrder(id);
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir o pedido. Tente novamente.");
      }
    }
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
          <div className="flex gap-4 mt-4">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Recebido</p>
              <p className="text-2xl font-black text-emerald-900 leading-none">R$ {totalRecebido.toFixed(2)}</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-3xl">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Total Pendente</p>
              <p className="text-2xl font-black text-orange-900 leading-none">R$ {totalPendente.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Pesquisar..."
            className="flex-1 md:w-48 p-4 bg-white/80 border border-orange-100 rounded-2xl shadow-sm focus:border-orange-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={exportWhatsApp}
            className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-xl flex items-center gap-2"
          >
            <span>📱</span> Lista WhatsApp
          </button>
          <button 
            onClick={exportCSV}
            className="bg-purple-900 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-purple-800 transition-all shadow-xl flex items-center gap-2"
          >
            <span>📥</span> CSV
          </button>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-orange-50/50">
                <th className="p-6 text-xs font-black text-orange-900 uppercase tracking-widest">Cliente</th>
                <th className="p-6 text-xs font-black text-orange-900 uppercase tracking-widest">Personalização</th>
                <th className="p-6 text-xs font-black text-orange-900 uppercase tracking-widest">Produto</th>
                <th className="p-6 text-xs font-black text-orange-900 uppercase tracking-widest">Número</th>
                <th className="p-6 text-xs font-black text-orange-900 uppercase tracking-widest">Temporada</th>
                <th className="p-6 text-xs font-black text-orange-900 uppercase tracking-widest text-right">Total</th>
                <th className="p-6 text-xs font-black text-orange-900 uppercase tracking-widest text-center">Pagamento</th>
                <th className="p-6 text-xs font-black text-orange-900 uppercase tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                      <p className="text-gray-400 font-bold text-sm animate-pulse">Carregando pedidos...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
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
                      <div className="flex flex-col">
                        <span className="font-black text-orange-600 uppercase tracking-tighter italic text-lg leading-none mb-1">
                          {order.shirtName}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Nome na Camisa</span>
                      </div>
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
                    <td className="p-6">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg italic">
                        {order.season}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <span className="font-black text-gray-900">R$ {order.totalPrice.toFixed(2)}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">R$</span>
                          <input 
                            type="number" 
                            step="0.1"
                            defaultValue={order.paidAmount || 0}
                            onBlur={(e) => handleUpdatePaidAmount(order.id, e.target.value)}
                            className="w-20 p-1 bg-white border border-gray-100 rounded-lg font-bold text-sm text-center outline-none focus:border-orange-500"
                          />
                        </div>
                        { (order.paidAmount || 0) >= order.totalPrice ? (
                          <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Pago</span>
                        ) : (order.paidAmount || 0) > 0 ? (
                          <span className="text-[8px] font-black bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Parcial</span>
                        ) : (
                          <span className="text-[8px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Pendente</span>
                        )}
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <button 
                        onClick={() => handleDelete(order.id)}
                        className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Excluir Pedido"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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
