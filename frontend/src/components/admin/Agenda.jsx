import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { Calendar as CalendarIcon, User, Scissors, Plus, X, CheckCircle, Trash2, Clock, DollarSign } from 'lucide-react';
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
    
    // Form State (Create)
    const [formData, setFormData] = useState({
        professionalId: '',
        serviceId: '',
        date: '',
        time: '',
        clientName: '',
        clientPhone: ''
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

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        // Fetch appointments for the current view (month)
        // Ideally we should calculate start/end of current view
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        fetchAppointments(start, end);
    }, [currentDate]);

    const fetchAppointments = async (start, end) => {
        try {
            // Fetch generous range to cover month view padding
            // Or just fetch all if volume is low, but better use range
            const res = await axios.get('/api/admin/appointments', {
                params: {
                    start: subMonths(start, 1).toISOString(),
                    end: addMonths(end, 1).toISOString()
                }
            });
            setAppointments(res.data);
            
            // Map to Calendar Events
            const mappedEvents = res.data.map(app => {
                let start = new Date(app.startTime);
                let end = new Date(app.endTime);

                // FIX: Use explicit string time if available to prevent timezone shifts
                // This ensures the calendar shows exactly what was booked (e.g. "11:30")
                if (app.hora_inicio && !isNaN(start.getTime())) {
                    const [hours, minutes] = app.hora_inicio.split(':').map(Number);
                    start.setHours(hours, minutes, 0, 0);
                    
                    // Update end time
                    if (app.hora_fim) {
                        const [endH, endM] = app.hora_fim.split(':').map(Number);
                        end = new Date(start); // Use the corrected start date
                        end.setHours(endH, endM, 0, 0);
                    } else {
                        // Recalculate based on original duration
                        const originalDuration = (new Date(app.endTime) - new Date(app.startTime));
                        end = new Date(start.getTime() + originalDuration);
                    }
                }

                // Validate Start Time
                if (isNaN(start.getTime())) {
                    // Fallback: Try to construct from date + simple string time if available (unlikely in this schema but safe)
                    if (app.date) {
                         start = new Date(app.date);
                    } else {
                         start = new Date();
                    }
                }

                // Validate End Time
                if (isNaN(end.getTime())) {
                     // Calculate duration from services
                     const duration = app.services?.reduce((acc, s) => acc + (s.duration || 30), 0) || 30;
                     end = new Date(start.getTime() + duration * 60000);
                }

                return {
                    id: app._id,
                    title: `${app.customerName}`,
                    start,
                    end,
                    resource: app,
                    status: app.status
                };
            });
            setEvents(mappedEvents);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchInitialData = async () => {
        if (!user) return;
        try {
            const [profRes, servRes] = await Promise.all([
                axios.get(`/api/professionals?salao_id=${user.id}`),
                axios.get(`/api/services?salao_id=${user.id}`)
            ]);
            setProfessionals(profRes.data);
            setServices(servRes.data);
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
            console.log("Fetching slots with params:", {
                salao_id: user.id,
                data: formData.date,
                profissional_id: formData.professionalId,
                servicos: formData.serviceId
            });

            const res = await axios.get('/api/disponibilidade/horarios', {
                params: {
                    salao_id: user.id,
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
    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este agendamento?')) return;
        
        try {
            await axios.delete(`/api/admin/appointments/${id}`);
            setShowDetailsModal(false);
            // Refresh
            const start = startOfMonth(currentDate);
            const end = endOfMonth(currentDate);
            fetchAppointments(start, end);
        } catch (err) {
            alert('Erro ao excluir agendamento: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleFinishClick = (apt) => {
        // Close details, open finish
        setShowDetailsModal(false);
        setSelectedAppointment(apt);
        setFinalPrice(apt.totalPrice || 0);
        setPaymentMethod('');
        setShowFinishModal(true);
    };

    const submitFinish = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/appointments/${selectedAppointment._id}/finish`, {
                finalPrice: Number(finalPrice),
                paymentMethod
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
                origin: 'panel'
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
                clientPhone: ''
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
                                        {/* Format time correctly whether it is ISO string or HH:mm */}
                                        {selectedAppointment.startTime.includes('T') 
                                            ? format(new Date(selectedAppointment.startTime), 'HH:mm') 
                                            : selectedAppointment.startTime}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-gray-500">Valor:</span>
                                    <span className="font-bold text-green-600 text-lg">
                                        R$ {selectedAppointment.finalPrice ? selectedAppointment.finalPrice.toFixed(2) : selectedAppointment.totalPrice?.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                {selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled' && (
                                    <>
                                        <button 
                                            onClick={() => handleFinishClick(selectedAppointment)}
                                            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={18} /> Finalizar
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(selectedAppointment._id)}
                                            className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg font-medium hover:bg-red-200 flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={18} /> Cancelar
                                        </button>
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
