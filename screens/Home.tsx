
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BucketTruckIcon } from '../components/Icons';

interface Props {
  isSyncing?: boolean;
  lastSync?: number | null;
}

const Home: React.FC<Props> = ({ isSyncing, lastSync }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] p-5 md:p-8 bg-gradient-to-b from-slate-50 to-white">
      <div className="text-center mb-8 md:mb-12 animate-fade-in space-y-4">
        <div className="flex justify-center mb-4 md:mb-6">
          <div className="bg-[#003366] p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-2xl shadow-[#003366]/20">
            <BucketTruckIcon className="w-12 h-12 md:w-20 md:h-20 text-white" />
          </div>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-[#003366] tracking-tight">
          Linha Viva <span className="text-[#FF8C00]">Itabaiana</span>
        </h2>
        
        {lastSync && (
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`}></div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {isSyncing ? 'Sincronizando...' : `Dados Atualizados: ${new Date(lastSync).toLocaleTimeString()}`}
            </span>
          </div>
        )}
        <p className="text-slate-500 font-medium max-w-sm mx-auto text-sm md:text-lg px-4">
          Gestão inteligente de materiais e suporte operacional para frotas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full max-w-5xl px-2">
        <button
          onClick={() => navigate('/stock')}
          className="relative overflow-hidden group flex flex-col items-center justify-center p-6 md:p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div className="p-4 bg-slate-100 rounded-2xl text-slate-600 mb-4 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <span className="text-lg md:text-xl font-black text-slate-700 uppercase tracking-wide">Consultar Estoque</span>
          <span className="text-[10px] md:text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">Visualização Pública</span>
        </button>

        <button
          onClick={() => navigate('/request')}
          className="relative overflow-hidden group flex flex-col items-center justify-center p-6 md:p-8 bg-white border-2 border-[#FF8C00] rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div className="p-4 bg-[#FF8C00] rounded-2xl text-white mb-4 shadow-lg shadow-orange-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-lg md:text-xl font-black text-[#FF8C00] uppercase tracking-wide">Solicitar Material</span>
          <span className="text-[10px] md:text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">Colaboradores</span>
        </button>

        <button
          onClick={() => navigate('/admin/login')}
          className="relative overflow-hidden group flex flex-col items-center justify-center p-6 md:p-8 bg-white border-2 border-[#003366] rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 sm:col-span-2 lg:col-span-1"
        >
          <div className="p-4 bg-[#003366] rounded-2xl text-white mb-4 shadow-lg shadow-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-1.197-3.59c1.612-2.852 2.533-6.12 2.533-9.571m0 0A5 5 0 1117 16m0 0a5 5 0 11-10 0" />
            </svg>
          </div>
          <span className="text-lg md:text-xl font-black text-[#003366] uppercase tracking-wide">Administrador</span>
          <span className="text-[10px] md:text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">Gestão de Estoque</span>
        </button>
      </div>
    </div>
  );
};

export default Home;
