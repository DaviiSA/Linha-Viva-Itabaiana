
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { BucketTruckIcon } from './components/Icons';
import { INITIAL_INVENTORY, GOOGLE_SHEETS_URL } from './constants';
import { InventoryItem, MaterialRequest, Transaction } from './types';
import Home from './screens/Home';
import AdminDashboard from './screens/AdminDashboard';
import RequestForm from './screens/RequestForm';
import AdminLogin from './screens/AdminLogin';

// Helper para migrar, filtrar e de-duplicar dados da nuvem
const migrateInventory = (items: any[]): InventoryItem[] => {
  if (!Array.isArray(items)) return [];

  const SYSTEM_KEYWORDS = [
    'NOVA_SOLICITACAO', 
    'ATUALIZACAO_STATUS_PEDIDO', 
    'MOVIMENTACAO_ESTOQUE', 
    'ATUALIZAR_ESTOQUE_TOTAL',
    'STATUS',
    'DATA',
    'ID_PEDIDO',
    'ID_TRANSACAO'
  ];

  const inventoryMap = new Map<string, InventoryItem>();

  items.forEach(item => {
    if (!item || (!item.name && !item.MATERIAL)) return;
    const name = String(item.name || item.MATERIAL).toUpperCase();
    
    // Ignora linhas de sistema ou cabeçalhos extras
    if (SYSTEM_KEYWORDS.some(kw => name.includes(kw))) return;
    
    const id = String(item.id || item.ID_MATERIAL || '').trim();
    if (!id || id.length > 20 || id.includes(':')) return;

    const balanceItabaiana = Number(item.balanceItabaiana ?? item.SALDO_ITABAIANA ?? 0);
    const balanceDores = Number(item.balanceDores ?? item.SALDO_DORES ?? 0);

    if (inventoryMap.has(id)) {
      // Se já existe, atualiza apenas se o saldo for maior (ou soma, mas aqui usaremos a última versão válida)
      const existing = inventoryMap.get(id)!;
      inventoryMap.set(id, {
        ...existing,
        balanceItabaiana: Math.max(existing.balanceItabaiana, balanceItabaiana),
        balanceDores: Math.max(existing.balanceDores, balanceDores)
      });
    } else {
      inventoryMap.set(id, {
        id,
        name,
        balanceItabaiana,
        balanceDores
      });
    }
  });

  return Array.from(inventoryMap.values());
};

const App: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('inventory');
    return saved ? migrateInventory(JSON.parse(saved)) : INITIAL_INVENTORY;
  });

  const [requests, setRequests] = useState<MaterialRequest[]>(() => {
    const saved = localStorage.getItem('requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [sheetsUrl, setSheetsUrl] = useState<string>(() => {
    const saved = localStorage.getItem('sheetsUrl');
    return saved || GOOGLE_SHEETS_URL;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);

  const fetchFromSheets = useCallback(async () => {
    const urlToUse = sheetsUrl || GOOGLE_SHEETS_URL;
    if (!urlToUse) return;

    setIsSyncing(true);
    setSyncError(false);
    try {
      const response = await fetch(`${urlToUse}?nocache=${Date.now()}`);
      if (!response.ok) throw new Error("Erro na resposta do servidor");
      
      const cloudData = await response.json();
      if (Array.isArray(cloudData) && cloudData.length > 0) {
        const filtered = migrateInventory(cloudData);
        if (filtered.length > 0) {
          setInventory(filtered);
          setLastSync(Date.now());
          localStorage.setItem('inventory', JSON.stringify(filtered));
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados da nuvem:", error);
      setSyncError(true);
    } finally {
      setIsSyncing(false);
    }
  }, [sheetsUrl]);

  const syncToGoogleSheets = async (payload: any, type: string) => {
    const urlToUse = sheetsUrl || GOOGLE_SHEETS_URL;
    if (!urlToUse) return false;

    setIsSyncing(true);
    setSyncError(false);
    try {
      const response = await fetch(urlToUse, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
          type, 
          payload,
          app: "Linha Viva",
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) throw new Error("Falha no POST");
      return true;
    } catch (error) {
      console.error(`Erro de Sincronização [${type}]:`, error);
      setSyncError(true);
      return false;
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  useEffect(() => {
    fetchFromSheets();
  }, [fetchFromSheets]);

  useEffect(() => {
    localStorage.setItem('requests', JSON.stringify(requests));
  }, [requests]);

  const addItem = async (item: InventoryItem) => {
    const updatedInv = [item, ...inventory];
    setInventory(updatedInv);
    localStorage.setItem('inventory', JSON.stringify(updatedInv));
    await syncToGoogleSheets(updatedInv, 'ATUALIZAR_ESTOQUE_TOTAL');
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const item = inventory.find(i => i.id === transaction.itemId);
    if (!item) return;

    const updatedInv = inventory.map(i => {
      if (i.id === transaction.itemId) {
        const delta = transaction.type === 'in' ? transaction.quantity : -transaction.quantity;
        return {
          ...i,
          balanceItabaiana: transaction.region === 'ITABAIANA' ? Math.max(0, i.balanceItabaiana + delta) : i.balanceItabaiana,
          balanceDores: transaction.region === 'DORES' ? Math.max(0, i.balanceDores + delta) : i.balanceDores
        };
      }
      return i;
    });

    setInventory(updatedInv);
    localStorage.setItem('inventory', JSON.stringify(updatedInv));

    await syncToGoogleSheets({
      ID_TRANSACAO: `TX-${Date.now()}`,
      DATA: new Date().toLocaleString('pt-BR'),
      ID_MATERIAL: transaction.itemId,
      MATERIAL: item.name.toUpperCase(),
      MOVIMENTACAO: `${transaction.type === 'in' ? 'ENTRADA' : 'SAÍDA'} (${transaction.region})`,
      QUANTIDADE: transaction.quantity,
      OBSERVACAO: transaction.description.toUpperCase(),
      SALDO_FINAL: transaction.region === 'ITABAIANA' ? updatedInv.find(i => i.id === item.id)?.balanceItabaiana : updatedInv.find(i => i.id === item.id)?.balanceDores
    }, 'MOVIMENTACAO_ESTOQUE');

    await syncToGoogleSheets(updatedInv, 'ATUALIZAR_ESTOQUE_TOTAL');
  };

  const addRequest = async (request: Omit<MaterialRequest, 'id' | 'timestamp' | 'status'>) => {
    const newRequest: MaterialRequest = {
      ...request,
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      timestamp: Date.now(),
      status: 'pending',
    };
    
    setRequests(prev => [newRequest, ...prev]);
    
    await syncToGoogleSheets({
      ID_PEDIDO: newRequest.id,
      DATA: new Date(newRequest.timestamp).toLocaleString('pt-BR'),
      VTR: newRequest.vtr,
      REGIAO: newRequest.region.toUpperCase(),
      SOLICITANTE: newRequest.requesterName.toUpperCase(),
      ITENS: newRequest.items.map(i => `${i.itemName} (${i.quantity})`).join(' | '),
      STATUS: 'PENDENTE'
    }, 'NOVA_SOLICITACAO');
  };

  const updateRequestStatus = async (id: string, status: 'pending' | 'served') => {
    const request = requests.find(r => r.id === id);
    if (!request || request.status === status) return;

    let updatedInv = [...inventory];
    const logs = [];

    if (status === 'served') {
      const regionKey = request.region === 'ITABAIANA' ? 'balanceItabaiana' : 'balanceDores';
      
      for (const reqItem of request.items) {
        updatedInv = updatedInv.map(invItem => {
          if (invItem.id === reqItem.itemId) {
            return { ...invItem, [regionKey]: Math.max(0, invItem[regionKey] - reqItem.quantity) };
          }
          return invItem;
        });

        logs.push({
          ID_TRANSACAO: `PED-${request.vtr}-${Date.now()}`,
          DATA: new Date().toLocaleString('pt-BR'),
          ID_MATERIAL: reqItem.itemId,
          MATERIAL: reqItem.itemName.toUpperCase(),
          MOVIMENTACAO: `SAÍDA (${request.region})`,
          QUANTIDADE: reqItem.quantity,
          OBSERVACAO: `ATENDIMENTO VTR ${request.vtr} - ${request.requesterName.toUpperCase()}`
        });
      }

      for (const log of logs) {
        await syncToGoogleSheets(log, 'MOVIMENTACAO_ESTOQUE');
      }
      
      setInventory(updatedInv);
      localStorage.setItem('inventory', JSON.stringify(updatedInv));
      await syncToGoogleSheets(updatedInv, 'ATUALIZAR_ESTOQUE_TOTAL');
    }

    setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
    await syncToGoogleSheets({ 
      ID_PEDIDO: id, 
      STATUS: status === 'served' ? 'ATENDIDO' : 'PENDENTE' 
    }, 'ATUALIZACAO_STATUS_PEDIDO');
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <header className="bg-[#003366] text-white p-4 shadow-xl flex items-center justify-between sticky top-0 z-50">
          <Link to="/" className="flex items-center gap-3 group">
            <BucketTruckIcon className="w-10 h-10 text-white group-hover:text-[#FF8C00] transition-colors" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Linha Viva</h1>
              <p className="text-[10px] uppercase tracking-widest opacity-80">Gestão Regional</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {isSyncing && (
              <div className="flex items-center gap-2 text-[10px] bg-orange-500/20 text-orange-200 px-4 py-2 rounded-full border border-orange-500/30 font-black animate-pulse">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-ping"></span>
                {syncError ? 'ERRO DE SYNC' : 'SINCRONIZANDO...'}
              </div>
            )}
            {syncError && !isSyncing && (
              <button onClick={fetchFromSheets} className="bg-red-500 text-white text-[9px] px-3 py-1 rounded-full font-bold animate-pulse">Falha na Nuvem - Tentar de novo</button>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard inventory={inventory} requests={requests} addTransaction={addTransaction} addItem={addItem} updateRequestStatus={updateRequestStatus} setInventory={setInventory} sheetsUrl={sheetsUrl} setSheetsUrl={setSheetsUrl} fetchFromSheets={fetchFromSheets} lastSync={lastSync} />} />
            <Route path="/request" element={<RequestForm inventory={inventory} addRequest={addRequest} isSyncing={isSyncing} />} />
          </Routes>
        </main>
        <footer className="bg-white text-gray-400 text-[10px] p-3 text-center border-t">
          &copy; {new Date().getFullYear()} Linha Viva - Gestão Multi-Depósito
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
