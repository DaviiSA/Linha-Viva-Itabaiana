
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VEHICLES } from '../constants';
import { InventoryItem, RequestedItem, MaterialRequest } from '../types';

interface Props {
  inventory: InventoryItem[];
  addRequest: (request: Omit<MaterialRequest, 'id' | 'timestamp' | 'status'>) => void;
  isSyncing: boolean;
}

const RequestForm: React.FC<Props> = ({ inventory, addRequest, isSyncing }) => {
  const navigate = useNavigate();
  const [vtr, setVtr] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [selectedItems, setSelectedItems] = useState<RequestedItem[]>([]);
  const [currentItem, setCurrentItem] = useState({ itemId: '', quantity: 1 });
  const [isSuccess, setIsSuccess] = useState(false);

  const availableItems = inventory.filter(i => i.balance > 0);

  const handleAddItem = () => {
    if (!currentItem.itemId) return;
    const item = inventory.find(i => i.id === currentItem.itemId);
    if (!item) return;

    if (currentItem.quantity > item.balance) {
      alert(`Ops! Só temos ${item.balance} em estoque para este material.`);
      return;
    }

    const existingIndex = selectedItems.findIndex(i => i.itemId === currentItem.itemId);
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      if ((updated[existingIndex].quantity + currentItem.quantity) > item.balance) {
         alert(`Quantidade total solicitada excede o estoque atual (${item.balance}).`);
         return;
      }
      updated[existingIndex].quantity += currentItem.quantity;
      setSelectedItems(updated);
    } else {
      setSelectedItems(prev => [...prev, { itemId: item.id, itemName: item.name, quantity: currentItem.quantity }]);
    }
    setCurrentItem({ itemId: '', quantity: 1 });
  };

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.itemId !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert("Adicione os itens da sua lista antes de finalizar.");
      return;
    }

    addRequest({
      vtr,
      requesterName,
      items: selectedItems
    });

    setIsSuccess(true);
    setTimeout(() => navigate('/'), 2500);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-6 text-center space-y-8 animate-fade-in">
        <div className="bg-green-500 p-8 rounded-[3rem] text-white shadow-2xl shadow-green-100 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-[#003366]">Pedido Realizado!</h2>
          <p className="text-slate-500 font-bold max-w-sm mx-auto text-lg leading-relaxed">
            Sua solicitação foi enviada para o administrador e está sendo processada.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
           <div className="w-8 h-1 bg-slate-200 rounded-full animate-pulse"></div>
           Redirecionando
           <div className="w-8 h-1 bg-slate-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div className="bg-white p-8 md:p-14 rounded-[3rem] shadow-2xl border border-slate-50">
        <div className="mb-12 text-center">
           <div className="inline-block bg-orange-50 text-[#FF8C00] px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-4">Requisição Operacional</div>
           <h2 className="text-4xl font-black text-[#003366] tracking-tight">Lista de <span className="text-[#FF8C00]">Materiais</span></h2>
           <p className="text-slate-400 font-medium mt-2">Preencha os dados abaixo para gerar seu pedido</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qual a sua Viatura (VTR)?</label>
              <select 
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:bg-white focus:border-[#003366] outline-none transition-all font-black text-[#003366] appearance-none"
                value={vtr}
                onChange={e => setVtr(e.target.value)}
                required
              >
                <option value="">Selecione o número...</option>
                {VEHICLES.map(v => <option key={v} value={v}>Viatura {v}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsável pela Coleta</label>
              <input 
                type="text" 
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:bg-white focus:border-[#003366] outline-none transition-all font-bold text-slate-700"
                placeholder="Nome completo"
                value={requesterName}
                onChange={e => setRequesterName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="relative pt-8">
            <div className="absolute inset-x-0 top-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-100"></div>
            </div>
          </div>

          <div className="bg-slate-50/70 p-8 md:p-10 rounded-[2.5rem] space-y-8 border border-slate-100 relative shadow-inner">
            <div className="absolute -top-4 left-10 bg-white px-4 py-1.5 text-[10px] font-black text-[#FF8C00] uppercase tracking-widest border border-[#FF8C00]/20 rounded-full shadow-sm">Adicionar Materiais</div>
            
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-[4] w-full space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar por Nome</label>
                <select 
                  className="w-full p-5 bg-white border-2 border-slate-200 rounded-[1.5rem] focus:border-[#FF8C00] outline-none transition-all font-bold text-slate-700 shadow-sm"
                  value={currentItem.itemId}
                  onChange={e => setCurrentItem({...currentItem, itemId: e.target.value})}
                >
                  <option value="">Clique para pesquisar material...</option>
                  {availableItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (Saldo: {i.balance})</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 w-full space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Qtd</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full p-5 bg-white border-2 border-slate-200 rounded-[1.5rem] focus:border-[#FF8C00] outline-none transition-all font-black text-[#FF8C00] shadow-sm text-center text-xl"
                  value={currentItem.quantity}
                  onChange={e => setCurrentItem({...currentItem, quantity: Math.max(1, Number(e.target.value))})}
                />
              </div>
              <button 
                type="button" 
                onClick={handleAddItem} 
                className="w-full md:w-auto bg-[#FF8C00] text-white px-10 py-5 rounded-[1.5rem] font-black text-2xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 active:scale-95"
              >
                +
              </button>
            </div>

            {selectedItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 pt-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">Sua lista de pedido:</h5>
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-fade-in group">
                    <div className="flex items-center gap-5">
                      <div className="bg-orange-50 text-[#FF8C00] w-12 h-12 flex items-center justify-center rounded-xl font-black text-lg border border-orange-100">
                        {item.quantity}
                      </div>
                      <div className="font-bold text-slate-700 text-sm leading-tight md:text-base">{item.itemName}</div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeItem(item.itemId)} 
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Remover Item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold text-sm">
                Nenhum item adicionado ainda. <br/> Use o campo acima para selecionar.
              </div>
            )}
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSyncing || selectedItems.length === 0}
              className={`group relative w-full font-black py-6 rounded-[2rem] shadow-2xl transition-all uppercase tracking-widest text-lg overflow-hidden ${isSyncing || selectedItems.length === 0 ? 'bg-slate-200 cursor-not-allowed text-slate-400' : 'bg-[#003366] text-white hover:bg-[#002244] hover:-translate-y-1'}`}
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                {isSyncing ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sincronizando...
                  </>
                ) : (
                  <>Finalizar e Enviar Pedido</>
                )}
              </div>
              {!isSyncing && selectedItems.length > 0 && (
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 font-black mt-6 uppercase tracking-[0.2em]">O administrador será notificado do seu pedido em tempo real</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestForm;
