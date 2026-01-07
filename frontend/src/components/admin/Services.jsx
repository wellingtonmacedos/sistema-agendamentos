import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';
import { X, Upload, Check, Image as ImageIcon, Edit, Trash } from 'lucide-react';

const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null); // null = list, {} = create, {id...} = edit
    
    // Cropper State
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.id) {
                const res = await axios.get(`/api/services?salao_id=${user.id}`);
                setServices(res.data);
            }
        } catch (error) {
            console.error("Erro ao carregar serviços", error);
        } finally {
            setLoading(false);
        }
    };

    const onFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl);
            setShowCropper(true);
            // Reset input value to allow selecting same file again
            e.target.value = null;
        }
    };

    const readFile = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result), false);
            reader.readAsDataURL(file);
        });
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropSave = async () => {
        try {
            setUploading(true);
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            
            const formData = new FormData();
            formData.append('image', croppedImageBlob, 'service-image.jpg');

            // Use auth token if needed, usually axios interceptor handles it
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/upload', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            setEditing(prev => ({ ...prev, image: res.data.url }));
            setShowCropper(false);
            setImageSrc(null);
        } catch (e) {
            console.error(e);
            alert('Erro ao fazer upload da imagem');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // Use state image if available (from upload), otherwise fallback to form input (manual url)
        const finalImage = editing.image || formData.get('image_url');

        const data = {
            name: formData.get('name'),
            price: Number(formData.get('price')),
            duration: Number(formData.get('duration')),
            image: finalImage,
        };

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (editing._id) {
                await axios.put(`/api/services/${editing._id}`, data, config);
            } else {
                await axios.post('/api/services', data, config);
            }
            setEditing(null);
            fetchServices();
        } catch (error) {
            alert('Erro ao salvar serviço');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/services/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchServices();
        } catch (error) {
            alert('Erro ao deletar');
        }
    };

    if (loading) return <div>Carregando...</div>;

    if (editing) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm max-w-lg relative">
                <h3 className="text-xl font-bold mb-4">{editing._id ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Serviço</label>
                        <input name="name" defaultValue={editing.name} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                    </div>

                    {/* Image Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Serviço</label>
                        
                        {/* Preview */}
                        {editing.image && (
                            <div className="mb-3 relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden group">
                                <img src={editing.image} alt="Preview" className="w-full h-full object-cover" />
                                <button 
                                    type="button"
                                    onClick={() => setEditing({...editing, image: ''})}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <div className="flex gap-2 items-start">
                            <div className="flex-1">
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={onFileChange}
                                        className="hidden" 
                                        id="file-upload"
                                    />
                                    <label 
                                        htmlFor="file-upload"
                                        className="flex items-center justify-center gap-2 w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 cursor-pointer hover:border-blue-500 hover:text-blue-500 transition-colors"
                                    >
                                        <Upload size={20} />
                                        <span>Carregar do Computador</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-2">
                             <p className="text-xs text-gray-500 mb-1">Ou cole uma URL externa:</p>
                             <input 
                                name="image_url" 
                                defaultValue={editing.image} 
                                onChange={(e) => setEditing({...editing, image: e.target.value})}
                                placeholder="https://..." 
                                className="block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                            <input name="price" type="number" step="0.01" defaultValue={editing.price} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Duração (min)</label>
                            <input name="duration" type="number" defaultValue={editing.duration} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border rounded text-gray-600">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
                    </div>
                </form>

                {/* Cropper Modal */}
                {showCropper && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
                        <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl flex flex-col max-h-[90vh]">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h3 className="font-bold text-lg">Ajustar Imagem</h3>
                                <button onClick={() => setShowCropper(false)} className="text-gray-500 hover:text-gray-700">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="relative flex-1 min-h-[400px] bg-gray-900">
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={16 / 9} // Service cards are usually landscape
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                />
                            </div>

                            <div className="p-4 border-t bg-gray-50">
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-1">Zoom</label>
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        aria-labelledby="Zoom"
                                        onChange={(e) => setZoom(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => setShowCropper(false)}
                                        className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={handleCropSave}
                                        disabled={uploading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                                    >
                                        {uploading ? 'Processando...' : (
                                            <>
                                                <Check size={18} />
                                                Confirmar Recorte
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Serviços</h2>
                <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    + Novo Serviço
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imagem</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {services.map(s => (
                            <tr key={s._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {s.image ? (
                                        <img src={s.image} alt={s.name} className="h-10 w-16 object-cover rounded" />
                                    ) : (
                                        <div className="h-10 w-16 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                                            <ImageIcon size={20} />
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{s.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">R$ {s.price.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{s.duration} min</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => setEditing(s)} className="text-blue-600 hover:text-blue-900 mr-4" title="Editar">
                                        <Edit size={20} />
                                    </button>
                                    <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:text-red-900" title="Excluir">
                                        <Trash size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {services.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Nenhum serviço cadastrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Services;
