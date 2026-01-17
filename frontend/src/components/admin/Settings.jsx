import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, Calendar, AlertTriangle, Save, Trash2, Plus, Copy, Bell, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import { subscribeToPush, getPushPermissionState } from '../../utils/pushUtils';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const Settings = () => {
    const [salon, setSalon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');
    const [pushPermission, setPushPermission] = useState('default');
    
    // Form States
    const [formData, setFormData] = useState({});
    const [workingHours, setWorkingHours] = useState({});
    const [agendaSettings, setAgendaSettings] = useState({});
    const [emailSettings, setEmailSettings] = useState({
        notifyOnNewAppointment: true,
        notifyOnCancellation: true,
        notifyProfessional: false
    });
    
    // Blocks State
    const [blocks, setBlocks] = useState([]);
    const [newBlock, setNewBlock] = useState({ start: '', end: '', reason: '', type: 'BLOCK' });

    useEffect(() => {
        fetchSettings();
        fetchBlocks();
        checkPushPermission();
    }, []);

    const checkPushPermission = async () => {
        const status = await getPushPermissionState();
        setPushPermission(status);
    };

    const handleEnablePush = async () => {
        try {
            if (pushPermission === 'denied') {
                alert('Você bloqueou as notificações. Por favor, habilite-as nas configurações do seu navegador.');
                return;
            }
            
            setLoading(true);
            const result = await subscribeToPush('ADMIN');
            
            if (result) {
                setPushPermission('granted');
                alert('Notificações ativadas com sucesso!');
            }
        } catch (error) {
            console.error("Erro ativar push admin:", error);
            alert(`Erro ao ativar notificações: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/me');
            const data = res.data;
            setSalon(data);
            setFormData({
                name: data.name,
                phone: data.phone,
                address: data.address,
                cancellationPolicy: data.cancellationPolicy
            });
            // Initialize working hours with defaults if empty
            const defaultHours = {};
            DAYS.forEach((_, index) => {
                defaultHours[index] = data.workingHours?.[index] || { 
                    open: '09:00', 
                    close: '18:00', 
                    isOpen: index !== 0, 
                    isArrivalOrder: false,
                    breaks: [] 
                };
            });
            setWorkingHours(defaultHours);
            
            setAgendaSettings({
                slotInterval: data.settings?.slotInterval || 30,
                appointmentBuffer: data.settings?.appointmentBuffer || 0,
                minNoticeMinutes: data.settings?.minNoticeMinutes || 60,
                maxFutureDays: data.settings?.maxFutureDays || 30
            });

            if (data.emailSettings) {
                setEmailSettings({
                    notifyOnNewAppointment: data.emailSettings.notifyOnNewAppointment ?? true,
                    notifyOnCancellation: data.emailSettings.notifyOnCancellation ?? true,
                    notifyProfessional: data.emailSettings.notifyProfessional ?? false
                });
            }

        } catch (error) {
            console.error("Erro ao carregar configurações", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBlocks = async () => {
        try {
            const res = await axios.get('/api/blocks');
            setBlocks(res.data);
        } catch (error) {
            console.error("Erro ao carregar bloqueios", error);
        }
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...formData,
                workingHours,
                settings: agendaSettings,
                emailSettings
            };
            
            const res = await axios.put('/api/salon', payload);
            setSalon(res.data);
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            alert('Erro ao salvar configurações');
            console.error(error);
        }
    };

    const handleCreateBlock = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/blocks', {
                startTime: newBlock.start,
                endTime: newBlock.end,
                reason: newBlock.reason,
                type: newBlock.type // Send the selected type!
            });
            fetchBlocks();
            setNewBlock({ start: '', end: '', reason: '', type: 'BLOCK' }); // Reset with default
            alert('Configuração salva com sucesso!');
        } catch (error) {
            alert('Erro ao criar configuração');
        }
    };

    const handleDeleteBlock = async (id) => {
        if (!window.confirm('Excluir este bloqueio?')) return;
        try {
            await axios.delete(`/api/blocks/${id}`);
            fetchBlocks();
        } catch (error) {
            alert('Erro ao excluir');
        }
    };

    // Helper to update specific day hours
    const updateDay = (dayIndex, field, value) => {
        setWorkingHours(prev => ({
            ...prev,
            [dayIndex]: {
                ...prev[dayIndex],
                [field]: value
            }
        }));
    };

    const addBreak = (dayIndex) => {
        const currentBreaks = workingHours[dayIndex].breaks || [];
        updateDay(dayIndex, 'breaks', [...currentBreaks, { start: '12:00', end: '13:00' }]);
    };

    const removeBreak = (dayIndex, breakIndex) => {
        const currentBreaks = [...workingHours[dayIndex].breaks];
        currentBreaks.splice(breakIndex, 1);
        updateDay(dayIndex, 'breaks', currentBreaks);
    };

    const updateBreak = (dayIndex, breakIndex, field, value) => {
        const currentBreaks = [...workingHours[dayIndex].breaks];
        currentBreaks[breakIndex] = { ...currentBreaks[breakIndex], [field]: value };
        updateDay(dayIndex, 'breaks', currentBreaks);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Link copiado para a área de transferência!');
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Configurações</h2>
            
            {/* Tabs */}
            <div className="flex border-b mb-6 overflow-x-auto">
                {[
                    { id: 'general', label: 'Geral', icon: AlertTriangle },
                    { id: 'hours', label: 'Horários de Funcionamento', icon: Clock },
                    { id: 'agenda', label: 'Regras da Agenda', icon: Calendar },
                    { id: 'blocks', label: 'Bloqueios & Feriados', icon: AlertTriangle },
                    { id: 'notifications', label: 'Notificações', icon: Bell },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 whitespace-nowrap transition-colors ${
                            activeTab === tab.id 
                            ? 'border-blue-600 text-blue-600 font-medium' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {/* <tab.icon size={18} /> */}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                
                {/* NOTIFICATIONS TAB */}
                {activeTab === 'notifications' && (
                    <div className="space-y-6">
                        
                        {/* Email Notifications */}
                        <div className="bg-white p-4 border rounded-lg">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <span role="img" aria-label="email">📧</span> Notificações por Email
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900">Novo Agendamento</h4>
                                        <p className="text-sm text-gray-500">Receber email quando um novo agendamento for criado.</p>
                                    </div>
                                    <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                        <input 
                                            type="checkbox" 
                                            checked={emailSettings.notifyOnNewAppointment}
                                            onChange={e => setEmailSettings({...emailSettings, notifyOnNewAppointment: e.target.checked})}
                                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-blue-600"
                                            style={{ right: emailSettings.notifyOnNewAppointment ? '0' : 'auto', left: emailSettings.notifyOnNewAppointment ? 'auto' : '0' }}
                                        />
                                        <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${emailSettings.notifyOnNewAppointment ? 'bg-blue-600' : 'bg-gray-300'}`}></label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900">Cancelamento</h4>
                                        <p className="text-sm text-gray-500">Receber email quando um agendamento for cancelado.</p>
                                    </div>
                                    <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                        <input 
                                            type="checkbox" 
                                            checked={emailSettings.notifyOnCancellation}
                                            onChange={e => setEmailSettings({...emailSettings, notifyOnCancellation: e.target.checked})}
                                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-blue-600"
                                            style={{ right: emailSettings.notifyOnCancellation ? '0' : 'auto', left: emailSettings.notifyOnCancellation ? 'auto' : '0' }}
                                        />
                                        <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${emailSettings.notifyOnCancellation ? 'bg-blue-600' : 'bg-gray-300'}`}></label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t pt-4 mt-2">
                                    <div>
                                        <h4 className="font-medium text-gray-900">Notificar Profissional</h4>
                                        <p className="text-sm text-gray-500">Enviar email também para o profissional responsável.</p>
                                    </div>
                                    <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                        <input 
                                            type="checkbox" 
                                            checked={emailSettings.notifyProfessional}
                                            onChange={e => setEmailSettings({...emailSettings, notifyProfessional: e.target.checked})}
                                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-blue-600"
                                            style={{ right: emailSettings.notifyProfessional ? '0' : 'auto', left: emailSettings.notifyProfessional ? 'auto' : '0' }}
                                        />
                                        <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${emailSettings.notifyProfessional ? 'bg-blue-600' : 'bg-gray-300'}`}></label>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 mt-2">
                                    <p><strong>Email do Estabelecimento:</strong> {formData.email || 'Não configurado'}</p>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-200" />

                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <Bell className="w-5 h-5" /> Notificações Push
                        </h3>
                        
                        <div className="bg-blue-50 p-4 rounded-md mb-6">
                            <p className="text-sm text-blue-700">
                                Ative as notificações para receber alertas instantâneos sobre novos agendamentos, 
                                mesmo com o aplicativo fechado (requer instalação do App ou navegador compatível).
                            </p>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <h4 className="font-medium text-gray-900">Novos Agendamentos</h4>
                                <p className="text-sm text-gray-500">Receba um alerta quando um cliente agendar um horário.</p>
                            </div>
                            
                            {pushPermission === 'granted' ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                    Ativado
                                </span>
                            ) : (
                                <button 
                                    onClick={handleEnablePush}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Ativar Notificações
                                </button>
                            )}
                        </div>
                        
                        {pushPermission === 'denied' && (
                             <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded">
                                 As notificações estão bloqueadas no seu navegador. Clique no ícone de cadeado/configurações na barra de endereço para desbloquear.
                             </div>
                        )}
                        
                        <div className="mt-8 pt-6 border-t">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Smartphone className="w-5 h-5" /> Instalação do App
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Este sistema pode ser instalado como um aplicativo no seu computador ou celular.
                                Procure pela opção <strong>"Instalar App"</strong> ou <strong>"Adicionar à Tela Inicial"</strong> no menu do seu navegador.
                            </p>
                        </div>
                    </div>
                )}

                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome do Estabelecimento</label>
                                <input 
                                    value={formData.name || ''} 
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="mt-1 block w-full rounded-md border-gray-300 border p-2" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                                <input 
                                    value={formData.phone || ''} 
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    className="mt-1 block w-full rounded-md border-gray-300 border p-2" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Endereço</label>
                            <input 
                                value={formData.address || ''} 
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                className="mt-1 block w-full rounded-md border-gray-300 border p-2" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Política de Cancelamento</label>
                            <textarea 
                                value={formData.cancellationPolicy || ''} 
                                onChange={e => setFormData({...formData, cancellationPolicy: e.target.value})}
                                rows={4}
                                className="mt-1 block w-full rounded-md border-gray-300 border p-2" 
                            />
                        </div>

                        {/* Chatbot Link Section */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h3 className="text-sm font-medium text-blue-800 mb-2">Link do Chatbot (Público) - Atualizado</h3>
                            <p className="text-xs text-blue-600 mb-3">
                                Este é o link único do seu estabelecimento. Compartilhe com seus clientes para que eles possam realizar agendamentos.
                            </p>
                            <div className="flex gap-2">
                                <input 
                                    readOnly
                                    value={salon?.slug ? `https://reservo.app.br/chat/${salon.slug}` : ''}
                                    className="flex-1 rounded-md border-blue-200 bg-white p-2 text-sm text-gray-600"
                                />
                                <button 
                                    onClick={() => salon?.slug && copyToClipboard(`https://reservo.app.br/chat/${salon.slug}`)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
                                >
                                    <Copy size={16} />
                                    <span className="text-sm font-medium">Copiar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* HOURS TAB */}
                {activeTab === 'hours' && (
                    <div className="space-y-6">
                        {DAYS.map((dayName, index) => {
                            const day = workingHours[index] || {};
                            return (
                                <div key={index} className={`p-4 rounded-lg border ${day.isOpen ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="checkbox" 
                                                checked={day.isOpen} 
                                                onChange={e => updateDay(index, 'isOpen', e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className={`font-medium ${day.isOpen ? 'text-gray-900' : 'text-gray-400'}`}>{dayName}</span>
                                        </div>
                                        {day.isOpen && (
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="time" 
                                                    value={day.open} 
                                                    onChange={e => updateDay(index, 'open', e.target.value)}
                                                    className="border rounded p-1 text-sm"
                                                />
                                                <span className="text-gray-400">-</span>
                                                <input 
                                                    type="time" 
                                                    value={day.close} 
                                                    onChange={e => updateDay(index, 'close', e.target.value)}
                                                    className="border rounded p-1 text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {day.isOpen && (
                                        <div className="ml-8 border-t pt-3 mt-3">
                                            <p className="text-xs text-gray-500 mb-2 font-medium">Intervalos / Pausas</p>
                                            <div className="space-y-2">
                                                {(day.breaks || []).map((brk, bIndex) => (
                                                    <div key={bIndex} className="flex items-center gap-2">
                                                        <input 
                                                            type="time" 
                                                            value={brk.start} 
                                                            onChange={e => updateBreak(index, bIndex, 'start', e.target.value)}
                                                            className="border rounded p-1 text-xs bg-gray-50"
                                                        />
                                                        <span className="text-gray-400 text-xs">até</span>
                                                        <input 
                                                            type="time" 
                                                            value={brk.end} 
                                                            onChange={e => updateBreak(index, bIndex, 'end', e.target.value)}
                                                            className="border rounded p-1 text-xs bg-gray-50"
                                                        />
                                                        <button 
                                                            onClick={() => removeBreak(index, bIndex)}
                                                            className="text-red-400 hover:text-red-600 p-1"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={() => addBreak(index)}
                                                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium mt-2"
                                                >
                                                    <Plus size={12} /> Adicionar Intervalo
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* AGENDA RULES TAB */}
                {activeTab === 'agenda' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo Padrão (minutos)</label>
                            <p className="text-xs text-gray-500 mb-2">Tempo base para visualização na agenda (grid).</p>
                            <input 
                                type="number" 
                                value={agendaSettings.slotInterval} 
                                onChange={e => setAgendaSettings({...agendaSettings, slotInterval: parseInt(e.target.value)})}
                                className="w-full border rounded-md p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Buffer entre Agendamentos (minutos)</label>
                            <p className="text-xs text-gray-500 mb-2">Tempo de descanso/preparação após cada serviço.</p>
                            <input 
                                type="number" 
                                value={agendaSettings.appointmentBuffer} 
                                onChange={e => setAgendaSettings({...agendaSettings, appointmentBuffer: parseInt(e.target.value)})}
                                className="w-full border rounded-md p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Antecedência Mínima (minutos)</label>
                            <p className="text-xs text-gray-500 mb-2">Quanto tempo antes o cliente pode agendar.</p>
                            <input 
                                type="number" 
                                value={agendaSettings.minNoticeMinutes} 
                                onChange={e => setAgendaSettings({...agendaSettings, minNoticeMinutes: parseInt(e.target.value)})}
                                className="w-full border rounded-md p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Limite Futuro (dias)</label>
                            <p className="text-xs text-gray-500 mb-2">Até quantos dias à frente a agenda está aberta.</p>
                            <input 
                                type="number" 
                                value={agendaSettings.maxFutureDays} 
                                onChange={e => setAgendaSettings({...agendaSettings, maxFutureDays: parseInt(e.target.value)})}
                                className="w-full border rounded-md p-2"
                            />
                        </div>
                    </div>
                )}

                {/* BLOCKS TAB */}
                {activeTab === 'blocks' && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="font-medium text-sm text-gray-700 mb-3">Nova Exceção (Feriado / Ordem de Chegada)</h4>
                            <form onSubmit={handleCreateBlock} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                <div className="md:col-span-1">
                                    <label className="text-xs text-gray-500">Tipo</label>
                                    <select 
                                        value={newBlock.type}
                                        onChange={e => setNewBlock({...newBlock, type: e.target.value})}
                                        className="w-full border rounded p-2 text-sm bg-white"
                                    >
                                        <option value="BLOCK">Bloqueio Total</option>
                                        <option value="ARRIVAL_ORDER">Ordem de Chegada</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Início</label>
                                    <input 
                                        type="datetime-local" 
                                        required
                                        value={newBlock.start}
                                        onChange={e => setNewBlock({...newBlock, start: e.target.value})}
                                        className="w-full border rounded p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Fim</label>
                                    <input 
                                        type="datetime-local" 
                                        required
                                        value={newBlock.end}
                                        onChange={e => setNewBlock({...newBlock, end: e.target.value})}
                                        className="w-full border rounded p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Motivo (Opcional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Feriado"
                                        value={newBlock.reason}
                                        onChange={e => setNewBlock({...newBlock, reason: e.target.value})}
                                        className="w-full border rounded p-2 text-sm"
                                    />
                                </div>
                                <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 text-sm font-medium">
                                    Salvar
                                </button>
                            </form>
                        </div>

                        <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-3">Configurações Ativas</h4>
                            {blocks.length === 0 ? (
                                <p className="text-gray-400 text-sm">Nenhuma configuração cadastrada.</p>
                            ) : (
                                <div className="space-y-2">
                                    {blocks.map(block => (
                                        <div key={block._id} className="flex justify-between items-center p-3 bg-white border rounded hover:shadow-sm">
                                            <div className="flex items-center gap-3">
                                                {block.type === 'ARRIVAL_ORDER' ? (
                                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">Ordem Chegada</span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold">Bloqueio</span>
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-800 text-sm">{block.reason || (block.type === 'ARRIVAL_ORDER' ? 'Atendimento por Ordem de Chegada' : 'Bloqueio de Agenda')}</div>
                                                <div className="text-xs text-gray-500">
                                                    {format(new Date(block.startTime), 'dd/MM/yyyy HH:mm')} até {format(new Date(block.endTime), 'dd/MM/yyyy HH:mm')}
                                                </div>
                                                <div className="text-xs text-blue-500 mt-1">
                                                    {block.professionalId ? `Profissional: ${block.professionalId.name}` : 'Todo o Estabelecimento'}
                                                </div>
                                            </div>
                                        </div>
                                            <button 
                                                onClick={() => handleDeleteBlock(block._id)}
                                                className="text-red-400 hover:text-red-600 p-2"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {activeTab !== 'blocks' && (
                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
                    >
                        <Save size={20} />
                        Salvar Configurações
                    </button>
                </div>
            )}
        </div>
    );
};

export default Settings;
