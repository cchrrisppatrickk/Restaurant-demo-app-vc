import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/db';
import { Pensionista } from '../types/database';

export function usePensionistas() {
    const [pensionistas, setPensionistas] = useState<Pensionista[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPensionistas = useCallback(async () => {
        try {
            setLoading(true);
            const result = await dbService.select<Pensionista>('SELECT * FROM pensionistas ORDER BY nombre ASC');
            setPensionistas(result);
        } catch (error) {
            console.error('Error fetching pensioners:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPensionistas();
    }, [fetchPensionistas]);

    const addPensionista = async (pensionista: Omit<Pensionista, 'id' | 'saldo_actual' | 'fecha_registro'>) => {
        try {
            await dbService.execute(
                'INSERT INTO pensionistas (nombre, dni, celular, saldo_actual) VALUES (?, ?, ?, 0)',
                [pensionista.nombre, pensionista.dni, pensionista.celular]
            );
            await fetchPensionistas();
        } catch (error) {
            console.error('Error adding pensioner:', error);
            throw error;
        }
    };

    const recargarSaldo = async (id: number, monto: number) => {
        try {
            // 1. Actualizar saldo
            await dbService.execute(
                'UPDATE pensionistas SET saldo_actual = saldo_actual + ? WHERE id = ?',
                [monto, id]
            );
            // 2. Registrar en historial
            await dbService.execute(
                'INSERT INTO historial_pensionistas (id_pensionista, monto, descripcion) VALUES (?, ?, ?)',
                [id, monto, 'Abono / Liquidación de deuda']
            );
            await fetchPensionistas();
        } catch (error) {
            console.error('Error recharging balance:', error);
            throw error;
        }
    };

    const getHistorialDetallado = async (idPensionista: number) => {
        try {
            const query = `
                SELECT 
                    h.*, 
                    (
                        SELECT GROUP_CONCAT(p.nombre || ' x' || dp.cantidad, ', ')
                        FROM detalles_pedido dp
                        JOIN platos p ON dp.id_plato = p.id
                        WHERE dp.id_pedido = h.id_pedido
                    ) as detalle_consumo
                FROM historial_pensionistas h
                WHERE h.id_pensionista = ?
                ORDER BY h.fecha DESC
            `;
            return await dbService.select<any>(query, [idPensionista]);
        } catch (error) {
            console.error('Error fetching detailed pensioner history:', error);
            throw error;
        }
    };

    return {
        pensionistas,
        loading,
        addPensionista,
        recargarSaldo,
        getHistorial: getHistorialDetallado,
        refreshPensionistas: fetchPensionistas
    };
}
