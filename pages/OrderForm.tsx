import React, { useState, useEffect } from 'react';
import { SHIRT_OPTIONS, SIZES, PRICES, PIX_KEY, USE_MOCK_DB } from '../constants';
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
  
  const [selectedShirtId, setSelectedShirtId] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<ShirtSize>('M');
  const [chosenNumber, setChosenNumber] = useState('');
  const [takenNumbers, setTakenNumbers] = useState<number[]>([]);

  // Real-time taken numbers subscription
  useEffect(() => {
    const unsubscribe = subscribeToTakenNumbers(gender, (taken) => {
      setTakenNumbers(taken.sort((a, b) => a - b));
    });
    return () => unsubscribe();
  }, [gender]);

  // --- Handlers ---

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 11) setPhone(val);
  };

  const validateStep1 = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("Por favor, preencha seu nome e sobrenome.");
      return false;
    }
    if (phone.length < 10) {
      setErrorMsg("Por favor, insira um telefone válido com DDD.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!selectedShirtId) {
      setErrorMsg("Selecione um modelo de camisa.");
      return false;
    }
    if (!chosenNumber) {
      setErrorMsg("Escolha seu número da camisa (0-99).");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Final full validation
    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setLoading(true);
    const numInt = parseInt(chosenNumber, 10);
    if (isNaN(numInt) || numInt < 0 || numInt > 99) {
      setErrorMsg("Número inválido. Escolha entre 0 e 99.");
      setLoading(false);
      return;
    }

    try {
      const availability = await checkNumberAvailability(numInt, gender);
      if (!availability.available) {
        setErrorMsg(availability.message || "Número indisponível.");
        setLoading(false);
        return;
      }

      const order: Order = {
        firstName,
        lastName,
        phoneNumber: phone,
        gender,
        shirtId: selectedShirtId!,
        size: selectedSize,
        number: numInt,
        totalPrice: PRICES[selectedShirtId!],
        createdAt: Date.now()
      };

      await submitOrder(order);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocorreu um erro ao salvar seu pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // --- Render logic ---

  if (success) {
    return (
      <div className="min-h-screen bg-sunrise flex items-center justify-center p-6">
        <div className="glass-card max-w-lg w-full p-10 rounded-[3rem] text-center animate-fade-in">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Pedido Realizado!</h2>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Olá <strong>{firstName}</strong>, sua reserva foi processada. O número <strong>#{chosenNumber}</strong> está garantido para você!
          </p>
          <div className="bg-white/50 rounded-3xl p-6 mb-8 text-left border border-white">
             <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Produto</span>
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total</span>
             </div>
             <div className="flex justify-between items-center text-gray-800">
                <span className="font-semibold">{SHIRT_OPTIONS.find(s => s.id === selectedShirtId)?.name}</span>
                <span className="font-bold text-orange-600">R$ {PRICES[selectedShirtId!]?.toFixed(2)}</span>
             </div>
             <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">Acompanhe pelo WhatsApp: {phone}</p>
             </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full btn-primary py-4 font-bold text-lg"
          >
            Fazer Novo Pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sunrise font-sans pb-20 selection:bg-orange-100 selection:text-orange-900">
      {/* Header */}
      <header className="pt-16 pb-12 text-center">
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2 italic">MANHÃZINHA</h1>
        <p className="text-orange-900/60 font-medium tracking-wide uppercase text-xs">Coleção Oficial 2026</p>
      </header>

      <main className="max-w-4xl mx-auto px-6">
        <StepProgressBar currentStep={step} onStepClick={(s) => setStep(s)} />
        <div className="glass-card rounded-[3rem] p-8 md:p-12 min-h-[500px] flex flex-col items-center">
          
          {/* STEP 1: Identification */}
          {step === 1 && (
            <div className="w-full max-w-xl animate-fade-in-up">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Suas Informações</h2>
              <p className="text-gray-500 mb-10">Como podemos te identificar?</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Sou do Gênero</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setGender('MASCULINO')}
                      className={`p-6 rounded-3xl flex flex-col items-center transition-all border-2 ${
                        gender === 'MASCULINO' ? 'bg-orange-50 border-orange-500 text-orange-900 shadow-lg' : 'bg-white border-gray-100 text-gray-400'
                      }`}
                    >
                      <span className="text-3xl mb-2">🧑</span>
                      <span className="font-bold uppercase text-xs tracking-tighter">Masculino</span>
                    </button>
                    <button
                      onClick={() => setGender('FEMININO')}
                      className={`p-6 rounded-3xl flex flex-col items-center transition-all border-2 ${
                        gender === 'FEMININO' ? 'bg-orange-50 border-orange-500 text-orange-900 shadow-lg' : 'bg-white border-gray-100 text-gray-400'
                      }`}
                    >
                      <span className="text-3xl mb-2">👩</span>
                      <span className="font-bold uppercase text-xs tracking-tighter">Feminino</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2 ml-2">Nome</label>
                    <input 
                      type="text"
                      placeholder="Ex: Gabriel"
                      className="w-full p-4 bg-white/50 border border-gray-100 rounded-2xl input-glow"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2 ml-2">Sobrenome</label>
                    <input 
                      type="text"
                      placeholder="Ex: Fraga"
                      className="w-full p-4 bg-white/50 border border-gray-100 rounded-2xl input-glow"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2 ml-2">WhatsApp (com DDD)</label>
                  <input 
                    type="tel"
                    placeholder="21 99999-9999"
                    className="w-full p-4 bg-white/50 border border-gray-100 rounded-2xl input-glow"
                    value={phone}
                    onChange={handlePhoneChange}
                  />
                </div>
              </div>

              <div className="mt-12 flex justify-end">
                <button onClick={nextStep} className="btn-primary px-12 py-4 font-bold flex items-center shadow-2xl">
                  Próximo Passo
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Product & Number */}
          {step === 2 && (
            <div className="w-full animate-fade-in-up">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">Selecione seu Manto</h2>
                  <p className="text-gray-500 font-medium">Escolha seu modelo e número da sorte.</p>
                </div>
                <button onClick={prevStep} className="text-gray-400 font-bold text-sm uppercase tracking-widest hover:text-orange-600 transition-colors">← Voltar</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {SHIRT_OPTIONS.map((shirt) => (
                  <div 
                    key={shirt.id}
                    onClick={() => setSelectedShirtId(shirt.id)}
                    className={`group cursor-pointer p-6 rounded-[2.5rem] border-4 transition-all ${
                      selectedShirtId === shirt.id ? 'border-orange-400 bg-white shadow-2xl' : 'border-white/50 bg-white/20 hover:bg-white/40'
                    }`}
                  >
                    <div className={`aspect-square w-full rounded-2xl ${shirt.imageColor} mb-6 flex items-center justify-center shadow-inner group-hover:scale-[1.02] transition-transform`}>
                        <span className="text-6xl group-hover:rotate-12 transition-transform">👕</span>
                    </div>
                    <div className="flex justify-between items-start mb-2 gap-4">
                       <h3 className="font-black text-xl text-gray-900 leading-tight flex-1">{shirt.name}</h3>
                       <span className="font-bold text-orange-600 whitespace-nowrap">R$ {PRICES[shirt.id]}</span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">{shirt.description}</p>
                    
                    <div className="flex flex-wrap gap-1">
                      {SIZES.map(s => (
                        <button
                          key={s}
                          onClick={(e) => { e.stopPropagation(); setSelectedShirtId(shirt.id); setSelectedSize(s); }}
                          className={`size-chip px-3 py-2 rounded-xl text-xs font-black border ${
                            selectedShirtId === shirt.id && selectedSize === s 
                            ? 'active' 
                            : 'border-gray-200 bg-white text-gray-400 hover:border-orange-200'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

               <div className="max-w-md mx-auto text-center">
                  <label className="block text-sm font-bold text-gray-600 mb-4 uppercase tracking-widest">Seu Número Personalizado</label>
                  <div className="relative inline-block">
                    <input 
                      type="text" 
                      maxLength={2}
                      placeholder="10"
                      className={`w-24 text-5xl font-black text-center py-6 bg-white/80 border-2 rounded-3xl outline-none shadow-xl transition-all ${
                        chosenNumber && takenNumbers.includes(parseInt(chosenNumber)) 
                        ? 'border-rose-400 text-rose-500 bg-rose-50' 
                        : 'border-orange-100 focus:border-orange-500'
                      }`}
                      value={chosenNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 2) setChosenNumber(val);
                      }}
                    />
                    {chosenNumber && takenNumbers.includes(parseInt(chosenNumber)) && (
                      <div className="absolute -top-3 -right-3 bg-rose-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg animate-bounce shadow-lg">⚠️</div>
                    )}
                  </div>
                  
                  {chosenNumber && takenNumbers.includes(parseInt(chosenNumber)) && (
                    <p className="mt-4 text-rose-500 font-bold text-xs uppercase tracking-tighter">Este número já está reservado!</p>
                  )}
                  
                  <p className="mt-4 text-[10px] text-gray-400/80 font-bold uppercase tracking-widest italic mb-6">O número é único por gênero ({gender})</p>
                  
                  {takenNumbers.length > 0 && (
                    <div className="bg-white/40 p-6 rounded-3xl border border-dashed border-gray-200">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Números Ocupados ({gender === 'MASCULINO' ? 'Masculino' : 'Feminino'})</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {takenNumbers.map(n => (
                          <span key={n} className="bg-gray-100 text-gray-400 px-3 py-1 rounded-full text-xs font-bold shadow-sm">{n.toString().padStart(2, '0')}</span>
                        ))}
                      </div>
                    </div>
                  )}
               </div>

              <div className="mt-16 flex justify-end">
                <button onClick={nextStep} className="btn-primary px-12 py-4 font-bold flex items-center shadow-2xl group">
                  Confirmar Escolha
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment & Summary */}
          {step === 3 && (
            <div className="w-full animate-fade-in-up">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">Finalização</h2>
                  <p className="text-gray-500 font-medium">Revise seu pedido e realize o Pix.</p>
                </div>
                <button onClick={prevStep} className="text-gray-400 font-bold text-sm uppercase tracking-widest hover:text-orange-600 transition-colors">← Alterar Escolha</button>
              </div>

              <div className="bg-white/80 rounded-[2.5rem] p-8 md:p-10 border-2 border-orange-100 shadow-xl mb-10 overflow-hidden relative">
                 {/* Decorative Glow */}
                 <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 blur-[80px] rounded-full opacity-50" />
                 
                 <div className="relative">
                   <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-8 border-b border-orange-100 pb-4">Resumo do Pedido</h3>
                   
                   <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">👕</div>
                         <div>
                            <p className="font-black text-gray-900 text-lg">{SHIRT_OPTIONS.find(s => s.id === selectedShirtId)?.name}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tamanho {selectedSize} • Nº {chosenNumber}</p>
                         </div>
                      </div>
                      <span className="text-2xl font-black text-gray-900">R$ {PRICES[selectedShirtId!]?.toFixed(2)}</span>
                   </div>

                   <div className="bg-orange-500/5 p-6 rounded-3xl border border-orange-500/10 space-y-4">
                      <div className="flex justify-between text-sm font-bold mb-1">
                         <span className="text-orange-900">1ª Parcela (Sinal)</span>
                         <span className="text-orange-600 whitespace-nowrap">R$ {(PRICES[selectedShirtId!]! * 0.5).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                         <span className="text-gray-400 font-medium">2ª Parcela (Na Entrega)</span>
                         <span className="text-gray-400 font-medium whitespace-nowrap">R$ {(PRICES[selectedShirtId!]! * 0.5).toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-orange-500/10">
                        <p className="text-[10px] text-orange-900/40 uppercase tracking-widest font-black leading-tight italic text-center">
                          O pagamento da 1ª parcela é obrigatório para garantir a reserva do número e do modelo.
                        </p>
                      </div>
                   </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                 <div className="bg-white/40 p-8 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Chave Pix</p>
                    <p className="text-xl font-black text-orange-900 break-all mb-4">{PIX_KEY}</p>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(PIX_KEY); setErrorMsg("Chave PIX copiada!"); }}
                      className="px-6 py-2 bg-orange-100 text-orange-600 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-orange-200 transition-all"
                    >
                      Copiar Chave
                    </button>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="flex items-start gap-3">
                       <span className="bg-orange-500 text-white p-1 rounded-full text-[10px]">✨</span>
                       <p className="text-xs text-gray-500 leading-relaxed">Confirme o pagamento e envie o comprovante para o organizador.</p>
                    </div>
                    <form onSubmit={handleSubmit}>
                       <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full btn-primary py-5 font-black text-xl shadow-2xl transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                       >
                         {loading ? 'Processando...' : 'Finalizar e Reservar'}
                       </button>
                    </form>
                 </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-400/60 font-medium text-[10px] uppercase tracking-[0.2em] space-y-2">
           <p>© 2026 Manhãzinha • Todos os direitos reservados</p>
           <p>Uniformes produzidos com materiais de alta performance</p>
            <a 
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block px-4 py-2 bg-gray-100 hover:bg-orange-100 text-gray-400 hover:text-orange-600 rounded-full transition-all text-[8px] tracking-widest uppercase font-black"
            >
              Painel Admin ↗
            </a>
        </div>
      </main>

      {errorMsg && <Toast message={errorMsg} type={errorMsg === "Chave PIX copiada!" ? "success" : "error"} />}
    </div>
  );
};

export default OrderForm;
