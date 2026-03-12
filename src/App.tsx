import { useState, useEffect } from "react";
import "./App.css";
import Layout from "./components/Layout";
import { dbService } from "./services/db";
import Catalogo from "./pages/Catalogo";
import Configuracion from "./pages/Configuracion";
import Dashboard from "./pages/Dashboard";
import Mesas from "./pages/Mesas";
import Caja from "./pages/Caja";
import Pensionistas from "./pages/Pensionistas";
import Estadisticas from "./pages/Estadisticas";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import { Toaster } from 'sonner';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const initDb = async () => {
      try {
        await dbService.init();
        setIsDbReady(true);
      } catch (error) {
        console.error("Failed to initialize database", error);
        setDbError(error instanceof Error ? error.message : String(error));
      }
    };
    initDb();
  }, []);

  if (dbError) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-8 bg-slate-800 rounded-2xl shadow-2xl border border-red-500/50 max-w-md">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Error de Base de Datos</h2>
          <p className="text-slate-400 mb-6">{dbError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!isDbReady || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "stats":
        return <Estadisticas />;
      case "tables":
        return <Mesas />;
      case "cashier":
        return <Caja />;
      case "pensioners":
        return <Pensionistas />;
      case "catalog":
        return <Catalogo />;
      case "config":
        return <Configuracion />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <span className="text-4xl mb-2">🚧</span>
            <p>Módulo "{activeTab}" en desarrollo...</p>
          </div>
        );
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <AppContent />
    </AuthProvider>
  );
}

export default App;
