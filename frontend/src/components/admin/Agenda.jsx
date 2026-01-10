import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { Calendar as CalendarIcon, User, Scissors, Plus, X, CheckCircle, Trash2, Clock, DollarSign, Repeat, Package } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const Agenda = () => {
    const [appointments, setAppointments] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modals
    const [showModal, setShowModal] = useState(false); // Create
    const [showDetailsModal, setShowDetailsModal] = useState(false); // View/Edit
    const [showFinishModal, setShowFinishModal] = useState(false); // Finish

    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [finalPrice, setFinalPrice] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    
    // Products in Finish Modal
    const [availableProducts, setAvailableProducts] = useState([]);
    const [usedProducts, setUsedProducts] = useState([]);
    const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
    const [selectedProductPrice, setSelectedProductPrice] = useState('');

    // Form State (Create)
    const [formData, setFormData] = useState({
        professionalId: '',
        serviceId: '',
        date: '',
        time: '',
        clientName: '',
        clientPhone: '',
        recurrenceType: 'none',
        recurrenceCount: ''
    });

    // Data for selectors
    const [professionals, setProfessionals] = useState([]);
    const [services, setServices] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    
    // Customer Search State
    const [customerSuggestions, setCustomerSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isManualCustomer, setIsManualCustomer] = useState(false); // Toggle between Search and Manual inputs

    const user = JSON.parse(localStorage.getItem('user'));

    // Calendar view date range
    const [currentDate, setCurrentDate] = useState(new Date());

    // Sound Notification
    const [lastAppointmentCount, setLastAppointmentCount] = useState(0);

    useEffect(() => {
        fetchInitialData();
        
        // Polling for new appointments every 30 seconds
        const interval = setInterval(() => {
            const start = startOfMonth(currentDate);
            const end = endOfMonth(currentDate);
            fetchAppointments(start, end, true);
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Fetch appointments for the current view (month)
        // Ideally we should calculate start/end of current view
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        fetchAppointments(start, end);
    }, [currentDate]);

    const playNotificationSound = () => {
        try {
            const audio = new Audio('/ringtone.wav');
            audio.play().catch(e => console.log("Audio play failed (interaction needed):", e));
        } catch (e) {
            console.error("Audio error:", e);
        }
    };

    const fetchAppointments = async (start, end, isPolling = false) => {
        try {
            // Fetch generous range to cover month view padding
            // Or just fetch all if volume is low, but better use range
            const res = await axios.get('/api/admin/appointments', {
                params: {
                    start: start.toISOString(),
                    end: end.toISOString()
                }
            });
            
            const newAppointments = res.data;
            
            // Sound Notification Check
            if (isPolling && newAppointments.length > lastAppointmentCount) {
                // playNotificationSound(); // Disabled for now to avoid annoyance
            }
            setLastAppointmentCount(newAppointments.length);
            setAppointments(newAppointments);
            
            // Map to calendar events
            const mappedEvents = newAppointments.map(apt => {
                // Safely extract service names
                let serviceNames = 'Serviço';
                
                // Try to extract from 'services' array (new structure)
                if (apt.services && apt.services.length > 0) {
                    // Filter valid names from objects
                    const names = apt.services
                        .map(s => (s && typeof s === 'object' && s.name) ? s.name : null)
                        .filter(n => n);
                    
                    if (names.length > 0) {
                        serviceNames = names.join(', ');
                    } else if (apt.serviceName) {
                        // Fallback to legacy field if array has no names
                        serviceNames = apt.serviceName;
                    }
                } 
                // Fallback to legacy field if 'services' array is missing/empty
                else if (apt.serviceName) {
                    serviceNames = apt.serviceName;
                }

                return {
                    id: apt._id,
                    title: `${serviceNames} - ${apt.customerName}`,
                    start: parseISO(apt.startTime),
                    end: parseISO(apt.endTime),
                    resource: apt,
                    status: apt.status
                };
            });
            
            setEvents(mappedEvents);
        } catch (error) {
            console.error("Erro ao carregar agendamentos", error);
        } finally {
            if (!isPolling) setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/admin/products');
            setAvailableProducts(res.data.filter(p => p.active && p.stock > 0));
        } catch (error) {
            console.error("Erro ao carregar produtos", error);
        }
    };

    const fetchInitialData = async () => {
        if (!user) return;
        try {
            const salonId = user.salonId || user.id;
            const [profRes, servRes] = await Promise.all([
                axios.get(`/api/professionals?salao_id=${salonId}`),
                axios.get(`/api/services?salao_id=${salonId}`)
            ]);
            setProfessionals(profRes.data);
            setServices(servRes.data);
            fetchProducts(); // Load products
        } catch (err) {
            console.error(err);
        }
    };

    // When Date or Professional changes, fetch slots
    useEffect(() => {
        if (formData.date && formData.professionalId && formData.serviceId && showModal) {
            fetchSlots();
        }
    }, [formData.date, formData.professionalId, formData.serviceId, showModal]);

    const fetchSlots = async () => {
        try {
            const salonId = user.salonId || user.id;
            console.log("Fetching slots with params:", {
                salao_id: salonId,
                data: formData.date,
                profissional_id: formData.professionalId,
                servicos: formData.serviceId
            });

            const res = await axios.get('/api/disponibilidade/horarios', {
                params: {
                    salao_id: salonId,
                    data: formData.date,
                    profissional_id: formData.professionalId,
                    servicos: formData.serviceId
                }
            });
            setAvailableSlots(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCustomerSearch = async (term) => {
        setFormData({ ...formData, clientName: term });
        
        if (term.length < 3) {
            setCustomerSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const res = await axios.get('/api/admin/customers', {
                params: { search: term }
            });
            setCustomerSuggestions(res.data.customers);
            setShowSuggestions(true);
        } catch (err) {
            console.error(err);
        }
    };

    const selectCustomer = (customer) => {
        setFormData({
            ...formData,
            clientName: customer.name,
            clientPhone: customer.phone
        });
        setCustomerSuggestions([]);
        setShowSuggestions(false);
        setIsManualCustomer(false); // Mantém modo busca, mas com valor selecionado (visualmente tratado abaixo)
    };

    const clearCustomerSelection = () => {
        setFormData({
            ...formData,
            clientName: '',
            clientPhone: ''
        });
        setIsManualCustomer(false);
    };

    // Calendar Actions
    const handleSelectSlot = (slotInfo) => {
        // Pre-fill date
        setFormData(prev => ({
            ...prev,
            date: format(slotInfo.start, 'yyyy-MM-dd')
        }));
        setShowModal(true);
    };

    const handleSelectEvent = (event) => {
        setSelectedAppointment(event.resource);
        setShowDetailsModal(true);
    };

    const handleNavigate = (date) => {
        setCurrentDate(date);
    };

    // CRUD Actions
    const handleDelete = async (id, cancelFuture = false) => {
        const message = cancelFuture 
            ? 'Tem certeza que deseja excluir este e TODOS os agendamentos futuros desta recorrência?'
            : 'Tem certeza que deseja excluir este agendamento?';

        if (!window.confirm(message)) return;
        
        try {
            await axios.delete(`/api/admin/appointments/${id}`, {
                params: { cancelFuture }
            });
            setShowDetailsModal(false);
            // Refresh
            const start = startOfMonth(currentDate);
            const end = endOfMonth(currentDate);
            fetchAppointments(start, end);
        } catch (err) {
            alert('Erro ao excluir agendamento: ' + (err.response?.data?.error || err.message));
        }
    };

    // Update selected product price when selection changes
    useEffect(() => {
        const product = availableProducts.find(p => p._id === selectedProductToAdd);
        if (product) {
            setSelectedProductPrice(product.price);
        } else {
            setSelectedProductPrice('');
        }
    }, [selectedProductToAdd, availableProducts]);

    // Product helpers for Finish Modal
    const addProductToFinish = () => {
        if (!selectedProductToAdd) return;
        
        const product = availableProducts.find(p => p._id === selectedProductToAdd);
        if (!product) return;

        // Check if already added
        if (usedProducts.find(p => p.productId === product._id)) {
            alert('Produto já adicionado.');
            return;
        }

        setUsedProducts([...usedProducts, {
            productId: product._id,
            name: product.name,
            price: selectedProductPrice !== '' ? Number(selectedProductPrice) : product.price,
            quantity: 1
        }]);
        
        setSelectedProductToAdd('');
        setSelectedProductPrice('');
    };

    const updateProductQuantity = (index, newQty) => {
        const updated = [...usedProducts];
        updated[index].quantity = Math.max(1, Number(newQty));
        setUsedProducts(updated);
    };

    const updateProductPrice = (index, newPrice) => {
        const updated = [...usedProducts];
        updated[index].price = Math.max(0, Number(newPrice));
        setUsedProducts(updated);
    };

    const removeProductFromFinish = (index) => {
        const updated = [...usedProducts];
        updated.splice(index, 1);
        setUsedProducts(updated);
    };

    const handleFinishClick = (apt) => {
        // Close details, open finish
        setShowDetailsModal(false);
        setSelectedAppointment(apt);
        setFinalPrice(apt.totalPrice || 0);
        setPaymentMethod('');
        setUsedProducts([]); // Reset products
        setSelectedProductToAdd(''); // Reset selection
        setShowFinishModal(true);
    };

    // Update final price when products change
    useEffect(() => {
        if (showFinishModal && selectedAppointment) {
            console.log('Recalculating price. Used Products:', usedProducts);
            let servicePrice = Number(selectedAppointment.totalPrice) || 0;
            
            // If totalPrice is 0 or missing, try to sum from services if populated
            if (servicePrice === 0 && selectedAppointment.services && selectedAppointment.services.length > 0) {
                 const calculated = selectedAppointment.services.reduce((sum, s) => {
                     // Check if it's an object and has price
                     if (s && typeof s === 'object') {
                         return sum + (Number(s.price) || 0);
                     }
                     return sum;
                 }, 0);
                 
                 if (calculated > 0) {
                     servicePrice = calculated;
                 }
            }

            const productsPrice = usedProducts.reduce((sum, p) => sum + (Number(p.price) * Number(p.quantity)), 0);
            console.log('Service Price:', servicePrice, 'Products Price:', productsPrice);
            setFinalPrice(servicePrice + productsPrice);
        }
    }, [usedProducts, showFinishModal, selectedAppointment]);

    const submitFinish = async (e) => {
        e.preventDefault();
        
        // UX Check: Did user select a product but forgot to click add?
        if (selectedProductToAdd) {
            const product = availableProducts.find(p => p._id === selectedProductToAdd);
            if (product) {
                if (!window.confirm(`Você selecionou o produto "${product.name}" mas não clicou no botão (+). Deseja adicionar este produto antes de finalizar?`)) {
                    // User said no, proceed without it
                } else {
                    // User said yes, cancel submit so they can add it
                    return;
                }
            }
        }

        console.log('Submitting Finish. Products:', usedProducts);
        try {
            await axios.put(`/api/appointments/${selectedAppointment._id}/finish`, {
                finalPrice: Number(finalPrice),
                paymentMethod,
                products: usedProducts
            });
            setShowFinishModal(false);
            const start = startOfMonth(currentDate);
            const end = endOfMonth(currentDate);
            fetchAppointments(start, end);
            alert('Atendimento finalizado com sucesso!');
        } catch (err) {
            alert('Erro ao finalizar: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/agendamentos', {
                salao_id: user.id,
                profissional_id: formData.professionalId,
                servicos: [formData.serviceId], // Array expected
                data: formData.date,
                hora_inicio: formData.time,
                cliente: formData.clientName,
                telefone: formData.clientPhone,
                origin: 'panel',
                recurrence: {
                    type: formData.recurrenceType,
                    count: formData.recurrenceCount
                }
            });
            setShowModal(false);
            const start = startOfMonth(currentDate);
            const end = endOfMonth(currentDate);
            fetchAppointments(start, end);
            alert('Agendamento criado com sucesso!');
            // Reset form
            setFormData({
                professionalId: '',
                serviceId: '',
                date: '',
                time: '',
                clientName: '',
                clientPhone: '',
                recurrenceType: 'none',
                recurrenceCount: ''
            });
        } catch (err) {
            alert('Erro ao criar agendamento: ' + (err.response?.data?.erro || err.message));
        }
    };

    const eventStyleGetter = (event) => {
        let backgroundColor = '#3B82F6'; // confirmed (blue)
        if (event.status === 'completed') backgroundColor = '#10B981'; // green
        if (event.status === 'cancelled') backgroundColor = '#EF4444'; // red
        
        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <CalendarIcon className="text-blue-600" /> Agenda
                </h2>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm"
                >
                    <Plus size={18} /> Novo Agendamento
                </button>
            </div>

            <div className="h-[700px] bg-white p-6 rounded-xl shadow-sm">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    messages={{
                        next: "Próximo",
                        previous: "Anterior",
                        today: "Hoje",
                        month: "Mês",
                        week: "Semana",
                        day: "Dia",
                        date: "Data",
                        time: "Hora",
                        event: "Evento",
                        noEventsInRange: "Não há agendamentos neste período."
                    }}
                    culture='pt-BR'
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    selectable
                    onNavigate={handleNavigate}
                    eventPropGetter={eventStyleGetter}
                    components={{
                        event: ({ event }) => (
                            <div className="flex items-center gap-1 overflow-hidden">
                                {event.resource.recurrenceId && <Repeat size={12} className="shrink-0" />}
                                <span className="truncate">{event.title}</span>
                            </div>
                        )
                    }}
                />
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="font-bold text-lg">Novo Agendamento</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* 1. Professional */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Profissional</label>
                                <select 
                                    required 
                                    className="w-full p-2 border rounded-lg bg-white"
                                    value={formData.professionalId}
                                    onChange={e => setFormData({...formData, professionalId: e.target.value})}
                                >
                                    <option value="">Selecione...</option>
                                    {professionals.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 2. Service */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
                                <select 
                                    required 
                                    className="w-full p-2 border rounded-lg bg-white"
                                    value={formData.serviceId}
                                    onChange={e => setFormData({...formData, serviceId: e.target.value})}
                                >
                                    <option value="">Selecione...</option>
                                    {services.map(s => (
                                        <option key={s._id} value={s._id}>{s.name} - {s.duration} min - R$ {s.price}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                <input 
                                    type="date" 
                                    required 
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                />
                            </div>

                            {/* 4. Time */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                                <select 
                                    required 
                                    className="w-full p-2 border rounded-lg bg-white"
                                    value={formData.time}
                                    onChange={e => setFormData({...formData, time: e.target.value})}
                                    disabled={!formData.date || !formData.professionalId || !formData.serviceId}
                                >
                                    <option value="">Selecione...</option>
                                    {availableSlots.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                {availableSlots.length === 0 && formData.date && formData.professionalId && formData.serviceId && (
                                    <p className="text-xs text-orange-500 mt-1">Nenhum horário disponível para esta combinação.</p>
                                )}
                            </div>

                            {/* Recurrence */}
                            <div className="pt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                    <Repeat size={16} /> Repetição
                                </label>
                                <div className="flex gap-4">
                                    <select 
                                        className="flex-1 p-2 border rounded-lg bg-white"
                                        value={formData.recurrenceType}
                                        onChange={e => setFormData({...formData, recurrenceType: e.target.value})}
                                    >
                                        <option value="none">Não repetir</option>
                                        <option value="weekly">Semanalmente</option>
                                        <option value="biweekly">Quinzenalmente</option>
                                        <option value="monthly">Mensalmente</option>
                                        <option value="yearly">Anualmente</option>
                                    </select>

                                    {formData.recurrenceType !== 'none' && (
                                        <input 
                                            type="number" 
                                            min="2" 
                                            max="52"
                                            placeholder="Qtd"
                                            className="w-24 p-2 border rounded-lg"
                                            value={formData.recurrenceCount}
                                            onChange={e => setFormData({...formData, recurrenceCount: e.target.value})}
                                            title="Quantidade de repetições"
                                            required
                                        />
                                    )}
                                </div>
                                {formData.recurrenceType !== 'none' && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Serão criados agendamentos individuais. O sistema verificará a disponibilidade de todos.
                                    </p>
                                )}
                            </div>

                            {/* 1. Customer Selection */}
                            <div className="relative pt-4 border-t border-dashed">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                
                                {!isManualCustomer && formData.clientPhone ? (
                                    // Selected Customer View
                                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div>
                                            <p className="font-medium text-blue-900">{formData.clientName}</p>
                                            <p className="text-sm text-blue-700">{formData.clientPhone}</p>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={clearCustomerSelection}
                                            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                                        >
                                            Alterar
                                        </button>
                                    </div>
                                ) : !isManualCustomer ? (
                                    // Search Mode
                                    <div className="relative">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded-lg pl-8"
                                                placeholder="Buscar por nome ou telefone..."
                                                value={formData.clientName}
                                                onChange={(e) => handleCustomerSearch(e.target.value)}
                                                onFocus={() => formData.clientName.length >= 3 && setShowSuggestions(true)}
                                            />
                                            <svg className="w-4 h-4 absolute left-2.5 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>

                                        {/* Suggestions Dropdown */}
                                        {showSuggestions && (
                                            <div className="absolute z-50 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                                                {customerSuggestions.length > 0 ? (
                                                    customerSuggestions.map(c => (
                                                        <div
                                                            key={c._id}
                                                            className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                                                            onClick={() => selectCustomer(c)}
                                                        >
                                                            <p className="font-medium">{c.name}</p>
                                                            <p className="text-xs text-gray-500">{c.phone}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-center text-gray-500 text-sm">
                                                        Nenhum cliente encontrado.
                                                    </div>
                                                )}
                                                
                                                <div 
                                                    className="p-2 bg-gray-50 border-t cursor-pointer hover:bg-gray-100 text-blue-600 text-center text-sm font-medium"
                                                    onClick={() => {
                                                        setIsManualCustomer(true);
                                                        setShowSuggestions(false);
                                                        setFormData({...formData, clientName: '', clientPhone: ''});
                                                    }}
                                                >
                                                    + Cadastrar Novo Cliente
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Manual Creation Mode
                                    <div className="p-3 border rounded-lg bg-gray-50 space-y-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Novo Cliente</span>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setIsManualCustomer(false);
                                                    setFormData({...formData, clientName: '', clientPhone: ''});
                                                }}
                                                className="text-xs text-gray-500 hover:text-gray-700 underline"
                                            >
                                                Voltar para busca
                                            </button>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Nome Completo</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full p-2 border rounded bg-white"
                                                value={formData.clientName}
                                                onChange={e => setFormData({...formData, clientName: e.target.value})}
                                                placeholder="Ex: João Silva"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Telefone (WhatsApp)</label>
                                            <input
                                                type="tel"
                                                required
                                                className="w-full p-2 border rounded bg-white"
                                                value={formData.clientPhone}
                                                onChange={e => setFormData({...formData, clientPhone: e.target.value})}
                                                placeholder="Ex: 11999999999"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button 
                                type="submit" 
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 mt-4"
                            >
                                Confirmar Agendamento
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedAppointment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">Detalhes do Agendamento</h3>
                            <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{selectedAppointment.customerName}</p>
                                    <p className="text-sm text-gray-500">{selectedAppointment.customerPhone}</p>
                                </div>
                            </div>

                            <div className="border-t border-b py-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Serviço:</span>
                                    <span className="font-medium">{selectedAppointment.services?.map(s => s.name).join(', ')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Profissional:</span>
                                    <span className="font-medium">{selectedAppointment.professionalId?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Data:</span>
                                    <span className="font-medium">{format(new Date(selectedAppointment.date), 'dd/MM/yyyy')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Horário:</span>
                                    <span className="font-medium">
                                        {/* Fix: Use hora_inicio if available to prevent timezone shifts */}
                                        {selectedAppointment.hora_inicio 
                                            ? selectedAppointment.hora_inicio 
                                            : (selectedAppointment.startTime && selectedAppointment.startTime.includes('T') 
                                                ? format(new Date(selectedAppointment.startTime), 'HH:mm') 
                                                : selectedAppointment.startTime)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-gray-500">Valor:</span>
                                    <span className="font-bold text-green-600 text-lg">
                                        R$ {selectedAppointment.finalPrice ? selectedAppointment.finalPrice.toFixed(2) : selectedAppointment.totalPrice?.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Recurrence Info */}
                            {selectedAppointment.recurrenceType && (
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 mt-2 mb-2">
                                    <div className="flex items-center gap-2 text-purple-700 font-medium text-sm mb-1">
                                        <Repeat size={14} />
                                        Agendamento Recorrente
                                    </div>
                                    <p className="text-xs text-purple-600">
                                        Tipo: {selectedAppointment.recurrenceType === 'weekly' ? 'Semanal' : 
                                               selectedAppointment.recurrenceType === 'biweekly' ? 'Quinzenal' :
                                               selectedAppointment.recurrenceType === 'monthly' ? 'Mensal' : 'Anual'}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 pt-2">
                                {selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled' && (
                                    <>
                                        <button 
                                            onClick={() => handleFinishClick(selectedAppointment)}
                                            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={18} /> Finalizar
                                        </button>
                                        
                                        {selectedAppointment.recurrenceId ? (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleDelete(selectedAppointment._id, false)}
                                                    className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg font-medium hover:bg-red-200 flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <Trash2 size={16} /> Excluir Este
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(selectedAppointment._id, true)}
                                                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <Trash2 size={16} /> Excluir Futuros
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleDelete(selectedAppointment._id)}
                                                className="w-full bg-red-100 text-red-600 py-2 rounded-lg font-medium hover:bg-red-200 flex items-center justify-center gap-2"
                                            >
                                                <Trash2 size={18} /> Cancelar
                                            </button>
                                        )}
                                    </>
                                )}
                                {(selectedAppointment.status === 'completed' || selectedAppointment.status === 'cancelled') && (
                                    <div className={`w-full text-center py-2 rounded-lg font-bold uppercase text-sm ${
                                        selectedAppointment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {selectedAppointment.status === 'completed' ? 'Finalizado' : 'Cancelado'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Finish Modal */}
            {showFinishModal && selectedAppointment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">Finalizar Atendimento</h3>
                            <button onClick={() => setShowFinishModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={submitFinish} className="p-6 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                <p className="text-sm text-gray-500">Cliente: <span className="font-bold text-gray-800">{selectedAppointment.customerName}</span></p>
                                <p className="text-sm text-gray-500">Valor Estimado: <span className="font-bold text-gray-800">R$ {selectedAppointment.totalPrice?.toFixed(2)}</span></p>
                            </div>

                            {/* Products Section */}
                            <div className="border-t border-b border-gray-100 py-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Package size={16} /> Produtos Utilizados
                                </label>
                                
                                <div className="flex gap-2 mb-2 items-center">
                                    <select 
                                        className="flex-1 p-2 border rounded-lg text-sm"
                                        value={selectedProductToAdd}
                                        onChange={e => setSelectedProductToAdd(e.target.value)}
                                    >
                                        <option value="">Adicionar produto...</option>
                                        {availableProducts.map(p => (
                                            <option key={p._id} value={p._id}>
                                                {p.name} (Estoque: {p.stock})
                                            </option>
                                        ))}
                                    </select>
                                    
                                    {selectedProductToAdd && (
                                        <div className="w-28 relative">
                                            <span className="absolute left-2 top-2 text-gray-500 text-xs">R$</span>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                min="0"
                                                placeholder="Preço"
                                                className="w-full p-2 pl-7 border rounded-lg text-sm"
                                                value={selectedProductPrice}
                                                onChange={(e) => setSelectedProductPrice(e.target.value)}
                                                title="Preço unitário do produto"
                                            />
                                        </div>
                                    )}

                                    <button 
                                        type="button"
                                        onClick={addProductToFinish}
                                        disabled={!selectedProductToAdd}
                                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                {/* Used Products List */}
                                {usedProducts.length > 0 && (
                                    <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-50 p-2 rounded-lg">
                                        {usedProducts.map((p, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm bg-white p-2 rounded border">
                                                <div className="flex-1">
                                                    <p className="font-medium truncate">{p.name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <span>Qtd:</span>
                                                        <input 
                                                            type="number" 
                                                            min="1"
                                                            className="w-12 p-1 border rounded"
                                                            value={p.quantity}
                                                            onChange={(e) => updateProductQuantity(idx, e.target.value)}
                                                        />
                                                        <span>R$:</span>
                                                        <input 
                                                            type="number" 
                                                            min="0"
                                                            step="0.01"
                                                            className="w-16 p-1 border rounded"
                                                            value={p.price}
                                                            onChange={(e) => updateProductPrice(idx, e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => removeProductFromFinish(idx)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                                <select 
                                    required 
                                    className="w-full p-2 border rounded-lg bg-white"
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="money">Dinheiro</option>
                                    <option value="pix">Pix</option>
                                    <option value="credit_card">Cartão de Crédito</option>
                                    <option value="debit_card">Cartão de Débito</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Final Cobrado (R$)</label>
                                <div className="relative">
                                    <DollarSign size={18} className="absolute left-3 top-3 text-gray-400" />
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        required 
                                        className="w-full pl-10 p-2 border rounded-lg font-bold text-lg"
                                        value={finalPrice}
                                        onChange={e => setFinalPrice(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 mt-2"
                            >
                                Confirmar e Receber
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agenda;
