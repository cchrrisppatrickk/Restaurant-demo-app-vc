import React, { useState } from 'react';
import { toast } from 'sonner';
import { usePlatos } from '../hooks/usePlatos';
import { useMenuDiario } from '../hooks/useMenuDiario';
import { Plato } from '../types/database';
import Modal from '../components/Modal';

const Catalogo: React.FC = () => {
    const { platos, loading: loadingPlatos, addPlato, updatePlato, deletePlato } = usePlatos();
    const { menuHoy, agregarAlMenu, quitarDelMenu } = useMenuDiario();

    const [currentTab, setCurrentTab] = useState<'catalogo' | 'menu'>('catalogo');

    // Modal Plato general
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlato, setEditingPlato] = useState<Plato | null>(null);
    const [form, setForm] = useState<Omit<Plato, 'id'>>({
        nombre: '',
        descripcion: '',
        precio_base: 0,
        categoria: 'Segundo'
    });

    // Modal Agregar al Menu del dia
    const [isAddMenuModalOpen, setIsAddMenuModalOpen] = useState(false);
    const [platoParaMenu, setPlatoParaMenu] = useState<Plato | null>(null);
    const [menuForm, setMenuForm] = useState({
        precio: 0,
        stock: 50
    });

    const handleOpenModal = (plato?: Plato) => {
        if (plato) {
            setEditingPlato(plato);
            setForm({
                nombre: plato.nombre,
                descripcion: plato.descripcion || '',
                precio_base: plato.precio_base,
                categoria: plato.categoria || 'Segundo'
            });
        } else {
            setEditingPlato(null);
            setForm({
                nombre: '',
                descripcion: '',
                precio_base: 0,
                categoria: 'Segundo'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPlato) {
                await updatePlato({ ...form, id: editingPlato.id });
            } else {
                await addPlato(form);
            }
            setIsModalOpen(false);
            toast.success(editingPlato ? 'Plato actualizado' : 'Plato creado con éxito');
        } catch (error) {
            toast.error('Error al guardar el plato');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Estás seguro de eliminar este plato?')) {
            try {
                await deletePlato(id);
                toast.success('Plato eliminado');
            } catch (error) {
                toast.error('Error al eliminar el plato');
            }
        }
    };

    const handleOpenAddMenu = (plato: Plato) => {
        setPlatoParaMenu(plato);
        setMenuForm({
            precio: plato.precio_base,
            stock: 50
        });
        setIsAddMenuModalOpen(true);
    };

    const handleConfirmAddMenu = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!platoParaMenu) return;
        try {
            await agregarAlMenu(platoParaMenu.id, menuForm.precio, menuForm.stock);
            setIsAddMenuModalOpen(false);
            toast.success(`${platoParaMenu.nombre} añadido al menú de hoy`);
        } catch (error: any) {
            toast.error(error.message || 'Error al añadir al menú');
        }
    };

    const handleRemoveFromMenu = async (id: number, nombre: string) => {
        try {
            await quitarDelMenu(id);
            toast.success(`${nombre} quitado del menú`);
        } catch (error) {
            toast.error('Error al quitar del menú');
        }
    };

    const categories = ['Entrada', 'Segundo', 'Postre', 'Bebida', 'Otro'];

    if (loadingPlatos) return <div className="p-8 text-center text-slate-500">Cargando catálogo...</div>;

    const isPlatoInMenu = (platoId: number) => menuHoy.some(m => m.id_plato === platoId);

    return (
        <div className="space-y-6 max-w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Catálogo & Menú</h1>
                    <p className="text-slate-500 text-sm font-medium">Gestiona tus productos y lo que ofreces hoy.</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
                    <button
                        onClick={() => setCurrentTab('catalogo')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${currentTab === 'catalogo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        📂 Catálogo General
                    </button>
                    <button
                        onClick={() => setCurrentTab('menu')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${currentTab === 'menu' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        🍽️ Menú de Hoy
                        {menuHoy.length > 0 && <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[10px]">{menuHoy.length}</span>}
                    </button>
                </div>
            </div>

            {currentTab === 'catalogo' ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
                        <span className="text-slate-400 text-sm font-bold ml-2">{platos.length} Platos en catálogo</span>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
                        >
                            <span>➕</span> Nuevo Plato
                        </button>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                                    <th className="px-8 py-4">Nombre</th>
                                    <th className="px-8 py-4">Categoría</th>
                                    <th className="px-8 py-4">Precio Sugerido</th>
                                    <th className="px-8 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm">
                                {platos.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic">
                                            No hay platos registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    platos.map((plato) => (
                                        <tr key={plato.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-4">
                                                <div className="font-bold text-slate-800">{plato.nombre}</div>
                                                {plato.descripcion && <div className="text-xs text-slate-400 max-w-xs truncate">{plato.descripcion}</div>}
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${plato.categoria === 'Entrada' ? 'bg-emerald-50 text-emerald-600' :
                                                    plato.categoria === 'Segundo' ? 'bg-blue-50 text-blue-600' :
                                                        plato.categoria === 'Postre' ? 'bg-purple-50 text-purple-600' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {plato.categoria}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 font-mono font-bold text-slate-600">
                                                S/ {plato.precio_base.toFixed(2)}
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex justify-end items-center gap-3">
                                                    {isPlatoInMenu(plato.id) ? (
                                                        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                                                            ✓ EN EL MENÚ
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleOpenAddMenu(plato)}
                                                            className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1"
                                                        >
                                                            <span>✨</span> OFRECER HOY
                                                        </button>
                                                    )}
                                                    <div className="h-4 w-px bg-slate-100 mx-1"></div>
                                                    <button onClick={() => handleOpenModal(plato)} className="text-slate-400 hover:text-blue-600 transition-all text-lg" title="Editar">✏️</button>
                                                    <button onClick={() => handleDelete(plato.id)} className="text-slate-400 hover:text-rose-600 transition-all text-lg" title="Eliminar">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100">
                        <h2 className="text-xl font-black text-emerald-900 flex items-center gap-2">
                            🍴 Menú del Día - {new Date().toLocaleDateString()}
                        </h2>
                        <p className="text-emerald-700/70 text-sm font-medium">Estos son los platos que los cajeros podrán vender hoy.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {menuHoy.length === 0 ? (
                            <div className="col-span-full py-12 text-center bg-white rounded-[2.5rem] border border-slate-100">
                                <span className="text-4xl block mb-4 italic opacity-20">🍃</span>
                                <p className="text-slate-400 font-bold">El menú de hoy está vacío.</p>
                                <button onClick={() => setCurrentTab('catalogo')} className="text-blue-600 font-black text-sm mt-2 hover:underline">Vuelve al catálogo para agregar platos →</button>
                            </div>
                        ) : (
                            menuHoy.map((item) => (
                                <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all relative group">
                                    <button
                                        onClick={() => handleRemoveFromMenu(item.id, item.plato_nombre)}
                                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-500 hover:text-white"
                                        title="Quitar del menú"
                                    >
                                        🗑️
                                    </button>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full mb-3 inline-block">
                                        {item.plato_categoria}
                                    </span>
                                    <h3 className="text-lg font-black text-slate-800 mb-1">{item.plato_nombre}</h3>
                                    <div className="flex justify-between items-end mt-6">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Precio Hoy</p>
                                            <span className="text-xl font-black text-blue-600 font-mono">S/ {item.precio_dia.toFixed(2)}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Stock Disponible</p>
                                            <span className={`text-lg font-black font-mono ${item.stock_actual === 0 ? 'text-rose-500' : 'text-slate-600'}`}>
                                                {item.stock_actual} / {item.stock_inicial}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Modal General de Platos */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPlato ? 'Editar Plato' : 'Nuevo Plato'}
            >
                <form onSubmit={handleSubmit} className="space-y-4 p-2">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Nombre del Plato</label>
                        <input
                            type="text"
                            required
                            className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            placeholder="Ej. Ceviche de Pescado"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Descripción</label>
                        <textarea
                            className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all h-24 resize-none"
                            value={form.descripcion || ''}
                            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                            placeholder="Breve descripción para el cliente..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Precio Base (S/)</label>
                            <input
                                type="number"
                                step="0.10"
                                required
                                className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono"
                                value={form.precio_base}
                                onChange={(e) => setForm({ ...form, precio_base: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Categoría</label>
                            <select
                                className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-white"
                                value={form.categoria || 'Segundo'}
                                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="pt-6 flex gap-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 text-slate-500 font-bold hover:bg-slate-100 transition-all">Cancelar</button>
                        <button type="submit" className="flex-1 px-6 py-4 rounded-2xl bg-slate-900 text-white font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all">
                            {editingPlato ? 'Actualizar' : 'Crear Plato'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal para Añadir al Menú */}
            <Modal
                isOpen={isAddMenuModalOpen}
                onClose={() => setIsAddMenuModalOpen(false)}
                title="🍱 Ofrecer este Plato Hoy"
            >
                <form onSubmit={handleConfirmAddMenu} className="space-y-6 p-2">
                    <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">🥘</div>
                        <div>
                            <h4 className="font-black text-blue-900">{platoParaMenu?.nombre}</h4>
                            <p className="text-xs text-blue-600 font-medium">Configura el precio y stock para hoy.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Precio para Hoy (S/)</label>
                            <input
                                type="number"
                                step="0.10"
                                required
                                autoFocus
                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono text-xl"
                                value={menuForm.precio}
                                onChange={(e) => setMenuForm({ ...menuForm, precio: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Stock Inicial</label>
                            <input
                                type="number"
                                required
                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono text-xl"
                                value={menuForm.stock}
                                onChange={(e) => setMenuForm({ ...menuForm, stock: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button type="button" onClick={() => setIsAddMenuModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 text-slate-500 font-bold hover:bg-slate-100 transition-all">Cancelar</button>
                        <button type="submit" className="flex-1 px-6 py-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all">
                            ✨ Confirmar Registro
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Catalogo;
