
import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState({ itemId: '', quantity: 1 });
  const [isSuccess, setIsSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtro de segurança para garantir que apenas MATERIAIS apareçam
  const availableItems = useMemo(() => {
    return inventory.filter(i => {
      const name = String(i.name).trim().toUpperCase();
      const isNumeric = /^\d+$/.test(name);
      const isVtr = VEHICLES.includes(name) || 
                    VEHICLES.includes(name.replace('VTR', '').trim()) ||
                    name.startsWith('VTR ');
      const isSystemTag = [
        'NOVA_SOLICITACAO', 
        'ATUALIZAR_ESTOQUE_TOTAL', 
        'ATUALIZACAO_STATUS_PEDIDO', 
        'MOVIMENTACAO_ESTOQUE',
        'STATUS', 'PENDING', 'SERVED'
      ].includes(name);

      const hasBalance = i.balance > 0;
      const isValidLength = name.length > 3;

      return hasBalance && !isVtr && !isSystemTag && !isNumeric && isValidLength;
    });
  }, [inventory]);

  // Filtra a lista baseada no que o usuário digita ou mostra todos se aberto
  const filteredOptions = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return availableItems.slice(0, 100); // Mostra os primeiros 100 se vazio
    
    return availableItems.filter(item => 
      item.name.toLowerCase().includes(search) || 
      item.id.includes(search)
    ).slice(0, 100);
  }, [searchTerm, availableItems]);

  const handleAddItem = (item?: InventoryItem) => {
    const targetItem = item || availableItems.find(i => i.id === currentItem.itemId);
    
    if (!targetItem) {
      alert("Por favor, selecione um material da lista.");
      return;
    }

    if (currentItem.quantity > targetItem.balance) {
      alert(`Ops! Só temos ${targetItem.balance} em estoque.`);
      return;
    }

    const existingIndex = selectedItems.findIndex(i => i.itemId === targetItem.id);
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      if ((updated[existingIndex].quantity + currentItem.quantity) > targetItem.balance) {
         alert(`Quantidade total excede o estoque (${targetItem.balance}).`);
         return;
      }
      updated[existingIndex].quantity += currentItem.quantity;
      setSelectedItems(updated);
    } else {
      setSelectedItems(prev => [...prev, { itemId: targetItem.id, itemName: targetItem.name, quantity: currentItem.quantity }]);
    }
    
    setSearchTerm('');
    setCurrentItem({ itemId: '', quantity: 1 });
    setIsDropdownOpen(false);
  };

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.itemId !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vtr) { alert("Selecione a Viatura."); return; }
    if (selectedItems.length === 0) { alert("Adicione ao menos um material."); return; }

    addRequest({
      vtr,
      requesterName: requesterName.toUpperCase() || 'COLABORADOR',
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
            Sua solicitação foi enviada e está sendo processada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div className="bg-white p-6 md:p-14 rounded-[3rem] shadow-2xl border border-slate-50">
        <div className="mb-10 text-center">
           <div className="inline-block bg-orange-50 text-[#FF8C00] px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-4">Requisição Operacional</div>
           <h2 className="text-3xl font-black text-[#003366] tracking-tight">Lista de <span className="text-[#FF8C00]">Materiais</span></h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Viatura (VTR)</label>
              <select 
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:bg-white focus:border-[#003366] outline-none transition-all font-black text-[#003366]"
                value={vtr}
                onChange={e => setVtr(e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {VEHICLES.map(v => <option key={v} value={v}>VTR {v}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsável</label>
              <input 
                type="text" 
                autoComplete="off"
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:bg-white focus:border-[#003366] outline-none transition-all font-bold text-slate-700 uppercase"
                placeholder="Seu nome"
                value={requesterName}
                onChange={e => setRequesterName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="bg-slate-50 p-6 md:p-10 rounded-[2.5rem] space-y-6 border border-slate-100 relative shadow-inner">
            <div className="absolute -top-4 left-10 bg-white px-4 py-1.5 text-[10px] font-black text-[#FF8C00] uppercase tracking-widest border border-orange-100 rounded-full">Adicionar Materiais</div>
            
            <div className="flex flex-col md:flex-row gap-4 items-start" ref={dropdownRef}>
              <div className="flex-[4] w-full space-y-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecionar Material (Com Saldo)</label>
                <div className="relative">
                  <input 
                    type="text"
                    autoComplete="off"
                    placeholder="Clique para ver a lista ou digite o nome..."
                    className="w-full p-5 bg-white border-2 border-slate-200 rounded-[1.5rem] focus:border-[#FF8C00] outline-none transition-all font-bold text-slate-700"
                    value={searchTerm}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setIsDropdownOpen(true);
                      if (!e.target.value) setCurrentItem({ itemId: '', quantity: currentItem.quantity });
                    }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Dropdown de materiais com saldo proeminente */}
                {isDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-scale-up max-h-[350px] overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                      filteredOptions.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setCurrentItem({ itemId: item.id, quantity: currentItem.quantity });
                            setSearchTerm(item.name);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-5 py-4 hover:bg-orange-50 transition-colors border-b border-slate-50 last:border-0 flex justify-between items-center ${currentItem.itemId === item.id ? 'bg-orange-50 border-l-4 border-l-[#FF8C00]' : ''}`}
                        >
                          <div className="flex-1 pr-4">
                            <div className="font-bold text-slate-800 text-sm leading-tight uppercase">{item.name}</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase mt-1">CÓD: {item.id}</div>
                          </div>
                          <div className="flex flex-col items-end shrink-0">
                             <div className="text-[14px] font-black text-[#FF8C00]">{item.balance}</div>
                             <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">DISPONÍVEL</div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-400 font-bold text-xs uppercase">Nenhum material encontrado</div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex-1 w-full space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Qtd</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full p-5 bg-white border-2 border-slate-200 rounded-[1.5rem] focus:border-[#FF8C00] outline-none transition-all font-black text-[#FF8C00] text-center text-xl"
                  value={currentItem.quantity}
                  onChange={e => setCurrentItem({...currentItem, quantity: Math.max(1, Number(e.target.value))})}
                />
              </div>
              
              <button 
                type="button" 
                onClick={() => handleAddItem()} 
                className="w-full md:w-auto mt-6 md:mt-0 bg-[#FF8C00] text-white px-10 py-5 rounded-[1.5rem] font-black text-2xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 active:scale-95"
              >
                +
              </button>
            </div>

            {selectedItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 pt-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">Itens na Lista:</h5>
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group animate-scale-up">
                    <div className="flex items-center gap-4">
                      <div className="bg-orange-50 text-[#FF8C00] w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm">
                        {item.quantity}
                      </div>
                      <div className="font-bold text-slate-700 text-xs md:text-sm uppercase">{item.itemName}</div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeItem(item.itemId)} 
                      className="p-2 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold text-xs uppercase">
                Selecione o material acima e clique no botão +
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSyncing || selectedItems.length === 0}
            className={`w-full font-black py-6 rounded-[2rem] shadow-2xl transition-all uppercase tracking-widest text-lg active:scale-95 ${isSyncing || selectedItems.length === 0 ? 'bg-slate-200 text-slate-400' : 'bg-[#003366] text-white hover:bg-blue-900'}`}
          >
            {isSyncing ? 'Sincronizando...' : 'Enviar Pedido'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestForm;
