import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/db';
import { MenuDiario } from '../types/database';

export interface MenuDiarioConPlato extends MenuDiario {
    plato_nombre: string;
    plato_categoria: string | null;
}

export function useMenuDiario() {
    const [menuHoy, setMenuHoy] = useState<MenuDiarioConPlato[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMenuHoy = useCallback(async () => {
        try {
            setLoading(true);
            const fechaHoy = new Date().toISOString().split('T')[0];
            const query = `
                SELECT md.*, p.nombre as plato_nombre, p.categoria as plato_categoria 
                FROM menu_diario md
                JOIN platos p ON md.id_plato = p.id
                WHERE md.fecha = ?
            `;
            const result = await dbService.select<MenuDiarioConPlato>(query, [fechaHoy]);
            setMenuHoy(result);
        } catch (error) {
            console.error('Error fetching today\'s menu:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMenuHoy();
    }, [fetchMenuHoy]);

    const agregarAlMenu = useCallback(async (idPlato: number, precio: number, stock: number) => {
        try {
            const fechaHoy = new Date().toISOString().split('T')[0];
            const exists = await dbService.select<any>(
                'SELECT id FROM menu_diario WHERE id_plato = ? AND fecha = ?',
                [idPlato, fechaHoy]
            );

            if (exists.length > 0) {
                throw new Error('Este plato ya está en el menú de hoy');
            }

            await dbService.execute(
                'INSERT INTO menu_diario (id_plato, precio_dia, stock_inicial, stock_actual, fecha) VALUES (?, ?, ?, ?, ?)',
                [idPlato, precio, stock, stock, fechaHoy]
            );
            await fetchMenuHoy();
        } catch (error) {
            console.error('Error adding to daily menu:', error);
            throw error;
        }
    }, [fetchMenuHoy]);

    const quitarDelMenu = useCallback(async (id: number) => {
        try {
            await dbService.execute('DELETE FROM menu_diario WHERE id = ?', [id]);
            await fetchMenuHoy();
        } catch (error) {
            console.error('Error removing from daily menu:', error);
            throw error;
        }
    }, [fetchMenuHoy]);

    return { menuHoy, loading, agregarAlMenu, quitarDelMenu, refreshMenu: fetchMenuHoy };
}
