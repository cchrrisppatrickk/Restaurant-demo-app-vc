import { useState } from 'react';
import { dbService } from '../services/db';

export function usePedidos() {
    const [loading, setLoading] = useState(false);

    const crearPedido = async (idMesa: number, total: number, items: { idPlato: number, cantidad: number, precioUnitario: number }[]) => {
        try {
            setLoading(true);
            // 1. Crear el pedido
            const result = await dbService.execute(
                'INSERT INTO pedidos (id_mesa, total, estado) VALUES (?, ?, ?)',
                [idMesa, total, 'Pendiente']
            );

            const pedidoId = result.lastInsertId;

            // 2. Crear los detalles del pedido
            for (const item of items) {
                const subtotal = item.cantidad * item.precioUnitario;
                await dbService.execute(
                    'INSERT INTO detalles_pedido (id_pedido, id_plato, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                    [pedidoId, item.idPlato, item.cantidad, item.precioUnitario, subtotal]
                );

                // 3. Actualizar stock si es necesario (del menú diario)
                const fechaHoy = new Date().toISOString().split('T')[0];
                await dbService.execute(
                    'UPDATE menu_diario SET stock_actual = stock_actual - ? WHERE id_plato = ? AND fecha = ?',
                    [item.cantidad, item.idPlato, fechaHoy]
                );
            }

            // 4. Actualizar estado de la mesa
            await dbService.execute(
                "UPDATE mesas SET estado = 'Ocupada' WHERE id = ?",
                [idMesa]
            );

            return pedidoId;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getPedidoPorMesa = async (idMesa: number) => {
        try {
            const pedido = await dbService.select<any>(
                "SELECT * FROM pedidos WHERE id_mesa = ? AND estado = 'Pendiente' ORDER BY fecha_hora DESC LIMIT 1",
                [idMesa]
            );

            if (pedido.length === 0) return null;

            const detalles = await dbService.select<any>(
                `SELECT dp.*, p.nombre as plato_nombre 
         FROM detalles_pedido dp 
         JOIN platos p ON dp.id_plato = p.id 
         WHERE dp.id_pedido = ?`,
                [pedido[0].id]
            );

            return { ...pedido[0], items: detalles };
        } catch (error) {
            console.error('Error fetching order by table:', error);
            throw error;
        }
    };

    const procesarPago = async (
        idPedido: number,
        idMesa: number,
        metodo: string,
        pagoCon: number,
        vuelto: number
    ) => {
        try {
            setLoading(true);
            // 1. Actualizar pedido
            await dbService.execute(
                "UPDATE pedidos SET estado = 'Pagado', metodo_pago = ?, pago_con = ?, vuelto = ? WHERE id = ?",
                [metodo, pagoCon, vuelto, idPedido]
            );

            // 2. Liberar mesa
            await dbService.execute(
                "UPDATE mesas SET estado = 'Libre' WHERE id = ?",
                [idMesa]
            );
        } catch (error) {
            console.error('Error processing payment:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const procesarPagoPensionista = async (
        idPedido: number,
        idMesa: number,
        idPensionista: number,
        total: number
    ) => {
        try {
            setLoading(true);
            // 1. Descontar saldo del pensionista
            await dbService.execute(
                "UPDATE pensionistas SET saldo_actual = saldo_actual - ? WHERE id = ?",
                [total, idPensionista]
            );

            // 2. Registrar en historial del pensionista
            await dbService.execute(
                "INSERT INTO historial_pensionistas (id_pensionista, id_pedido, monto, descripcion) VALUES (?, ?, ?, ?)",
                [idPensionista, idPedido, -total, "Consumo Menú"]
            );

            // 3. Marcar pedido como pagado
            await dbService.execute(
                "UPDATE pedidos SET estado = 'Pagado', metodo_pago = 'Pensionista', total = ? WHERE id = ?",
                [total, idPedido]
            );

            // 4. Liberar mesa
            await dbService.execute(
                "UPDATE mesas SET estado = 'Libre' WHERE id = ?",
                [idMesa]
            );
        } catch (error) {
            console.error('Error processing pensioner payment:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { crearPedido, getPedidoPorMesa, procesarPago, procesarPagoPensionista, loading };
}
