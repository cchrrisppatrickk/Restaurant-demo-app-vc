import Database from '@tauri-apps/plugin-sql';
import { SCHEMA_SQL } from './schema';

class DbService {
    private db: Database | null = null;

    async getDb(): Promise<Database> {
        if (this.db) {
            return this.db;
        }

        // El nombre del archivo de la base de datos será 'restaurante.db'
        this.db = await Database.load('sqlite:restaurante.db');
        return this.db;
    }

    async init() {
        try {
            const db = await this.getDb();

            // Dividimos el esquema por punto y coma para ejecutar cada sentencia por separado.
            // Esto es más robusto ante diferentes versiones del plugin.
            const statements = SCHEMA_SQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            for (const statement of statements) {
                await db.execute(statement);
            }

            // Migración manual: Asegurar que id_usuario existe en cierres_caja
            try {
                await db.execute('ALTER TABLE cierres_caja ADD COLUMN id_usuario INTEGER');
                console.log('Migración: Columna id_usuario añadida a cierres_caja');
            } catch (e) {
                // Probablemente la columna ya existe
            }

            console.log('Base de datos inicializada correctamente');
        } catch (error) {
            console.error('Error detallado al inicializar la base de datos:', error);
            throw error;
        }
    }

    async execute(query: string, values: any[] = []) {
        const db = await this.getDb();
        return await db.execute(query, values);
    }

    async select<T>(query: string, values: any[] = []): Promise<T[]> {
        const db = await this.getDb();
        return await db.select<T[]>(query, values);
    }
}

export const dbService = new DbService();
