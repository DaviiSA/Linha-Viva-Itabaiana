
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BucketTruckIcon } from '../components/Icons';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] p-4 md:p-8 bg-gradient-to-b from-slate-50 to-white">
      <div className="text-center mb-12 animate-fade-in space-y-4">
        <div className="flex justify-center mb-6">
          <div className="bg-[#003366] p-6 rounded-[2.5rem] shadow-2xl shadow-[#003366]/20">
            <BucketTruckIcon className="w-20 h-20 text-white" />
          </div>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-[#003366] tracking-tight">
          Linha Viva <span className="text-[#FF8C00]">Itabaiana</span>
        </h2>
        <p className="text-slate-500 font-medium max-w-md mx-auto text-lg">
          Gestão inteligente de materiais e suporte operacional para frotas de manutenção.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <button
          onClick={() => navigate('/request')}
          className="relative overflow-hidden group flex flex-col items-center justify-center p-8 bg-white border-2 border-[#FF8C00] rounded-[2rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-32 h-32 text-[#FF8C00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="p-6 bg-[#FF8C00] rounded-2xl text-white mb-6 shadow-lg shadow-orange-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-2xl font-black text-[#FF8C00] uppercase tracking-wide">Solicitar Material</span>
          <span className="text-sm text-slate-400 mt-2 font-semibold">Uso livre para colaboradores</span>
        </button>

        <button
          onClick={() => navigate('/admin/login')}
          className="relative overflow-hidden group flex flex-col items-center justify-center p-8 bg-white border-2 border-[#003366] rounded-[2rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-32 h-32 text-[#003366]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="p-6 bg-[#003366] rounded-2xl text-white mb-6 shadow-lg shadow-blue-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-1.197-3.59c1.612-2.852 2.533-6.12 2.533-9.571m0 0A5 5 0 1117 16m0 0a5 5 0 11-10 0" />
            </svg>
          </div>
          <span className="text-2xl font-black text-[#003366] uppercase tracking-wide">Administrador</span>
          <span className="text-sm text-slate-400 mt-2 font-semibold">Controle de estoque e auditoria</span>
        </button>
      </div>
    </div>
  );
};

export default Home;
