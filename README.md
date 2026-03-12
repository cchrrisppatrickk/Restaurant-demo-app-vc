# 🍽️ Sistema POS - Gestión de Restaurante (Menú del Día)

Una aplicación de escritorio de alto rendimiento y "local-first" diseñada para optimizar la operación de locales de comida y restaurantes con menú dinámico. Construida para funcionar de manera offline, garantizando que el negocio nunca se detenga por caídas de internet.

## ✨ Características Principales

* **📝 Menú Dinámico:** Configuración diaria del menú a partir de un catálogo general de platos.
* **🪑 Gestión de Mesas:** Mapa visual en tiempo real con estados de ocupación y toma de pedidos intuitiva.
* **👥 Módulo de Pensionistas (Cuentas Corrientes):** Sistema único para gestionar clientes habituales. Permite registrar consumos a crédito, acumular deudas y realizar abonos/liquidaciones a fin de mes, con historial detallado.
* **💰 Caja y Cobros:** Cálculo automático de subtotales y vueltos. Soporte integrado para cobros en Efectivo, Yape y Plin.
* **🔒 Seguridad y Roles:** Acceso rápido mediante PIN numérico. Separación estricta de permisos entre Administradores y Cajeros.
* **📊 Estadísticas y Cierre Diario:** Arqueo de caja seguro con bloqueo del sistema post-cierre (regla de un cierre por día). Ranking de platos más vendidos y filtros por fecha.

## 🛠️ Stack Tecnológico

Este proyecto utiliza tecnologías web modernas empaquetadas como una aplicación nativa de escritorio:

* **Frontend:** React + Vite
* **Lenguaje:** TypeScript
* **Estilos:** Tailwind CSS v4 (con UI moderna y Toasts de notificación)
* **Desktop Core:** Tauri v2 (Rust)
* **Base de Datos:** SQLite (Almacenamiento local incrustado vía `tauri-plugin-sql`)

## 🚀 Requisitos y Desarrollo Local

Para ejecutar este proyecto en tu entorno local:

1. Clonar el repositorio.
2. Instalar las dependencias de Node:
   ```bash
   npm install
