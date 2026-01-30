import React, { useState, useEffect } from 'react';
import { ShirtSelector } from './components/ShirtSelector';
import { SHIRT_OPTIONS, SIZES, USE_MOCK_DB } from './constants';
import { Gender, Order, ShirtSize } from './types';
import { checkNumberAvailability, submitOrder } from './services/orderService';

// Mock simple toaster for notifications
const Toast = ({ message, type }: { message: string; type: 'error' | 'success' }) => (
  <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} animate-bounce z-50`}>
    {message}
  </div>
);

const App: React.FC = () => {
  // --- State ---
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isPreFilled, setIsPreFilled] = useState<boolean>(false);

  // Step 1: User Data
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender>('MASCULINO');

  // Step 2: Selection
  const [selectedShirtIds, setSelectedShirtIds] = useState<number[]>([]);

  // Step 3: Details (Number is global, Sizes are per shirt)
  const [chosenNumber, setChosenNumber] = useState<string>('');
  const [sizes, setSizes] = useState<Record<number, ShirtSize>>({});

  // --- Effects ---
  
  // Check for URL parameters to pre-fill data from external system
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlName = params.get('name');
    const urlEmail = params.get('email');
    const urlGender = params.get('gender');

    let hasData = false;

    if (urlName) {
      setCustomerName(urlName);
      hasData = true;
    }
    
    if (urlEmail) {
      setEmail(urlEmail);
      hasData = true;
    }

    if (urlGender) {
      const g = urlGender.toUpperCase();
      // Simple logic to detect gender from varied inputs (F, Fem, Feminino, Mulher)
      if (g.startsWith('F') || g.includes('MULHER') || g.includes('WOMAN')) {
        setGender('FEMININO');
      } else {
        setGender('MASCULINO'); // Default to Masculino if not explicitly female
      }
      hasData = true;
    }

    if (hasData) {
      setIsPreFilled(true);
      // Optional: Auto-advance if you want to skip step 1, but usually safer to let them confirm
      // setStep(2); 
    }
  }, []);

  // --- Handlers ---

  const handleToggleShirt = (id: number) => {
    setSelectedShirtIds(prev => {
      if (prev.includes(id)) {
        const newIds = prev.filter(item => item !== id);
        // Remove size if deselected
        const newSizes = { ...sizes };
        delete newSizes[id];
        setSizes(newSizes);
        return newIds;
      } else {
        // Default size M when selected
        setSizes(curr => ({ ...curr, [id]: 'M' }));
        return [...prev, id];
      }
    });
  };

  const handleSizeChange = (shirtId: number, newSize: ShirtSize) => {
    setSizes(prev => ({ ...prev, [shirtId]: newSize }));
  };

  const validateStep1 = () => {
    if (!customerName.trim() || !email.trim()) {
      showError("Por favor, preencha seu nome e e-mail.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (selectedShirtIds.length === 0) {
      showError("Selecione pelo menos uma camisa.");
      return false;
    }
    return true;
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const numberInt = parseInt(chosenNumber, 10);

    // Validation
    if (isNaN(numberInt) || numberInt < 0 || numberInt > 99) {
      showError("Escolha um número válido entre 0 e 99.");
      setLoading(false);
      return;
    }

    try {
      // 1. Check availability (Global check for the user's gender)
      const availability = await checkNumberAvailability(numberInt, gender);
      
      if (!availability.available) {
        showError(availability.message || "Número indisponível.");
        setLoading(false);
        return;
      }

      // 2. Submit Orders (One per shirt)
      const promises = selectedShirtIds.map(shirtId => {
        const newOrder: Order = {
          customerName,
          email,
          shirtId,
          size: sizes[shirtId] || 'M',
          gender,
          number: numberInt,
          createdAt: Date.now()
        };
        return submitOrder(newOrder);
      });

      await Promise.all(promises);
      
      setSuccess(true);
      setLoading(false);

    } catch (err) {
      console.error(err);
      showError("Erro ao processar. Tente novamente.");
      setLoading(false);
    }
  };

  // --- Render Views ---

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full p-8 rounded-2xl shadow-xl text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Pedido Confirmado!</h2>
          <p className="text-gray-600 mb-8">
            Parabéns, {customerName}! Suas camisas foram reservadas com o número <strong>#{chosenNumber}</strong>.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-h-60 overflow-y-auto">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Resumo do Pedido</h4>
            {selectedShirtIds.map(id => {
              const shirt = SHIRT_OPTIONS.find(s => s.id === id);
              return (
                <div key={id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                  <span className="text-gray-800 font-medium">{shirt?.name}</span>
                  <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">Tam: {sizes[id]}</span>
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
          >
            Fazer outro pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Header */}
      <header className="bg-slate-900 text-white py-8 shadow-lg">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-4xl">🏐</span>
            <h1 className="text-3xl font-extrabold tracking-tight">Vôlei Team Store</h1>
          </div>
          <p className="text-slate-400">Escolha seu uniforme oficial da temporada</p>
          {USE_MOCK_DB && (
            <div className="mt-4 bg-yellow-500/20 text-yellow-200 text-xs inline-block px-2 py-1 rounded border border-yellow-500/50">
              Modo Demonstração
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex flex-col">
          
          {/* Progress Bar */}
          <div className="bg-gray-100 h-2 w-full flex">
            <div className={`h-full transition-all duration-500 ${step >= 1 ? 'bg-orange-500' : 'bg-transparent'} w-1/3`}></div>
            <div className={`h-full transition-all duration-500 ${step >= 2 ? 'bg-orange-500' : 'bg-transparent'} w-1/3`}></div>
            <div className={`h-full transition-all duration-500 ${step >= 3 ? 'bg-orange-500' : 'bg-transparent'} w-1/3`}></div>
          </div>

          <div className="p-6 md:p-10 flex-1 flex flex-col">
            
            {/* --- STEP 1: Identification --- */}
            {step === 1 && (
              <div className="animate-fade-in flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
                
                {/* Pre-filled data banner */}
                {isPreFilled && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg animate-fade-in-down">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          Olá, <strong>{customerName}</strong>! Trouxemos seus dados automaticamente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <h2 className="text-3xl font-bold text-gray-900 mb-2">Vamos começar</h2>
                <p className="text-gray-500 mb-8">Confirme seus dados principais para iniciarmos o pedido.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-lg"
                      placeholder="Ex: Ana Souza"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-lg"
                      placeholder="Ex: ana@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Qual modelagem você usa?</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setGender('MASCULINO')}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center ${gender === 'MASCULINO' ? 'border-orange-500 bg-orange-50 text-orange-900' : 'border-gray-200 hover:border-orange-200 text-gray-600'}`}
                      >
                        <span className="text-2xl mb-1">👨</span>
                        <span className="font-bold">Masculino</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('FEMININO')}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center ${gender === 'FEMININO' ? 'border-orange-500 bg-orange-50 text-orange-900' : 'border-gray-200 hover:border-orange-200 text-gray-600'}`}
                      >
                        <span className="text-2xl mb-1">👩</span>
                        <span className="font-bold">Feminino</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex justify-end">
                  <button
                    onClick={handleNextStep}
                    className="bg-slate-900 text-white px-10 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center shadow-lg hover:shadow-xl"
                  >
                    Confirmar e Continuar
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              </div>
            )}

            {/* --- STEP 2: Shirt Selection --- */}
            {step === 2 && (
              <div className="animate-fade-in flex-1 flex flex-col">
                 <div className="flex justify-between items-end mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Escolha suas Camisas</h2>
                      <p className="text-gray-500">Selecione quantas camisas desejar.</p>
                    </div>
                    <button onClick={handlePrevStep} className="text-gray-400 hover:text-slate-600 font-medium text-sm">Voltar</button>
                 </div>

                <ShirtSelector 
                  selectedIds={selectedShirtIds} 
                  onToggle={handleToggleShirt} 
                />

                <div className="mt-10 flex justify-between items-center pt-6 border-t border-gray-100">
                  <div className="text-gray-600">
                    <strong className="text-orange-600">{selectedShirtIds.length}</strong> {selectedShirtIds.length === 1 ? 'item selecionado' : 'itens selecionados'}
                  </div>
                  <button
                    onClick={handleNextStep}
                    className="bg-orange-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-orange-700 transition-all flex items-center shadow-lg hover:shadow-xl"
                  >
                    Próximo Passo
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              </div>
            )}

            {/* --- STEP 3: Details --- */}
            {step === 3 && (
              <div className="animate-fade-in flex-1 flex flex-col max-w-3xl mx-auto w-full">
                <button onClick={handlePrevStep} className="self-start text-gray-400 hover:text-slate-600 font-medium text-sm mb-4">← Voltar para seleção</button>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Personalização</h2>
                <p className="text-gray-500 mb-8">Defina seu número de jogador e os tamanhos das peças.</p>

                <form onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* Player Number Section */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
                    <label className="block text-slate-700 font-semibold mb-2">
                      Seu Número de Camisa
                      <span className="block text-xs text-slate-400 font-normal mt-1">Este número será único para o gênero {gender === 'MASCULINO' ? 'Masculino' : 'Feminino'}</span>
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      max="99"
                      required
                      autoFocus
                      className="w-32 text-4xl font-black text-center tracking-widest px-4 py-4 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 outline-none transition-all placeholder-slate-300 bg-white mx-auto block"
                      placeholder="10"
                      value={chosenNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || (val.length <= 2 && /^\d+$/.test(val))) {
                          setChosenNumber(val);
                        }
                      }}
                    />
                  </div>

                  {/* Size Selection per Shirt */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800">Tamanhos por peça:</h3>
                    {selectedShirtIds.map((id) => {
                      const shirt = SHIRT_OPTIONS.find(s => s.id === id);
                      return (
                        <div key={id} className="flex items-center justify-between bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                          <div className="flex items-center space-x-4">
                             <div className={`w-12 h-12 rounded-lg ${shirt?.imageColor} flex items-center justify-center text-white font-bold text-sm shadow-inner`}>
                               {id}
                             </div>
                             <div>
                               <p className="font-bold text-gray-800">{shirt?.name}</p>
                               <p className="text-xs text-gray-500">{gender === 'MASCULINO' ? 'Masc.' : 'Fem.'}</p>
                             </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-500 hidden sm:block">Tamanho:</label>
                            <select 
                              value={sizes[id]}
                              onChange={(e) => handleSizeChange(id, e.target.value as ShirtSize)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50 font-medium"
                            >
                              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit Area */}
                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`
                        w-full py-4 rounded-xl font-bold text-lg shadow-lg flex justify-center items-center transition-all
                        ${loading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-xl active:scale-[0.98]'}
                      `}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processando...
                        </>
                      ) : (
                        `Finalizar Pedido (${selectedShirtIds.length} itens)`
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
        
        {/* Helper Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>© 2024 Associação Atlética de Vôlei</p>
        </div>
      </main>

      {/* Toast Notification */}
      {errorMsg && <Toast message={errorMsg} type="error" />}
    </div>
  );
};

export default App;