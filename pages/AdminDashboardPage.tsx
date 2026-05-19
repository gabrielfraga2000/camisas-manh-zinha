import React from 'react';
import AdminDashboard from '../components/AdminDashboard';

const AdminDashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-sunrise font-sans pb-20 selection:bg-orange-100 selection:text-orange-900">
      {/* Header */}
      <header className="pt-16 pb-12 text-center">
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2 italic">MANHÃZINHA</h1>
        <p className="text-orange-900/60 font-medium tracking-wide uppercase text-xs">Painel de Controle • Pedido #7</p>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        <AdminDashboard />
        
        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-400/60 font-medium text-[10px] uppercase tracking-[0.2em] space-y-2">
           <p>© 2026 Manhãzinha • Todos os direitos reservados</p>
           <p>Uniformes produzidos com materiais de alta performance</p>
            <a 
              href="/"
              className="mt-4 inline-block px-4 py-2 bg-gray-100 hover:bg-orange-100 text-gray-400 hover:text-orange-600 rounded-full transition-all text-[8px] tracking-widest uppercase font-black"
            >
              ← Voltar para o Formulário
            </a>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
