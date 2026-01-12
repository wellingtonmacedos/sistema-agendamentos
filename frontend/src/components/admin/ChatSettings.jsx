import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, MessageSquare, User, Send, Bot } from 'lucide-react';
import { messageMap } from '../../utils/messageMap';

const ChatSettings = () => {
    const [config, setConfig] = useState({
        botBubbleColor: '#F3F4F6',
        botTextColor: '#1F2937',
        userBubbleColor: '#3B82F6',
        userTextColor: '#FFFFFF',
        buttonColor: '#3B82F6',
        backgroundColor: '#F9FAFB',
        headerColor: '#FFFFFF',
        headerTextColor: '#1F2937',
        assistantName: 'Assistente',
        assistantTone: 'neutro',
        avatarUrl: '',
        showAvatar: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/me');
            if (res.data.chatConfig) {
                setConfig(prev => ({ ...prev, ...res.data.chatConfig }));
            }
        } catch (error) {
            console.error("Erro ao carregar configurações", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await axios.put('/api/salon', { chatConfig: config });
            if (res.data.chatConfig) {
                 setConfig(prev => ({ ...prev, ...res.data.chatConfig }));
            }
            setMessage('Configurações salvas com sucesso!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Erro ao salvar: ' + (error.response?.data?.error || error.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <MessageSquare className="text-blue-600" />
                Personalização do Chat
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Column */}
                <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-700 border-b pb-2 mb-4">Aparência & Identidade</h3>
                    
                    {/* Assistant Identity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Assistente</label>
                            <input 
                                type="text" 
                                name="assistantName"
                                value={config.assistantName}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Avatar */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Avatar do Assistente</label>
                        <div className="flex items-center gap-4">
                            <input 
                                type="text" 
                                name="avatarUrl"
                                placeholder="URL da imagem (https://...)"
                                value={config.avatarUrl}
                                onChange={handleChange}
                                className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    name="showAvatar"
                                    checked={config.showAvatar}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Mostrar</span>
                            </label>
                        </div>
                    </div>

                    {/* Colors */}
                    <h3 className="font-semibold text-gray-700 border-b pb-2 mb-4 pt-4">Cores e Estilo</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Balão do Bot (Fundo)</label>
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="color" 
                                    name="botBubbleColor"
                                    value={config.botBubbleColor}
                                    onChange={handleChange}
                                    className="h-10 w-12 p-0.5 rounded cursor-pointer border-2 border-gray-200"
                                    title="Escolher cor"
                                />
                                <input 
                                    type="text"
                                    name="botBubbleColor"
                                    value={config.botBubbleColor}
                                    onChange={handleChange}
                                    className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase font-mono"
                                    placeholder="#000000"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Texto do Bot</label>
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="color" 
                                    name="botTextColor"
                                    value={config.botTextColor}
                                    onChange={handleChange}
                                    className="h-10 w-12 p-0.5 rounded cursor-pointer border-2 border-gray-200"
                                    title="Escolher cor"
                                />
                                <input 
                                    type="text"
                                    name="botTextColor"
                                    value={config.botTextColor}
                                    onChange={handleChange}
                                    className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase font-mono"
                                    placeholder="#000000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Balão do Cliente (Fundo)</label>
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="color" 
                                    name="userBubbleColor"
                                    value={config.userBubbleColor}
                                    onChange={handleChange}
                                    className="h-10 w-12 p-0.5 rounded cursor-pointer border-2 border-gray-200"
                                    title="Escolher cor"
                                />
                                <input 
                                    type="text"
                                    name="userBubbleColor"
                                    value={config.userBubbleColor}
                                    onChange={handleChange}
                                    className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase font-mono"
                                    placeholder="#000000"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Texto do Cliente</label>
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="color" 
                                    name="userTextColor"
                                    value={config.userTextColor}
                                    onChange={handleChange}
                                    className="h-10 w-12 p-0.5 rounded cursor-pointer border-2 border-gray-200"
                                    title="Escolher cor"
                                />
                                <input 
                                    type="text"
                                    name="userTextColor"
                                    value={config.userTextColor}
                                    onChange={handleChange}
                                    className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase font-mono"
                                    placeholder="#000000"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Botões de Ação (Cor Principal)</label>
                            <p className="text-xs text-gray-500 mb-2">Cor usada nos botões, opções e destaques.</p>
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="color" 
                                    name="buttonColor"
                                    value={config.buttonColor}
                                    onChange={handleChange}
                                    className="h-10 w-12 p-0.5 rounded cursor-pointer border-2 border-gray-200"
                                    title="Escolher cor"
                                />
                                <input 
                                    type="text"
                                    name="buttonColor"
                                    value={config.buttonColor}
                                    onChange={handleChange}
                                    className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase font-mono"
                                    placeholder="#000000"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fundo do Chat</label>
                                <div className="flex gap-2 items-center">
                                    <input 
                                        type="color" 
                                        name="backgroundColor"
                                        value={config.backgroundColor}
                                        onChange={handleChange}
                                        className="h-10 w-12 p-0.5 rounded cursor-pointer border-2 border-gray-200"
                                        title="Escolher cor"
                                    />
                                    <input 
                                        type="text"
                                        name="backgroundColor"
                                        value={config.backgroundColor}
                                        onChange={handleChange}
                                        className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase font-mono"
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cabeçalho (Fundo)</label>
                                <div className="flex gap-2 items-center">
                                    <input 
                                        type="color" 
                                        name="headerColor"
                                        value={config.headerColor}
                                        onChange={handleChange}
                                        className="h-10 w-12 p-0.5 rounded cursor-pointer border-2 border-gray-200"
                                        title="Escolher cor"
                                    />
                                    <input 
                                        type="text"
                                        name="headerColor"
                                        value={config.headerColor}
                                        onChange={handleChange}
                                        className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase font-mono"
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cabeçalho (Texto)</label>
                                <div className="flex gap-2 items-center">
                                    <input 
                                        type="color" 
                                        name="headerTextColor"
                                        value={config.headerTextColor}
                                        onChange={handleChange}
                                        className="h-10 w-12 p-0.5 rounded cursor-pointer border-2 border-gray-200"
                                        title="Escolher cor"
                                    />
                                    <input 
                                        type="text"
                                        name="headerTextColor"
                                        value={config.headerTextColor}
                                        onChange={handleChange}
                                        className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase font-mono"
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat Profile Selection */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-semibold text-gray-700">Perfil do Chatbot</h3>
                        <p className="text-sm text-gray-500">Altera apenas a linguagem e o estilo visual do chatbot. Não interfere no funcionamento dos agendamentos.</p>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                                <input 
                                    type="radio"
                                    name="chat_profile"
                                    value="neutral"
                                    checked={config.chat_profile === 'neutral' || !config.chat_profile}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div>
                                    <span className="block text-sm font-medium text-gray-700">Neutro / Profissional</span>
                                    <span className="block text-xs text-gray-500">Ideal para barbearias, salões masculinos e unissex.</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                                <input 
                                    type="radio"
                                    name="chat_profile"
                                    value="feminine"
                                    checked={config.chat_profile === 'feminine'}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div>
                                    <span className="block text-sm font-medium text-gray-700">Feminino / Delicado</span>
                                    <span className="block text-xs text-gray-500">Ideal para manicure, studio de cílios, estética e salões femininos.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="pt-6 border-t">
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            <Save size={20} />
                            {saving ? 'Salvando...' : 'Salvar Configurações'}
                        </button>
                        {message && (
                            <p className={`mt-3 text-center text-sm ${message.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
                                {message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Preview Column */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Pré-visualização</h3>
                    
                    <div className={`bg-gray-100 rounded-[2.5rem] border-4 border-gray-800 p-4 h-[600px] w-full max-w-sm mx-auto shadow-2xl overflow-hidden flex flex-col relative ${isFeminine ? 'font-soft' : ''}`}>
                        {/* Fake Phone Header */}
                        <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 w-1/2 mx-auto rounded-b-xl z-20"></div>
                        
                        {/* Chat Header */}
                        <div 
                            className="p-3 border-b flex items-center gap-3 pt-8 shadow-sm z-10"
                            style={{ backgroundColor: config.headerColor }}
                        >
                            {config.showAvatar && (
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                    {config.avatarUrl ? (
                                        <img src={config.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <Bot className="w-6 h-6 m-2 text-gray-500" />
                                    )}
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-sm" style={{ color: config.headerTextColor }}>{config.assistantName}</p>
                                <p className="text-xs text-green-500 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Online
                                </p>
                            </div>
                        </div>

                        {/* Chat Body */}
                        <div 
                            className="flex-1 overflow-y-auto p-4 space-y-4"
                            style={{ backgroundColor: config.backgroundColor }}
                        >
                            {/* Bot Message */}
                            <div className="flex gap-2">
                                {config.showAvatar && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mt-1">
                                        {config.avatarUrl ? (
                                            <img src={config.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <Bot className="w-5 h-5 m-1.5 text-gray-500" />
                                        )}
                                    </div>
                                )}
                                <div 
                                    className="p-3 rounded-2xl rounded-tl-none max-w-[85%] text-sm shadow-sm"
                                    style={{ backgroundColor: config.botBubbleColor, color: config.botTextColor }}
                                >
                                    <p>Olá! Sou {config.assistantName}. Como posso ajudar você hoje?</p>
                                </div>
                            </div>

                            {/* User Message */}
                            <div className="flex justify-end">
                                <div 
                                    className="p-3 rounded-2xl rounded-tr-none max-w-[85%] text-sm shadow-sm"
                                    style={{ backgroundColor: config.userBubbleColor, color: config.userTextColor }}
                                >
                                    <p>Gostaria de agendar um horário para corte de cabelo.</p>
                                </div>
                            </div>

                            {/* Bot Response with Buttons */}
                            <div className="flex gap-2">
                                {config.showAvatar && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mt-1">
                                        {config.avatarUrl ? (
                                            <img src={config.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <Bot className="w-5 h-5 m-1.5 text-gray-500" />
                                        )}
                                    </div>
                                )}
                                <div className="space-y-2 max-w-[85%]">
                                    <div 
                                        className="p-3 rounded-2xl rounded-tl-none text-sm shadow-sm"
                                        style={{ backgroundColor: config.botBubbleColor, color: config.botTextColor }}
                                    >
                                        <p>Claro! Para qual serviço seria?</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button 
                                            className="px-4 py-2 rounded-full text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                                            style={{ backgroundColor: config.buttonColor }}
                                        >
                                            Corte Masculino
                                        </button>
                                        <button 
                                            className="px-4 py-2 rounded-full text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                                            style={{ backgroundColor: config.buttonColor }}
                                        >
                                            Barba
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chat Input */}
                        <div className="bg-white p-3 border-t flex items-center gap-2">
                            <input 
                                type="text" 
                                placeholder="Digite sua mensagem..." 
                                className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-300"
                                disabled
                            />
                            <button 
                                className="p-2 rounded-full text-white"
                                style={{ backgroundColor: config.buttonColor }}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-xs text-gray-500">Visualização aproximada em dispositivo móvel</p>
                </div>
            </div>
        </div>
    );
};

export default ChatSettings;
