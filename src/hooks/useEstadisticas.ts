import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/db';

export function useEstadisticas() {
    const [stats, setStats] = useState({
        ventasHoy: 0,
        efectivoHoy: 0,
        digitalHoy: 0,
        abonosHoy: 0,
        deudaTotal: 0,
        gananciaSemanal: 0,
        isCerrado: false
    });
    const [historialCierres, setHistorialCierres] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const fechaHoy = new Date().toISOString().split('T')[0];

            // 1. Ventas de hoy por método
            const hoyResult = await dbService.select<any>(`
                SELECT 
                    SUM(CASE WHEN metodo_pago IN ('Efectivo', 'Yape', 'Plin') THEN total ELSE 0 END) as total,
                    SUM(CASE WHEN metodo_pago = 'Efectivo' THEN total ELSE 0 END) as efectivo,
                    SUM(CASE WHEN metodo_pago IN ('Yape', 'Plin') THEN total ELSE 0 END) as digital
                FROM pedidos 
                WHERE estado = 'Pagado' AND date(fecha_hora, 'localtime') = ?
            `, [fechaHoy]);

            // 2. Abonos de pensionistas hoy
            const abonosResult = await dbService.select<any>(`
                SELECT SUM(monto) as total 
                FROM historial_pensionistas 
                WHERE monto > 0 AND date(fecha, 'localtime') = ?
            `, [fechaHoy]);

            // 3. Deuda total (Saldos negativos)
            const deudaResult = await dbService.select<any>(`
                SELECT SUM(ABS(saldo_actual)) as total 
                FROM pensionistas 
                WHERE saldo_actual < 0
            `);

            // 4. Ganancia Semanal (basada en cierres anteriores)
            const semanalResult = await dbService.select<any>(`
                SELECT SUM(monto_cierre) as total 
                FROM cierres_caja 
                WHERE fecha >= date(?, '-7 days')
            `, [fechaHoy]);

            // 5. Verificar si ya se cerró la caja hoy
            const cierreHoy = await dbService.select<any>(`
                SELECT id FROM cierres_caja WHERE fecha = ?
            `, [fechaHoy]);

            // 6. Historial de cierres para el gráfico
            const historial = await dbService.select<any>(`
                SELECT fecha, monto_cierre 
                FROM cierres_caja 
                ORDER BY fecha DESC 
                LIMIT 7
            `);

            const ventas = hoyResult[0]?.total || 0;
            const abonos = abonosResult[0]?.total || 0;

            setStats({
                ventasHoy: ventas,
                efectivoHoy: hoyResult[0]?.efectivo || 0,
                digitalHoy: hoyResult[0]?.digital || 0,
                abonosHoy: abonos,
                deudaTotal: deudaResult[0]?.total || 0,
                gananciaSemanal: semanalResult[0]?.total || 0,
                isCerrado: cierreHoy.length > 0
            });
            setHistorialCierres(historial.reverse());

        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const cerrarCaja = useCallback(async (montoApertura: number, idUsuario: number, notas: string = '') => {
        console.log('--- INICIO PROCESO DE CIERRE ---');

        try {
            if (!idUsuario) throw new Error('ID de usuario no proporcionado para el cierre');

            // Saneamiento estricto de valores numéricos
            const numApertura = Number(montoApertura) || 0;
            const numEfectivoHoy = Number(stats.efectivoHoy) || 0;
            const numAbonosHoy = Number(stats.abonosHoy) || 0;
            const numDigitalHoy = Number(stats.digitalHoy) || 0;

            const totalEfectivo = numEfectivoHoy + numAbonosHoy;
            const totalDigital = numDigitalHoy;
            const montoCierre = totalEfectivo + totalDigital;
            const fechaHoy = new Date().toISOString().split('T')[0];

            const values = [
                fechaHoy,
                numApertura,
                montoCierre,
                totalEfectivo,
                totalDigital,
                idUsuario,
                notas || ''
            ];

            console.log('Valores a insertar:', {
                fecha: values[0],
                monto_apertura: values[1],
                monto_cierre: values[2],
                total_efectivo: values[3],
                total_digital: values[4],
                id_usuario: values[5],
                notas: values[6]
            });

            await dbService.execute(`
                INSERT INTO cierres_caja (fecha, monto_apertura, monto_cierre, total_efectivo, total_digital, id_usuario, notas)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, values);

            console.log('--- CIERRE COMPLETADO EXITOSAMENTE ---');
            await fetchStats();
            return true;
        } catch (error: any) {
            console.error('ERROR EN SQLITE AL CERRAR CAJA:', error);
            const errorMsg = error.message || 'Error desconocido';
            throw new Error(`Error en base de datos: ${errorMsg}`);
        }
    }, [stats, fetchStats]);

    const getRankingPlatos = useCallback(async (fechaInicio: string, fechaFin: string) => {
        try {
            return await dbService.select<any>(`
                SELECT 
                    p.nombre,
                    SUM(dp.cantidad) as total_cantidad,
                    SUM(dp.subtotal) as total_venta
                FROM detalles_pedido dp
                JOIN platos p ON dp.id_plato = p.id
                JOIN pedidos ped ON dp.id_pedido = ped.id
                WHERE ped.estado = 'Pagado' 
                AND date(ped.fecha_hora, 'localtime') BETWEEN ? AND ?
                GROUP BY p.id
                ORDER BY total_cantidad DESC
            `, [fechaInicio, fechaFin]);
        } catch (error) {
            console.error('Error fetching ranking:', error);
            return [];
        }
    }, []);

    const getResumenPeriodo = useCallback(async (fechaInicio: string, fechaFin: string) => {
        try {
            const ventasResult = await dbService.select<any>(`
                SELECT 
                    SUM(CASE WHEN metodo_pago IN ('Efectivo', 'Yape', 'Plin') THEN total ELSE 0 END) as total,
                    SUM(CASE WHEN metodo_pago = 'Efectivo' THEN total ELSE 0 END) as efectivo,
                    SUM(CASE WHEN metodo_pago IN ('Yape', 'Plin') THEN total ELSE 0 END) as digital
                FROM pedidos 
                WHERE estado = 'Pagado' AND date(fecha_hora, 'localtime') BETWEEN ? AND ?
            `, [fechaInicio, fechaFin]);

            const abonosResult = await dbService.select<any>(`
                SELECT SUM(monto) as total 
                FROM historial_pensionistas 
                WHERE monto > 0 AND date(fecha, 'localtime') BETWEEN ? AND ?
            `, [fechaInicio, fechaFin]);

            return {
                ventas: ventasResult[0]?.total || 0,
                efectivo: ventasResult[0]?.efectivo || 0,
                digital: ventasResult[0]?.digital || 0,
                abonos: abonosResult[0]?.total || 0
            };
        } catch (error) {
            console.error('Error fetching period stats:', error);
            return { ventas: 0, efectivo: 0, digital: 0, abonos: 0 };
        }
    }, []);

    const getHistorialCierresDetallado = useCallback(async (fechaInicio: string, fechaFin: string) => {
        try {
            return await dbService.select<any>(`
                SELECT 
                    c.*,
                    u.nombre as usuario_nombre
                FROM cierres_caja c
                JOIN usuarios u ON c.id_usuario = u.id
                WHERE c.fecha BETWEEN ? AND ?
                ORDER BY c.fecha DESC
            `, [fechaInicio, fechaFin]);
        } catch (error) {
            console.error('Error fetching detailed history:', error);
            return [];
        }
    }, []);

    return {
        stats,
        historialCierres,
        loading,
        cerrarCaja,
        getRankingPlatos,
        getHistorialCierresDetallado,
        getResumenPeriodo,
        refreshStats: fetchStats
    };
}
