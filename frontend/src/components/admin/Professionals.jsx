import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Professionals = () => {
    const [professionals, setProfessionals] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        fetchProfessionals();
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                const salonId = user.salonId || user.id;
                const res = await axios.get(`/api/services?salao_id=${salonId}`);
                setServices(res.data);
            }
        } catch (error) {
            console.error("Erro ao carregar serviços", error);
        }
    };

    const fetchProfessionals = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                const salonId = user.salonId || user.id;
                const res = await axios.get(`/api/professionals?salao_id=${salonId}`);
                setProfessionals(res.data);
            }
        } catch (error) {
            console.error("Erro ao carregar profissionais", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const selectedServices = [];
        e.target.querySelectorAll('input[name="services"]:checked').forEach(cb => {
            selectedServices.push(cb.value);
        });

        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            services: selectedServices
        };

        try {
            if (editing._id) {
                await axios.put(`/api/professionals/${editing._id}`, data);
            } else {
                await axios.post('/api/professionals', data);
            }
            setEditing(null);
            fetchProfessionals();
        } catch (error) {
            alert('Erro ao salvar profissional');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza?')) return;
        try {
            await axios.delete(`/api/professionals/${id}`);
            fetchProfessionals();
        } catch (error) {
            alert('Erro ao deletar');
        }
    };

    if (loading) return <div>Carregando...</div>;

    if (editing) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm max-w-lg">
                <h3 className="text-xl font-bold mb-4">{editing._id ? 'Editar Profissional' : 'Novo Profissional'}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome</label>
                        <input name="name" defaultValue={editing.name} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input name="email" type="email" defaultValue={editing.email} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Telefone</label>
                        <input name="phone" defaultValue={editing.phone} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Serviços Atendidos</label>
                        <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2 bg-gray-50">
                            {services.map(s => (
                                <label key={s._id} className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        name="services" 
                                        value={s._id} 
                                        defaultChecked={editing.services && editing.services.includes(s._id)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{s.name}</span>
                                </label>
                            ))}
                            {services.length === 0 && <p className="text-xs text-gray-500">Nenhum serviço cadastrado.</p>}
                        </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border rounded text-gray-600">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Profissionais</h2>
                <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    + Novo Profissional
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {professionals.map(p => (
                            <tr key={p._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{p.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{p.email || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{p.phone || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => setEditing(p)} className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                                    <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:text-red-900">Excluir</button>
                                </td>
                            </tr>
                        ))}
                        {professionals.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">Nenhum profissional cadastrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Professionals;
