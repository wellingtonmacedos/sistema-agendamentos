import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    Calendar, 
    Scissors, 
    Users, 
    Settings as SettingsIcon, 
    LogOut, 
    Menu, 
    X, 
    MessageSquare, 
    BarChart2, 
    Shield,
    Package
} from 'lucide-react';

import Overview from './admin/Overview';
import Agenda from './admin/Agenda';
import Reports from './admin/Reports';
import Services from './admin/Services';
import Products from './admin/Products';
import Professionals from './admin/Professionals';
import Customers from './admin/Customers';
import ChatSettings from './admin/ChatSettings';
import Settings from './admin/Settings';
import SuperAdminUsers from './admin/SuperAdminUsers';

const AdminDashboard = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    // Set default tab for Super Admin
    useEffect(() => {
        if (isSuperAdmin && activeTab === 'overview') {
            setActiveTab('users');
        }
    }, [isSuperAdmin, activeTab]);

    let tabs = [];

    if (isSuperAdmin) {
        tabs = [
            { id: 'users', label: 'Gestão de Admins', icon: Shield },
            // Super Admin might want to see logs or settings later
        ];
    } else {
        tabs = [
            { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
            { id: 'agenda', label: 'Agenda', icon: Calendar },
            { id: 'reports', label: 'Relatórios', icon: BarChart2 },
            { id: 'customers', label: 'Clientes', icon: Users },
            { id: 'services', label: 'Serviços', icon: Scissors },
            { id: 'products', label: 'Produtos', icon: Package },
            { id: 'professionals', label: 'Profissionais', icon: Users },
            { id: 'chat-settings', label: 'Personalizar Chat', icon: MessageSquare },
            { id: 'settings', label: 'Configurações', icon: SettingsIcon },
        ];
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'users': return <SuperAdminUsers />;
            case 'audit-logs': return <AuditLogs />;
            case 'overview': return <Overview />;
            case 'agenda': return <Agenda />;
            case 'reports': return <Reports />;
            case 'customers': return <Customers />;
            case 'services': return <Services />;
            case 'products': return <Products />;
            case 'professionals': return <Professionals />;
            case 'chat-settings': return <ChatSettings />;
            case 'settings': return <Settings />;
            default: return isSuperAdmin ? <SuperAdminUsers /> : <Overview />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r h-screen sticky top-0">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-gray-800">
                        {isSuperAdmin ? 'Super Admin' : 'Painel Salão'}
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">{user?.name}</p>
                </div>
                
                <nav className="flex-1 p-4 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
                                activeTab === tab.id 
                                    ? 'bg-blue-50 text-blue-600 font-medium' 
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <tab.icon size={20} />
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t">
                    <button 
                        onClick={onLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Mobile Header & Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-20">
                    <h1 className="font-bold text-gray-800">{isSuperAdmin ? 'Super Admin' : 'Painel Administrativo'}</h1>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </header>

                {/* Mobile Menu Overlay */}
                {mobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 z-10 bg-white pt-16 px-4">
                        <nav className="space-y-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg ${
                                        activeTab === tab.id 
                                            ? 'bg-blue-50 text-blue-600 font-medium' 
                                            : 'text-gray-600'
                                    }`}
                                >
                                    <tab.icon size={20} />
                                    {tab.label}
                                </button>
                            ))}
                            <button 
                                onClick={onLogout}
                                className="flex items-center gap-3 w-full px-4 py-3 text-red-600 border-t mt-4"
                            >
                                <LogOut size={20} />
                                Sair
                            </button>
                        </nav>
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
