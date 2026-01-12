
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
  const [region, setRegion] = useState<'ITABAIANA' | 'DORES'>('ITABAIANA');
  const [requesterName, setRequesterName] = useState('');
  const [selectedItems, setSelectedItems] = useState<RequestedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState({ itemId: '', quantity: 1 });
  const [isSuccess, setIsSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const availableItems = useMemo(() => {
    // Filtro estrito: Apenas itens com saldo > 0 na regional selecionada
    return inventory.filter(i => {
      const balance = region === 'ITABAIANA' ? i.balanceItabaiana : i.balanceDores;
      return balance > 0 && i.name.length > 2;
    });
  }, [inventory, region]);

  const filteredOptions = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return availableItems.slice(0, 50);
    return availableItems.filter(i => i.name.toLowerCase().includes(search) || i.id.includes(search)).slice(0, 50);
  }, [searchTerm, availableItems]);

  const handleAddItem = (item?: InventoryItem) => {
    const target = item || availableItems.find(i => i.id === currentItem.itemId);
    if (!target) return;

    const currentBalance = region === 'ITABAIANA' ? target.balanceItabaiana : target.balanceDores;
    if (currentItem.quantity > currentBalance) {
      alert(`Saldo insuficiente em ${region}. Disponível: ${currentBalance}`);
      return;
    }

    const existing = selectedItems.find(i => i.itemId === target.id);
    if (existing) {
      if ((existing.quantity + currentItem.quantity) > currentBalance) {
        alert("Quantidade total excede o estoque da regional.");
        return;
      }
      setSelectedItems(prev => prev.map(i => i.itemId === target.id ? { ...i, quantity: i.quantity + currentItem.quantity } : i));
    } else {
      setSelectedItems(prev => [...prev, { itemId: target.id, itemName: target.name, quantity: currentItem.quantity }]);
    }
    setSearchTerm('');
    setCurrentItem({ itemId: '', quantity: 1 });
    setIsDropdownOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vtr || selectedItems.length === 0) return;
    addRequest({ vtr, region, requesterName: requesterName.toUpperCase() || 'COLABORADOR', items: selectedItems });
    setIsSuccess(true);
    setTimeout(() => navigate('/'), 2500);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-6 text-center animate-fade-in">
        <div className="bg-green-500 p-8 rounded-[3rem] text-white shadow-2xl animate-bounce mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-black text-[#003366]">Pedido Enviado!</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] mt-2">Retirada em: {region}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in-up">
      <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-2xl border border-slate-50">
        <h2 className="text-3xl font-black text-[#003366] text-center mb-10">Solicitar <span className="text-[#FF8C00]">Material</span></h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Retirar em:</label>
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button type="button" onClick={() => { setRegion('ITABAIANA'); setSelectedItems([]); }} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${region === 'ITABAIANA' ? 'bg-white text-[#003366] shadow-sm' : 'text-slate-400'}`}>Itabaiana</button>
                <button type="button" onClick={() => { setRegion('DORES'); setSelectedItems([]); }} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${region === 'DORES' ? 'bg-white text-[#003366] shadow-sm' : 'text-slate-400'}`}>Dores</button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">VTR / Viatura</label>
              <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#003366] outline-none font-black text-[#003366] transition-colors" value={vtr} onChange={e => setVtr(e.target.value)} required>
                <option value="" className="text-slate-400">Selecione...</option>
                {VEHICLES.map(v => <option key={v} value={v} className="text-slate-800 font-bold">VTR {v}</option>)}
              </select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Solicitante</label>
              <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold uppercase text-slate-800 placeholder:text-slate-300 focus:border-[#003366] transition-colors" placeholder="Nome Completo" value={requesterName} onChange={e => setRequesterName(e.target.value)} required />
            </div>
          </div>

          <div className="bg-slate-50 p-6 md:p-10 rounded-[2.5rem] space-y-6 relative shadow-inner">
            <div className="absolute -top-3 left-10 bg-white px-4 py-1 text-[9px] font-black text-[#FF8C00] uppercase tracking-widest border rounded-full">Estoque Disponível</div>
            
            <div className="flex flex-col md:flex-row gap-4 items-end" ref={dropdownRef}>
              <div className="flex-1 space-y-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar Material</label>
                <input 
                  type="text" 
                  placeholder="Ex: Abracadeira..." 
                  className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-800 placeholder:text-slate-400 focus:border-[#FF8C00] transition-colors" 
                  value={searchTerm} 
                  onFocus={() => setIsDropdownOpen(true)} 
                  onChange={e => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }} 
                />
                
                {isDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden animate-scale-up border-orange-100">
                    {filteredOptions.length === 0 ? (
                      <div className="p-4 text-center text-xs font-bold text-slate-400 uppercase">Nenhum material com saldo em {region}</div>
                    ) : (
                      filteredOptions.map(item => (
                        <button 
                          key={item.id} 
                          type="button" 
                          onClick={() => { setCurrentItem({ ...currentItem, itemId: item.id }); setSearchTerm(item.name); setIsDropdownOpen(false); }} 
                          className="w-full text-left px-5 py-4 hover:bg-orange-50 border-b border-slate-50 last:border-0 group transition-colors"
                        >
                          <div className="text-[11px] font-black uppercase truncate text-slate-900 group-hover:text-[#FF8C00]">{item.name}</div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[9px] text-slate-400 font-mono font-bold tracking-tighter">CÓDIGO: {item.id}</span>
                            <span className="text-[10px] font-black text-[#FF8C00] bg-orange-100/50 px-2 py-0.5 rounded-md uppercase">
                              SALDO {region}: {region === 'ITABAIANA' ? item.balanceItabaiana : item.balanceDores}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="w-full md:w-24 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Qtd</label>
                <input 
                  type="number" 
                  min="1" 
                  className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-center text-xl text-slate-800 outline-none focus:border-[#FF8C00]" 
                  value={currentItem.quantity} 
                  onChange={e => setCurrentItem({...currentItem, quantity: Math.max(1, Number(e.target.value))})} 
                />
              </div>
              <button 
                type="button" 
                onClick={() => handleAddItem()} 
                className="w-full md:w-auto bg-[#FF8C00] text-white px-8 py-4 rounded-2xl font-black text-2xl shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center"
              >
                +
              </button>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200">
              {selectedItems.length > 0 && <h4 className="text-[9px] font-black text-slate-400 uppercase mb-2">Materiais para Retirar em {region}:</h4>}
              {selectedItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm animate-scale-up">
                  <span className="text-xs font-black text-slate-700 uppercase leading-tight max-w-[70%]">{item.itemName}</span>
                  <div className="flex items-center gap-4">
                    <span className="bg-orange-50 text-[#FF8C00] px-3 py-1 rounded-lg font-black text-sm border border-orange-100">x{item.quantity}</span>
                    <button type="button" onClick={() => setSelectedItems(prev => prev.filter(i => i.itemId !== item.itemId))} className="text-slate-300 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSyncing || selectedItems.length === 0} 
            className="w-full bg-[#003366] text-white py-6 rounded-3xl font-black text-lg uppercase shadow-2xl shadow-blue-100 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-95 hover:bg-blue-900"
          >
            {isSyncing ? 'Sincronizando...' : 'Finalizar Pedido'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestForm;
