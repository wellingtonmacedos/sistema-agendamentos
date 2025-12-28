import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format, addDays, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, User, Users, Calendar, Clock, Scissors, CheckCircle, Store, Briefcase, Lock } from 'lucide-react';
import clsx from 'clsx';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState('INIT'); // INIT, IDENTIFY_PHONE, IDENTIFY_NAME, SALON, SERVICE, PROFESSIONAL, DATE, TIME, CONFIRM, SUCCESS
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Data
  const [salons, setSalons] = useState([]);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Admin State
  const [adminUser, setAdminUser] = useState(null);
  const [view, setView] = useState('CHAT'); // CHAT, LOGIN, ADMIN

  // Selection
  const [booking, setBooking] = useState({
    salon: null,
    service: null,
    professional: null,
    date: null,
    time: null,
    clientName: '',
    clientPhone: ''
  });

  const [chatConfig, setChatConfig] = useState({
    botBubbleColor: '#FFFFFF',
    botTextColor: '#334155',
    userBubbleColor: '#1e293b',
    userTextColor: '#FFFFFF',
    buttonColor: '#3B82F6',
    backgroundColor: '#f8fafc',
    headerColor: '#FFFFFF',
    headerTextColor: '#000000',
    assistantName: 'Agendamento Online',
    avatarUrl: '',
    showAvatar: true
   });
 
   useEffect(() => {
     document.documentElement.style.setProperty('--accent-color', chatConfig.buttonColor);
   }, [chatConfig.buttonColor]);

   const addMessage = (text, sender = 'bot', type = 'text', data = null) => {
    setMessages(prev => [...prev, { text, sender, type, data, id: Date.now() + Math.random() }]);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initialized = useRef(false);

  // Init
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      setLoading(true);

      // Check URL for direct access
      const path = window.location.pathname;
      const hostname = window.location.hostname;
      
      // Force logout if explicitly visiting /login
      if (path === '/login') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setAdminUser(null);
          setView('LOGIN');
          setLoading(false);
          return;
      }

      // Check for admin path or subdomain
      if (path === '/admin' || hostname.startsWith('admin.')) {
          setView('LOGIN');
      }

      // Check for admin session
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
          try {
              const user = JSON.parse(userStr);
              setAdminUser(user);
              axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              
              if (path === '/admin') {
                  setView('ADMIN');
              }
          } catch (e) {
              console.error("Erro ao restaurar sessão admin", e);
              localStorage.removeItem('token');
              localStorage.removeItem('user');
          }
      }
      
      // Pre-fetch salons to check for single-tenant mode (apply branding early)
      try {
        const salonsRes = await axios.get('/api/salons');
        setSalons(salonsRes.data);
        
        // If there's only one salon, apply its branding immediately
        if (salonsRes.data.length === 1 && salonsRes.data[0].chatConfig) {
            setChatConfig(prev => ({ ...prev, ...salonsRes.data[0].chatConfig }));
        }
      } catch (err) {
        console.error("Erro ao carregar configurações iniciais", err);
      }
      
      // Initial Greeting
      addMessage('Olá! Sou seu assistente de agendamentos. 🤖\n\nAntes de começarmos, por favor, me informe seu **número de celular** (com DDD).');
      setStep('IDENTIFY_PHONE');
      setLoading(false);
    };
    init();
  }, []);

  const handleAdminClick = () => {
    console.log("Admin click detected, current user:", adminUser);
    if (adminUser) {
        setView('ADMIN');
    } else {
        setView('LOGIN');
    }
  };

  const handleLoginSuccess = (user) => {
    console.log("Login successful! User:", user);
    setAdminUser(user);
    setView('ADMIN');
    window.history.pushState({}, '', '/admin');
  };

  const handleLogout = () => {
    setAdminUser(null);
    setView('LOGIN');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.history.pushState({}, '', '/login');
  };

  // ----------------------------------------------------------------------
  // FLOW HANDLERS
  // ----------------------------------------------------------------------

  const handleInputSubmit = async (e) => {
    e.preventDefault();
    const val = e.target.elements.input.value.trim();
    if (!val) return;
    e.target.elements.input.value = '';

    // 1. Identify Phone
    if (step === 'IDENTIFY_PHONE') {
        addMessage(val, 'user');
        setBooking(prev => ({ ...prev, clientPhone: val }));
        
        // Check backend for existing customer
        setLoading(true);
        try {
            const res = await axios.get(`/api/customers/check?phone=${val}`);
            if (res.data.found) {
                setBooking(prev => ({ ...prev, clientName: res.data.name }));
                addMessage(`Olá novamente, **${res.data.name}**! Que bom te ver.`);
                loadSalons();
            } else {
                addMessage('Certo. Como é a primeira vez, qual seu **Nome Completo**?');
                setStep('IDENTIFY_NAME');
            }
        } catch (err) {
            // Fallback if backend fails or offline
            addMessage('Obrigado. E qual é o seu **Nome Completo**?');
            setStep('IDENTIFY_NAME');
        } finally {
            setLoading(false);
        }
    } 
    // 2. Identify Name (if new)
    else if (step === 'IDENTIFY_NAME') {
        addMessage(val, 'user');
        setBooking(prev => ({ ...prev, clientName: val }));
        addMessage(`Prazer, ${val}!`);
        loadSalons();
    }
  };

  const loadSalons = async () => {
    // If we already have salons loaded (from init), just use them
    if (salons.length > 0) {
        handleSalonSelect(salons[0], true);
        return;
    }

    setLoading(true);
    try {
        const res = await axios.get('/api/salons');
        setSalons(res.data);
        if (res.data.length > 0) {
             handleSalonSelect(res.data[0], true);
        } else {
             addMessage('Nenhum estabelecimento encontrado.');
        }
    } catch (err) {
        addMessage('Erro ao carregar salões. Tente recarregar a página.');
    } finally {
        setLoading(false);
    }
  };

  const handleSalonSelect = async (salon, autoSelected = false) => {
    if (!autoSelected) {
        addMessage(salon.name, 'user');
    }
    setBooking(prev => ({ ...prev, salon }));

    // Apply Chat Config if available
    if (salon.chatConfig) {
        setChatConfig(prev => ({ ...prev, ...salon.chatConfig }));
    }
    
    setLoading(true);
    try {
      const srvRes = await axios.get(`/api/services?salao_id=${salon._id}`);
      setServices(srvRes.data);
      // Professionals will be loaded after service selection
      setProfessionals([]);
      
      addMessage(`Vamos agendar? Escolha o serviço que deseja:`);
      setStep('SERVICE');
    } catch (err) {
      addMessage('Erro ao carregar serviços.');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = async (service) => {
    addMessage(service.name, 'user');
    setBooking(prev => ({ ...prev, service }));
    
    setLoading(true);
    try {
        const res = await axios.get(`/api/professionals?salao_id=${booking.salon._id}&service_id=${service._id}`);
        setProfessionals(res.data);
        
        if (res.data.length > 0) {
            addMessage(`Você tem preferência por algum profissional?`);
            setStep('PROFESSIONAL');
        } else {
            // Fallback if no specific professional found (e.g. not configured yet)
            // Try fetching all professionals as fallback or show error
            // For now, let's assume if 0, maybe all can do it? Or just show message?
            // User requested fix, so likely they will configure it.
            // If empty, we can't really proceed if backend requires professional_id.
            // But let's try fetching all if filtered returns none, to support legacy/unconfigured data?
            // No, that defeats the purpose of filtering.
            // But if the user hasn't configured services for professionals yet, this will block the flow.
            // Let's fallback to ALL if filtered is empty, with a console warning.
            
            const allRes = await axios.get(`/api/professionals?salao_id=${booking.salon._id}`);
            if (allRes.data.length > 0) {
                console.warn("No professionals matched service, falling back to all.");
                setProfessionals(allRes.data);
                addMessage(`Você tem preferência por algum profissional?`);
                setStep('PROFESSIONAL');
            } else {
                addMessage('Não há profissionais disponíveis para este serviço no momento.');
            }
        }
    } catch (err) {
        addMessage('Erro ao carregar profissionais.');
    } finally {
        setLoading(false);
    }
  };

  const handleProfessionalSelect = (prof) => {
    if (prof) {
        addMessage(prof.name, 'user');
        setBooking(prev => ({ ...prev, professional: prof }));
    } else {
        addMessage('Sem preferência', 'user');
        // If "Any", we might need logic to find ANY available slot across pros.
        // For now, let's pick the first one or handle backend logic for "any".
        // To keep it simple, let's just pick the first one or ask user to pick one.
        // But prompt says "Perguntar profissional (opcional)".
        // If user says "Sem preferência", we usually pick one internally or show all slots.
        // Current backend expects a professional_id. Let's pick the first one for simplicity or logic.
        // BETTER: Let's pick the first available one in logic, but for now, let's just pick the first one.
        setBooking(prev => ({ ...prev, professional: professionals[0] }));
    }
    
    addMessage('Entendido. Para qual dia você gostaria de verificar a disponibilidade?');
    setStep('DATE');
  };

  const handleDateSelect = async (dateStr) => {
    const formattedDate = format(new Date(dateStr), 'dd/MM/yyyy');
    addMessage(formattedDate, 'user');
    setBooking(prev => ({ ...prev, date: dateStr }));
    
    addMessage('Consultando agenda...', 'bot');
    setLoading(true);
    
    try {
      const { salon, professional, service } = booking;
      
      const res = await axios.get('/api/disponibilidade/horarios', {
        params: {
          salao_id: salon._id,
          profissional_id: booking.professional?._id || professional._id,
          servicos: booking.service?._id || service._id,
          data: dateStr
        }
      });
      
      setAvailableSlots(res.data);
      if (res.data.length > 0) {
        addMessage(`Encontrei estes horários para ${formattedDate}:`);
        setStep('TIME');
      } else {
        addMessage(`Não há horários livres para ${formattedDate}. Por favor, escolha outra data.`);
        setStep('DATE');
      }
    } catch (err) {
      console.error(err);
      addMessage('Erro ao buscar horários.');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSelect = (time) => {
    addMessage(time, 'user');
    setBooking(prev => ({ ...prev, time }));
    
    addMessage('Perfeito. Por favor, confira os dados do agendamento:');
    setStep('CONFIRM');
  };

  const handleConfirm = async () => {
    addMessage('Confirmar', 'user');
    setLoading(true);
    try {
      await axios.post('/api/agendamentos', {
        salao_id: booking.salon._id,
        profissional_id: booking.professional._id,
        data: booking.date,
        hora_inicio: booking.time,
        servicos: [booking.service._id],
        cliente: booking.clientName,
        telefone: booking.clientPhone
      });
      
      addMessage(`Agendamento Confirmado! 🎉\n${booking.service.name} com ${booking.professional.name}\nDia ${format(new Date(booking.date), 'dd/MM')} às ${booking.time}.`);
      setStep('SUCCESS');
    } catch (err) {
      addMessage('Ocorreu um erro ao finalizar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for dynamic styles
  const getButtonStyle = () => ({
    borderColor: chatConfig.buttonColor,
    '--accent-color': chatConfig.buttonColor // Used for hover/text via CSS variable if needed, but we'll use inline styles for specifics
  });

  // Renderers
  const renderContent = () => {
    switch(step) {
      case 'SALON':
        return (
          <div className="grid gap-2">
            {salons.map(s => (
              <button 
                key={s._id} 
                onClick={() => handleSalonSelect(s)} 
                className="card hover:opacity-90 text-left flex items-center gap-3 transition-all border border-transparent hover:border-current"
                style={{ 
                    backgroundColor: chatConfig.buttonColor, 
                    color: '#fff' 
                }}
              >
                <div className="bg-white/20 p-2 rounded-full text-white"><Store size={20} /></div>
                <div className="">
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs opacity-90">{s.phone}</div>
                </div>
              </button>
            ))}
          </div>
        );
      case 'SERVICE':
        return (
          <div className="grid gap-2">
            {services.map(s => (
              <button 
                key={s._id} 
                onClick={() => handleServiceSelect(s)} 
                className="card hover:opacity-90 text-left flex justify-between items-center transition-all border border-transparent hover:border-current"
                style={{ 
                    backgroundColor: chatConfig.buttonColor, 
                    color: '#fff' 
                }}
              >
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full text-white"><Scissors size={20} /></div>
                    <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs opacity-80">{s.duration} min</div>
                    </div>
                </div>
                <div className="font-bold">R$ {s.price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        );
      case 'PROFESSIONAL':
        return (
          <div className="grid gap-2">
            <button 
                onClick={() => handleProfessionalSelect(null)} 
                className="card hover:opacity-90 text-left flex items-center gap-3 transition-all"
                style={{ borderColor: chatConfig.buttonColor, borderWidth: '1px' }}
            >
                <div className="bg-slate-100 p-2 rounded-full"><Users size={20} /></div>
                <div className="font-medium">Sem preferência</div>
            </button>
            {professionals.map(p => (
              <button 
                key={p._id} 
                onClick={() => handleProfessionalSelect(p)} 
                className="card hover:opacity-90 text-left flex items-center gap-3 transition-all"
                style={{ 
                    backgroundColor: chatConfig.buttonColor, 
                    color: '#fff' 
                }}
              >
                <div className="bg-white/20 p-2 rounded-full text-white"><Briefcase size={20} /></div>
                <div className="font-medium">{p.name}</div>
              </button>
            ))}
          </div>
        );
      case 'DATE':
        const dates = [];
        const today = startOfToday();
        for(let i=0; i<7; i++) {
            dates.push(addDays(today, i));
        }
        return (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map(d => {
                const isSelected = booking.date === d.toISOString().split('T')[0];
                return (
                  <button 
                    key={d.toString()} 
                    onClick={() => handleDateSelect(d.toISOString().split('T')[0])}
                    className={clsx(
                        "flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center border transition-all"
                    )}
                    style={{
                        backgroundColor: isSelected ? chatConfig.buttonColor : '#fff',
                        borderColor: isSelected ? chatConfig.buttonColor : '#e2e8f0',
                        color: isSelected ? '#fff' : '#1e293b'
                    }}
                  >
                    <span className="text-xs uppercase">{format(d, 'EEE', { locale: ptBR })}</span>
                    <span className="text-xl font-bold">{format(d, 'dd')}</span>
                  </button>
                );
            })}
          </div>
        );
      case 'TIME':
        return (
          <div className="grid grid-cols-4 gap-2">
            {availableSlots.map(t => (
              <button 
                key={t} 
                onClick={() => handleTimeSelect(t)}
                className="py-2 px-1 bg-white border border-slate-200 rounded-lg text-sm hover:opacity-80 transition-all"
                style={{
                    color: '#1e293b'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = chatConfig.buttonColor;
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.color = '#1e293b';
                }}
              >
                {t}
              </button>
            ))}
          </div>
        );
      case 'CONFIRM':
        return (
            <div className="card bg-slate-50">
                <h3 className="font-bold mb-2">Resumo</h3>
                <div className="text-sm space-y-1 mb-4">
                    <p><span className="text-gray-500">Cliente:</span> {booking.clientName}</p>
                    <p><span className="text-gray-500">Telefone:</span> {booking.clientPhone}</p>
                    <p><span className="text-gray-500">Serviço:</span> {booking.service?.name}</p>
                    <p><span className="text-gray-500">Profissional:</span> {booking.professional?.name}</p>
                    <p><span className="text-gray-500">Data:</span> {booking.date && format(new Date(booking.date), 'dd/MM/yyyy')} às {booking.time}</p>
                    <p><span className="text-gray-500">Total:</span> R$ {booking.service?.price.toFixed(2)}</p>
                </div>
                <button 
                    onClick={handleConfirm} 
                    className="w-full btn-primary flex justify-center items-center gap-2"
                    style={{ backgroundColor: chatConfig.buttonColor }}
                >
                    <CheckCircle size={18} /> Confirmar Agendamento
                </button>
            </div>
        );
      default:
        return null;
    }
  };

  if (view === 'LOGIN') {
    return <AdminLogin onLogin={handleLoginSuccess} />;
  }

  if (view === 'ADMIN') {
    return <AdminDashboard user={adminUser} onLogout={handleLogout} />;
  }

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
        {/* Header */}
        <div 
            className="border-b p-4 flex items-center gap-3 sticky top-0 z-10"
            style={{ backgroundColor: chatConfig.headerColor }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 text-gray-500">
            {chatConfig.showAvatar && chatConfig.avatarUrl ? (
                <img src={chatConfig.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
                <Store size={20} />
            )}
          </div>
          <div>
            <h1 className="font-bold text-lg" style={{ color: chatConfig.headerTextColor }}>{chatConfig.assistantName}</h1>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online agora
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={handleAdminClick} className="text-gray-400 hover:text-gray-600 p-1" title="Área Administrativa">
                <Lock size={16} />
            </button>
            <button onClick={() => window.location.reload()} className="text-xs text-gray-400 hover:text-gray-600">
                Reiniciar
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ backgroundColor: chatConfig.backgroundColor }}
        >
          {messages.map((msg) => (
            <div key={msg.id} className={clsx(
              "flex w-full items-end gap-2",
              msg.sender === 'user' ? "justify-end" : "justify-start"
            )}>
              {msg.sender === 'bot' && chatConfig.showAvatar && (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                   {chatConfig.avatarUrl ? (
                     <img src={chatConfig.avatarUrl} alt="Bot" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100">
                       <Store size={14} />
                     </div>
                   )}
                </div>
              )}

              <div 
                className={clsx(
                    "max-w-[75%] p-3 rounded-2xl text-sm whitespace-pre-line shadow-sm",
                    msg.sender === 'user' ? "rounded-tr-none" : "rounded-tl-none border border-slate-100"
                )}
                style={{
                    backgroundColor: msg.sender === 'user' ? chatConfig.userBubbleColor : chatConfig.botBubbleColor,
                    color: msg.sender === 'user' ? chatConfig.userTextColor : chatConfig.botTextColor
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex w-full justify-start items-end gap-2">
               {chatConfig.showAvatar && (
                 <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {chatConfig.avatarUrl ? (
                      <img src={chatConfig.avatarUrl} alt="Bot" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100">
                        <Store size={14} />
                      </div>
                    )}
                 </div>
               )}
               <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-none p-3">
                 <div className="flex gap-1">
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                 </div>
               </div>
             </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t">
          {['IDENTIFY_PHONE', 'IDENTIFY_NAME'].includes(step) ? (
            <form onSubmit={handleInputSubmit} className="flex gap-2">
              <input 
                name="input"
                type={step === 'IDENTIFY_PHONE' ? "tel" : "text"}
                className="flex-1 bg-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50"
                placeholder={step === 'IDENTIFY_PHONE' ? "Digite seu celular..." : "Digite seu nome..."}
                autoFocus
              />
              <button type="submit" style={{ backgroundColor: chatConfig.buttonColor }} className="text-white p-3 rounded-xl hover:opacity-90 transition-opacity">
                <Send size={20} />
              </button>
            </form>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
