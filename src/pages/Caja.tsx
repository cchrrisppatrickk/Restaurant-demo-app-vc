import React, { useState, useEffect } from 'react';
import { useMesas } from '../hooks/useMesas';
import { usePedidos } from '../hooks/usePedidos';
import { usePensionistas } from '../hooks/usePensionistas';
import { useEstadisticas } from '../hooks/useEstadisticas';
import { Mesa } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface OrderDetail {
    id: number;
    total: number;
    items: Array<{
        id: number;
        plato_nombre: string;
        cantidad: number;
        precio_unitario: number;
        subtotal: number;
    }>;
}

const Caja: React.FC = () => {
    const { user } = useAuth();
    const { mesas, loading: loadingMesas, refreshMesas } = useMesas();
    const { getPedidoPorMesa, procesarPago, procesarPagoPensionista, loading: processingPayment } = usePedidos();
    const { pensionistas } = usePensionistas();
    const { stats } = useEstadisticas();

    const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
    const [orderDetails, setOrderDetails] = useState<OrderDetail | null>(null);
    const [loadingOrder, setLoadingOrder] = useState(false);

    // Payment State
    const [metodoPago, setMetodoPago] = useState<string>('Efectivo');
    const [montoRecibido, setMontoRecibido] = useState<number | ''>('');
    const [vuelto, setVuelto] = useState<number>(0);
    const [selectedPensionistaId, setSelectedPensionistaId] = useState<number | ''>('');

    const occupiedTables = mesas.filter(m => m.estado !== 'Libre');

    useEffect(() => {
        if (selectedMesa) {
            loadOrder(selectedMesa.id);
        } else {
            setOrderDetails(null);
        }
    }, [selectedMesa]);

    useEffect(() => {
        if (metodoPago === 'Efectivo' && orderDetails && typeof montoRecibido === 'number') {
            const calc = montoRecibido - orderDetails.total;
            setVuelto(calc > 0 ? calc : 0);
        } else {
            setVuelto(0);
        }
    }, [montoRecibido, metodoPago, orderDetails]);

    const loadOrder = async (idMesa: number) => {
        try {
            setLoadingOrder(true);
            const data = await getPedidoPorMesa(idMesa);
            setOrderDetails(data);
        } catch (error) {
            toast.error('Error al cargar detalle del pedido');
        } finally {
            setLoadingOrder(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!selectedMesa || !orderDetails) return;

        if (metodoPago === 'Efectivo') {
            if (typeof montoRecibido !== 'number' || montoRecibido < orderDetails.total) {
                toast.error('Monto recibido insuficiente');
                return;
            }
        }

        if (metodoPago === 'Pensionista') {
            if (!selectedPensionistaId) {
                toast.error('Debe seleccionar un pensionista');
                return;
            }
        }

        try {
            if (metodoPago === 'Pensionista') {
                await procesarPagoPensionista(
                    orderDetails.id,
                    selectedMesa.id,
                    Number(selectedPensionistaId),
                    orderDetails.total
                );
            } else {
                await procesarPago(
                    orderDetails.id,
                    selectedMesa.id,
                    metodoPago,
                    Number(montoRecibido) || orderDetails.total,
                    vuelto
                );
            }

            toast.success('Pago procesado correctamente');
            setSelectedMesa(null);
            setMontoRecibido('');
            setSelectedPensionistaId('');
            refreshMesas();
        } catch (error) {
            toast.error('Error en el proceso de cobro');
        }
    };

    const currentPensionista = pensionistas.find(p => p.id === Number(selectedPensionistaId));

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full">
            {/* Tables List */}
            <div className="flex-1 space-y-6">
                <header className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Caja y Cobros</h2>
                        <p className="text-slate-500">Gestión de cuentas por pagar</p>
                    </div>
                    <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                            {user?.nombre.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter leading-none">Cajero Atendiendo</p>
                            <p className="text-sm font-bold text-blue-900">{user?.nombre}</p>
                        </div>
                    </div>
                    {stats.isCerrado && (
                        <div className="bg-rose-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg animate-pulse">
                            <span>🔒</span> CAJA CERRADA
                        </div>
                    )}
                </header>

                {loadingMesas ? (
                    <p>Cargando mesas...</p>
                ) : occupiedTables.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                        <span className="text-4xl block mb-4">😌</span>
                        <p className="text-slate-500 font-medium">No hay mesas por cobrar en este momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {occupiedTables.map((mesa) => (
                            <button
                                key={mesa.id}
                                disabled={stats.isCerrado}
                                onClick={() => setSelectedMesa(mesa)}
                                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${selectedMesa?.id === mesa.id
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-white border-slate-100 text-slate-800 hover:border-blue-200'
                                    } ${stats.isCerrado ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className="text-2xl">💰</span>
                                <span className="font-bold">Mesa {mesa.numero_mesa}</span>
                                <span className="text-xs font-medium opacity-80">{mesa.estado}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected Table Billing Detail */}
            <div className="w-full lg:w-96 bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col overflow-hidden">
                {selectedMesa ? (
                    <>
                        <div className="p-6 bg-slate-900 text-white">
                            <h3 className="text-xl font-bold">Detalle Mesa {selectedMesa.numero_mesa}</h3>
                            <p className="text-xs text-slate-400">Procesando cobro</p>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto">
                            {loadingOrder ? (
                                <p className="text-center py-8">Cargando detalles...</p>
                            ) : orderDetails ? (
                                <div className="space-y-6">
                                    {/* Items List */}
                                    <div className="space-y-3">
                                        {orderDetails.items.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span className="text-slate-600">
                                                    {item.cantidad}x <span className="text-slate-900 font-medium">{item.plato_nombre}</span>
                                                </span>
                                                <span className="font-mono font-bold text-slate-800">
                                                    S/ {item.subtotal.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <hr className="border-slate-100" />

                                    {/* Total View */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-bold uppercase text-xs">Total del Pedido</span>
                                        <span className="text-3xl font-black text-slate-900 font-mono">
                                            S/ {orderDetails.total.toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Payment Form */}
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Método de Pago</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['Efectivo', 'Yape', 'Plin', 'Pensionista'].map((m) => (
                                                    <button
                                                        key={m}
                                                        onClick={() => setMetodoPago(m)}
                                                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${metodoPago === m
                                                            ? 'bg-blue-50 border-blue-600 text-blue-600'
                                                            : 'bg-white border-slate-200 text-slate-500'
                                                            }`}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {metodoPago === 'Efectivo' && (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Paga con (S/)</label>
                                                    <input
                                                        type="number"
                                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xl"
                                                        value={montoRecibido}
                                                        onChange={(e) => setMontoRecibido(parseFloat(e.target.value) || '')}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex justify-between items-center">
                                                    <span className="text-emerald-700 font-bold text-sm">Vuelto:</span>
                                                    <span className="text-xl font-black text-emerald-800 font-mono">S/ {vuelto.toFixed(2)}</span>
                                                </div>
                                            </>
                                        )}

                                        {metodoPago === 'Pensionista' && (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Seleccionar Pensionista</label>
                                                    <select
                                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        value={selectedPensionistaId}
                                                        onChange={(e) => setSelectedPensionistaId(e.target.value ? Number(e.target.value) : '')}
                                                    >
                                                        <option value="">-- Elige un pensionista --</option>
                                                        {pensionistas.map(p => (
                                                            <option key={p.id} value={p.id}>{p.nombre} (ID: {p.dni || 'S/N'})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {currentPensionista && (
                                                    <div className={`p-4 rounded-2xl border flex justify-between items-center ${currentPensionista.saldo_actual >= orderDetails.total
                                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                                        : 'bg-rose-50 border-rose-100 text-rose-700'
                                                        }`}>
                                                        <div className="text-xs">
                                                            <p className="font-bold">Saldo Actual:</p>
                                                            <p className="font-mono text-lg font-black">S/ {currentPensionista.saldo_actual.toFixed(2)}</p>
                                                        </div>
                                                        <div className="text-xs text-right">
                                                            <p className="font-bold">Quedará:</p>
                                                            <p className="font-mono text-lg font-black">S/ {(currentPensionista.saldo_actual - orderDetails.total).toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center py-8 text-slate-400 italic">No se encontró el pedido pendiente.</p>
                            )}
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <button
                                disabled={!orderDetails || processingPayment || stats.isCerrado}
                                onClick={handleConfirmPayment}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:bg-slate-300 disabled:shadow-none"
                            >
                                {stats.isCerrado ? 'Transacciones Bloqueadas' : processingPayment ? 'Confirmando...' : 'Confirmar Pago'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-300">
                        <span className="text-5xl mb-4">👈</span>
                        <p className="font-medium">Selecciona una mesa ocupada a la izquierda para ver su cuenta</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Caja;
