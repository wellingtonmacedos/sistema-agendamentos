import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Edit, Plus, RotateCcw, Store } from 'lucide-react';

const SuperAdminUsers = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [formData, setFormData] = useState({ salonName: '', email: '', phone: '', password: '', active: true });
    const [resetPassword, setResetPassword] = useState('');

    const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

    const fetchAdmins = async () => {
        try {
            const res = await axios.get('/api/super-admin/users', { headers: authHeaders() });
            setAdmins(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.salonName,       // Keeps the login user name in sync with the salon
                salonName: formData.salonName,  // Establishment name
                email: formData.email,
                phone: formData.phone,
                active: formData.active,
            };
            if (selectedAdmin) {
                await axios.put(`/api/super-admin/users/${selectedAdmin._id}`, payload, { headers: authHeaders() });
            } else {
                await axios.post('/api/super-admin/users', { ...payload, password: formData.password }, { headers: authHeaders() });
            }
            setShowModal(false);
            fetchAdmins();
        } catch (error) {
            alert(error.response?.data?.error || 'Erro ao salvar');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza? Esta ação removerá o acesso deste administrador.')) return;
        try {
            await axios.delete(`/api/super-admin/users/${id}`, { headers: authHeaders() });
            fetchAdmins();
        } catch (error) {
            alert('Erro ao remover');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/super-admin/users/${selectedAdmin._id}/reset-password`, { newPassword: resetPassword }, { headers: authHeaders() });
            setShowResetModal(false);
            alert('Senha redefinida com sucesso!');
        } catch (error) {
            alert(error.response?.data?.error || 'Erro ao redefinir senha');
        }
    };

    const openCreate = () => {
        setSelectedAdmin(null);
        setFormData({ salonName: '', email: '', phone: '', password: '', active: true });
        setShowModal(true);
    };

    const openEdit = (admin) => {
        setSelectedAdmin(admin);
        setFormData({
            salonName: admin.salonId?.name || admin.name || '',
            email: admin.email || '',
            phone: admin.salonId?.phone || '',
            active: admin.active !== false,
        });
        setShowModal(true);
    };

    const openReset = (admin) => {
        setSelectedAdmin(admin);
        setResetPassword('');
        setShowResetModal(true);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gestão de Administradores</h2>
                    <p className="text-gray-500 text-sm">Gerencie o acesso dos estabelecimentos</p>
                </div>
                <button
                    onClick={openCreate}
                    className="bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 w-full sm:w-auto"
                >
                    <Plus size={20} /> Novo Administrador
                </button>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl border p-8 text-center text-gray-500">Carregando...</div>
            ) : admins.length === 0 ? (
                <div className="bg-white rounded-xl border p-8 text-center text-gray-500">Nenhum administrador encontrado.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {admins.map(admin => {
                        const salonName = admin.salonId?.name || admin.name;
                        const phone = admin.salonId?.phone;
                        return (
                            <div key={admin._id} className="bg-white rounded-xl border shadow-sm p-4 flex flex-col">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Store size={18} className="text-gray-400 shrink-0" />
                                            <h3 className="font-semibold text-gray-800 truncate">{salonName}</h3>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate mt-1">{admin.email}</p>
                                        {phone && <p className="text-sm text-gray-500 mt-0.5">{phone}</p>}
                                    </div>
                                    <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-medium ${admin.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {admin.active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>

                                <p className="text-xs text-gray-400 mt-3">
                                    Criado em {new Date(admin.createdAt).toLocaleDateString()}
                                </p>

                                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
                                    <button
                                        onClick={() => openEdit(admin)}
                                        className="flex flex-col sm:flex-row items-center justify-center gap-1 px-2 py-3 sm:py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
                                    >
                                        <Edit size={18} /> Editar
                                    </button>
                                    <button
                                        onClick={() => openReset(admin)}
                                        className="flex flex-col sm:flex-row items-center justify-center gap-1 px-2 py-3 sm:py-2 text-yellow-600 hover:bg-yellow-50 rounded-lg text-sm font-medium"
                                    >
                                        <RotateCcw size={18} /> Senha
                                    </button>
                                    <button
                                        onClick={() => handleDelete(admin._id)}
                                        className="flex flex-col sm:flex-row items-center justify-center gap-1 px-2 py-3 sm:py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                                    >
                                        <Trash2 size={18} /> Excluir
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Create/Edit */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{selectedAdmin ? 'Editar Estabelecimento' : 'Novo Administrador'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Estabelecimento</label>
                                <input type="text" required value={formData.salonName} onChange={e => setFormData({ ...formData, salonName: e.target.value })} className="w-full border rounded-lg p-3" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (Login)</label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border rounded-lg p-3" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full border rounded-lg p-3" placeholder="(00) 00000-0000" />
                            </div>
                            {!selectedAdmin && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha Inicial</label>
                                    <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full border rounded-lg p-3" />
                                </div>
                            )}
                            {selectedAdmin && (
                                <div className="flex items-center gap-3 py-1">
                                    <input type="checkbox" id="active" className="w-5 h-5" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} />
                                    <label htmlFor="active" className="text-sm text-gray-700">Acesso Ativo</label>
                                </div>
                            )}
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-3 sm:py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Reset Password */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">Redefinir Senha</h3>
                        <p className="text-sm text-gray-500 mb-4">Defina uma nova senha para <strong>{selectedAdmin?.salonId?.name || selectedAdmin?.name}</strong>.</p>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                                <input type="password" required minLength={6} value={resetPassword} onChange={e => setResetPassword(e.target.value)} className="w-full border rounded-lg p-3" placeholder="Mínimo 6 caracteres" />
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowResetModal(false)} className="px-4 py-3 sm:py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-3 sm:py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Redefinir</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminUsers;
