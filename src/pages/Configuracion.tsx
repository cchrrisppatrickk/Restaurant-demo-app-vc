import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useMesas } from '../hooks/useMesas';
import { useUsuarios } from '../hooks/useUsuarios';
import { Usuario } from '../types/database';
import Modal from '../components/Modal';

const Configuracion: React.FC = () => {
    const [currentTab, setCurrentTab] = useState<'mesas' | 'personal'>('mesas');

    // Mesas Logic
    const { mesas, setCantidadMesas, loading: loadingMesas } = useMesas();
    const [tempMesas, setTempMesas] = useState(0);

    useEffect(() => {
        if (!loadingMesas) {
            setTempMesas(mesas.length);
        }
    }, [mesas.length, loadingMesas]);

    const handleUpdateMesas = async () => {
        try {
            if (tempMesas < 1) {
                toast.error('Debe haber al menos 1 mesa');
                return;
            }
            await setCantidadMesas(tempMesas);
            toast.success('Configuración de mesas actualizada');
        } catch (error) {
            toast.error('Error al actualizar mesas');
        }
    };

    // Personal Logic
    const { usuarios, addUsuario, deleteUsuario } = useUsuarios();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userForm, setUserForm] = useState<Omit<Usuario, 'id'>>({
        nombre: '',
        pin: '',
        rol: 'Cajero'
    });

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (userForm.pin.length !== 4 || isNaN(parseInt(userForm.pin))) {
            toast.error('El PIN debe ser de 4 dígitos');
            return;
        }
        try {
            await addUsuario(userForm);
            setIsModalOpen(false);
            setUserForm({ nombre: '', pin: '', rol: 'Cajero' });
            toast.success('Usuario agregado correctamente');
        } catch (error) {
            toast.error('Error al agregar usuario');
        }
    };

    const handleDeleteUser = async (id: number, nombre: string) => {
        if (nombre === 'Admin') {
            toast.error('No se puede eliminar el administrador por defecto');
            return;
        }
        if (confirm(`¿Estás seguro de eliminar a ${nombre}?`)) {
            try {
                await deleteUsuario(id);
                toast.success('Usuario eliminado');
            } catch (error) {
                toast.error('Error al eliminar usuario');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Configuración del Sistema</h1>
                <p className="text-slate-500">Ajusta los parámetros básicos de tu local.</p>
            </div>

            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                    onClick={() => setCurrentTab('mesas')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentTab === 'mesas' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    🪑 Mesas
                </button>
                <button
                    onClick={() => setCurrentTab('personal')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentTab === 'personal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    👥 Personal
                </button>
            </div>

            {currentTab === 'mesas' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-2xl">
                    <h2 className="text-lg font-bold text-slate-800 mb-2">Gestión de Mesas</h2>
                    <p className="text-slate-500 text-sm mb-6">Indica cuántas mesas activas tiene tu local. El sistema las numerará automáticamente de forma secuencial.</p>

                    <div className="flex items-end gap-4">
                        <div className="w-32">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad de Mesas</label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                value={tempMesas}
                                onChange={(e) => setTempMesas(parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <button
                            onClick={handleUpdateMesas}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                        >
                            Guardar Cambios
                        </button>
                    </div>

                    <div className="mt-8 grid grid-cols-5 sm:grid-cols-8 gap-3">
                        {loadingMesas ? (
                            <div className="col-span-full py-4 text-center text-slate-400">Cargando...</div>
                        ) : (
                            mesas.map(mesa => (
                                <div key={mesa.id} className="aspect-square rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold">
                                    {mesa.numero_mesa}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800">Cajeros y Administradores</h2>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg shadow-blue-200"
                        >
                            <span>➕</span> Agregar Personal
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">PIN</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {usuarios.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{user.nombre}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.rol === 'Administrador' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                                                }`}>
                                                {user.rol}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-400">****</td>
                                        <td className="px-6 py-4 text-right">
                                            {user.nombre !== 'Admin' && (
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.nombre)}
                                                    className="text-slate-400 hover:text-red-600 transition-colors"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Modal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        title="Nuevo Miembro del Personal"
                    >
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={userForm.nombre}
                                    onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">PIN (4 dígitos)</label>
                                    <input
                                        type="password"
                                        maxLength={4}
                                        required
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                                        value={userForm.pin}
                                        onChange={(e) => setUserForm({ ...userForm, pin: e.target.value.replace(/\D/g, '') })}
                                        placeholder="1234"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                                        value={userForm.rol}
                                        onChange={(e) => setUserForm({ ...userForm, rol: e.target.value as any })}
                                    >
                                        <option value="Cajero">Cajero</option>
                                        <option value="Administrador">Administrador</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-200"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </Modal>
                </div>
            )}
        </div>
    );
};

export default Configuracion;
