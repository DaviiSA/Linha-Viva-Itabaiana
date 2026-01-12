
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryItem, MaterialRequest, Transaction } from '../types';
import { GOOGLE_SHEETS_URL, VEHICLES, CRITICAL_THRESHOLD } from '../constants';

interface Props {
  inventory: InventoryItem[];
  requests: MaterialRequest[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  addItem: (item: InventoryItem) => Promise<void>;
  updateRequestStatus: (id: string, status: 'pending' | 'served') => void;
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  sheetsUrl: string;
  setSheetsUrl: (url: string) => void;
  fetchFromSheets?: () => Promise<void>;
  lastSync?: number | null;
}

const AdminDashboard: React.FC<Props> = ({ 
  inventory, requests, addTransaction, addItem, updateRequestStatus, sheetsUrl, setSheetsUrl, fetchFromSheets, lastSync
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'stock' | 'requests' | 'config'>('stock');
  const [selectedRegional, setSelectedRegional] = useState<'ALL' | 'ITABAIANA' | 'DORES'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [newItem, setNewItem] = useState({ id: '', name: '', balanceItabaiana: 0, balanceDores: 0 });
  const [movement, setMovement] = useState({ itemId: '', quantity: 1, type: 'in' as 'in' | 'out', region: 'ITABAIANA' as 'ITABAIANA' | 'DORES', description: '' });

  useEffect(() => {
    if (sessionStorage.getItem('isAdmin') !== 'true') navigate('/admin/login');
  }, [navigate]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.includes(searchTerm)
    );
  }, [inventory, searchTerm]);

  const handleManualSync = async () => {
    if (fetchFromSheets) {
      await fetchFromSheets();
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 3000);
    }
  };

  const handleAddStockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.id.trim() || !newItem.name.trim()) return;
    await addItem({ ...newItem, name: newItem.name.toUpperCase() });
    setShowAddModal(false);
    setNewItem({ id: '', name: '', balanceItabaiana: 0, balanceDores: 0 });
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movement.itemId) return;
    addTransaction({
      itemId: movement.itemId,
      quantity: movement.quantity,
      type: movement.type,
      region: movement.region,
      description: movement.description || (movement.type === 'in' ? 'Entrada manual' : 'Saída manual')
    });
    setMovement({ itemId: '', quantity: 1, type: 'in', region: 'ITABAIANA', description: '' });
    setShowMovementModal(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
      
      {showSyncSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-green-500 text-white px-6 py-3 rounded-full font-black text-xs shadow-2xl animate-fade-in-up uppercase">
          Planilha Atualizada com Sucesso!
        </div>
      )}

      {/* Modal: Novo Material */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#003366]/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-scale-up border border-slate-100">
            <h3 className="text-xl font-black text-[#003366] mb-6 uppercase text-center">Novo Material</h3>
            <form onSubmit={handleAddStockItem} className="space-y-4">
              <input type="text" placeholder="Código (ID)" className="w-full p-4 bg-slate-50 border-2 rounded-xl outline-none font-bold text-slate-800 placeholder:text-slate-300" value={newItem.id} onChange={e => setNewItem({...newItem, id: e.target.value})} required />
              <input type="text" placeholder="Descrição do Material" className="w-full p-4 bg-slate-50 border-2 rounded-xl outline-none font-bold uppercase text-slate-800 placeholder:text-slate-300" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Qtd Itabaiana</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border-2 rounded-xl font-black text-slate-800" value={newItem.balanceItabaiana} onChange={e => setNewItem({...newItem, balanceItabaiana: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Qtd Dores</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border-2 rounded-xl font-black text-slate-800" value={newItem.balanceDores} onChange={e => setNewItem({...newItem, balanceDores: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 py-4 rounded-xl font-black text-xs text-slate-500 uppercase">Cancelar</button>
                <button type="submit" className="flex-1 bg-[#003366] py-4 rounded-xl font-black text-xs text-white uppercase shadow-lg">Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Movimentar Estoque */}
      {showMovementModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#003366]/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-scale-up border border-slate-100">
            <h3 className="text-xl font-black text-[#003366] mb-6 uppercase text-center">Movimentar Estoque</h3>
            <form onSubmit={handleMovementSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Material</label>
                <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-800 focus:border-[#FF8C00] transition-colors" value={movement.itemId} onChange={e => setMovement({...movement, itemId: e.target.value})} required>
                  <option value="" className="text-slate-400">Selecione o Material</option>
                  {inventory.map(i => <option key={i.id} value={i.id} className="text-slate-800">{i.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Regional</label>
                <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-black text-xs text-[#FF8C00] focus:border-[#FF8C00] transition-colors" value={movement.region} onChange={e => setMovement({...movement, region: e.target.value as any})}>
                  <option value="ITABAIANA">DEPOSITO ITABAIANA</option>
                  <option value="DORES">DEPOSITO DORES</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Tipo</label>
                  <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-black text-xs text-slate-800 focus:border-[#FF8C00] transition-colors" value={movement.type} onChange={e => setMovement({...movement, type: e.target.value as any})}>
                    <option value="in">ENTRADA</option>
                    <option value="out">SAÍDA</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Qtd</label>
                  <input type="number" min="1" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-black text-lg text-center text-slate-800 focus:border-[#FF8C00] transition-colors" value={movement.quantity} onChange={e => setMovement({...movement, quantity: Math.max(1, Number(e.target.value))})} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Observação</label>
                <input type="text" placeholder="EX: REPOSIÇÃO DE FROTAS" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold text-xs uppercase text-slate-800 placeholder:text-slate-300 focus:border-[#FF8C00] transition-colors" value={movement.description} onChange={e => setMovement({...movement, description: e.target.value})} />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowMovementModal(false)} className="flex-1 bg-slate-100 py-4 rounded-xl font-black text-xs text-slate-500 uppercase">Cancelar</button>
                <button type="submit" className="flex-1 bg-[#FF8C00] py-4 rounded-xl font-black text-xs text-white uppercase shadow-lg shadow-orange-100">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#003366] p-3 rounded-2xl shadow-lg text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#003366]">Painel Administrativo</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{lastSync ? `Sincronizado: ${new Date(lastSync).toLocaleTimeString()}` : 'Sem conexão com a nuvem'}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={handleManualSync} className="flex-1 md:px-6 py-3 bg-[#003366] text-white rounded-xl font-black text-[10px] uppercase shadow-md hover:bg-blue-900 transition-colors">Sincronizar Agora</button>
          <button onClick={() => { sessionStorage.removeItem('isAdmin'); navigate('/'); }} className="flex-1 md:px-6 py-3 bg-slate-100 text-slate-400 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-colors">Sair</button>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
        {['stock', 'requests', 'config'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase transition-all ${activeTab === tab ? 'bg-white text-[#003366] shadow-sm' : 'text-slate-400'}`}>
            {tab === 'stock' ? 'Depósitos' : tab === 'requests' ? 'Pedidos' : 'Config'}
          </button>
        ))}
      </div>

      {activeTab === 'stock' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-3">
             <button 
              onClick={() => setSelectedRegional('ALL')} 
              className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all shadow-sm ${selectedRegional === 'ALL' ? 'bg-[#003366] text-white' : 'bg-white text-slate-400 border border-slate-100 hover:border-blue-200'}`}
            >
              Visão Geral
            </button>
            <button 
              onClick={() => setSelectedRegional('ITABAIANA')} 
              className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all shadow-sm ${selectedRegional === 'ITABAIANA' ? 'bg-[#003366] text-white' : 'bg-white text-slate-400 border border-slate-100 hover:border-blue-200'}`}
            >
              Depósito Itabaiana
            </button>
            <button 
              onClick={() => setSelectedRegional('DORES')} 
              className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all shadow-sm ${selectedRegional === 'DORES' ? 'bg-[#FF8C00] text-white' : 'bg-white text-slate-400 border border-slate-100 hover:border-orange-200'}`}
            >
              Depósito Dores
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-80">
                <input 
                  type="text" 
                  placeholder="Pesquisar material..." 
                  className="w-full p-3 pl-10 bg-white border-2 border-slate-100 rounded-xl outline-none font-bold text-sm text-slate-800 focus:border-[#003366] transition-colors" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
                <svg className="absolute left-3 top-3.5 h-4 w-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => setShowAddModal(true)} className="flex-1 md:flex-none bg-[#003366] text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-900 transition-colors">+ Novo Material</button>
                <button onClick={() => setShowMovementModal(true)} className="flex-1 md:flex-none bg-[#FF8C00] text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-orange-100 hover:bg-orange-600 transition-colors">Movimentar Estoque</button>
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-8 py-5">Material</th>
                    {(selectedRegional === 'ALL' || selectedRegional === 'ITABAIANA') && (
                      <th className={`px-4 py-5 text-center ${selectedRegional === 'ITABAIANA' ? 'bg-blue-50/50 text-[#003366]' : ''}`}>Itabaiana</th>
                    )}
                    {(selectedRegional === 'ALL' || selectedRegional === 'DORES') && (
                      <th className={`px-4 py-5 text-center ${selectedRegional === 'DORES' ? 'bg-orange-50/50 text-[#FF8C00]' : ''}`}>Dores</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                  {filteredInventory.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="text-xs uppercase leading-tight group-hover:text-[#003366] transition-colors">{item.name}</div>
                        <div className="text-[9px] text-slate-300 font-mono mt-1">ID: {item.id}</div>
                      </td>
                      {(selectedRegional === 'ALL' || selectedRegional === 'ITABAIANA') && (
                        <td className={`px-4 py-5 text-center ${selectedRegional === 'ITABAIANA' ? 'bg-blue-50/20' : ''}`}>
                          <span className={`text-lg font-black ${item.balanceItabaiana <= CRITICAL_THRESHOLD ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>{item.balanceItabaiana}</span>
                        </td>
                      )}
                      {(selectedRegional === 'ALL' || selectedRegional === 'DORES') && (
                        <td className={`px-4 py-5 text-center ${selectedRegional === 'DORES' ? 'bg-orange-50/20' : ''}`}>
                          <span className={`text-lg font-black ${item.balanceDores <= CRITICAL_THRESHOLD ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>{item.balanceDores}</span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInventory.length === 0 && (
                <div className="p-20 text-center font-black text-slate-200 uppercase tracking-widest">Nenhum material encontrado</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {requests.length === 0 ? (
            <div className="col-span-full py-20 text-center font-bold text-slate-300 uppercase">Nenhum pedido pendente</div>
          ) : (
            requests.map(req => (
              <div key={req.id} className={`bg-white p-6 rounded-3xl shadow-sm border-2 transition-all ${req.status === 'served' ? 'border-green-100 opacity-60' : 'border-slate-50 hover:border-blue-100'}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase text-white shadow-sm ${req.region === 'ITABAIANA' ? 'bg-[#003366]' : 'bg-[#FF8C00]'}`}>{req.region}</span>
                  <span className="text-[9px] font-black text-slate-300 uppercase">VTR {req.vtr}</span>
                </div>
                <h4 className="font-black text-[#003366] text-lg mb-4 truncate">{req.requesterName}</h4>
                <div className="space-y-2 mb-6 max-h-40 overflow-y-auto no-scrollbar">
                  {req.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between bg-slate-50 p-3 rounded-xl text-[10px] font-bold uppercase text-slate-700 border border-slate-100">
                      <span className="truncate mr-2">{item.itemName}</span>
                      <span className="text-[#FF8C00] font-black">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
                {req.status === 'pending' ? (
                  <button onClick={() => updateRequestStatus(req.id, 'served')} className="w-full bg-green-500 text-white py-4 rounded-xl font-black text-xs uppercase shadow-lg shadow-green-100 hover:bg-green-600 transition-all active:scale-95">Atender Pedido</button>
                ) : (
                  <div className="w-full bg-slate-100 text-slate-400 py-4 rounded-xl font-black text-xs uppercase text-center border border-slate-200">Pedido Atendido</div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'config' && (
        <div className="max-w-xl mx-auto bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 space-y-6 animate-fade-in">
          <h3 className="text-xl font-black text-[#003366] uppercase">Configuração da Nuvem</h3>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase">Google Script URL</label>
            <input type="text" className="w-full p-4 bg-slate-50 border-2 rounded-xl outline-none font-bold text-[10px] text-slate-600 focus:border-[#003366] transition-colors" value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)} />
            <button onClick={() => setSheetsUrl(GOOGLE_SHEETS_URL)} className="w-full py-4 text-[#003366] font-black text-[10px] uppercase hover:underline decoration-2 underline-offset-4">Resetar URL para o Padrão</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
