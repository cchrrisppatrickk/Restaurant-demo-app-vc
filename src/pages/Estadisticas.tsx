import React, { useState, useEffect, useCallback } from 'react';
import { useEstadisticas } from '../hooks/useEstadisticas';

const Estadisticas: React.FC = () => {
    const { getRankingPlatos, getHistorialCierresDetallado, getResumenPeriodo } = useEstadisticas();

    // Filtros de fecha
    const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

    // Data states
    const [resumen, setResumen] = useState({ ventas: 0, efectivo: 0, digital: 0, abonos: 0 });
    const [rankingData, setRankingData] = useState<any[]>([]);
    const [historialDetallado, setHistorialDetallado] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Paginación
    const [pageRanking, setPageRanking] = useState(1);
    const [pageHistorial, setPageHistorial] = useState(1);
    const itemsPerPage = 5;

    const loadData = useCallback(async () => {
        setLoading(true);
        const [ranking, history, res] = await Promise.all([
            getRankingPlatos(fechaInicio, fechaFin),
            getHistorialCierresDetallado(fechaInicio, fechaFin),
            getResumenPeriodo(fechaInicio, fechaFin)
        ]);

        setRankingData(ranking);
        setHistorialDetallado(history);
        setResumen(res);
        setLoading(false);
        setPageRanking(1);
        setPageHistorial(1);
    }, [fechaInicio, fechaFin, getRankingPlatos, getHistorialCierresDetallado, getResumenPeriodo]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Preajustes de fecha
    const setPreajuste = (tipo: 'hoy' | 'mes' | 'siempre') => {
        const fin = new Date().toISOString().split('T')[0];
        let inicio = fin;

        if (tipo === 'mes') {
            const d = new Date();
            inicio = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
        } else if (tipo === 'siempre') {
            inicio = '2020-01-01';
        }

        setFechaInicio(inicio);
        setFechaFin(fin);
    };

    // Lógica Paginación Ranking
    const totalPagesRanking = Math.ceil(rankingData.length / itemsPerPage);
    const currentRanking = rankingData.slice((pageRanking - 1) * itemsPerPage, pageRanking * itemsPerPage);

    // Lógica Paginación Historial
    const totalPagesHistorial = Math.ceil(historialDetallado.length / itemsPerPage);
    const currentHistorial = historialDetallado.slice((pageHistorial - 1) * itemsPerPage, pageHistorial * itemsPerPage);

    return (
        <div className="space-y-10 pb-10 max-w-full">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800">Estadísticas y Reportes</h2>
                    <p className="text-slate-500 font-medium">
                        Periodo: <span className="text-blue-600 font-bold">{fechaInicio === fechaFin ? fechaInicio : `${fechaInicio} al ${fechaFin}`}</span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
                        {(['hoy', 'mes', 'siempre'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setPreajuste(f)}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all hover:bg-white hover:text-blue-600"
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <span className="text-slate-400 font-bold">a</span>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            </header>

            {/* Resumen Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:scale-110 transition-transform">💰</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventas Totales</p>
                    <h3 className="text-2xl font-black text-slate-800 font-mono">S/ {resumen.ventas.toFixed(2)}</h3>
                </div>
                <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:scale-110 transition-transform">💵</div>
                    <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Efectivo</p>
                    <h3 className="text-2xl font-black text-emerald-700 font-mono">S/ {resumen.efectivo.toFixed(2)}</h3>
                </div>
                <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:scale-110 transition-transform">📱</div>
                    <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mb-1">Yape/Plin</p>
                    <h3 className="text-2xl font-black text-blue-700 font-mono">S/ {resumen.digital.toFixed(2)}</h3>
                </div>
                <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl shadow-slate-200 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-6xl opacity-20 group-hover:scale-110 transition-transform">➕</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Abonos Pens.</p>
                    <h3 className="text-2xl font-black text-white font-mono">S/ {resumen.abonos.toFixed(2)}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Ranking de Platos */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Ranking de Platos Vendidos</h3>
                            <p className="text-xs text-slate-400 italic">Basado en el periodo seleccionado</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <table className="min-w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest font-black text-slate-400">
                                    <th className="px-8 py-4">Plato</th>
                                    <th className="px-8 py-4 text-center">Cant. Vendida</th>
                                    <th className="px-8 py-4 text-right">Total Generado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={3} className="px-8 py-10 text-center text-slate-400 animate-pulse">Cargando datos...</td></tr>
                                ) : currentRanking.length === 0 ? (
                                    <tr><td colSpan={3} className="px-8 py-10 text-center text-slate-400 italic">No hay datos para este periodo</td></tr>
                                ) : (
                                    currentRanking.map((item, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-4 font-bold text-slate-700">{item.nombre}</td>
                                            <td className="px-8 py-4 text-center">
                                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-black">
                                                    {item.total_cantidad} uds.
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-right font-mono font-bold text-slate-900">
                                                S/ {item.total_venta.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Ranking */}
                    {totalPagesRanking > 1 && (
                        <div className="p-6 border-t border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <span className="text-xs text-slate-400 font-medium">Página {pageRanking} de {totalPagesRanking}</span>
                            <div className="flex gap-2">
                                <button
                                    disabled={pageRanking === 1}
                                    onClick={() => setPageRanking(p => p - 1)}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all"
                                >
                                    Anterior
                                </button>
                                <button
                                    disabled={pageRanking >= totalPagesRanking}
                                    onClick={() => setPageRanking(p => p + 1)}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Historial de Cierres */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                    <div className="p-8 border-b border-slate-50">
                        <h3 className="text-lg font-bold text-slate-800">Historial de Cierres de Caja</h3>
                        <p className="text-xs text-slate-400">Libro mayor de cierres diarios y auditoría</p>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <table className="min-w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest font-black text-slate-400">
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Admin</th>
                                    <th className="px-6 py-4 text-right">Efectivo</th>
                                    <th className="px-6 py-4 text-right">Digital</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 animate-pulse">Cargando historial...</td></tr>
                                ) : currentHistorial.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">No hay cierres en este periodo</td></tr>
                                ) : (
                                    currentHistorial.map((c, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-600">{c.fecha}</td>
                                            <td className="px-6 py-4 font-medium text-slate-500">{c.usuario_nombre}</td>
                                            <td className="px-6 py-4 text-right font-mono font-medium text-slate-500">S/ {c.total_efectivo?.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-right font-mono font-medium text-slate-500">S/ {c.total_digital?.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-blue-600">S/ {c.monto_cierre.toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Historial */}
                    {totalPagesHistorial > 1 && (
                        <div className="p-6 border-t border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <span className="text-xs text-slate-400 font-medium">Página {pageHistorial} de {totalPagesHistorial}</span>
                            <div className="flex gap-2">
                                <button
                                    disabled={pageHistorial === 1}
                                    onClick={() => setPageHistorial(p => p - 1)}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all"
                                >
                                    Anterior
                                </button>
                                <button
                                    disabled={pageHistorial >= totalPagesHistorial}
                                    onClick={() => setPageHistorial(p => p + 1)}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Estadisticas;
