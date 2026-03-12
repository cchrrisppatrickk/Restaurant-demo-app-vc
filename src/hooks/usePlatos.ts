import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/db';
import { Plato } from '../types/database';

export function usePlatos() {
    const [platos, setPlatos] = useState<Plato[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPlatos = useCallback(async () => {
        try {
            setLoading(true);
            const result = await dbService.select<Plato>('SELECT * FROM platos ORDER BY categoria, nombre');
            setPlatos(result);
        } catch (error) {
            console.error('Error fetching platos:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlatos();
    }, [fetchPlatos]);

    const addPlato = useCallback(async (plato: Omit<Plato, 'id'>) => {
        try {
            await dbService.execute(
                'INSERT INTO platos (nombre, descripcion, precio_base, categoria) VALUES (?, ?, ?, ?)',
                [plato.nombre, plato.descripcion, plato.precio_base, plato.categoria]
            );
            await fetchPlatos();
        } catch (error) {
            console.error('Error adding plato:', error);
            throw error;
        }
    }, [fetchPlatos]);

    const updatePlato = useCallback(async (plato: Plato) => {
        try {
            await dbService.execute(
                'UPDATE platos SET nombre = ?, descripcion = ?, precio_base = ?, categoria = ? WHERE id = ?',
                [plato.nombre, plato.descripcion, plato.precio_base, plato.categoria, plato.id]
            );
            await fetchPlatos();
        } catch (error) {
            console.error('Error updating plato:', error);
            throw error;
        }
    }, [fetchPlatos]);

    const deletePlato = useCallback(async (id: number) => {
        try {
            await dbService.execute('DELETE FROM platos WHERE id = ?', [id]);
            await fetchPlatos();
        } catch (error) {
            console.error('Error deleting plato:', error);
            throw error;
        }
    }, [fetchPlatos]);

    return { platos, loading, addPlato, updatePlato, deletePlato, refreshPlatos: fetchPlatos };
}
