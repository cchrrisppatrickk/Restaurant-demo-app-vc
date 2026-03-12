import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { Usuario } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Login: React.FC = () => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [pin, setPin] = useState('');
    const { login } = useAuth();
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchUsuarios = async () => {
            const result = await dbService.select<Usuario>('SELECT id, nombre, rol FROM usuarios');
            setUsuarios(result);
        };
        fetchUsuarios();
    }, []);

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleSubmit = async () => {
        if (!selectedUserId || pin.length < 4) return;

        const success = await login(selectedUserId, pin);
        if (success) {
            const userName = usuarios.find(u => u.id === selectedUserId)?.nombre;
            toast.success(`Bienvenido, ${userName}!`);
        } else {
            setError(true);
            toast.error('PIN Incorrecto');
            setPin('');
            setTimeout(() => setError(false), 2000);
        }
    };

    useEffect(() => {
        if (pin.length === 4) {
            handleSubmit();
        }
    }, [pin]);

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden p-8 space-y-8">
                <div className="text-center">
                    <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-xl shadow-blue-200 mb-4">
                        🔑
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">Menú del Día</h1>
                    <p className="text-slate-400 font-medium">Sistema de Gestión de Restaurante</p>
                </div>

                <div className="space-y-6">
                    {/* User Selection */}
                    <div className="grid grid-cols-2 gap-3">
                        {usuarios.map(u => (
                            <button
                                key={u.id}
                                onClick={() => {
                                    setSelectedUserId(u.id);
                                    setPin('');
                                }}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${selectedUserId === u.id
                                    ? 'bg-blue-50 border-blue-500'
                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                    }`}
                            >
                                <span className="text-xl">👤</span>
                                <span className="text-xs font-bold text-slate-800">{u.nombre}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{u.rol}</span>
                            </button>
                        ))}
                    </div>

                    {/* PIN Display */}
                    <div className={`flex justify-center gap-4 py-4 ${error ? 'animate-shake' : ''}`}>
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-full transition-all duration-200 ${pin.length > i
                                    ? (error ? 'bg-rose-500 scale-125' : 'bg-blue-600 scale-125')
                                    : 'bg-slate-200'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-3">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                            <button
                                key={num}
                                onClick={() => handleNumberClick(num)}
                                className="h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-700 text-xl hover:bg-slate-100 active:scale-95 transition-all"
                            >
                                {num}
                            </button>
                        ))}
                        <button className="h-14 invisible"></button>
                        <button
                            onClick={() => handleNumberClick('0')}
                            className="h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-700 text-xl hover:bg-slate-100 active:scale-95 transition-all"
                        >
                            0
                        </button>
                        <button
                            onClick={handleDelete}
                            className="h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 text-xl hover:bg-rose-100 active:scale-95 transition-all"
                        >
                            ⌫
                        </button>
                    </div>
                </div>

                {error && (
                    <p className="text-center text-rose-500 font-bold text-sm animate-bounce">
                        PIN Incorrecto. Intente de nuevo.
                    </p>
                )}
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
                .animate-shake { animation: shake 0.2s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default Login;
