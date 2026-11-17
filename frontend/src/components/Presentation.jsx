import React, { useEffect, useState } from 'react';
import {
    MessageSquare,
    Calendar,
    BarChart2,
    Package,
    Bell,
    Palette,
    CheckCircle,
    Smartphone,
    Clock,
    TrendingUp,
    ArrowRight,
    Store,
    MessageCircle,
    LayoutDashboard,
    Settings as SettingsIcon,
    Scissors,
    Users,
    Lock
} from 'lucide-react';

const CONTACT_PHONE = '+55 (79) 99857-9844';
const WHATSAPP_URL =
    'https://wa.me/5579998579844?text=Ol%C3%A1!%20Quero%20conhecer%20o%20Reservo';

const features = [
    {
        icon: MessageSquare,
        title: 'Chat de agendamento 24h',
        text: 'Seu cliente escolhe serviço, profissional, data e horário em uma conversa simples, direto do celular. Sem instalar nada.'
    },
    {
        icon: Calendar,
        title: 'Agenda inteligente',
        text: 'Visão mensal de todos os atendimentos, bloqueio de horários, agendamentos recorrentes e status identificados por cor.'
    },
    {
        icon: Bell,
        title: 'Lembretes automáticos',
        text: 'Notificações push e e-mail para o cliente em cada novo agendamento, reagendamento ou cancelamento. Menos faltas, menos esquecimento.'
    },
    {
        icon: TrendingUp,
        title: 'Relatórios de faturamento',
        text: 'Faturamento por dia, semana, mês ou ano, ranking de serviços mais vendidos e desempenho de cada profissional.'
    },
    {
        icon: Package,
        title: 'Controle de estoque',
        text: 'Cadastre produtos com preço, quantidade e alerta de estoque baixo. A baixa no estoque acontece ao finalizar o atendimento.'
    },
    {
        icon: Palette,
        title: 'Com a sua identidade',
        text: 'Cores, avatar, nome do assistente e mensagens personalizados. O atendimento pode ser mais direto ou mais acolhedor, conforme o seu público.'
    }
];

const steps = [
    {
        title: 'Cliente acessa o link',
        text: 'Você compartilha o endereço do seu estabelecimento e o cliente abre o chat no celular ou computador.'
    },
    {
        title: 'Escolhe e confirma',
        text: 'O sistema mostra apenas os horários realmente livres, respeitando a agenda de cada profissional.'
    },
    {
        title: 'Todo mundo avisado',
        text: 'Cliente e profissional recebem a confirmação, e os lembretes saem automaticamente antes do atendimento.'
    }
];

const faq = [
    {
        q: 'Serve para estúdio de beleza, nail e lash designer?',
        a: 'Serve. O atendimento pode usar um tom mais acolhedor, com mensagens delicadas, fonte arredondada e paleta de cores personalizada — ideal para estúdios femininos, sobrancelha, cílios, unhas e estética.'
    },
    {
        q: 'Preciso instalar algum aplicativo?',
        a: 'Não. O Reservo funciona direto no navegador. O painel administrativo pode ser instalado como aplicativo (PWA) no computador ou celular, ficando com ícone próprio.'
    },
    {
        q: 'O cliente precisa criar conta para agendar?',
        a: 'Não. O cliente informa apenas nome e telefone na primeira vez. Nas próximas, o sistema já reconhece e mostra os agendamentos dele.'
    },
    {
        q: 'Consigo controlar mais de um profissional?',
        a: 'Sim. Cada profissional tem sua própria agenda e seus próprios serviços, e os relatórios mostram o desempenho individual.'
    },
    {
        q: 'Funciona no celular?',
        a: 'Sim. Tanto o chat de agendamento quanto o painel administrativo são responsivos e funcionam em celular, tablet e computador.'
    }
];

/* ---------------------------------------------------------------- mockups */

const BrowserFrame = ({ url, children }) => (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 border-b border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <div className="ml-3 flex-1 bg-white rounded-md px-3 py-1 text-[11px] text-slate-400 border border-slate-200 truncate">
                {url}
            </div>
        </div>
        <div className="bg-slate-50">{children}</div>
    </div>
);

const Chip = ({ children, active, tone = 'blue' }) => (
    <span
        className={`inline-block text-[11px] px-3 py-1.5 rounded-full border ${
            active
                ? tone === 'rose'
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200'
        }`}
    >
        {children}
    </span>
);

const Bubble = ({ children, user, tone = 'blue' }) => (
    <div className={`flex ${user ? 'justify-end' : 'justify-start'}`}>
        <div
            className={`max-w-[85%] text-[12px] leading-snug px-3 py-2 rounded-2xl ${
                user
                    ? tone === 'rose'
                        ? 'bg-rose-500 text-white rounded-tr-none'
                        : 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-200'
            }`}
        >
            {children}
        </div>
    </div>
);

const chatVariants = {
    neutral: {
        tone: 'blue',
        accent: 'bg-blue-600',
        header: 'bg-slate-900',
        assistant: 'Assistente do Salão',
        welcome: 'Olá! Vamos agendar seu horário?',
        userFirst: 'Oi! Quero agendar um corte',
        askService: 'Escolha o serviço desejado.',
        services: ['Corte Masculino · R$ 45', 'Barba · R$ 30', 'Combo · R$ 70'],
        servicesActive: 0,
        askDate: 'Qual o melhor dia para você? 📅',
        askTime: 'Olha só os horários que encontrei:',
        detailsLabel: 'Confira os detalhes do agendamento:',
        summaryService: 'Corte Masculino',
        summaryLine: 'Amanhã às 14:00 · com Rafael',
        confirm: 'Confirmar Agendamento'
    },
    feminine: {
        tone: 'rose',
        accent: 'bg-rose-500',
        header: 'bg-gradient-to-r from-rose-400 to-pink-500',
        assistant: 'Assistente do Studio',
        welcome: 'Oi! 💕 Que alegria te ver por aqui!',
        userFirst: 'Oi! Quero agendar um horário',
        askService: 'Qual serviço você gostaria de agendar hoje? 💅✨',
        services: ['Design de Sobrancelha · R$ 45', 'Alongamento de Cílios · R$ 130', 'Manicure · R$ 40'],
        servicesActive: 1,
        askDate: 'Qual o melhor dia para você? 📅',
        askTime: 'Olha só os horários que encontrei para amanhã: 💖',
        detailsLabel: 'Dá uma olhadinha se está tudo certo com seu agendamento: ✨',
        summaryService: 'Alongamento de Cílios',
        summaryLine: 'Amanhã às 15:30 · com Camila',
        confirm: 'Confirmar meu Horário 💖'
    }
};

const ChatMock = ({ tone = 'neutral' }) => {
    const v = chatVariants[tone];

    return (
        <div className={`max-w-sm mx-auto ${tone === 'feminine' ? 'font-soft' : ''}`}>
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                <div className={`p-4 flex items-center gap-3 ${v.header}`}>
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                        <Store size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{v.assistant}</p>
                        <p className="text-[11px] text-green-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-300 rounded-full" /> online
                        </p>
                    </div>
                    <span className="text-[10px] text-white/80 border border-white/30 rounded-full px-2 py-1">
                        Início
                    </span>
                </div>

                <div className="p-4 space-y-3 bg-slate-50">
                    <Bubble tone={v.tone}>{v.welcome}</Bubble>
                    <Bubble user tone={v.tone}>{v.userFirst}</Bubble>
                    <Bubble tone={v.tone}>{v.askService}</Bubble>
                    <div className="flex flex-wrap gap-2">
                        {v.services.map((s, i) => (
                            <Chip key={s} tone={v.tone} active={i === v.servicesActive}>
                                {s}
                            </Chip>
                        ))}
                    </div>
                    <Bubble tone={v.tone}>{v.askDate}</Bubble>
                    <div className="flex flex-wrap gap-2">
                        <Chip tone={v.tone}>Hoje</Chip>
                        <Chip tone={v.tone} active>Amanhã</Chip>
                        <Chip tone={v.tone}>Sex, 18</Chip>
                    </div>
                    <Bubble tone={v.tone}>{v.askTime}</Bubble>
                    <div className="flex flex-wrap gap-2">
                        <Chip tone={v.tone}>09:00</Chip>
                        <Chip tone={v.tone}>10:30</Chip>
                        <Chip tone={v.tone} active>14:00</Chip>
                        <Chip tone={v.tone}>16:30</Chip>
                    </div>
                    <Bubble tone={v.tone}>
                        <span className="block text-[11px] text-slate-500 mb-1">{v.detailsLabel}</span>
                        <strong>{v.summaryService}</strong>
                        <br />
                        {v.summaryLine}
                    </Bubble>
                    <button className={`w-full ${v.accent} text-white text-[12px] font-semibold py-2.5 rounded-xl`}>
                        {v.confirm}
                    </button>
                </div>

                <div className="p-3 border-t border-slate-200 flex items-center gap-2">
                    <div className="flex-1 text-[11px] text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-3 py-2">
                        Digite sua mensagem...
                    </div>
                    <div className={`w-8 h-8 rounded-full ${v.accent} flex items-center justify-center text-white`}>
                        <ArrowRight size={14} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const sidebarItems = [
    { label: 'Visão Geral', icon: LayoutDashboard, active: false },
    { label: 'Agenda', icon: Calendar, active: true },
    { label: 'Relatórios', icon: BarChart2, active: false },
    { label: 'Clientes', icon: Users, active: false },
    { label: 'Serviços', icon: Scissors, active: false },
    { label: 'Produtos', icon: Package, active: false },
    { label: 'Profissionais', icon: Users, active: false },
    { label: 'Personalizar Chat', icon: MessageSquare, active: false },
    { label: 'Configurações', icon: SettingsIcon, active: false }
];

const calendarEvents = {
    3: [{ label: 'Corte · 09:00', tone: 'blue' }],
    5: [
        { label: 'Barba · 10:30', tone: 'amber' },
        { label: 'Combo · 15:00', tone: 'green' }
    ],
    9: [{ label: 'Coloração · 14:00', tone: 'violet' }],
    12: [
        { label: 'Corte · 11:00', tone: 'blue' },
        { label: 'Escova · 16:30', tone: 'green' }
    ],
    17: [{ label: 'Manicure · 13:00', tone: 'violet' }],
    20: [{ label: 'Combo · 09:30', tone: 'amber' }],
    24: [{ label: 'Corte · 14:00', tone: 'blue' }]
};

const toneClass = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    violet: 'bg-violet-100 text-violet-700 border-violet-200'
};

const MockAgenda = () => (
    <BrowserFrame url="reservo.app.br/admin">
        <div className="flex min-h-[380px]">
            <aside className="hidden sm:block w-48 shrink-0 bg-white border-r border-slate-200 p-4">
                <p className="text-sm font-bold text-slate-800 mb-1">Painel Salão</p>
                <p className="text-[10px] text-slate-400 mb-4">Maria Souza</p>
                <nav className="space-y-1">
                    {sidebarItems.map((item) => (
                        <div
                            key={item.label}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] ${
                                item.active
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'text-slate-500'
                            }`}
                        >
                            <item.icon size={13} />
                            {item.label}
                        </div>
                    ))}
                </nav>
            </aside>

            <div className="flex-1 p-4 min-w-0">
                <p className="text-sm font-bold text-slate-800 mb-3">Agenda</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white rounded-xl border border-slate-100 p-3">
                        <p className="text-[10px] text-slate-400">Faturamento Total</p>
                        <p className="text-base font-bold text-green-600">R$ 12.480,00</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-100 p-3">
                        <p className="text-[10px] text-slate-400">Agendamentos</p>
                        <p className="text-base font-bold text-blue-600">148</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-semibold text-slate-700">Novembro 2026</p>
                        <span className="text-[10px] text-slate-400">Mês</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-[9px] text-slate-400 mb-1">
                        {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((d) => (
                            <span key={d} className="text-center">{d}</span>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 28 }).map((_, i) => {
                            const day = i + 1;
                            const events = calendarEvents[day] || [];
                            return (
                                <div
                                    key={day}
                                    className="min-h-[42px] rounded-md border border-slate-100 p-1"
                                >
                                    <span className="text-[9px] text-slate-400">{day}</span>
                                    {events.map((ev) => (
                                        <div
                                            key={ev.label}
                                            className={`mt-0.5 text-[8px] leading-tight px-1 py-0.5 rounded border truncate ${toneClass[ev.tone]}`}
                                        >
                                            {ev.label}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    </BrowserFrame>
);

const bars = [42, 58, 35, 74, 66, 88, 52];
const barLabels = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

const MockReports = () => (
    <BrowserFrame url="reservo.app.br/admin">
        <div className="p-4 space-y-3 min-h-[380px]">
            <div className="bg-white rounded-xl border border-slate-100 p-3 flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <BarChart2 size={14} className="text-blue-600" /> Relatórios de Faturamento
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Analise o desempenho financeiro do seu negócio</p>
                </div>
                <div className="hidden sm:flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
                    {['Dia', 'Semana', 'Mês', 'Ano'].map((p) => (
                        <span
                            key={p}
                            className={`text-[10px] px-2 py-1 rounded-md ${
                                p === 'Mês' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
                            }`}
                        >
                            {p}
                        </span>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Faturamento', value: 'R$ 12.480,00' },
                    { label: 'Atendimentos', value: '148' },
                    { label: 'Ticket médio', value: 'R$ 84,32' }
                ].map((kpi) => (
                    <div key={kpi.label} className="bg-white rounded-xl border border-slate-100 p-3">
                        <p className="text-[10px] text-slate-400">{kpi.label}</p>
                        <p className="text-sm font-bold text-slate-800">{kpi.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-slate-100 p-3">
                    <p className="text-[11px] font-semibold text-slate-700 mb-3">Faturamento por dia</p>
                    <div className="flex items-end gap-2 h-24">
                        {bars.map((h, i) => (
                            <div key={barLabels[i]} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                    className="w-full rounded-t bg-blue-500/80"
                                    style={{ height: `${h}%` }}
                                />
                                <span className="text-[9px] text-slate-400">{barLabels[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 p-3">
                    <p className="text-[11px] font-semibold text-slate-700 mb-3">Top Serviços</p>
                    <div className="space-y-2">
                        {[
                            { name: 'Corte Masculino', value: 'R$ 4.860,00', count: 108 },
                            { name: 'Coloração', value: 'R$ 3.240,00', count: 36 },
                            { name: 'Combo Corte + Barba', value: 'R$ 2.380,00', count: 34 }
                        ].map((s) => (
                            <div
                                key={s.name}
                                className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-1.5"
                            >
                                <span className="text-[11px] text-slate-600">{s.name}</span>
                                <div className="text-right">
                                    <p className="text-[11px] font-medium text-slate-800">{s.value}</p>
                                    <p className="text-[9px] text-slate-400">{s.count} agendamentos</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </BrowserFrame>
);

const MockProducts = () => (
    <BrowserFrame url="reservo.app.br/admin">
        <div className="p-4 space-y-3 min-h-[380px]">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Package size={14} className="text-blue-600" /> Produtos e Estoque
                </p>
                <span className="text-[10px] bg-blue-600 text-white rounded-lg px-3 py-1.5">+ Novo produto</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="grid grid-cols-4 text-[10px] text-slate-400 px-3 py-2 border-b border-slate-100 bg-slate-50">
                    <span>Produto</span>
                    <span>Estoque</span>
                    <span>Preço</span>
                    <span className="text-right">Status</span>
                </div>
                {[
                    { name: 'Pomada Modeladora', stock: 12, price: 'R$ 49,90', ok: true },
                    { name: 'Shampoo Profissional', stock: 3, price: 'R$ 38,00', ok: false },
                    { name: 'Óleo para Barba', stock: 8, price: 'R$ 29,90', ok: true },
                    { name: 'Máscara de Hidratação', stock: 2, price: 'R$ 62,00', ok: false }
                ].map((p) => (
                    <div
                        key={p.name}
                        className="grid grid-cols-4 text-[11px] px-3 py-2.5 border-b border-slate-50 last:border-0 items-center"
                    >
                        <span className="text-slate-700 truncate">{p.name}</span>
                        <span className="text-slate-500">{p.stock} un.</span>
                        <span className="text-slate-500">{p.price}</span>
                        <span className="text-right">
                            <span
                                className={`text-[9px] px-2 py-1 rounded-full border ${
                                    p.ok
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                            >
                                {p.ok ? 'Em estoque' : 'Estoque baixo'}
                            </span>
                        </span>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-3">
                <p className="text-[11px] font-semibold text-slate-700 mb-2">Baixa automática no atendimento</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                    Ao finalizar um atendimento, os produtos utilizados são descontados do estoque automaticamente,
                    mantendo o controle sempre correto.
                </p>
            </div>
        </div>
    </BrowserFrame>
);

const MockNotifications = () => (
    <BrowserFrame url="reservo.app.br/admin">
        <div className="p-4 space-y-3 min-h-[380px]">
            <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Bell size={14} className="text-blue-600" /> Notificações
            </p>

            <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                    <Bell size={14} />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800">Novo agendamento recebido</p>
                    <p className="text-[10px] text-slate-500">
                        Maria Silva agendou Corte Masculino para amanhã às 14:00.
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1">agora mesmo</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-3 space-y-2">
                {[
                    { label: '📧 Notificações por Email', on: true },
                    { label: '🔔 Notificações Push no painel', on: true },
                    { label: '⏰ Lembrete antes do atendimento', on: true }
                ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-600">{item.label}</span>
                        <span
                            className={`w-8 h-4 rounded-full relative ${
                                item.on ? 'bg-blue-600' : 'bg-slate-300'
                            }`}
                        >
                            <span
                                className={`absolute top-0.5 w-3 h-3 bg-white rounded-full ${
                                    item.on ? 'right-0.5' : 'left-0.5'
                                }`}
                            />
                        </span>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-3">
                <p className="text-[11px] font-semibold text-slate-700 mb-2">Personalização do chat</p>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 w-24">Cor principal</span>
                        <div className="flex gap-1.5">
                            {['#0f172a', '#3b82f6', '#ec4899', '#10b981', '#f59e0b'].map((c) => (
                                <span
                                    key={c}
                                    className="w-5 h-5 rounded-full border border-white shadow"
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 w-24">Nome do assistente</span>
                        <span className="text-[10px] text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1">
                            Assistente do Salão
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </BrowserFrame>
);

const mockTabs = [
    { id: 'chat', label: 'Chat de agendamento', icon: MessageSquare, render: () => <ChatMock tone="neutral" /> },
    { id: 'agenda', label: 'Agenda', icon: Calendar, render: MockAgenda },
    { id: 'reports', label: 'Relatórios', icon: BarChart2, render: MockReports },
    { id: 'products', label: 'Estoque', icon: Package, render: MockProducts },
    { id: 'notifications', label: 'Notificações', icon: Bell, render: MockNotifications }
];

/* ------------------------------------------------------------------ página */

const Presentation = () => {
    const [activeMock, setActiveMock] = useState('chat');
    const ActiveMock = mockTabs.find((t) => t.id === activeMock).render;

    useEffect(() => {
        const previous = document.title;
        document.title = 'Reservo — Sistema de Agendamento Online para Salões e Barbearias';
        return () => {
            document.title = previous;
        };
    }, []);

    return (
        <div className="min-h-screen bg-white text-slate-700">
            {/* Nav */}
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
                    <a href="#top" className="flex items-center gap-2">
                        <img src="/Reservo-icon.png" alt="Reservo" className="w-8 h-8 rounded-lg" />
                        <span className="font-bold text-slate-900 text-lg">Reservo</span>
                    </a>

                    <nav className="hidden md:flex items-center gap-7 text-sm text-slate-500">
                        <a href="#recursos" className="hover:text-slate-900 transition-colors">Recursos</a>
                        <a href="#estilos" className="hover:text-slate-900 transition-colors">Para o seu negócio</a>
                        <a href="#telas" className="hover:text-slate-900 transition-colors">Telas do sistema</a>
                        <a href="#como-funciona" className="hover:text-slate-900 transition-colors">Como funciona</a>
                        <a href="#faq" className="hover:text-slate-900 transition-colors">Dúvidas</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <a
                            href="/login"
                            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <Lock size={14} /> Já sou cliente
                        </a>
                        <a
                            href={WHATSAPP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                            Quero conhecer
                        </a>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section id="top" className="relative overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                        backgroundSize: '44px 44px'
                    }}
                />
                <div className="absolute -top-32 -right-24 w-96 h-96 bg-blue-600/25 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-20 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />

                <div className="relative max-w-6xl mx-auto px-5 py-16 md:py-24 grid lg:grid-cols-2 gap-14 items-center">
                    <div>
                        <span className="inline-flex items-center gap-2 text-xs font-medium bg-white/10 border border-white/15 rounded-full px-3 py-1.5 mb-6">
                            <Smartphone size={13} /> Sistema de agendamento online
                        </span>

                        <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-5">
                            Sua agenda cheia, sem depender do telefone
                        </h1>

                        <p className="text-slate-300 text-lg leading-relaxed mb-8">
                            O Reservo é o sistema de agendamento online para salões de beleza, barbearias, estúdios
                            femininos, nail e lash designers e clínicas de estética. Seus clientes marcam sozinhos pelo
                            chat, e você acompanha tudo pelo painel.
                        </p>

                        <div className="flex flex-wrap gap-3 mb-8">
                            <a
                                href={WHATSAPP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                            >
                                Quero conhecer o Reservo <ArrowRight size={16} />
                            </a>
                            <a
                                href="#telas"
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                            >
                                Ver as telas
                            </a>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                            {[
                                'Agendamento 24h por dia',
                                'Funciona no navegador',
                                'Lembretes automáticos'
                            ].map((item) => (
                                <span key={item} className="flex items-center gap-2">
                                    <CheckCircle size={15} className="text-green-400" /> {item}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <ChatMock tone="neutral" />
                    </div>
                </div>

                <div className="relative border-t border-white/10">
                    <div className="max-w-6xl mx-auto px-5 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        {[
                            { icon: Clock, label: 'Cliente agenda a qualquer hora' },
                            { icon: Bell, label: 'Lembretes antes do atendimento' },
                            { icon: TrendingUp, label: 'Relatórios de faturamento' },
                            { icon: Users, label: 'Agenda por profissional' }
                        ].map((item) => (
                            <div key={item.label} className="flex flex-col items-center gap-2">
                                <item.icon size={18} className="text-blue-400" />
                                <span className="text-xs text-slate-300">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Recursos */}
            <section id="recursos" className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-5">
                    <div className="max-w-2xl mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            Tudo que o seu estabelecimento precisa
                        </h2>
                        <p className="text-slate-500 text-lg">
                            Da marcação do horário até o relatório do mês, o Reservo cobre o dia a dia do seu negócio.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f) => (
                            <div
                                key={f.title}
                                className="p-6 rounded-2xl border border-slate-100 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all"
                            >
                                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                                    <f.icon size={20} />
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{f.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Estilos de atendimento */}
            <section id="estilos" className="py-20 bg-gradient-to-b from-white to-slate-50">
                <div className="max-w-6xl mx-auto px-5">
                    <div className="max-w-2xl mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            Barbearia, salão ou estúdio feminino
                        </h2>
                        <p className="text-slate-500 text-lg">
                            O atendimento se adapta ao seu público: mais direto para a barbearia, mais acolhedor para o
                            estúdio de beleza. As cores, a fonte e as mensagens acompanham a sua marca.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Scissors size={16} className="text-slate-400" />
                                <span className="text-sm font-semibold text-slate-700">
                                    Tom direto · barbearias, salões e clínicas
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 mb-5">
                                Serviços combinados, duração definida e agenda separada por profissional.
                            </p>
                            <ChatMock tone="neutral" />
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Palette size={16} className="text-rose-400" />
                                <span className="text-sm font-semibold text-slate-700">
                                    Tom acolhedor · estúdios femininos, nail e lash
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 mb-5">
                                Mensagens delicadas, fonte arredondada e paleta personalizada para o seu público.
                            </p>
                            <ChatMock tone="feminine" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Telas */}
            <section id="telas" className="py-20 bg-slate-50 border-y border-slate-100">
                <div className="max-w-6xl mx-auto px-5">
                    <div className="max-w-2xl mb-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            Conheça as telas do sistema
                        </h2>
                        <p className="text-slate-500 text-lg">
                            Um chat simples para o cliente e um painel completo para você.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8">
                        {mockTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveMock(tab.id)}
                                className={`inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border transition-colors ${
                                    activeMock === tab.id
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-500 border-slate-200 hover:text-slate-900'
                                }`}
                            >
                                <tab.icon size={15} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    <ActiveMock />

                    <p className="text-xs text-slate-400 mt-6 text-center">
                        Telas ilustrativas do sistema, com dados de exemplo.
                    </p>
                </div>
            </section>

            {/* Como funciona */}
            <section id="como-funciona" className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-5">
                    <div className="max-w-2xl mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            Como funciona
                        </h2>
                        <p className="text-slate-500 text-lg">
                            Três passos entre o cliente decidir e o horário estar na sua agenda.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {steps.map((s, i) => (
                            <div key={s.title} className="relative p-6 rounded-2xl border border-slate-100">
                                <span className="w-9 h-9 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center mb-4">
                                    {i + 1}
                                </span>
                                <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{s.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-20 bg-slate-50 border-y border-slate-100">
                <div className="max-w-3xl mx-auto px-5">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-10 text-center">
                        Dúvidas frequentes
                    </h2>

                    <div className="space-y-3">
                        {faq.map((item) => (
                            <details
                                key={item.q}
                                className="group bg-white rounded-xl border border-slate-200 p-5"
                            >
                                <summary className="flex items-center justify-between cursor-pointer text-slate-900 font-medium list-none">
                                    {item.q}
                                    <span className="text-slate-400 group-open:rotate-45 transition-transform text-xl leading-none">
                                        +
                                    </span>
                                </summary>
                                <p className="text-sm text-slate-500 leading-relaxed mt-3">
                                    {item.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA final */}
            <section className="py-20 bg-slate-900 text-white">
                <div className="max-w-4xl mx-auto px-5 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-5">
                        Pronto para lotar a sua agenda?
                    </h2>
                    <p className="text-slate-300 text-lg mb-9 max-w-2xl mx-auto">
                        Fale com a nossa equipe, veja o sistema funcionando com os seus serviços e comece a receber
                        agendamentos ainda esta semana.
                    </p>

                    <div className="flex flex-wrap gap-3 justify-center">
                        <a
                            href={WHATSAPP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors"
                        >
                            <MessageCircle size={17} /> Falar no WhatsApp
                        </a>
                        <a
                            href="/login"
                            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors"
                        >
                            <Lock size={15} /> Acessar painel
                        </a>
                    </div>

                    <p className="text-sm text-slate-400 mt-6">WhatsApp {CONTACT_PHONE}</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 text-slate-400 py-10">
                <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <img src="/Reservo-icon.png" alt="Reservo" className="w-7 h-7 rounded-lg" />
                        <span className="font-semibold text-white">Reservo</span>
                    </div>
                    <p className="text-xs">
                        Sistema de agendamento online para salões, barbearias, estúdios femininos e clínicas de estética.
                    </p>
                    <p className="text-xs">© {new Date().getFullYear()} Reservo</p>
                </div>
            </footer>
        </div>
    );
};

export default Presentation;
