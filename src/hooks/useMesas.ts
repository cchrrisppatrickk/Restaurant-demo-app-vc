import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/db';
import { Mesa } from '../types/database';

export function useMesas() {
    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMesas = useCallback(async () => {
        try {
            setLoading(true);
            const result = await dbService.select<Mesa>('SELECT * FROM mesas ORDER BY numero_mesa');
            setMesas(result);
        } catch (error) {
            console.error('Error fetching mesas:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMesas();
    }, [fetchMesas]);

    const setCantidadMesas = async (cantidad: number) => {
        try {
            const currentMesas = await dbService.select<Mesa>('SELECT * FROM mesas');
            const currentCount = currentMesas.length;

            if (cantidad > currentCount) {
                // Add new tables
                for (let i = currentCount + 1; i <= cantidad; i++) {
                    await dbService.execute(
                        'INSERT INTO mesas (numero_mesa, estado) VALUES (?, ?)',
                        [i, 'Libre']
                    );
                }
            } else if (cantidad < currentCount) {
                // Remove excess tables (be careful with occupied tables in a real app)
                await dbService.execute(
                    'DELETE FROM mesas WHERE numero_mesa > ?',
                    [cantidad]
                );
            }

            await fetchMesas();
        } catch (error) {
            console.error('Error updating mesas count:', error);
            throw error;
        }
    };

    return { mesas, loading, setCantidadMesas, refreshMesas: fetchMesas };
}
