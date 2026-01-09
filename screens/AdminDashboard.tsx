
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryItem, MaterialRequest, Transaction } from '../types';
import { GOOGLE_SHEETS_URL } from '../constants';

interface Props {
  inventory: InventoryItem[];
  requests: MaterialRequest[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  updateRequestStatus: (id: string, status: 'pending' | 'served') => void;
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  sheetsUrl: string;
  setSheetsUrl: (url: string) => void;
  fetchFromSheets?: () => Promise<void>;
  lastSync?: number | null;
}

const AdminDashboard: React.FC<Props> = ({ 
  inventory, 
  requests, 
  addTransaction, 
  updateRequestStatus,
  setInventory,
  sheetsUrl,
  setSheetsUrl,
  fetchFromSheets,
  lastSync
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'stock' | 'requests' | 'config'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', balance: 0 });
  const [movement, setMovement] = useState({ itemId: '', quantity: 1, type: 'in' as 'in' | 'out', description: '' });

  useEffect(() => {
    if (sessionStorage.getItem('isAdmin') !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleAddStockItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    const id = Math.floor(10000 + Math.random() * 90000).toString();
    const item: InventoryItem = {
      id,
      name: newItem.name.toUpperCase(),
      balance: newItem.balance,
    };

    setInventory(prev => [item, ...prev]);
    setNewItem({ name: '', balance: 0 });
    setShowAddModal(false);
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.id.includes(searchTerm)
  );

  const handleExportXLSX = () => {
    if (typeof (window as any).XLSX === 'undefined') {
      alert("Aguarde o carregamento da biblioteca...");
      return;
    }
    const XLSX = (window as any).XLSX;
    const wb = XLSX.utils.book_new();
    
    const ws1 = XLSX.utils.json_to_sheet(inventory.map(i => ({ ID: i.id, Material: i.name, Saldo: i.balance })));
    XLSX.utils.book_append_sheet(wb, ws1, "Estoque");

    const ws2 = XLSX.utils.json_to_sheet(requests.map(r => ({
      Data: new Date(r.timestamp).toLocaleString(),
      VTR: r.vtr,
      Solicitante: r.requesterName,
      Status: r.status,
      Itens: r.items.map(i => `${i.itemName}(${i.quantity})`).join(', ')
    })));
    XLSX.utils.book_append_sheet(wb, ws2, "Solicitações");

    XLSX.writeFile(wb, `LinhaViva_Relatorio_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
           <div className="bg-[#003366] p-4 rounded-2xl shadow-lg">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
           </div>
           <div>
             <h2 className="text-3xl font-black text-[#003366]">Painel Administrativo</h2>
             <p className="text-slate-400 font-semibold uppercase text-xs tracking-widest mt-1">
               {lastSync ? `Sincronizado: ${new Date(lastSync).toLocaleTimeString()}` : 'Gerenciamento Linha Viva'}
             </p>
           </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {fetchFromSheets && (
             <button onClick={fetchFromSheets} className="flex-1 md:flex-none bg-[#003366] text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wide transition-all shadow-lg hover:bg-blue-900">
               Importar da Planilha
             </button>
          )}
          <button onClick={handleExportXLSX} className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wide transition-all shadow-lg">
            Relatório XLSX
          </button>
          <button onClick={() => { sessionStorage.removeItem('isAdmin'); navigate('/'); }} className="flex-1 md:flex-none bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wide transition-all">
            Sair
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100 p-2 rounded-[1.5rem] w-full md:w-fit overflow-x-auto no-scrollbar">
        {[
          { id: 'stock', label: 'Estoque', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
          { id: 'requests', label: 'Pedidos', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          { id: 'config', label: 'Config', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-[#003366] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'stock' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 md:p-8 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    placeholder="Filtrar materiais..."
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:border-[#FF8C00] outline-none transition-all text-sm font-bold text-slate-800"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button onClick={() => setShowAddModal(true)} className="w-full md:w-auto bg-[#003366] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100">+ Adicionar</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <tr>
                      <th className="px-8 py-5 text-left">Material / ID</th>
                      <th className="px-8 py-5 text-center">Saldo</th>
                      <th className="px-8 py-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInventory.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="font-bold text-slate-800 group-hover:text-[#003366]">{item.name}</div>
                          <div className="text-[10px] font-black text-slate-400 font-mono mt-1">ID: {item.id}</div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`text-xl font-black ${item.balance <= 5 ? 'text-red-500' : 'text-slate-800'}`}>
                            {item.balance}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${item.balance <= 5 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-green-100 text-green-600'}`}>
                            {item.balance <= 5 ? 'Crítico' : 'Em Dia'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 h-fit">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 space-y-6 sticky top-24">
              <h3 className="text-xl font-black text-[#003366] uppercase tracking-wide">Movimentação Manual</h3>
              <form onSubmit={(e) => { e.preventDefault(); if (movement.itemId) addTransaction(movement); setMovement({itemId: '', quantity: 1, type: 'in', description: ''}); }} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Material</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-[#FF8C00] outline-none transition-all font-bold text-slate-900"
                    value={movement.itemId}
                    onChange={e => setMovement({...movement, itemId: e.target.value})}
                    required
                  >
                    <option value="">Escolher...</option>
                    {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-[#FF8C00] outline-none transition-all font-black text-slate-900"
                      value={movement.type}
                      onChange={e => setMovement({...movement, type: e.target.value as any})}
                    >
                      <option value="in" className="text-green-600">Entrada</option>
                      <option value="out" className="text-red-600">Saída</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Qtd</label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-[#FF8C00] outline-none transition-all font-black text-slate-900"
                      value={movement.quantity}
                      onChange={e => setMovement({...movement, quantity: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#FF8C00] text-white font-black py-5 rounded-2xl shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all uppercase tracking-widest">Processar Lançamento</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-slate-100 font-bold text-slate-300">Nenhum pedido registrado</div>
          ) : (
            requests.map(req => (
              <div key={req.id} className={`group bg-white p-6 rounded-[2rem] shadow-sm border-2 transition-all hover:shadow-xl ${req.status === 'served' ? 'border-green-100 opacity-60' : 'border-slate-50 hover:border-[#FF8C00]'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-[#003366] text-white px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase shadow-md shadow-blue-100">VTR {req.vtr}</div>
                  <div className="text-[10px] font-black text-slate-300 uppercase">{new Date(req.timestamp).toLocaleString('pt-BR')}</div>
                </div>
                
                <h4 className="text-xl font-black text-[#003366] mb-4 truncate">{req.requesterName}</h4>
                
                <div className="space-y-2 mb-8 h-32 overflow-y-auto no-scrollbar">
                  {req.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-600 truncate mr-2">{item.itemName}</span>
                      <span className="bg-[#FF8C00] text-white px-2 py-0.5 rounded-lg text-[10px] font-black tracking-widest">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {req.status === 'pending' ? (
                  <button 
                    onClick={() => updateRequestStatus(req.id, 'served')}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-green-100 transition-all uppercase tracking-widest text-xs"
                  >
                    Atender Requisição
                  </button>
                ) : (
                  <div className="w-full bg-slate-100 text-slate-400 font-black py-4 rounded-2xl text-center uppercase tracking-widest text-xs border border-slate-200">Pedido Atendido</div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'config' && (
        <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-10 space-y-8 animate-fade-in-up">
           <div className="flex items-center gap-4 mb-2">
             <div className="bg-orange-100 p-4 rounded-2xl">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#FF8C00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
             </div>
             <h3 className="text-2xl font-black text-[#003366]">Sincronização Cloud</h3>
           </div>
           
           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Google Apps Script</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  className="flex-1 p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:bg-white focus:border-[#003366] outline-none transition-all font-bold text-sm text-slate-600"
                  value={sheetsUrl}
                  onChange={e => setSheetsUrl(e.target.value)}
                  placeholder="https://..."
                />
                <button 
                  onClick={() => setSheetsUrl(GOOGLE_SHEETS_URL)}
                  className="bg-slate-100 text-[#003366] px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Restaurar
                </button>
              </div>
           </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl animate-scale-up">
            <h3 className="text-2xl font-black text-[#003366] mb-8 text-center uppercase tracking-tight">Novo Material</h3>
            <form onSubmit={handleAddStockItem} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  autoFocus
                  className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-[#003366] outline-none transition-all font-bold text-slate-700"
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Saldo em Prateleira</label>
                <input 
                  type="number"
                  className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-[#003366] outline-none transition-all font-bold text-slate-700"
                  value={newItem.balance}
                  onChange={e => setNewItem({...newItem, balance: Number(e.target.value)})}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-[#003366] text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-100">Salvar</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-5 bg-slate-100 text-slate-400 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-200">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
