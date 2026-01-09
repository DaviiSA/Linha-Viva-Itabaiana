
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_PASSWORD } from '../constants';

const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('isAdmin', 'true');
      navigate('/admin/dashboard');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#003366]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-1.197-3.59c1.612-2.852 2.533-6.12 2.533-9.571m0 0A5 5 0 1117 16m0 0a5 5 0 11-10 0" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#003366]">Área Administrativa</h2>
          <p className="text-sm text-gray-400 mt-1">Identifique-se para prosseguir</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-500 uppercase ml-1">Senha de Acesso</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-4 border-2 rounded-2xl focus:ring-4 focus:ring-[#003366]/10 outline-none transition-all text-center text-xl tracking-widest ${error ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-100 focus:border-[#003366]'}`}
              placeholder="••••••"
              autoFocus
              required
            />
            {error && <p className="text-red-500 text-xs mt-2 text-center font-semibold">Credenciais incorretas!</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-[#003366] text-white font-bold p-4 rounded-2xl hover:bg-[#002244] shadow-lg shadow-[#003366]/20 transition-all active:scale-95"
          >
            Acessar Painel
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full text-gray-400 text-sm font-medium hover:text-[#003366] transition-colors"
          >
            Voltar ao Início
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
