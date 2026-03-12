export const SCHEMA_SQL = `
-- Gestión de usuarios y roles
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    pin TEXT NOT NULL,
    rol TEXT CHECK(rol IN ('Administrador', 'Cajero')) NOT NULL
);

-- Catálogo de platos
CREATE TABLE IF NOT EXISTS platos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio_base REAL NOT NULL,
    categoria TEXT
);

-- Configuración del menú para el día actual
CREATE TABLE IF NOT EXISTS menu_diario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    id_plato INTEGER NOT NULL,
    precio_dia REAL NOT NULL,
    stock_inicial INTEGER,
    stock_actual INTEGER,
    FOREIGN KEY (id_plato) REFERENCES platos(id)
);

-- Estado de las mesas
CREATE TABLE IF NOT EXISTS mesas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_mesa INTEGER NOT NULL UNIQUE,
    estado TEXT CHECK(estado IN ('Libre', 'Ocupada', 'Atendida', 'Cuenta')) NOT NULL DEFAULT 'Libre'
);

-- Registro de pedidos (Ventas)
CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_mesa INTEGER,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    total REAL NOT NULL DEFAULT 0,
    estado TEXT CHECK(estado IN ('Pendiente', 'Pagado', 'Anulado')) NOT NULL DEFAULT 'Pendiente',
    metodo_pago TEXT CHECK(metodo_pago IN ('Efectivo', 'Yape', 'Plin', 'Pensionista')),
    pago_con REAL,
    vuelto REAL,
    FOREIGN KEY (id_mesa) REFERENCES mesas(id)
);

-- Detalle de platos en cada pedido
CREATE TABLE IF NOT EXISTS detalles_pedido (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_pedido INTEGER NOT NULL,
    id_plato INTEGER NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id),
    FOREIGN KEY (id_plato) REFERENCES platos(id)
);

-- Gestión de Pensionistas
CREATE TABLE IF NOT EXISTS pensionistas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    dni TEXT UNIQUE,
    celular TEXT,
    saldo_actual REAL NOT NULL DEFAULT 0,
    fecha_registro DATE DEFAULT CURRENT_DATE
);

-- Historial de consumos/recargas de pensionistas
CREATE TABLE IF NOT EXISTS historial_pensionistas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_pensionista INTEGER NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_pedido INTEGER,
    monto REAL NOT NULL,
    descripcion TEXT,
    FOREIGN KEY (id_pensionista) REFERENCES pensionistas(id),
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id)
);

-- Cierre de caja diario
CREATE TABLE IF NOT EXISTS cierres_caja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    monto_apertura REAL NOT NULL,
    monto_cierre REAL NOT NULL,
    total_efectivo REAL,
    total_digital REAL,
    id_usuario INTEGER,
    notas TEXT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);

-- Insertar usuario administrador por defecto si no existe
INSERT INTO usuarios (nombre, pin, rol) 
SELECT 'Admin', '1234', 'Administrador'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'Admin');
`;
