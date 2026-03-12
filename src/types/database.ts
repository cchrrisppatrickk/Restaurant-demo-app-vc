export type UserRole = 'Administrador' | 'Cajero';

export interface Usuario {
    id: number;
    nombre: string;
    pin: string;
    rol: UserRole;
}

export interface Plato {
    id: number;
    nombre: string;
    descripcion: string | null;
    precio_base: number;
    categoria: string | null;
}

export interface MenuDiario {
    id: number;
    fecha: string;
    id_plato: number;
    precio_dia: number;
    stock_inicial: number | null;
    stock_actual: number | null;
}

export type MesaEstado = 'Libre' | 'Ocupada' | 'Atendida' | 'Cuenta';

export interface Mesa {
    id: number;
    numero_mesa: number;
    estado: MesaEstado;
}

export type PedidoEstado = 'Pendiente' | 'Pagado' | 'Anulado';
export type MetodoPago = 'Efectivo' | 'Yape' | 'Plin' | 'Pensionista';

export interface Pedido {
    id: number;
    id_mesa: number | null;
    fecha_hora: string;
    total: number;
    estado: PedidoEstado;
    metodo_pago: MetodoPago | null;
    pago_con: number | null;
    vuelto: number | null;
}

export interface DetallePedido {
    id: number;
    id_pedido: number;
    id_plato: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}

export interface Pensionista {
    id: number;
    nombre: string;
    dni: string | null;
    celular: string | null;
    saldo_actual: number;
    fecha_registro: string;
}

export interface HistorialPensionista {
    id: number;
    id_pensionista: number;
    fecha: string;
    id_pedido: number | null;
    monto: number;
    descripcion: string | null;
}

export interface CierreCaja {
    id: number;
    fecha: string;
    monto_apertura: number;
    monto_cierre: number;
    total_efectivo: number | null;
    total_digital: number | null;
    id_usuario: number;
    notas: string | null;
}
