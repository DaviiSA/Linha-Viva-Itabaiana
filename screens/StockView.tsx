
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryItem } from '../types';
import { CRITICAL_THRESHOLD } from '../constants';

interface Props {
  inventory: InventoryItem[];
  isSyncing?: boolean;
  fetchFromSheets?: () => Promise<void>;
  lastSync?: number | null;
}

const StockView: React.FC<Props> = ({ inventory, isSyncing, fetchFromSheets, lastSync }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.includes(searchTerm)
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-[#003366] font-bold transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          VOLTAR
        </button>
        <div className="flex flex-col items-end gap-1">
          <h2 className="text-xl md:text-2xl font-black text-[#003366] uppercase">Estoque Disponível</h2>
          <div className="flex items-center gap-2">
            {lastSync && (
              <span className="text-[8px] font-bold text-slate-400 uppercase">
                Atualizado: {new Date(lastSync).toLocaleTimeString()}
              </span>
            )}
            <button 
              onClick={() => fetchFromSheets?.()}
              disabled={isSyncing}
              className={`p-1.5 rounded-lg transition-all ${isSyncing ? 'bg-slate-100 text-slate-300 animate-spin' : 'bg-blue-50 text-[#003366] hover:bg-blue-100'}`}
              title="Sincronizar agora"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h5M20 20v-5h-5M20 9.474a10 10 0 10-1.526 8.526" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-4 bg-slate-50 border-bottom">
          <div className="relative">
            <input
              type="text"
              placeholder="Pesquisar material..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-[#003366] focus:outline-none transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-black">
              <tr>
                <th className="px-6 py-4">Material</th>
                <th className="px-6 py-4 text-center">Saldo Disponível</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#003366] text-sm">{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">ID: {item.id}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                      item.balanceItabaiana <= CRITICAL_THRESHOLD ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {item.balanceItabaiana}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredInventory.map(item => (
            <div key={item.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-[#003366] text-sm leading-tight">{item.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">ID: {item.id}</div>
                </div>
                <span className={`px-4 py-1 rounded-full text-xs font-black ${
                  item.balanceItabaiana <= CRITICAL_THRESHOLD ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {item.balanceItabaiana}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredInventory.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest">
            Nenhum material encontrado
          </div>
        )}
      </div>
    </div>
  );
};

export default StockView;
