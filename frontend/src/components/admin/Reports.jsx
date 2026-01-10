import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
    BarChart2, 
    TrendingUp, 
    Calendar, 
    Users, 
    Scissors, 
    DollarSign, 
    Filter,
    Package
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

const Reports = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD

    useEffect(() => {
        fetchReports();
    }, [period, date]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/reports', {
                params: {
                    period,
                    date
                }
            });
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    const getPeriodLabel = () => {
        if (!data) return '';
        const start = parseISO(data.startDate);
        const end = parseISO(data.endDate);
        
        if (period === 'day') return format(start, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        if (period === 'month') return format(start, "MMMM 'de' yyyy", { locale: ptBR });
        if (period === 'year') return format(start, "yyyy", { locale: ptBR });
        return `${format(start, "dd/MM", { locale: ptBR })} a ${format(end, "dd/MM", { locale: ptBR })}`;
    };

    if (loading && !data) {
        return <div className="p-10 text-center text-gray-500">Carregando relatórios...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <BarChart2 className="text-blue-600" /> Relatórios de Faturamento
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Analise o desempenho financeiro do seu negócio
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border">
                        <button 
                            onClick={() => setPeriod('day')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${period === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Dia
                        </button>
                        <button 
                            onClick={() => setPeriod('week')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${period === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Semana
                        </button>
                        <button 
                            onClick={() => setPeriod('month')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${period === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Mês
                        </button>
                        <button 
                            onClick={() => setPeriod('year')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${period === 'year' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Ano
                        </button>
                    </div>
                    
                    <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="p-2 border rounded-lg bg-white text-sm"
                    />
                </div>
            </div>

            {/* Date Display */}
            <div className="text-center">
                <span className="inline-block bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-sm font-bold border border-blue-100">
                    {data ? getPeriodLabel() : '...'}
                </span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Revenue */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <DollarSign size={64} className="text-green-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                        <h3 className="font-semibold text-gray-600">Faturamento Total</h3>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {data ? formatCurrency(data.summary.totalRevenue) : 'R$ 0,00'}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        Valor total de serviços finalizados
                    </p>
                </div>

                {/* Total Appointments */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Calendar size={64} className="text-blue-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Calendar size={20} />
                        </div>
                        <h3 className="font-semibold text-gray-600">Atendimentos</h3>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {data ? data.summary.totalAppointments : 0}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        Total de agendamentos concluídos
                    </p>
                </div>

                {/* Average Ticket */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp size={64} className="text-purple-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="font-semibold text-gray-600">Ticket Médio</h3>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {data ? formatCurrency(data.summary.averageTicket) : 'R$ 0,00'}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        Média de valor por atendimento
                    </p>
                </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Professional */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Users size={18} className="text-gray-500" /> Faturamento por Profissional
                    </h3>
                    <div className="space-y-4">
                        {data?.byProfessional.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">Sem dados para o período.</p>
                        ) : (
                            data?.byProfessional
                                .sort((a, b) => b.value - a.value)
                                .map((item, index) => (
                                <div key={index} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700">{item.name}</span>
                                        <span className="font-bold text-gray-900">{formatCurrency(item.value)}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="bg-blue-500 h-2 rounded-full" 
                                            style={{ width: `${(item.value / data.summary.totalRevenue) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* By Service */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Scissors size={18} className="text-gray-500" /> Faturamento por Serviço
                    </h3>
                    <div className="space-y-4">
                        {data?.byService.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">Sem dados para o período.</p>
                        ) : (
                            data?.byService
                                .sort((a, b) => b.value - a.value)
                                .map((item, index) => (
                                <div key={index} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700">{item.name}</span>
                                        <span className="font-bold text-gray-900">{formatCurrency(item.value)}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="bg-purple-500 h-2 rounded-full" 
                                            style={{ width: `${(item.value / data.summary.totalRevenue) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* By Product */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Package size={18} className="text-gray-500" /> Faturamento por Produto
                    </h3>
                    <div className="space-y-4">
                        {data?.byProduct?.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">Sem dados para o período.</p>
                        ) : (
                            data?.byProduct
                                ?.sort((a, b) => b.value - a.value)
                                .map((item, index) => (
                                <div key={index} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700">{item.name}</span>
                                        <span className="font-bold text-gray-900">{formatCurrency(item.value)}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="bg-green-500 h-2 rounded-full" 
                                            style={{ width: `${(item.value / data.summary.totalRevenue) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
