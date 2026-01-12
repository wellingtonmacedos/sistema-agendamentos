import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format, addDays, startOfToday, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, User, Users, Calendar, Clock, Scissors, CheckCircle, Store, Briefcase, Lock, Trash2, ArrowLeft, History, Bell, Plus, X } from 'lucide-react';
import clsx from 'clsx';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { subscribeToPush, getPushPermissionState } from './utils/pushUtils';
import { messageMap } from './utils/messageMap';

function App() {
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState('INIT'); // INIT, IDENTIFY_PHONE, IDENTIFY_NAME, SALON, SERVICE, PROFESSIONAL, DATE, TIME, CONFIRM, SUCCESS, MY_APPOINTMENTS
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const [history, setHistory] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);

  const goToStep = (nextStep) => {
      // Don't push INIT to history to avoid going back to a non-interactive state
      if (step !== 'INIT') {
        setHistory(prev => [...prev, step]);
      }
      setStep(nextStep);
  };

  const handleBack = () => {
      if (history.length === 0) return;
      const prev = history[history.length - 1];
      setHistory(prevHist => prevHist.slice(0, -1));
      setStep(prev);
  };

  // Data
  const [salons, setSalons] = useState([]);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Admin State
  const [adminUser, setAdminUser] = useState(null);
  const [view, setView] = useState('CHAT'); // CHAT, LOGIN, ADMIN
  
  const [notifPermission, setNotifPermission] = useState('default');

  useEffect(() => {
    getPushPermissionState().then(setNotifPermission);
  }, []);

  const handleEnableNotifications = async () => {
    try {
        setLoading(true); // Visual feedback
        const salonId = booking.salon?._id || salons[0]?._id;
        const phone = booking.clientPhone;
        
        console.log('[Push] Requesting permission for:', { salonId, phone });

        if (!salonId || !phone) {
            alert('Erro: Dados incompletos para notificação. Tente recarregar.');
            return;
        }

        // Request permission and subscribe
        const success = await subscribeToPush('CLIENT', { 
            clientPhone: phone, 
            salonId: salonId 
        });
        
        console.log('[Push] Subscribe result:', success);

        if (success) {
            setNotifPermission('granted');
            alert('Notificações ativadas com sucesso! Você será avisado sobre este agendamento.'); 
        } else {
            alert('Não foi possível ativar as notificações. Verifique as permissões do navegador.');
        }
    } catch (err) {
        console.error("Failed to enable notifications", err);
        if (err.message.includes('not supported')) {
            alert('Seu navegador não suporta notificações ou você está em modo anônimo.');
        } else {
            alert(`Erro ao ativar notificações: ${err.message}. Tente recarregar a página.`);
        }
    } finally {
        setLoading(false);
    }
  };

  // Selection
  const [booking, setBooking] = useState({
    salon: null,
    service: null, // Deprecated in favor of selectedServices, but kept for legacy checks if any
    selectedServices: [], // New multi-selection support
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
    showAvatar: true,
    enableSuccessMeme: true,
    successMemeUrl: 'https://media.tenor.com/8ZDLU43omvcAAAAM/kid-thumbs-up.gif',
    chat_profile: 'neutral'
   });

   const getMessage = (key, ...args) => {
    const profile = chatConfig.chat_profile || 'neutral';
    const template = messageMap[key]?.[profile] || messageMap[key]?.['neutral'];
    if (typeof template === 'function') {
        return template(...args);
    }
    return template || key;
  };

  const isFeminine = chatConfig.chat_profile === 'feminine';
  const roundedClass = isFeminine ? 'rounded-3xl' : 'rounded-xl';
  const buttonRoundedClass = isFeminine ? 'rounded-full' : 'rounded-lg';
  const animClass = isFeminine ? 'hover:scale-[1.02] transition-transform duration-300' : 'hover:opacity-90 transition-opacity';

   useEffect(() => {
    const initApp = async () => {
        try {
            // Check for slug in URL (e.g., /chat/:slug)
            const pathParts = window.location.pathname.split('/');
            const slugIndex = pathParts.indexOf('chat');
            const slug = slugIndex !== -1 && pathParts.length > slugIndex + 1 ? pathParts[slugIndex + 1] : null;

            if (slug) {
                // Fetch specific salon context
                const res = await axios.get(`/api/public/salon/${slug}`);
                const salon = res.data;
                
                if (salon) {
                    setSalons([salon]); // Pre-load as the only salon to force selection
                    
                    if (salon.chatConfig) {
                        setChatConfig(prev => ({ ...prev, ...salon.chatConfig }));
                    }
                }
            } else {
                // Default global config
                const res = await axios.get('/api/public/config');
                if (res.data && Object.keys(res.data).length > 0) {
                    setChatConfig(prev => ({ ...prev, ...res.data }));
                }
            }
        } catch (error) {
            console.error("Erro ao inicializar app:", error);
        }
    };
    initApp();
  }, []);
 
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

  const handleMyHistoryClick = async () => {
    if (!booking.clientPhone) {
        addMessage(getMessage('identifyFirst'), 'bot');
        goToStep('IDENTIFY_PHONE');
        return;
    }
    
    setLoading(true);
    try {
        const res = await axios.get(`/api/my-appointments?phone=${booking.clientPhone}`);
        setMyAppointments(res.data);
        if (res.data.length === 0) {
            addMessage(getMessage('myAppointmentsEmpty'));
            addMessage(getMessage('newAppointmentPrompt'));
            // If we are not on the service list, try to go there
            if (step !== 'SERVICE' && salons.length > 0) {
                if (services.length > 0) {
                    goToStep('SERVICE');
                } else {
                    handleSalonSelect(booking.salon || salons[0], true);
                }
            }
        } else {
            addMessage(getMessage('myAppointmentsFound', res.data.length));
            goToStep('MY_APPOINTMENTS');
        }
    } catch (err) {
        addMessage('Erro ao buscar seus agendamentos.');
    } finally {
        setLoading(false);
    }
  };

  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm(getMessage('cancelConfirm'))) return;
    
    setLoading(true);
    try {
        await axios.delete(`/api/my-appointments/${apptId}`, {
            data: { phone: booking.clientPhone } // Axios delete body requires 'data' key
        });
        
        // Refresh
        const res = await axios.get(`/api/my-appointments?phone=${booking.clientPhone}`);
        setMyAppointments(res.data);
        addMessage(getMessage('cancelSuccess'));
        
        if (res.data.length === 0) {
            handleBack(); 
        }
    } catch (err) {
        addMessage('Erro ao cancelar agendamento.');
    } finally {
        setLoading(false);
    }
  };

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
                // Save to cache
                localStorage.setItem('customer_phone', val);
                
                setBooking(prev => ({ ...prev, clientName: res.data.name }));
                addMessage(getMessage('welcomeBack', res.data.name));
                loadSalons();
            } else {
                addMessage(getMessage('askName'));
                goToStep('IDENTIFY_NAME');
            }
        } catch (err) {
            // Fallback if backend fails or offline
            addMessage(getMessage('askNameFallback'));
            goToStep('IDENTIFY_NAME');
        } finally {
            setLoading(false);
        }
    } 
    // 2. Identify Name (if new)
    else if (step === 'IDENTIFY_NAME') {
        addMessage(val, 'user');
        setBooking(prev => ({ ...prev, clientName: val }));
        addMessage(getMessage('niceToMeetYou', val));
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
             addMessage(getMessage('noSalons'));
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
      
      addMessage(getMessage('chooseService'));
      goToStep('SERVICE');
    } catch (err) {
      addMessage('Erro ao carregar serviços.');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = async (service) => {
    // Legacy single select handler - kept if needed but UI now uses Toggle/Confirm
    handleServiceToggle(service);
    // For single click flow (optional, but requested UI is toggle + confirm)
  };

  const handleServiceToggle = (service) => {
    setBooking(prev => {
        const current = prev.selectedServices || [];
        const exists = current.find(s => s._id === service._id);
        
        let newSelection;
        if (exists) {
            newSelection = current.filter(s => s._id !== service._id);
        } else {
            newSelection = [...current, service];
        }
        
        return { ...prev, selectedServices: newSelection };
    });
  };

  const handleServicesConfirmed = async () => {
    const selected = booking.selectedServices || [];
    if (selected.length === 0) return;
    
    const names = selected.map(s => s.name).join(', ');
    addMessage(names, 'user');

    // Legacy support: set 'service' to the first one just in case
    setBooking(prev => ({ ...prev, service: selected[0] }));

    setLoading(true);
    try {
        // Fetch all professionals for the salon
        const res = await axios.get(`/api/professionals?salao_id=${booking.salon._id}`);
        setProfessionals(res.data);
        
        if (res.data.length > 0) {
            addMessage(getMessage('chooseProfessional'));
            goToStep('PROFESSIONAL');
        } else {
            addMessage(getMessage('noProfessionals'));
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
        addMessage(getMessage('noPreference'), 'user');
        setBooking(prev => ({ ...prev, professional: professionals[0] }));
    }
    
    addMessage(getMessage('chooseDate'));
    goToStep('DATE');
  };

  const handleDateSelect = async (dateStr) => {
    const dateObj = parse(dateStr, 'yyyy-MM-dd', new Date());
    const formattedDate = format(dateObj, 'dd/MM/yyyy');
    
    addMessage(formattedDate, 'user');
    setBooking(prev => ({ ...prev, date: dateStr }));
    
    addMessage(getMessage('checkingSchedule'), 'bot');
    setLoading(true);
    
    try {
      const { salon, professional, service, selectedServices } = booking;
      
      const serviceIds = selectedServices?.length > 0 
        ? selectedServices.map(s => s._id) 
        : [service?._id].filter(Boolean);

      const res = await axios.get('/api/disponibilidade/horarios', {
        params: {
          salao_id: salon._id,
          profissional_id: booking.professional?._id || professional._id,
          servicos: serviceIds,
          data: dateStr
        }
      });
      
      setAvailableSlots(res.data);

      // Check for Arrival Order header
      if (res.headers['x-arrival-order'] === 'true') {
        addMessage(getMessage('arrivalOrderWarning'));
        addMessage(getMessage('chooseAnotherDate'));
        goToStep('ARRIVAL_WARNING');
        return;
      }

      if (res.data.length > 0) {
        addMessage(getMessage('timeFound', formattedDate));
        goToStep('TIME');
      } else {
        addMessage(getMessage('noSlots', formattedDate));
        goToStep('DATE');
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
    
    addMessage(getMessage('confirmDetails'));
    goToStep('CONFIRM');
  };

  const [calendarLinks, setCalendarLinks] = useState(null);

  const handleConfirm = async () => {
    addMessage(getMessage('confirmButton'), 'user');
    setLoading(true);
    try {
      const serviceIds = booking.selectedServices?.length > 0 
        ? booking.selectedServices.map(s => s._id)
        : [booking.service._id];

      const res = await axios.post('/api/agendamentos', {
        salao_id: booking.salon._id,
        profissional_id: booking.professional._id,
        data: booking.date,
        hora_inicio: booking.time,
        servicos: serviceIds,
        cliente: booking.clientName,
        telefone: booking.clientPhone
      });
      
      // Save phone to cache on success
      localStorage.setItem('customer_phone', booking.clientPhone);

      if (res.data.links) {
        setCalendarLinks(res.data.links);
      }

      const serviceNames = booking.selectedServices?.length > 0
        ? booking.selectedServices.map(s => s.name).join(', ')
        : booking.service.name;

      const successMsg = getMessage('success');
      addMessage(`${successMsg}\n${serviceNames} com ${booking.professional.name}\nDia ${format(parse(booking.date, 'yyyy-MM-dd', new Date()), 'dd/MM')} às ${booking.time}.`);
      
      if (chatConfig.enableSuccessMeme !== false) {
        const memeUrl = chatConfig.successMemeUrl || 'https://media.tenor.com/l5_u4JktKxYAAAAC/thumbs-up-computer.gif';
        addMessage(memeUrl, 'bot', 'image');
      }

      addMessage(getMessage('addToCalendar'), 'bot');
      setStep('CALENDAR_DECISION');
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
        const selectedCount = booking.selectedServices?.length || 0;
        return (
          <div className="space-y-4">
            <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide snap-x">
              {services.map(s => {
                const isSelected = booking.selectedServices?.some(sel => sel._id === s._id);
                return (
                  <button 
                    key={s._id} 
                    onClick={() => handleServiceToggle(s)} 
                    className={clsx(
                      `flex-shrink-0 w-40 flex flex-col ${roundedClass} border transition-all snap-center overflow-hidden shadow-sm bg-white ${animClass}`,
                      isSelected ? "ring-2 ring-offset-2" : "opacity-90 hover:opacity-100"
                    )}
                    style={{ 
                        borderColor: isSelected ? chatConfig.buttonColor : '#e2e8f0',
                        '--tw-ring-color': chatConfig.buttonColor
                    }}
                  >
                    {/* Image Area */}
                    <div className="h-24 w-full bg-slate-100 relative">
                        {s.image && s.image.trim() !== '' ? (
                            <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Scissors size={24} />
                            </div>
                        )}
                        {isSelected && (
                            <div className="absolute top-1 right-1 bg-green-500 text-white p-0.5 rounded-full shadow-sm">
                                <CheckCircle size={14} />
                            </div>
                        )}
                    </div>
                    
                    {/* Content Area */}
                    <div className="p-2 text-left flex-1 flex flex-col w-full">
                        <div className="font-medium text-xs text-slate-800 line-clamp-2 mb-1 leading-tight">{s.name}</div>
                        <div className="mt-auto">
                            <div className="text-[10px] text-slate-500 mb-0.5 flex items-center gap-1">
                                <Clock size={10} /> {s.duration} min
                            </div>
                            <div className="font-bold text-sm text-slate-900">
                                R$ {s.price.toFixed(2)}
                            </div>
                        </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Confirmation Button */}
            {selectedCount > 0 && (
                <div className="flex justify-end">
                    <button
                        onClick={handleServicesConfirmed}
                        className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90"
                        style={{ backgroundColor: chatConfig.buttonColor }}
                    >
                        Confirmar ({selectedCount}) <Send size={16} />
                    </button>
                </div>
            )}
            
            {/* Helper Text */}
            <div className="text-center text-xs text-slate-400 animate-pulse">
                Arraste para o lado para ver mais opções →
            </div>
          </div>
        );
      case 'PROFESSIONAL':
        return (
          <div className="grid grid-cols-2 gap-2">
            {professionals.map(p => (
              <button 
                key={p._id} 
                onClick={() => handleProfessionalSelect(p)} 
                className="card hover:opacity-90 text-left flex items-center gap-2 transition-all p-2"
                style={{ 
                    backgroundColor: chatConfig.buttonColor, 
                    color: '#fff' 
                }}
              >
                <div className="bg-white/20 p-1.5 rounded-full text-white"><Briefcase size={16} /></div>
                <div className="font-medium text-sm line-clamp-1">{p.name}</div>
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
                const dateStr = format(d, 'yyyy-MM-dd');
                const isSelected = booking.date === dateStr;
                return (
                  <button 
                    key={d.toString()} 
                    onClick={() => handleDateSelect(dateStr)}
                    className={clsx(
                        `flex-shrink-0 w-16 h-20 ${roundedClass} flex flex-col items-center justify-center border transition-all ${animClass}`
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
      case 'ARRIVAL_WARNING':
        return (
          <div className="grid gap-2">
            <button 
              onClick={() => {
                addMessage('Sim, escolher outra data', 'user');
                goToStep('DATE');
              }} 
              className="card hover:opacity-90 text-left flex items-center gap-3 transition-all"
              style={{ 
                  backgroundColor: chatConfig.buttonColor, 
                  color: '#fff' 
              }}
            >
              <div className="bg-white/20 p-2 rounded-full text-white"><Calendar size={20} /></div>
              <div className="font-medium">Sim, escolher outra data</div>
            </button>
            <button 
              onClick={() => {
                addMessage('Não, encerrar atendimento', 'user');
                addMessage('Entendido. Agradecemos o contato!', 'bot');
                // Reset flow after a delay
                setTimeout(() => {
                    handleReset();
                }, 3000);
              }} 
              className="card hover:opacity-90 text-left flex items-center gap-3 transition-all bg-white border border-slate-200"
              style={{ color: '#ef4444' }} // Red for cancel
            >
              <div className="bg-red-50 p-2 rounded-full text-red-500"><Trash2 size={20} /></div>
              <div className="font-medium">Não, encerrar atendimento</div>
            </button>
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
                    <p><span className="text-gray-500">Data:</span> {booking.date && format(parse(booking.date, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')} às {booking.time}</p>
                    <p><span className="text-gray-500">Total:</span> R$ {booking.service?.price.toFixed(2)}</p>
                </div>
                <button 
                    onClick={handleConfirm} 
                    className={`w-full btn-primary flex justify-center items-center gap-2 ${buttonRoundedClass}`}
                    style={{ backgroundColor: chatConfig.buttonColor }}
                >
                    <CheckCircle size={18} /> {getMessage('confirmButton')}
                </button>
            </div>
        );
      case 'CALENDAR_DECISION':
        return (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                addMessage('Sim', 'user');
                addMessage('Escolha sua agenda:', 'bot');
                setStep('CALENDAR_OPTIONS');
              }}
              className="card p-3 flex flex-col items-center gap-2 hover:opacity-90 transition-all"
              style={{ backgroundColor: chatConfig.buttonColor, color: '#fff' }}
            >
              <div className="bg-white/20 p-2 rounded-full"><CheckCircle size={24} /></div>
              <div className="font-bold">SIM</div>
            </button>
            <button
              onClick={() => {
                addMessage('Não', 'user');
                addMessage('Combinado! Te esperamos lá. 😉', 'bot');
                setStep('FINAL');
              }}
              className="card p-3 flex flex-col items-center gap-2 hover:bg-slate-100 transition-all bg-white border border-slate-200"
              style={{ color: '#64748b' }}
            >
              <div className="bg-slate-100 p-2 rounded-full"><X size={24} /></div>
              <div className="font-bold">NÃO</div>
            </button>
          </div>
        );
      case 'CALENDAR_OPTIONS':
        return (
            <div className="space-y-3">
                {calendarLinks && (
                    <div className="flex gap-2">
                         <a 
                             href={calendarLinks.google} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 ${roundedClass} bg-white border hover:bg-slate-50 text-xs font-medium transition-colors text-center shadow-sm`}
                             style={{ borderColor: chatConfig.buttonColor, color: chatConfig.buttonColor }}
                         >
                             <Calendar size={18} /> Google
                         </a>
                         <a 
                             href={calendarLinks.ics} 
                             download="agendamento.ics"
                             className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 ${roundedClass} bg-white border hover:bg-slate-50 text-xs font-medium transition-colors text-center shadow-sm`}
                             style={{ borderColor: chatConfig.buttonColor, color: chatConfig.buttonColor }}
                         >
                             <Calendar size={18} /> Apple/Outros
                         </a>
                    </div>
                )}
                
                <button 
                    onClick={handleReset}
                    className="w-full btn-primary flex justify-center items-center gap-2"
                    style={{ backgroundColor: chatConfig.buttonColor }}
                >
                    <Plus size={18} /> Novo Agendamento
                </button>
            </div>
        );
      case 'FINAL':
        return (
            <div className="space-y-3">
                {notifPermission === 'default' && (
                    <button 
                        onClick={handleEnableNotifications}
                        className={`w-full p-3 ${roundedClass} shadow-sm flex items-center justify-between hover:opacity-90 transition-opacity`}
                        style={{ backgroundColor: chatConfig.buttonColor, color: '#fff' }}
                    >
                        <div className="flex items-center gap-3">
                            <Bell size={18} />
                            <div className="text-left">
                                <div className="font-bold text-sm">Ativar Notificações</div>
                                <div className="text-[10px] opacity-90">Receba lembretes automáticos</div>
                            </div>
                        </div>
                        <div className="bg-white/20 p-1 rounded-lg">
                            <CheckCircle size={14} />
                        </div>
                    </button>
                )}

                <button 
                    onClick={handleReset}
                    className="w-full btn-primary flex justify-center items-center gap-2"
                    style={{ backgroundColor: chatConfig.buttonColor }}
                >
                    <Plus size={18} /> Novo Agendamento
                </button>
            </div>
        );
      case 'MY_APPOINTMENTS':
        return (
            <div className="space-y-3">
                {myAppointments.map(appt => (
                    <div key={appt._id} className={`card bg-white border p-3 ${roundedClass} shadow-sm`}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="font-bold text-slate-800">{appt.services.map(s => s.name).join(', ')}</div>
                                <div className="text-sm text-slate-500">{appt.salonId.name}</div>
                            </div>
                            <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                Agendado
                            </div>
                        </div>
                        
                        <div className="text-sm space-y-1 mb-3">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Calendar size={14} />
                                {format(parse(appt.date.split('T')[0], 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')}
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Clock size={14} />
                                {(() => {
                                    try {
                                        // If we have the raw input string 'hora_inicio' (some backends might send it), prefer it
                                        if (appt.hora_inicio && typeof appt.hora_inicio === 'string' && appt.hora_inicio.includes(':')) {
                                            return appt.hora_inicio;
                                        }

                                        // Otherwise parse the ISO startTime
                                        // We use new Date() to ensure the browser converts UTC back to Local Time
                                        if (appt.startTime) {
                                            const date = new Date(appt.startTime);
                                            if (!isNaN(date.getTime())) {
                                                return format(date, 'HH:mm');
                                            }
                                        }

                                        return '00:00';
                                    } catch (e) {
                                        return '00:00';
                                    }
                                })()}
                            </div>
                            {appt.professionalId && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <User size={14} />
                                    {appt.professionalId.name}
                                </div>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => handleCancelAppointment(appt._id)}
                            className="w-full py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={16} /> Cancelar Agendamento
                        </button>
                    </div>
                ))}
                <button 
                    onClick={() => {
                        if (services.length > 0) {
                            goToStep('SERVICE');
                        } else if (salons.length > 0) {
                            handleSalonSelect(booking.salon || salons[0], true);
                        } else {
                            addMessage('Aguarde, carregando informações do estabelecimento...');
                            window.location.reload();
                        }
                    }}
                    className="w-full py-3 text-white rounded-lg font-medium hover:opacity-90 flex items-center justify-center gap-2 mb-2"
                    style={{ backgroundColor: chatConfig.buttonColor }}
                >
                    <Plus size={16} /> Novo Agendamento
                </button>

                <button 
                    onClick={handleBack}
                    className="w-full py-3 text-slate-500 text-sm hover:underline"
                >
                    Voltar
                </button>
            </div>
        );
      default:
        return null;
    }
  };

  const runStartLogic = async () => {
      setLoading(true);
      try {
        let loadedSalons = salons;
        
        // If salons not loaded yet (e.g. first run), load them
        if (loadedSalons.length === 0) {
            const path = window.location.pathname;
            const chatMatch = path.match(/^\/chat\/([^\/]+)/);
            
            if (chatMatch) {
                const slug = chatMatch[1];
                try {
                    const res = await axios.get(`/api/public/salon/${slug}`);
                    if (res.data) loadedSalons = [res.data];
                } catch (e) {
                    console.error("Slug load failed", e);
                }
            }

            if (loadedSalons.length === 0) {
                const res = await axios.get('/api/salons');
                loadedSalons = res.data;
            }

            setSalons(loadedSalons);
            
            if (loadedSalons.length === 1 && loadedSalons[0].chatConfig) {
                setChatConfig(prev => ({ ...prev, ...loadedSalons[0].chatConfig }));
            }
        }

        // CACHE CHECK
        const cachedPhone = localStorage.getItem('customer_phone');
        let customerFound = false;

        if (cachedPhone) {
            try {
                const res = await axios.get(`/api/customers/check?phone=${cachedPhone}`);
                if (res.data.found) {
                    customerFound = true;
                    setBooking(prev => ({ ...prev, clientPhone: cachedPhone, clientName: res.data.name }));
                    addMessage(getMessage('welcomeBackDevice', res.data.name));
                    
                    // Skip to Salon selection
                    if (loadedSalons.length > 0) {
                        if (loadedSalons.length === 1) {
                            handleSalonSelect(loadedSalons[0], true);
                        } else {
                            setStep('SALON');
                            addMessage(getMessage('chooseSalon'));
                        }
                    } else {
                        addMessage(getMessage('noSalons'));
                    }
                }
            } catch (e) {
                console.error("Cache check failed", e);
            }
        }

        if (!customerFound) {
            addMessage(getMessage('welcomeInitial'));
            setStep('IDENTIFY_PHONE');
        }

      } catch (err) {
        console.error("Erro ao carregar inicial", err);
        addMessage('Erro ao conectar com o servidor.');
      } finally {
        setLoading(false);
      }
  };

  const handleReset = () => {
      setMessages([]);
      setHistory([]);
      setBooking({
        salon: null,
        service: null,
        selectedServices: [],
        professional: null,
        date: null,
        time: null,
        clientName: '',
        clientPhone: ''
      });
      setStep('INIT');
      setCalendarLinks(null);
      
      // Small delay to ensure state is cleared before logic runs (though React batches, it's safer to await or just run)
      // Actually, since state updates are async, we might want to run logic in a useEffect or just assume it will pick up.
      // But we need to make sure we don't use stale state in runStartLogic.
      // runStartLogic uses `salons` state.
      
      setTimeout(runStartLogic, 100);
  };

  // Init
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      setLoading(true);

      const path = window.location.pathname;
      const hostname = window.location.hostname;
      
      if (path === '/login') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setAdminUser(null);
          setView('LOGIN');
          setLoading(false);
          return;
      }

      if (path === '/admin' || hostname.startsWith('admin.')) {
          setView('LOGIN');
      }

      const token = localStorage.getItem('token');
      // Always try to validate token and get fresh user data
      if (token) {
          try {
              axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              const meRes = await axios.get('/api/me');
              const user = meRes.data;
              
              setAdminUser(user);
              localStorage.setItem('user', JSON.stringify(user));

              if (path === '/admin') {
                  setView('ADMIN');
              }
          } catch (e) {
              console.error("Token validation failed", e);
              // Only clear if it's an auth error, not network error
              if (e.response && (e.response.status === 401 || e.response.status === 403)) {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  setAdminUser(null);
                  if (path === '/admin') setView('LOGIN');
              } else {
                  // Fallback to local storage if network error
                  const userStr = localStorage.getItem('user');
                  if (userStr) {
                      setAdminUser(JSON.parse(userStr));
                      if (path === '/admin') setView('ADMIN');
                  }
              }
          }
      }
      
      // Run Chat Logic
      await runStartLogic();
    };
    init();
  }, []);

  if (view === 'LOGIN') {
    return <AdminLogin onLogin={handleLoginSuccess} />;
  }

  if (view === 'ADMIN') {
    return <AdminDashboard user={adminUser} onLogout={handleLogout} />;
  }

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
      <div className={clsx("w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[80vh]", isFeminine && "font-soft")}>
        {/* Header */}
        <div 
            className="border-b p-4 flex items-center gap-3 sticky top-0 z-10"
            style={{ backgroundColor: chatConfig.headerColor }}
        >
          {history.length > 0 ? (
            <button onClick={handleBack} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                <ArrowLeft size={20} style={{ color: chatConfig.headerTextColor }} />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 text-gray-500">
                {chatConfig.showAvatar && chatConfig.avatarUrl ? (
                    <img src={chatConfig.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <Store size={20} />
                )}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate" style={{ color: chatConfig.headerTextColor }}>{chatConfig.assistantName}</h1>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online agora
            </p>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={handleReset} 
                className="text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-2 sm:px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all"
                title="Voltar ao Início"
            >
                <History size={14} /> 
                Início
            </button>
            <button 
                onClick={handleMyHistoryClick} 
                className="text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-2 sm:px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all"
                title="Ver meus agendamentos"
            >
                <Calendar size={14} /> 
                <span className="hidden sm:inline">Meus Agendamentos</span>
                <span className="sm:hidden">Agenda</span>
            </button>
            {/* Admin button removed as per request */}
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
                {msg.type === 'image' ? (
                    <img 
                        src={msg.text} 
                        alt="Meme" 
                        className="rounded-lg w-full h-auto object-cover max-w-[200px]" 
                        onError={(e) => e.target.style.display = 'none'}
                    />
                ) : (
                    msg.text
                )}
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
