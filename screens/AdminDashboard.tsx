
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryItem, MaterialRequest, Transaction } from '../types';
import { GOOGLE_SHEETS_URL, VEHICLES } from '../constants';

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
  inventory, 
  requests, 
  addTransaction, 
  addItem,
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
  const [newItem, setNewItem] = useState({ id: '', name: '', balance: 0 });
  const [movement, setMovement] = useState({ itemId: '', quantity: 1, type: 'in' as 'in' | 'out', description: '' });

  // Threshold para estado crítico atualizado para 6 conforme pedido
  const CRITICAL_THRESHOLD = 6;

  useEffect(() => {
    if (sessionStorage.getItem('isAdmin') !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  const cleanInventory = useMemo(() => {
    return inventory.filter(i => {
      const name = String(i.name).trim().toUpperCase();
      const isVtr = VEHICLES.includes(name) || VEHICLES.includes(name.replace('VTR', '').trim());
      const isSystemTag = ['NOVA_SOLICITACAO', 'ATUALIZAR_ESTOQUE_TOTAL', 'ATUALIZACAO_STATUS_PEDIDO', 'MOVIMENTACAO_ESTOQUE'].includes(name);
      return !isVtr && !isSystemTag && name.length > 2;
    });
  }, [inventory]);

  const handleAddStockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.id.trim() || !newItem.name.trim()) {
      alert("Preencha o Código e a Descrição.");
      return;
    }

    try {
      const item: InventoryItem = {
        id: newItem.id.trim(),
        name: newItem.name.toUpperCase().trim(),
        balance: newItem.balance,
      };

      await addItem(item);
      setNewItem({ id: '', name: '', balance: 0 });
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar material.');
    }
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movement.itemId) {
      alert("Selecione um material.");
      return;
    }

    try {
      await addTransaction({
        itemId: movement.itemId,
        quantity: movement.quantity,
        type: movement.type,
        description: movement.description || (movement.type === 'in' ? 'Entrada manual' : 'Saída manual')
      });
      setMovement({itemId: '', quantity: 1, type: 'in', description: ''});
    } catch (err) {
      console.error(err);
      alert('Falha ao registrar movimentação.');
    }
  };

  const filteredInventory = cleanInventory.filter(item => 
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
    const ws1 = XLSX.utils.json_to_sheet(cleanInventory.map(i => ({ ID: i.id, Material: i.name, Saldo: i.balance })));
    XLSX.utils.book_append_sheet(wb, ws1, "Estoque");
    XLSX.writeFile(wb, `LinhaViva_Relatorio_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-fade-in relative pb-20 md:pb-8">
      
      {/* Modal responsivo */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#003366]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] p-6 md:p-12 w-full max-w-md shadow-2xl animate-scale-up border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl md:text-2xl font-black text-[#003366] mb-8 uppercase tracking-tighter text-center">Novo Material</h3>
            
            <form onSubmit={handleAddStockItem} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Código</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  placeholder="Ex: 90001"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-[#FF8C00] outline-none transition-all font-bold text-slate-800"
                  value={newItem.id}
                  onChange={e => setNewItem({...newItem, id: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Descrição</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nome do material"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-[#FF8C00] outline-none transition-all font-bold text-slate-800 uppercase"
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Saldo Inicial</label>
                <input 
                  type="number" 
                  required
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-[#FF8C00] outline-none transition-all font-black text-[#FF8C00] text-2xl"
                  value={newItem.balance}
                  onChange={e => setNewItem({...newItem, balance: Number(e.target.value)})}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="w-full bg-slate-100 text-slate-500 font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="w-full bg-[#003366] text-white font-black py-4 rounded-xl shadow-lg uppercase tracking-widest text-xs hover:bg-blue-900 transition-all active:scale-95"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Responsivo */}
      <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-10 shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 w-full lg:w-auto">
           <div className="bg-[#003366] p-3 md:p-4 rounded-xl md:rounded-2xl shadow-lg">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
           </div>
           <div>
             <h2 className="text-xl md:text-3xl font-black text-[#003366]">Dashboard</h2>
             <p className="text-slate-400 font-semibold uppercase text-[9px] md:text-[10px] tracking-widest mt-1 truncate">
               {lastSync ? `Sinc.: ${new Date(lastSync).toLocaleTimeString()}` : 'Linha Viva Itabaiana'}
             </p>
           </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full lg:w-auto">
          {fetchFromSheets && (
             <button onClick={fetchFromSheets} className="bg-[#003366] text-white px-4 py-3 rounded-xl font-black text-[9px] md:text-xs uppercase tracking-wide transition-all shadow-md hover:bg-blue-900 active:scale-95">
               Importar
             </button>
          )}
          <button onClick={handleExportXLSX} className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-black text-[9px] md:text-xs uppercase tracking-wide transition-all shadow-md active:scale-95">
            XLSX
          </button>
          <button onClick={() => { sessionStorage.removeItem('isAdmin'); navigate('/'); }} className="col-span-2 md:col-span-1 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 px-4 py-3 rounded-xl font-black text-[9px] md:text-xs uppercase tracking-wide transition-all active:scale-95">
            Sair
          </button>
        </div>
      </div>

      {/* Tabs Mobile-Friendly */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full overflow-x-auto no-scrollbar">
        {[
          { id: 'stock', label: 'Estoque', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
          { id: 'requests', label: 'Pedidos', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          { id: 'config', label: 'Config', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 md:px-8 py-3.5 rounded-xl font-black text-[9px] md:text-xs uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-[#003366] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} />
            </svg>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'stock' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 md:p-8 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    placeholder="Buscar material..."
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl md:rounded-2xl focus:border-[#FF8C00] outline-none transition-all text-sm font-bold text-slate-800"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button 
                  onClick={() => setShowAddModal(true)} 
                  className="w-full md:w-auto bg-[#003366] text-white px-6 py-3.5 rounded-xl md:rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-900 transition-all active:scale-95"
                >
                  + Adicionar
                </button>
              </div>
              
              {/* Tabela Responsiva com Scroll Horizontal Suave */}
              <div className="overflow-x-auto smooth-scroll no-scrollbar">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-slate-50/80 text-[9px] md:text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <tr>
                      <th className="px-6 md:px-8 py-5 text-left">Material / ID</th>
                      <th className="px-6 md:px-8 py-5 text-center">Saldo</th>
                      <th className="px-6 md:px-8 py-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInventory.map(item => (
                      <tr key={item.id} className={`hover:bg-slate-50/30 transition-colors group ${item.balance <= CRITICAL_THRESHOLD ? 'bg-red-50/30' : ''}`}>
                        <td className="px-6 md:px-8 py-5 md:py-6">
                          <div className={`font-bold text-slate-800 text-xs md:text-sm uppercase ${item.balance <= CRITICAL_THRESHOLD ? 'text-red-700' : ''}`}>
                            {item.name}
                          </div>
                          <div className="text-[9px] font-black text-slate-400 font-mono mt-1 tracking-tighter">CÓD: {item.id}</div>
                        </td>
                        <td className="px-6 md:px-8 py-5 md:py-6 text-center">
                          <span className={`text-xl md:text-2xl font-black ${item.balance <= CRITICAL_THRESHOLD ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                            {item.balance}
                          </span>
                        </td>
                        <td className="px-6 md:px-8 py-5 md:py-6 text-right">
                          <span className={`inline-flex px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${item.balance <= CRITICAL_THRESHOLD ? 'bg-red-600 text-white animate-pulse' : 'bg-green-100 text-green-600'}`}>
                            {item.balance <= CRITICAL_THRESHOLD ? 'Crítico' : 'Em Dia'}
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
            <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 p-6 md:p-8 space-y-6 sticky top-24">
              <h3 className="text-lg md:text-xl font-black text-[#003366] uppercase tracking-wide">Movimentação Manual</h3>
              <form onSubmit={handleMovementSubmit} className="space-y-4 md:space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Material</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-[#FF8C00] outline-none transition-all font-bold text-slate-900 text-[11px] md:text-xs"
                    value={movement.itemId}
                    onChange={e => setMovement({...movement, itemId: e.target.value})}
                    required
                  >
                    <option value="">Escolher material...</option>
                    {cleanInventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.id})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Tipo</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-[#FF8C00] outline-none transition-all font-black text-slate-900 text-xs"
                      value={movement.type}
                      onChange={e => setMovement({...movement, type: e.target.value as any})}
                    >
                      <option value="in">Entrada</option>
                      <option value="out">Saída</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Qtd</label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-[#FF8C00] outline-none transition-all font-black text-slate-900 text-lg md:text-xl"
                      value={movement.quantity}
                      onChange={e => setMovement({...movement, quantity: Math.max(1, Number(e.target.value))})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Obs (Opcional)</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-[#FF8C00] outline-none transition-all font-bold text-slate-700 uppercase text-xs"
                    value={movement.description}
                    onChange={e => setMovement({...movement, description: e.target.value})}
                    placeholder="Ex: Reposição"
                  />
                </div>
                <button type="submit" className="w-full bg-[#FF8C00] text-white font-black py-4 rounded-xl shadow-lg hover:bg-orange-600 transition-all uppercase tracking-widest text-xs active:scale-95">Confirmar</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {requests.length === 0 ? (
            <div className="col-span-full py-16 md:py-24 text-center bg-white rounded-3xl border border-slate-100 font-bold text-slate-300">Nenhum pedido pendente</div>
          ) : (
            requests.map(req => (
              <div key={req.id} className={`bg-white p-5 md:p-6 rounded-3xl shadow-sm border-2 transition-all hover:shadow-xl ${req.status === 'served' ? 'border-green-100 opacity-60' : 'border-slate-50 hover:border-[#FF8C00]'}`}>
                <div className="flex justify-between items-center mb-5">
                  <div className="bg-[#003366] text-white px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest uppercase">VTR {req.vtr}</div>
                  <div className="text-[9px] font-black text-slate-300 uppercase">{new Date(req.timestamp).toLocaleDateString()}</div>
                </div>
                
                <h4 className="text-lg font-black text-[#003366] mb-4 truncate">{req.requesterName}</h4>
                
                <div className="space-y-2 mb-6 max-h-40 overflow-y-auto no-scrollbar">
                  {req.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-600 truncate mr-2 uppercase">{item.itemName}</span>
                      <span className="bg-[#FF8C00] text-white px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {req.status === 'pending' ? (
                  <button 
                    onClick={() => updateRequestStatus(req.id, 'served')}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl shadow-lg transition-all uppercase tracking-widest text-xs active:scale-95"
                  >
                    Atender
                  </button>
                ) : (
                  <div className="w-full bg-slate-100 text-slate-400 font-black py-4 rounded-xl text-center uppercase tracking-widest text-xs border border-slate-200">Atendido</div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'config' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-10 space-y-8 animate-fade-in-up">
           <div className="flex items-center gap-4 mb-2">
             <div className="bg-orange-100 p-3 rounded-xl">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#FF8C00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
             </div>
             <h3 className="text-xl font-black text-[#003366]">Sincronização Cloud</h3>
           </div>
           
           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">URL Google Apps Script</label>
              <div className="flex flex-col gap-3">
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-[#003366] outline-none transition-all font-bold text-xs text-slate-600"
                  value={sheetsUrl}
                  onChange={e => setSheetsUrl(e.target.value)}
                  placeholder="https://script.google.com/..."
                />
                <button 
                  onClick={() => setSheetsUrl(GOOGLE_SHEETS_URL)}
                  className="w-full bg-slate-100 text-[#003366] px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Restaurar Original
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
