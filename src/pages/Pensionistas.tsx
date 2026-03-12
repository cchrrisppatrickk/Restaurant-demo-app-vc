import React, { useState } from 'react';
import { usePensionistas } from '../hooks/usePensionistas';
import Modal from '../components/Modal';
import { toast } from 'sonner';

const Pensionistas: React.FC = () => {
    const { pensionistas, loading, addPensionista, recargarSaldo, getHistorial } = usePensionistas();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedPensionista, setSelectedPensionista] = useState<{ id: number, nombre: string, saldo: number } | null>(null);
    const [historialData, setHistorialData] = useState<any[]>([]);

    // Form states
    const [nombre, setNombre] = useState('');
    const [dni, setDni] = useState('');
    const [celular, setCelular] = useState('');
    const [montoRecarga, setMontoRecarga] = useState<number>(0);

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addPensionista({ nombre, dni, celular });
            setIsAddModalOpen(false);
            setNombre(''); setDni(''); setCelular('');
            toast.success('Pensionista registrado con éxito');
        } catch (error) {
            toast.error('Error al registrar pensionista (DNI duplicado?)');
        }
    };

    const handleRechargeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPensionista || montoRecarga <= 0) return;
        try {
            await recargarSaldo(selectedPensionista.id, montoRecarga);
            setIsRechargeModalOpen(false);
            setSelectedPensionista(null);
            setMontoRecarga(0);
            toast.success('Abono registrado con éxito');
        } catch (error) {
            toast.error('Error al procesar el abono');
        }
    };

    const openHistory = async (p: { id: number, nombre: string, saldo: number }) => {
        try {
            setSelectedPensionista(p);
            const data = await getHistorial(p.id);
            setHistorialData(data);
            setIsHistoryModalOpen(true);
        } catch (error) {
            toast.error('Error al cargar historial');
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Clientes Pensionistas</h2>
                    <p className="text-slate-500">Gestión de saldo y consumos frecuentes</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                    <span>👤+</span> Nuevo Pensionista
                </button>
            </header>

            {/* Pensionistas Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">DNI / Celular</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Estado de Cuenta</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Cargando...</td></tr>
                            ) : pensionistas.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No hay pensionistas registrados.</td></tr>
                            ) : (
                                pensionistas.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800">{p.nombre}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            <div>ID: {p.dni || '-'}</div>
                                            <div className="text-xs">Cel: {p.celular || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {p.saldo_actual < 0 ? (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-tight">Deuda Acumulada</span>
                                                    <span className="text-lg font-black font-mono text-rose-600">
                                                        S/ {Math.abs(p.saldo_actual).toFixed(2)}
                                                    </span>
                                                </div>
                                            ) : p.saldo_actual > 0 ? (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">Saldo a Favor</span>
                                                    <span className="text-lg font-black font-mono text-emerald-600">
                                                        S/ {p.saldo_actual.toFixed(2)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">Al día</span>
                                                    <span className="text-lg font-black font-mono text-slate-400">
                                                        S/ 0.00
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => openHistory({ id: p.id, nombre: p.nombre, saldo: p.saldo_actual })}
                                                className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all title='Ver Historial'"
                                            >
                                                📋
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedPensionista({ id: p.id, nombre: p.nombre, saldo: p.saldo_actual });
                                                    setIsRechargeModalOpen(true);
                                                }}
                                                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all"
                                            >
                                                💳 Abonar / Liquidar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Add */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nuevo Pensionista">
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                        <input
                            type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">DNI / Documento</label>
                            <input
                                type="text" value={dni} onChange={(e) => setDni(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Celular</label>
                            <input
                                type="text" value={celular} onChange={(e) => setCelular(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold">Guardar</button>
                    </div>
                </form>
            </Modal>

            {/* Modal Recharge */}
            <Modal isOpen={isRechargeModalOpen} onClose={() => setIsRechargeModalOpen(false)} title={`Abono / Liquidación: ${selectedPensionista?.nombre}`}>
                <form onSubmit={handleRechargeSubmit} className="space-y-4">
                    {selectedPensionista && selectedPensionista.saldo < 0 && (
                        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 text-center">
                            <p className="text-rose-600 text-[10px] font-bold uppercase tracking-widest">Deuda Actual</p>
                            <p className="text-2xl font-black text-rose-700 font-mono">S/ {Math.abs(selectedPensionista.saldo).toFixed(2)}</p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Monto a Abonar (S/)</label>
                        <input
                            type="number" step="0.10" required autoFocus value={montoRecarga}
                            onChange={(e) => setMontoRecarga(parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-2xl font-mono text-center"
                        />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsRechargeModalOpen(false)} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200">Confirmar Abono</button>
                    </div>
                </form>
            </Modal>

            {/* Modal History */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Historial de Movimientos</h3>
                                <p className="text-sm text-slate-500 font-medium">{selectedPensionista?.nombre}</p>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white">
                                        <th className="px-6 py-3">Fecha y Hora</th>
                                        <th className="px-6 py-3">Descripción</th>
                                        <th className="px-6 py-3 text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {historialData.map((h) => (
                                        <tr key={h.id} className="text-sm hover:bg-slate-50/50">
                                            <td className="px-6 py-4 text-slate-500 font-medium">
                                                {new Date(h.fecha).toLocaleString('es-PE', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">
                                                    {h.monto < 0 ? '🍜 Consumo' : '💰 Abono'}
                                                </div>
                                                <div className="text-xs text-slate-500 italic">
                                                    {h.detalle_consumo || h.descripcion}
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-black font-mono text-lg ${h.monto < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {h.monto < 0 ? '-' : '+'} S/ {Math.abs(h.monto).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {historialData.length === 0 && (
                                        <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">No hay movimientos registrados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Resumen Actual</span>
                                <span className={`text-xl font-black font-mono ${selectedPensionista && selectedPensionista.saldo < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    S/ {selectedPensionista?.saldo.toFixed(2)}
                                </span>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pensionistas;
