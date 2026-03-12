import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/db';
import { Usuario } from '../types/database';

export function useUsuarios() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsuarios = useCallback(async () => {
        try {
            setLoading(true);
            const result = await dbService.select<Usuario>('SELECT * FROM usuarios ORDER BY nombre');
            setUsuarios(result);
        } catch (error) {
            console.error('Error fetching usuarios:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsuarios();
    }, [fetchUsuarios]);

    const addUsuario = async (usuario: Omit<Usuario, 'id'>) => {
        try {
            await dbService.execute(
                'INSERT INTO usuarios (nombre, pin, rol) VALUES (?, ?, ?)',
                [usuario.nombre, usuario.pin, usuario.rol]
            );
            await fetchUsuarios();
        } catch (error) {
            console.error('Error adding usuario:', error);
            throw error;
        }
    };

    const deleteUsuario = async (id: number) => {
        try {
            await dbService.execute('DELETE FROM usuarios WHERE id = ?', [id]);
            await fetchUsuarios();
        } catch (error) {
            console.error('Error deleting usuario:', error);
            throw error;
        }
    };

    return { usuarios, loading, addUsuario, deleteUsuario, refreshUsuarios: fetchUsuarios };
}
