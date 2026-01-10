import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X, Search, Package, AlertTriangle, CheckCircle } from 'lucide-react';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '',
        commission: '',
        active: true
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/admin/products', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(res.data);
        } catch (error) {
            console.error("Erro ao carregar produtos", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = {
                name: formData.name,
                price: Number(formData.price),
                stock: Number(formData.stock),
                commission: Number(formData.commission),
                active: formData.active
            };

            if (editingProduct) {
                await axios.put(`/api/admin/products/${editingProduct._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/admin/products', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setShowModal(false);
            setEditingProduct(null);
            setFormData({ name: '', price: '', stock: '', commission: '', active: true });
            fetchProducts();
        } catch (error) {
            alert('Erro ao salvar produto: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/admin/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchProducts();
        } catch (error) {
            alert('Erro ao excluir produto: ' + (error.response?.data?.error || error.message));
        }
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            price: product.price,
            stock: product.stock,
            commission: product.commission,
            active: product.active
        });
        setShowModal(true);
    };

    const openNewModal = () => {
        setEditingProduct(null);
        setFormData({ name: '', price: '', stock: '', commission: '', active: true });
        setShowModal(true);
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Package className="text-blue-600" /> Produtos
                </h2>
                <button 
                    onClick={openNewModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm"
                >
                    <Plus size={18} /> Novo Produto
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text"
                    placeholder="Buscar produtos..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-10">Carregando...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Nome</th>
                                <th className="p-4 font-semibold text-gray-600">Preço</th>
                                <th className="p-4 font-semibold text-gray-600">Estoque</th>
                                <th className="p-4 font-semibold text-gray-600">Status</th>
                                <th className="p-4 font-semibold text-gray-600 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredProducts.map(product => (
                                <tr key={product._id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-800">{product.name}</td>
                                    <td className="p-4 text-gray-600">R$ {product.price.toFixed(2)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            product.stock > 10 ? 'bg-green-100 text-green-700' : 
                                            product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {product.stock} un
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {product.active ? (
                                            <span className="flex items-center gap-1 text-green-600 text-sm">
                                                <CheckCircle size={14} /> Ativo
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-gray-400 text-sm">
                                                <X size={14} /> Inativo
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button 
                                            onClick={() => openEditModal(product)}
                                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(product._id)}
                                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        Nenhum produto encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">
                                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        min="0"
                                        required 
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        value={formData.price}
                                        onChange={e => setFormData({...formData, price: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                                    <input 
                                        type="number" 
                                        step="1"
                                        min="0"
                                        required 
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        value={formData.stock}
                                        onChange={e => setFormData({...formData, stock: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Comissão (%) <span className="text-xs text-gray-400">(Opcional)</span></label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={formData.commission}
                                    onChange={e => setFormData({...formData, commission: e.target.value})}
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input 
                                    type="checkbox" 
                                    id="active"
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    checked={formData.active}
                                    onChange={e => setFormData({...formData, active: e.target.checked})}
                                />
                                <label htmlFor="active" className="text-sm font-medium text-gray-700">Produto Ativo</label>
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors mt-4"
                            >
                                Salvar Produto
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;