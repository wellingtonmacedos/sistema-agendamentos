import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, MessageSquare, User, Send, Bot } from 'lucide-react';
import { messageMap } from '../../utils/messageMap';

const ColorField = ({ label, name, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="flex gap-2 items-center">
            <input
                type="color"
                name={name}
                value={value}
                onChange={onChange}
                className="h-10 w-12 p-0.5 rounded cursor-pointer border-2 border-gray-200"
                title="Escolher cor"
            />
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                className="flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm uppercase font-mono"
                placeholder="#000000"
            />
        </div>
    </div>
);

const ChatSettings = () => {
    const [config, setConfig] = useState({
        botBubbleColor: '#F3F4F6',
        botTextColor: '#1F2937',
        botBubbleBorderColor: '#E2E8F0',
        userBubbleColor: '#3B82F6',
        userTextColor: '#FFFFFF',
        userBubbleBorderColor: '#2563EB',
        bubbleBorderWidth: 1,
        bubbleRadius: 16,
        responseAreaColor: '#FFFFFF',
        responseAreaBorderColor: '#E2E8F0',
        responseAreaBorderWidth: 1,
        responseOptionColor: '#FFFFFF',
        responseOptionBorderColor: '#E2E8F0',
        responseOptionBorderWidth: 1,
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
            [name]: type === 'checkbox' ? checked : type === 'range' ? Number(value) : value
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

    const isFeminine = config.chat_profile === 'feminine';

    const getPreviewMessage = (key, ...args) => {
        const profile = config.chat_profile || 'neutral';
        const template = messageMap[key]?.[profile] || messageMap[key]?.['neutral'];
        if (typeof template === 'function') {
            return template(...args);
        }
        return template || key;
    };

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                <MessageSquare className="text-blue-600" />
                Personalização do Chat
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Form Column */}
                <div className="order-2 lg:order-1 space-y-6 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
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
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
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

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                            <h4 className="md:col-span-2 font-semibold text-sm text-gray-700">Bordas dos balões</h4>
                            <ColorField
                                label="Borda do balão do assistente"
                                name="botBubbleBorderColor"
                                value={config.botBubbleBorderColor}
                                onChange={handleChange}
                            />
                            <ColorField
                                label="Borda do balão do cliente"
                                name="userBubbleBorderColor"
                                value={config.userBubbleBorderColor}
                                onChange={handleChange}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Espessura da borda: {config.bubbleBorderWidth}px
                                </label>
                                <input
                                    type="range"
                                    name="bubbleBorderWidth"
                                    min="0"
                                    max="4"
                                    step="1"
                                    value={config.bubbleBorderWidth}
                                    onChange={handleChange}
                                    className="w-full accent-blue-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Arredondamento: {config.bubbleRadius}px
                                </label>
                                <input
                                    type="range"
                                    name="bubbleRadius"
                                    min="8"
                                    max="32"
                                    step="2"
                                    value={config.bubbleRadius}
                                    onChange={handleChange}
                                    className="w-full accent-blue-600"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                            <h4 className="md:col-span-2 font-semibold text-sm text-gray-700">Área das respostas e opções</h4>
                            <ColorField
                                label="Fundo da área de respostas"
                                name="responseAreaColor"
                                value={config.responseAreaColor}
                                onChange={handleChange}
                            />
                            <ColorField
                                label="Borda da área de respostas"
                                name="responseAreaBorderColor"
                                value={config.responseAreaBorderColor}
                                onChange={handleChange}
                            />
                            <ColorField
                                label="Fundo dos cartões de opções"
                                name="responseOptionColor"
                                value={config.responseOptionColor}
                                onChange={handleChange}
                            />
                            <ColorField
                                label="Borda dos cartões de opções"
                                name="responseOptionBorderColor"
                                value={config.responseOptionBorderColor}
                                onChange={handleChange}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Espessura da borda da área: {config.responseAreaBorderWidth}px
                                </label>
                                <input
                                    type="range"
                                    name="responseAreaBorderWidth"
                                    min="0"
                                    max="4"
                                    step="1"
                                    value={config.responseAreaBorderWidth}
                                    onChange={handleChange}
                                    className="w-full accent-blue-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Espessura da borda das opções: {config.responseOptionBorderWidth}px
                                </label>
                                <input
                                    type="range"
                                    name="responseOptionBorderWidth"
                                    min="0"
                                    max="4"
                                    step="1"
                                    value={config.responseOptionBorderWidth}
                                    onChange={handleChange}
                                    className="w-full accent-blue-600"
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
                <div className="order-1 lg:order-2 space-y-4">
                    <h3 className="font-semibold text-gray-700">Pré-visualização</h3>

                    <div className={`isolate bg-gray-100 rounded-[2rem] sm:rounded-[2.5rem] border-[6px] border-gray-800 p-2.5 sm:p-4 h-[460px] sm:h-[560px] lg:h-[600px] w-full max-w-[340px] sm:max-w-sm mx-auto shadow-2xl overflow-hidden flex flex-col relative ${isFeminine ? 'font-soft' : ''}`}>
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

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-opacity-50" style={{ backgroundColor: config.backgroundColor }}>
                            {/* Bot Welcome */}
                            <div className="flex gap-2">
                                {config.showAvatar && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mt-1">
                                         {config.avatarUrl ? (
                                            <img src={config.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <Bot size={20} className="w-full h-full p-1.5 text-gray-500" />
                                        )}
                                    </div>
                                )}
                                <div 
                                    className={`p-3 rounded-2xl rounded-tl-none max-w-[85%] text-sm shadow-sm ${isFeminine ? 'rounded-3xl rounded-tl-none' : ''}`}
                                    style={{
                                        backgroundColor: config.botBubbleColor,
                                        color: config.botTextColor,
                                        border: `${config.bubbleBorderWidth}px solid ${config.botBubbleBorderColor}`,
                                        borderRadius: `0 ${config.bubbleRadius}px ${config.bubbleRadius}px ${config.bubbleRadius}px`
                                    }}
                                >
                                    <p>{getPreviewMessage('previewWelcome', config.assistantName)}</p>
                                </div>
                            </div>

                            {/* User Message */}
                            <div className="flex justify-end gap-2">
                                <div 
                                    className={`p-3 rounded-2xl rounded-tr-none max-w-[85%] text-sm shadow-sm ${isFeminine ? 'rounded-3xl rounded-tr-none' : ''}`}
                                    style={{
                                        backgroundColor: config.userBubbleColor,
                                        color: config.userTextColor,
                                        border: `${config.bubbleBorderWidth}px solid ${config.userBubbleBorderColor}`,
                                        borderRadius: `${config.bubbleRadius}px 0 ${config.bubbleRadius}px ${config.bubbleRadius}px`
                                    }}
                                >
                                    <p>{getPreviewMessage('previewUserMessage')}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                                    <User size={16} className="text-blue-600" />
                                </div>
                            </div>

                            {/* Bot Response */}
                            <div className="flex gap-2">
                                {config.showAvatar && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mt-1">
                                         {config.avatarUrl ? (
                                            <img src={config.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <Bot size={20} className="w-full h-full p-1.5 text-gray-500" />
                                        )}
                                    </div>
                                )}
                                <div className="space-y-2 max-w-[85%]">
                                    <div 
                                        className={`p-3 rounded-2xl rounded-tl-none text-sm shadow-sm ${isFeminine ? 'rounded-3xl rounded-tl-none' : ''}`}
                                        style={{
                                            backgroundColor: config.botBubbleColor,
                                            color: config.botTextColor,
                                            border: `${config.bubbleBorderWidth}px solid ${config.botBubbleBorderColor}`,
                                            borderRadius: `0 ${config.bubbleRadius}px ${config.bubbleRadius}px ${config.bubbleRadius}px`
                                        }}
                                    >
                                        <p>{getPreviewMessage('previewBotResponse')}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button 
                                            className="px-4 py-2 rounded-full text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                                            style={{ backgroundColor: config.buttonColor }}
                                        >
                                            {getPreviewMessage('previewService1')}
                                        </button>
                                        <button 
                                            className="px-4 py-2 rounded-full text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                                            style={{ backgroundColor: config.buttonColor }}
                                        >
                                            {getPreviewMessage('previewService2')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chat Input */}
                        <div
                            className="p-3 border-t space-y-2"
                            style={{
                                backgroundColor: config.responseAreaColor,
                                borderTop: `${config.responseAreaBorderWidth}px solid ${config.responseAreaBorderColor}`
                            }}
                        >
                            <button
                                className="w-full p-2 text-left text-xs shadow-sm"
                                style={{
                                    backgroundColor: config.responseOptionColor,
                                    border: `${config.responseOptionBorderWidth}px solid ${config.responseOptionBorderColor}`,
                                    borderRadius: `${config.bubbleRadius}px`,
                                    color: config.headerTextColor
                                }}
                            >
                                Opção de resposta do cliente
                            </button>
                            <div className="flex items-center gap-2">
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
                    </div>
                    <p className="text-center text-xs text-gray-500">Visualização aproximada em dispositivo móvel</p>
                </div>
            </div>
        </div>
    );
};

export default ChatSettings;
