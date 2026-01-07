import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Search, Plus, Edit, X, Phone, Trash2 } from 'lucide-react';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '' });

    useEffect(() => {
        fetchCustomers();
    }, [page, searchTerm]); // Debounce could be added here

    const fetchCustomers = async () => {
        try {
            const res = await axios.get('/api/admin/customers', {
                params: {
                    page,
                    limit: 10,
                    search: searchTerm
                }
            });
            setCustomers(res.data.customers);
            setTotalPages(res.data.pages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({ name: customer.name, phone: customer.phone });
        setShowModal(true);
    };

    const handleNew = () => {
        setEditingCustomer(null);
        setFormData({ name: '', phone: '' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await axios.put(`/api/admin/customers/${editingCustomer._id}`, formData);
                alert('Cliente atualizado com sucesso!');
            } else {
                await axios.post('/api/admin/customers', formData);
                alert('Cliente criado com sucesso!');
            }
            setShowModal(false);
            fetchCustomers();
        } catch (err) {
            alert('Erro: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            try {
                await axios.delete(`/api/admin/customers/${id}`);
                alert('Cliente excluído com sucesso!');
                fetchCustomers();
            } catch (err) {
                alert('Erro ao excluir: ' + (err.response?.data?.error || err.message));
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <User className="text-blue-600" /> Clientes
                </h2>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome ou telefone..." 
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                    <button 
                        onClick={handleNew}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm"
                    >
                        <Plus size={18} /> Novo
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400">Carregando...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                            <tr>
                                <th className="p-4">Nome</th>
                                <th className="p-4">Telefone</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {customers.map(c => (
                                <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium text-gray-800">{c.name}</td>
                                    <td className="p-4 text-gray-600">{c.phone}</td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => handleEdit(c)}
                                            className="text-gray-400 hover:text-blue-600 p-1 mr-2"
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(c._id)}
                                            className="text-gray-400 hover:text-red-600 p-1"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="p-8 text-center text-gray-500">
                                        Nenhum cliente encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
                            <button 
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Próxima
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">
                                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-2.5 text-gray-400" />
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        placeholder="Ex: Maria Silva"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (WhatsApp)</label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-3 top-2.5 text-gray-400" />
                                    <input 
                                        type="tel" 
                                        required 
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                        placeholder="Ex: 11999999999"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Use apenas números. O telefone é o identificador único do cliente.
                                </p>
                            </div>

                            <button 
                                type="submit" 
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 mt-2"
                            >
                                Salvar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
