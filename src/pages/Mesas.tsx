import React, { useState } from 'react';
import { toast } from 'sonner';
import { useMesas } from '../hooks/useMesas';
import { useMenuDiario } from '../hooks/useMenuDiario';
import { usePedidos } from '../hooks/usePedidos';
import { useEstadisticas } from '../hooks/useEstadisticas';
import { Mesa } from '../types/database';

interface OrderItem {
    idPlato: number;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
}

const Mesas: React.FC = () => {
    const { mesas, loading: loadingMesas, refreshMesas } = useMesas();
    const { menuHoy } = useMenuDiario();
    const { crearPedido, getPedidoPorMesa, loading: creatingOrder } = usePedidos();
    const { stats } = useEstadisticas();

    const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
    const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
    const [viewingOccupied, setViewingOccupied] = useState(false);
    const [occupiedOrderItems, setOccupiedOrderItems] = useState<any[]>([]);

    const handleMesaClick = async (mesa: Mesa) => {
        if (mesa.estado !== 'Libre') {
            try {
                const orderData = await getPedidoPorMesa(mesa.id);
                if (orderData) {
                    setOccupiedOrderItems(orderData.items);
                    setSelectedMesa(mesa);
                    setViewingOccupied(true);
                } else {
                    toast.error('No se encontró pedido activo para esta mesa');
                }
            } catch (error) {
                toast.error('Error al cargar detalle de mesa');
            }
            return;
        }

        if (stats.isCerrado) {
            toast.error('Caja cerrada por hoy. No se pueden abrir nuevas mesas.');
            return;
        }

        setSelectedMesa(mesa);
        setViewingOccupied(false);
        setCurrentOrder([]);
    };

    const addToOrder = (item: { id_plato: number, plato_nombre: string, precio_dia: number }) => {
        setCurrentOrder(prev => {
            const existing = prev.find(i => i.idPlato === item.id_plato);
            if (existing) {
                return prev.map(i => i.idPlato === item.id_plato
                    ? { ...i, cantidad: i.cantidad + 1 }
                    : i
                );
            }
            return [...prev, {
                idPlato: item.id_plato,
                nombre: item.plato_nombre,
                cantidad: 1,
                precioUnitario: item.precio_dia
            }];
        });
    };

    const removeFromOrder = (idPlato: number) => {
        setCurrentOrder(prev => {
            const existing = prev.find(i => i.idPlato === idPlato);
            if (existing && existing.cantidad > 1) {
                return prev.map(i => i.idPlato === idPlato
                    ? { ...i, cantidad: i.cantidad - 1 }
                    : i
                );
            }
            return prev.filter(i => i.idPlato !== idPlato);
        });
    };

    const total = viewingOccupied
        ? occupiedOrderItems.reduce((acc, current) => acc + (current.cantidad * current.precio_unitario), 0)
        : currentOrder.reduce((acc, current) => acc + (current.cantidad * current.precioUnitario), 0);

    const handleConfirmOrder = async () => {
        if (!selectedMesa || currentOrder.length === 0) return;

        try {
            await crearPedido(
                selectedMesa.id,
                total,
                currentOrder.map(i => ({
                    idPlato: i.idPlato,
                    cantidad: i.cantidad,
                    precioUnitario: i.precioUnitario
                }))
            );
            setSelectedMesa(null);
            refreshMesas();
            toast.success('Pedido confirmado con éxito');
        } catch (error) {
            toast.error('Error al procesar el pedido');
        }
    };

    return (
        <div className="relative h-full">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800">Mapa de Mesas</h2>
                <p className="text-slate-500">Gestión de atención y pedidos en tiempo real</p>
            </header>

            {loadingMesas ? (
                <p className="text-center text-slate-500">Cargando mesas...</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {mesas.map((mesa) => (
                        <button
                            key={mesa.id}
                            onClick={() => handleMesaClick(mesa)}
                            className={`aspect-square rounded-3xl border-2 transition-all p-4 flex flex-col items-center justify-center gap-2 shadow-sm ${mesa.estado === 'Libre'
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:shadow-lg hover:shadow-emerald-100'
                                : 'bg-rose-50 border-rose-100 text-rose-700 hover:shadow-lg hover:shadow-rose-100'
                                }`}
                        >
                            <span className="text-3xl">🪑</span>
                            <span className="text-xl font-bold">Mesa {mesa.numero_mesa}</span>
                            <span className="text-[10px] uppercase tracking-wider font-bold opacity-60">
                                {mesa.estado}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Banner de Bloqueo */}
            {stats.isCerrado && (
                <div className="mt-8 p-6 bg-rose-50 border-2 border-rose-200 rounded-3xl flex items-center gap-6 animate-pulse">
                    <span className="text-4xl">🔒</span>
                    <div>
                        <h4 className="text-xl font-bold text-rose-800">Caja cerrada por hoy</h4>
                        <p className="text-rose-600 font-medium text-sm">El sistema se habilitará automáticamente mañana. No se permiten nuevos pedidos.</p>
                    </div>
                </div>
            )}

            {/* Sidebar de Pedido (Slide-in) */}
            <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-100 overflow-hidden flex flex-col ${selectedMesa ? 'translate-x-0' : 'translate-x-full'
                }`}>
                {selectedMesa && (
                    <>
                        <div className={`p-6 text-white flex justify-between items-center ${viewingOccupied ? 'bg-rose-600' : 'bg-slate-900'}`}>
                            <div>
                                <h3 className="text-xl font-bold">Mesa {selectedMesa.numero_mesa}</h3>
                                <p className="text-xs opacity-70">
                                    {viewingOccupied ? 'Detalle de Consumo Actual' : 'Tomando Nuevo Pedido'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedMesa(null)}
                                className="p-2 hover:bg-black/20 rounded-lg transition-colors"
                            >
                                ✖️
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {viewingOccupied ? (
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Comanda Activa</h4>
                                    <div className="space-y-4">
                                        {occupiedOrderItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start animate-in fade-in slide-in-from-right-2 duration-300">
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-800">{item.plato_nombre}</p>
                                                    <p className="text-xs text-slate-500">Cantidad: {item.cantidad} x S/ {item.precio_unitario.toFixed(2)}</p>
                                                </div>
                                                <span className="font-mono font-bold text-slate-900">
                                                    S/ {(item.cantidad * item.precio_unitario).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Menu de hoy selection */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Carta de Hoy</h4>
                                        <div className="space-y-2">
                                            {menuHoy.length === 0 ? (
                                                <p className="text-sm text-slate-500 italic">No hay platos en el menú de hoy. Configúralos en el Dashboard.</p>
                                            ) : (
                                                menuHoy.map(item => (
                                                    <button
                                                        key={item.id}
                                                        disabled={item.stock_actual! <= 0}
                                                        onClick={() => addToOrder(item)}
                                                        className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all flex justify-between items-center group disabled:opacity-50"
                                                    >
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{item.plato_nombre}</p>
                                                            <p className="text-xs text-slate-500">S/ {item.precio_dia.toFixed(2)}</p>
                                                        </div>
                                                        <span className="text-slate-300 group-hover:text-blue-500 transition-colors">➕</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Order summary */}
                                    {currentOrder.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Pedido Actual</h4>
                                            <div className="space-y-3">
                                                {currentOrder.map(item => (
                                                    <div key={item.idPlato} className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => removeFromOrder(item.idPlato)}
                                                                className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs hover:bg-rose-100 hover:text-rose-600"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="font-bold text-sm w-4">{item.cantidad}</span>
                                                            <button
                                                                onClick={() => addToOrder({ id_plato: item.idPlato, plato_nombre: item.nombre, precio_dia: item.precioUnitario })}
                                                                className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs hover:bg-emerald-100 hover:text-emerald-600"
                                                            >
                                                                +
                                                            </button>
                                                            <span className="text-sm text-slate-700">{item.nombre}</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-900">
                                                            S/ {(item.cantidad * item.precioUnitario).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-slate-500 font-medium">Total:</span>
                                <span className="text-2xl font-black text-slate-900 font-mono">
                                    S/ {total.toFixed(2)}
                                </span>
                            </div>
                            {!viewingOccupied && (
                                <button
                                    disabled={currentOrder.length === 0 || creatingOrder || stats.isCerrado}
                                    onClick={handleConfirmOrder}
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:bg-slate-300 disabled:shadow-none"
                                >
                                    {stats.isCerrado ? 'Caja Cerrada' : creatingOrder ? 'Procesando...' : 'Confirmar Pedido'}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Backdrop for Sidebar */}
            {selectedMesa && (
                <div
                    onClick={() => setSelectedMesa(null)}
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
                />
            )}
        </div>
    );
};

export default Mesas;
