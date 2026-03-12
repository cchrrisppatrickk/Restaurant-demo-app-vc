import React, { useState } from 'react';
import { useEstadisticas } from '../hooks/useEstadisticas';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { stats, historialCierres, cerrarCaja } = useEstadisticas();
    const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);
    const [montoApertura, setMontoApertura] = useState<number>(0);
    const [notas, setNotas] = useState('');

    const handleCerrarCaja = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            await cerrarCaja(montoApertura, user.id, notas);
            setIsCierreModalOpen(false);
            toast.success('Cierre de caja realizado con éxito');
        } catch (error: any) {
            toast.error(`Error al realizar el cierre: ${error.message}`);
        }
    };

    // Calcular el porcentaje para las barras del gráfico
    const maxMonto = Math.max(...historialCierres.map(h => h.monto_cierre), 100);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Panel de Control</h2>
                    <p className="text-slate-500 font-medium">Resumen administrativo y financiero</p>
                </div>
                {!stats.isCerrado ? (
                    <button
                        onClick={() => setIsCierreModalOpen(true)}
                        className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2 group"
                    >
                        <span className="group-hover:rotate-12 transition-transform">🔒</span> Cerrar Caja del Día
                    </button>
                ) : (
                    <div className="px-6 py-3 bg-emerald-100 text-emerald-700 rounded-2xl font-bold flex items-center gap-2 border border-emerald-200">
                        <span>✅</span> Caja Cerrada
                    </div>
                )}
            </header>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Ventas Hoy */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl group-hover:scale-110 transition-transform">💰</div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ventas del Día</p>
                    <h3 className="text-4xl font-black text-slate-900 font-mono">
                        S/ {stats.ventasHoy.toFixed(2)}
                    </h3>
                    <div className="mt-4 flex gap-3">
                        <span className="text-[10px] bg-slate-50 px-2 py-1 rounded-lg text-slate-500 font-bold">
                            Efectivo: S/ {stats.efectivoHoy.toFixed(2)}
                        </span>
                        <span className="text-[10px] bg-blue-50 px-2 py-1 rounded-lg text-blue-600 font-bold">
                            Yape/Plin: S/ {stats.digitalHoy.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Ganancia Semanal */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-20 text-6xl group-hover:scale-110 transition-transform text-emerald-400">📈</div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ganancia Semanal</p>
                    <h3 className="text-4xl font-black text-white font-mono">
                        S/ {stats.gananciaSemanal.toFixed(2)}
                    </h3>
                    <p className="text-xs text-slate-400 mt-4 leading-relaxed font-medium">
                        Suma acumulada de los cierres de<br />los últimos 7 días.
                    </p>
                </div>

                {/* Deuda Pendiente */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl group-hover:scale-110 transition-transform text-rose-500">🚫</div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Deuda por Cobrar</p>
                    <h3 className="text-4xl font-black text-rose-600 font-mono">
                        S/ {stats.deudaTotal.toFixed(2)}
                    </h3>
                    <p className="text-xs text-slate-400 mt-4 leading-relaxed font-medium">
                        Total acumulado por pensionistas<br />con saldo negativo.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gráfico Simple */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800 mb-8 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Ingresos Últimos 7 Días
                    </h4>
                    <div className="h-64 flex items-end justify-between gap-4 px-2">
                        {historialCierres.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 italic text-sm">
                                No hay cierres registrados aún
                            </div>
                        ) : (
                            historialCierres.map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3">
                                    <div className="w-full relative group">
                                        <div
                                            className="w-full bg-blue-500 rounded-t-xl transition-all duration-1000 ease-out group-hover:bg-blue-600"
                                            style={{ height: `${(h.monto_cierre / maxMonto) * 180}px` }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded font-bold whitespace-nowrap">
                                                S/ {h.monto_cierre.toFixed(0)}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-bold rotate-45 origin-left">{h.fecha.split('-').slice(1).reverse().join('/')}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Resumen de Caja */}
                <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-900 mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span> Detalle del Flujo de Caja (Hoy)
                    </h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-white/50 rounded-2xl border border-white">
                            <span className="text-slate-600 text-sm font-medium">Ventas en Efectivo</span>
                            <span className="font-bold font-mono">S/ {stats.efectivoHoy.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/50 rounded-2xl border border-white">
                            <span className="text-slate-600 text-sm font-medium">Abonos de Pensionistas</span>
                            <span className="font-bold font-mono text-emerald-600">+ S/ {stats.abonosHoy.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/50 rounded-2xl border border-white">
                            <span className="text-slate-600 text-sm font-medium">Ventas Digitales (Yape/Plin)</span>
                            <span className="font-bold font-mono">S/ {stats.digitalHoy.toFixed(2)}</span>
                        </div>
                        <div className="pt-4 border-t border-blue-200 flex justify-between items-center">
                            <span className="text-blue-900 font-black">Total en Caja Estimado</span>
                            <span className="text-2xl font-black text-blue-900 font-mono">
                                S/ {(stats.ventasHoy + stats.abonosHoy).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Cierre */}
            <Modal
                isOpen={isCierreModalOpen}
                onClose={() => setIsCierreModalOpen(false)}
                title="Cierre de Caja Diario"
            >
                <form onSubmit={handleCerrarCaja} className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Resumen a Confirmar</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Efectivo</p>
                                <p className="text-xl font-black text-slate-800 font-mono">S/ {(stats.efectivoHoy + stats.abonosHoy).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Digital</p>
                                <p className="text-xl font-black text-slate-800 font-mono">S/ {stats.digitalHoy.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-200">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Monto Total de Cierre</p>
                            <p className="text-3xl font-black text-blue-600 font-mono">S/ {(stats.ventasHoy + stats.abonosHoy).toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Monto de Apertura (Sencillo)</label>
                            <input
                                type="number"
                                step="0.10"
                                required
                                value={montoApertura}
                                onChange={(e) => setMontoApertura(parseFloat(e.target.value) || 0)}
                                className="w-full px-5 py-4 rounded-[1.25rem] border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xl font-mono"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Notas u Observaciones</label>
                            <textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                className="w-full px-5 py-4 rounded-[1.25rem] border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm h-24 resize-none"
                                placeholder="Opcional..."
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={() => setIsCierreModalOpen(false)}
                            className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-4 rounded-2xl bg-slate-900 text-white font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
                        >
                            Confirmar y Cerrar
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Dashboard;
