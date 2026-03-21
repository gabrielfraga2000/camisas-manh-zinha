import React, { useState, useEffect } from 'react';
import { SHIRT_OPTIONS, SIZES, PRICES, PIX_KEY, USE_MOCK_DB, CURRENT_SEASON } from '../constants';
import { Gender, Order, ShirtSize } from '../types';
import { checkNumberAvailability, submitOrder, subscribeToTakenNumbers } from '../services/orderService';
import StepProgressBar from '../components/StepProgressBar';
import Toast from '../components/Toast';

const OrderForm: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Form State
  const [gender, setGender] = useState<Gender>('MASCULINO');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Multi-shirt selection state
  // Stores which shirt IDs are selected
  const [selectedShirtIds, setSelectedShirtIds] = useState<number[]>([]);
  // Stores details for each shirt model independently
  const [shirtNumber, setShirtNumber] = useState('');
  const [shirtDetails, setShirtDetails] = useState<Record<number, { size: ShirtSize; name: string }>>(
    SHIRT_OPTIONS.reduce((acc, shirt) => ({
      ...acc,
      [shirt.id]: { size: 'M' as ShirtSize, name: '' }
    }), {})
  );

  const [takenNumbers, setTakenNumbers] = useState<number[]>([]);
  const [showMeasures, setShowMeasures] = useState(false);

  // Real-time taken numbers subscription
  useEffect(() => {
    const unsubscribe = subscribeToTakenNumbers(gender, phone, (taken) => {
      setTakenNumbers(taken.sort((a, b) => a - b));
    });
    return () => unsubscribe();
  }, [gender, phone]);

  // --- Handlers ---

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 11) setPhone(val);
  };

  const updateShirtDetail = (id: number, field: string, value: string) => {
    setShirtDetails(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const toggleShirtSelection = (id: number) => {
    setSelectedShirtIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const validateStep1 = () => {
    if (!gender) {
      setErrorMsg("Por favor, selecione seu gênero.");
      return false;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("Por favor, preencha seu nome e sobrenome.");
      return false;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setErrorMsg("Por favor, insira um telefone válido com DDD.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (selectedShirtIds.length === 0) {
      setErrorMsg("Selecione pelo menos um modelo de camisa.");
      return false;
    }

    if (!shirtNumber) {
      setErrorMsg("Escolha o número para sua camisa.");
      return false;
    }

    const numInt = parseInt(shirtNumber, 10);
    if (isNaN(numInt) || numInt < 0 || numInt > 99) {
      setErrorMsg("Número inválido.");
      return false;
    }

    if (takenNumbers.includes(numInt)) {
      setErrorMsg("No seu gênero, este número já está reservado.");
      return false;
    }

    for (const id of selectedShirtIds) {
      const details = shirtDetails[id];
      const modelName = SHIRT_OPTIONS.find(s => s.id === id)?.name;

      if (!details.name.trim()) {
        setErrorMsg(`Digite o nome para a camisa ${modelName}.`);
        return false;
      }
    }
    return true;
  };

  const nextStep = async () => {
    setErrorMsg(null);
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      // Final full verification
      if (!validateStep1() || !validateStep2()) {
        setLoading(false);
        return;
      }

      // Create multiple order objects if needed
      const promises = selectedShirtIds.map(id => {
        const details = shirtDetails[id];
        const order: Order = {
          firstName,
          lastName,
          phoneNumber: phone,
          gender: gender!,
          shirtName: details.name.toUpperCase(),
          shirtId: id,
          size: details.size,
          number: parseInt(shirtNumber, 10),
          totalPrice: PRICES[id],
          createdAt: Date.now(),
          season: CURRENT_SEASON
        };
        return submitOrder(order);
      });

      await Promise.all(promises);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Total calculation
  const totalAmount = selectedShirtIds.reduce((sum, id) => sum + PRICES[id], 0);

  // --- Render logic ---

  if (success) {
    return (
      <div className="min-h-screen bg-sunrise flex items-center justify-center p-6 text-center">
        <div className="glass-card max-w-lg w-full p-10 rounded-[3rem] animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-black mb-2 tracking-tight transition-all">Pedido Confirmado!</h2>
          <p className="text-gray-500 mb-8 font-medium">Obrigado, {firstName}! Seus mantos estão garantidos.</p>
          
          <div className="bg-white/50 rounded-3xl p-6 mb-8 text-left border border-white">
             {selectedShirtIds.map(id => (
               <div key={id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-bold text-gray-700">{SHIRT_OPTIONS.find(s => s.id === id)?.name}</span>
                  <span className="text-sm font-black text-orange-600">R$ {PRICES[id].toFixed(2)}</span>
               </div>
             ))}
             <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                <span className="text-xs font-black text-gray-400 uppercase">Total Geral</span>
                <span className="text-xl font-black text-gray-900">R$ {totalAmount.toFixed(2)}</span>
             </div>
          </div>

          <button onClick={() => window.location.reload()} className="btn-primary w-full py-4 font-bold text-lg">Início</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sunrise font-sans pb-20 selection:bg-orange-100 selection:text-orange-900">
      <header className="pt-16 pb-12 text-center">
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2 italic">MANHÃZINHA</h1>
        <p className="text-orange-900/60 font-medium tracking-wide uppercase text-xs">Pedido #6 • Coleção 2026</p>
      </header>

      <main className="max-w-4xl mx-auto px-6">
        <StepProgressBar currentStep={step} onStepClick={async (s) => {
          if (s === step) return;
          if (s < step) {
            setStep(s);
          } else {
             // To go forward, must validate intermediate steps
             if (step === 1) {
                if (validateStep1()) {
                   // If clicking 3 from 1, we still stop at 2 because 2 needs to be filled
                   setStep(2);
                }
             } else if (step === 2) {
                setLoading(true);
                const ok = await validateStep2();
                setLoading(false);
                if (ok) setStep(3);
             }
          }
        }} />

        <div className="glass-card rounded-[3rem] p-8 md:p-12 min-h-[500px] flex flex-col items-center">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="w-full max-w-xl animate-fade-in-up">
              <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Suas Informações</h2>
              <p className="text-gray-500 mb-10 font-medium">Preencha seus dados para identificação.</p>

              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Gênero do Manto</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['MASCULINO', 'FEMININO'].map(g => (
                      <button
                        key={g}
                        onClick={() => setGender(g as Gender)}
                        className={`p-6 rounded-[2rem] flex flex-col items-center transition-all border-2 ${
                          gender === g ? 'bg-orange-50 border-orange-500 text-orange-900 shadow-xl scale-[1.02]' : 'bg-white border-gray-50 text-gray-300'
                        }`}
                      >
                        <span className="text-4xl mb-2">{g === 'MASCULINO' ? '🧑' : '👩'}</span>
                        <span className="font-black uppercase text-[10px] tracking-widest">{g}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 ml-2 uppercase tracking-widest">Nome</label>
                    <input type="text" placeholder="Gabriel" className="w-full p-4 bg-white/50 border border-gray-100 rounded-2xl input-glow font-bold" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 ml-2 uppercase tracking-widest">Sobrenome</label>
                    <input type="text" placeholder="Fraga" className="w-full p-4 bg-white/50 border border-gray-100 rounded-2xl input-glow font-bold" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 ml-2 uppercase tracking-widest">WhatsApp</label>
                  <input type="tel" placeholder="(21) 99999-9999" className="w-full p-4 bg-white/50 border border-gray-100 rounded-2xl input-glow font-bold" value={phone} onChange={handlePhoneChange} />
                </div>
              </div>

              <div className="mt-12 flex justify-end">
                <button onClick={nextStep} className="btn-primary px-12 py-4 font-black flex items-center shadow-2xl group">
                  Próximo Passo
                  <svg className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="w-full animate-fade-in-up">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-8">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Escolha os Modelos</h2>
                  <p className="text-gray-500 font-medium italic">Você pode selecionar um ou ambos.</p>
                </div>
                
                {/* Global Number Selection */}
                <div className="bg-white p-6 rounded-[2.5rem] border-2 border-orange-100 shadow-xl flex items-center gap-6 animate-fade-in-right">
                   <div>
                      <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Seu Número</label>
                      <input 
                        type="text" maxLength={2} placeholder="10"
                        className="w-20 p-2 bg-orange-50 border-2 border-orange-100 rounded-xl font-black text-3xl text-center outline-none focus:border-orange-500 text-orange-900"
                        value={shirtNumber}
                        onChange={e => setShirtNumber(e.target.value.replace(/\D/g, ''))}
                      />
                   </div>
                   <button onClick={prevStep} className="text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-orange-600 border-l border-gray-100 pl-6 h-12">← Voltar</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {SHIRT_OPTIONS.map((shirt) => {
                  const isSelected = selectedShirtIds.includes(shirt.id);
                  const details = shirtDetails[shirt.id];
                  
                  return (
                    <div 
                      key={shirt.id}
                      onClick={() => toggleShirtSelection(shirt.id)}
                      className={`group cursor-pointer p-8 rounded-[3rem] border-4 transition-all relative ${
                        isSelected ? 'border-orange-500 bg-white shadow-2xl scale-[1.02]' : 'border-white/50 bg-white/20 hover:bg-white/40'
                      }`}
                    >
                      {isSelected && <div className="absolute -top-3 -right-3 bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black animate-pop-in">✓</div>}
                      
                      <div className={`aspect-square w-full rounded-2xl ${shirt.imageColor} mb-8 flex items-center justify-center shadow-inner group-hover:scale-[1.05] transition-transform`}>
                        <span className="text-7xl group-hover:rotate-6 transition-transform">👕</span>
                      </div>

                      <div className="flex justify-between items-start mb-6 gap-4">
                        <h3 className="font-black text-2xl text-gray-900 flex-1 leading-none">{shirt.name}</h3>
                        <span className="text-xl font-bold text-orange-600 whitespace-nowrap">R$ {PRICES[shirt.id]}</span>
                      </div>

                      {/* Detail Fields (Visible when selected) */}
                      <div className={`space-y-6 transition-all duration-500 ${isSelected ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                         <div className="pt-4 border-t border-gray-100">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tamanho</label>
                            <div className="flex flex-wrap gap-2">
                               {SIZES.map(s => (
                                 <button
                                   key={s}
                                   onClick={(e) => { e.stopPropagation(); updateShirtDetail(shirt.id, 'size', s); }}
                                   className={`px-3 py-2 rounded-xl text-xs font-black border-2 transition-all ${
                                     details.size === s ? 'border-orange-500 bg-orange-50 text-orange-900' : 'border-gray-100 bg-white text-gray-300'
                                   }`}
                                 >
                                    {s}
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div className="pt-4 border-t border-gray-100">
                               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nome na Camisa</label>
                               <input 
                                 type="text" placeholder="GABRIEL"
                                 className="w-full p-4 bg-orange-50/50 border-2 border-orange-100 rounded-2xl font-black text-base outline-none focus:border-orange-500 uppercase"
                                 value={details.name}
                                 onClick={e => e.stopPropagation()}
                                 onChange={e => { e.stopPropagation(); updateShirtDetail(shirt.id, 'name', e.target.value.toUpperCase()); }}
                               />
                          </div>
                      </div>
                      
                      {!isSelected && (
                        <div className="mt-4 flex justify-center">
                           <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">Cliquar para Selecionar</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col items-center gap-8">
                 <button 
                  onClick={() => setShowMeasures(!showMeasures)} 
                  className="text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-orange-600 flex items-center gap-2"
                 >
                   📏 Guia de Medidas {showMeasures ? '↑' : '↓'}
                 </button>

                  {showMeasures && (
                    <div className="w-full max-w-2xl p-8 bg-white/60 rounded-[2.5rem] border-2 border-orange-100 animate-fade-in text-center overflow-hidden">
                       <h4 className="font-black text-gray-900 mb-6 uppercase tracking-widest">Tabela de Medidas (cm)</h4>
                       <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse">
                             <thead>
                                <tr className="border-b border-orange-100 font-black text-orange-400 uppercase tracking-widest">
                                   <th className="py-3 px-4 text-left">Tamanho</th>
                                   <th className="py-3 px-4">Largura</th>
                                   <th className="py-3 px-4">Altura</th>
                                </tr>
                             </thead>
                             <tbody className="text-gray-700 font-bold">
                                <tr className="border-b border-orange-50/50">
                                   <td className="py-3 px-4 text-left">PP (12 anos)</td>
                                   <td className="py-3 px-4">47 cm</td>
                                   <td className="py-3 px-4">61,5 cm</td>
                                </tr>
                                <tr className="border-b border-orange-50/50">
                                   <td className="py-3 px-4 text-left">P Adulto</td>
                                   <td className="py-3 px-4">53 cm</td>
                                   <td className="py-3 px-4">67 cm</td>
                                </tr>
                                <tr className="border-b border-orange-50/50">
                                   <td className="py-3 px-4 text-left">M Adulto</td>
                                   <td className="py-3 px-4">57,5 cm</td>
                                   <td className="py-3 px-4">72 cm</td>
                                </tr>
                                <tr className="border-b border-orange-50/50">
                                   <td className="py-3 px-4 text-left">G Adulto</td>
                                   <td className="py-3 px-4">62 cm</td>
                                   <td className="py-3 px-4">77 cm</td>
                                </tr>
                                <tr className="border-b border-orange-50/50">
                                   <td className="py-3 px-4 text-left">GG Adulto</td>
                                   <td className="py-3 px-4">67,5 cm</td>
                                   <td className="py-3 px-4">82 cm</td>
                                </tr>
                                <tr>
                                   <td className="py-3 px-4 text-left">XG (Extra G)</td>
                                   <td className="py-3 px-4">68,5 cm</td>
                                   <td className="py-3 px-4">87 cm</td>
                                </tr>
                             </tbody>
                          </table>
                       </div>
                       <p className="mt-6 text-[10px] text-gray-400 italic">As medidas podem variar até 2cm para mais ou para menos.</p>
                    </div>
                  )}

                 <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest italic mb-8 max-w-xs leading-relaxed">
                      O número é único por gênero.<br/>Você pode manter o seu de pedidos anteriores se estiver disponível.
                    </p>
                    <button onClick={nextStep} disabled={loading} className="btn-primary px-16 py-5 font-black text-xl shadow-2xl flex items-center group">
                      {loading ? 'Validando...' : 'Revisar Pedido'}
                      <svg className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>
                 </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="w-full animate-fade-in-up">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Quase Lá!</h2>
                  <p className="text-gray-500 font-medium">Confira o resumo do seu pedido.</p>
                </div>
                <button onClick={prevStep} className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] hover:text-orange-600 transition-colors">← Editar Pedido</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="md:col-span-2 space-y-4">
                    {selectedShirtIds.map(id => {
                      const details = shirtDetails[id];
                      return (
                        <div key={id} className="bg-white/80 rounded-[2.5rem] p-8 border-2 border-orange-100 shadow-xl flex justify-between items-center group relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100 blur-3xl opacity-30 rounded-full" />
                           <div className="flex items-center gap-6 relative">
                              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner">👕</div>
                              <div>
                                 <p className="font-black text-gray-900 text-xl leading-none mb-2">{SHIRT_OPTIONS.find(s => s.id === id)?.name}</p>
                                 <p className="text-xs font-black text-orange-600 uppercase tracking-widest">{details.size} • #{shirtNumber} • {details.name}</p>
                              </div>
                           </div>
                           <span className="text-2xl font-black text-gray-900 relative whitespace-nowrap">R$ {PRICES[id].toFixed(2)}</span>
                        </div>
                      );
                    })}
                 </div>

                 <div className="bg-orange-500 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col justify-between">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total do Pedido</p>
                       <p className="text-5xl font-black italic tracking-tighter mb-8">R${totalAmount.toFixed(0)}</p>
                       
                       <div className="space-y-4 pt-6 border-t border-white/20">
                          <div className="flex justify-between font-black">
                             <span className="text-xs opacity-70 uppercase">1ª Parcela</span>
                             <span className="text-base">R$ {(totalAmount * 0.5).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between opacity-60 text-xs font-bold uppercase">
                             <span>2ª Parcela</span>
                             <span>R$ {(totalAmount * 0.5).toFixed(2)}</span>
                          </div>
                       </div>
                    </div>
                    
                    <p className="mt-8 text-[10px] font-black uppercase italic leading-tight text-orange-100">O pagamento do sinal é necessário para reserva oficial.</p>
                 </div>
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                 <div className="bg-white/40 p-10 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Transferência PIX</p>
                    <p className="text-xl font-black text-orange-900 mb-6 break-all tracking-tight">{PIX_KEY}</p>
                    <button onClick={() => { navigator.clipboard.writeText(PIX_KEY); setErrorMsg("Chave PIX copiada!"); }} className="px-10 py-3 bg-orange-100 text-orange-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-200 transition-all">Copiar Chave</button>
                 </div>

                 <form onSubmit={handleSubmit} className="w-full">
                    <button type="submit" disabled={loading} className="w-full btn-primary py-6 font-black text-2xl shadow-2xl transition-all disabled:opacity-50">
                      {loading ? 'Finalizando...' : 'Concluir Reserva'}
                    </button>
                 </form>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 text-center text-gray-400/60 font-black text-[10px] uppercase tracking-[0.3em] space-y-4">
           <p>© 2026 Manhãzinha • Todos os Direitos Reservados</p>
        </div>
      </main>

      {errorMsg && <Toast message={errorMsg} type={errorMsg.includes("copiada") ? "success" : "error"} />}
    </div>
  );
};

export default OrderForm;
