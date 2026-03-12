import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
    const { user, logout } = useAuth();

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['Administrador'] },
        { id: 'catalog', label: 'Catálogo', icon: '🍴', roles: ['Administrador'] },
        { id: 'tables', label: 'Mesas', icon: '🪑', roles: ['Administrador', 'Cajero'] },
        { id: 'cashier', label: 'Caja', icon: '💰', roles: ['Administrador', 'Cajero'] },
        { id: 'pensioners', label: 'Pensionistas', icon: '👥', roles: ['Administrador', 'Cajero'] },
        { id: 'stats', label: 'Estadísticas', icon: '📈', roles: ['Administrador'] },
        { id: 'config', label: 'Configuración', icon: '⚙️', roles: ['Administrador'] },
    ];

    const filteredItems = menuItems.filter(item =>
        item.roles.includes(user?.rol || '')
    );

    return (
        <div className="w-64 bg-slate-900 text-white h-screen flex flex-col shadow-xl">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Menú del Día
                </h1>
                <p className="text-xs text-slate-400 mt-1">Gestión de Restaurante</p>
            </div>

            <nav className="flex-1 mt-6 px-4">
                <ul className="space-y-2">
                    {filteredItems.map((item) => (
                        <li key={item.id}>
                            <button
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === item.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                        {user?.nombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.nombre}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{user?.rol}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-rose-400 border border-rose-400/20 rounded-xl hover:bg-rose-400/10 transition-all font-bold text-xs"
                >
                    <span>🚪</span> <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
