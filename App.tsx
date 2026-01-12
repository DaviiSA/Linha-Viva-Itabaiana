
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { BucketTruckIcon } from './components/Icons';
import { INITIAL_INVENTORY, GOOGLE_SHEETS_URL } from './constants';
import { InventoryItem, MaterialRequest, Transaction } from './types';
import Home from './screens/Home';
import AdminDashboard from './screens/AdminDashboard';
import RequestForm from './screens/RequestForm';
import AdminLogin from './screens/AdminLogin';

// Helper para converter dados crus da planilha para o formato do App
const migrateInventory = (items: any[]): InventoryItem[] => {
  if (!Array.isArray(items)) return [];

  const inventoryMap = new Map<string, InventoryItem>();

  items.forEach(item => {
    if (!item) return;
    
    // Suporta nomes de colunas do Google Script ou do App
    const name = String(item.MATERIAL || item.name || '').toUpperCase();
    const id = String(item.ID_MATERIAL || item.id || '').trim();
    
    // Ignora linhas inválidas ou de log
    if (!id || id.length > 20 || name.includes('STATUS') || name.includes('PEDIDO')) return;

    const balanceItabaiana = Number(item.SALDO_ITABAIANA ?? item.balanceItabaiana ?? 0);
    const balanceDores = Number(item.SALDO_DORES ?? item.balanceDores ?? 0);

    inventoryMap.set(id, {
      id,
      name,
      balanceItabaiana,
      balanceDores
    });
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
  const isFetchingRef = useRef(false);

  const fetchFromSheets = useCallback(async () => {
    if (isFetchingRef.current) return;
    
    const urlToUse = sheetsUrl || GOOGLE_SHEETS_URL;
    if (!urlToUse) return;

    isFetchingRef.current = true;
    setIsSyncing(true);
    setSyncError(false);
    
    try {
      // Adiciona timestamp para evitar cache do navegador
      const response = await fetch(`${urlToUse}?nocache=${Date.now()}`);
      if (!response.ok) throw new Error("Erro de conexão com o Google");
      
      const cloudData = await response.json();
      
      if (Array.isArray(cloudData)) {
        const filtered = migrateInventory(cloudData);
        // Só atualiza se trouxer dados válidos, senão mantém o local
        if (filtered.length > 0) {
          setInventory(filtered);
          setLastSync(Date.now());
          localStorage.setItem('inventory', JSON.stringify(filtered));
        }
      }
    } catch (error) {
      console.error("Erro ao puxar dados:", error);
      setSyncError(true);
    } finally {
      setIsSyncing(false);
      isFetchingRef.current = false;
    }
  }, [sheetsUrl]);

  // Polling e Visibility Sync
  useEffect(() => {
    fetchFromSheets();
    const interval = setInterval(fetchFromSheets, 45000); // 45 segundos para poupar cota do Google
    
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchFromSheets();
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchFromSheets]);

  const syncToGoogleSheets = async (payload: any, type: string) => {
    const urlToUse = sheetsUrl || GOOGLE_SHEETS_URL;
    if (!urlToUse) return false;

    setIsSyncing(true);
    try {
      const response = await fetch(urlToUse, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow', // Essencial para Google Apps Script
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ type, payload, timestamp: new Date().toISOString() })
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        return true;
      }
      throw new Error(result.message || "Erro no servidor");
    } catch (error) {
      console.error(`Falha no envio [${type}]:`, error);
      setSyncError(true);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const addItem = async (item: InventoryItem) => {
    const updated = [item, ...inventory];
    setInventory(updated);
    const success = await syncToGoogleSheets(updated, 'ATUALIZAR_ESTOQUE_TOTAL');
    if (success) fetchFromSheets();
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const item = inventory.find(i => i.id === transaction.itemId);
    if (!item) return;

    const delta = transaction.type === 'in' ? transaction.quantity : -transaction.quantity;
    const updatedInv = inventory.map(i => {
      if (i.id === transaction.itemId) {
        return {
          ...i,
          balanceItabaiana: transaction.region === 'ITABAIANA' ? Math.max(0, i.balanceItabaiana + delta) : i.balanceItabaiana,
          balanceDores: transaction.region === 'DORES' ? Math.max(0, i.balanceDores + delta) : i.balanceDores
        };
      }
      return i;
    });

    setInventory(updatedInv);

    // Primeiro envia a movimentação para o log
    await syncToGoogleSheets({
      ID_TRANSACAO: `TX-${Date.now()}`,
      DATA: new Date().toLocaleString('pt-BR'),
      ID_MATERIAL: item.id,
      MATERIAL: item.name,
      MOVIMENTACAO: `${transaction.type === 'in' ? 'ENTRADA' : 'SAÍDA'} (${transaction.region})`,
      QUANTIDADE: transaction.quantity,
      OBSERVACAO: transaction.description.toUpperCase(),
      SALDO_FINAL: transaction.region === 'ITABAIANA' ? updatedInv.find(i => i.id === item.id)?.balanceItabaiana : updatedInv.find(i => i.id === item.id)?.balanceDores
    }, 'MOVIMENTACAO_ESTOQUE');

    // Depois atualiza o saldo total
    await syncToGoogleSheets(updatedInv, 'ATUALIZAR_ESTOQUE_TOTAL');
    fetchFromSheets();
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

    if (status === 'served') {
      let currentInv = [...inventory];
      const regionKey = request.region === 'ITABAIANA' ? 'balanceItabaiana' : 'balanceDores';
      
      // Processa cada item do pedido
      for (const reqItem of request.items) {
        currentInv = currentInv.map(invItem => {
          if (invItem.id === reqItem.itemId) {
            return { ...invItem, [regionKey]: Math.max(0, invItem[regionKey] - reqItem.quantity) };
          }
          return invItem;
        });

        // Registra cada saída no log individualmente para garantir integridade
        await syncToGoogleSheets({
          ID_TRANSACAO: `PED-${request.vtr}-${Date.now()}`,
          DATA: new Date().toLocaleString('pt-BR'),
          ID_MATERIAL: reqItem.itemId,
          MATERIAL: reqItem.itemName.toUpperCase(),
          MOVIMENTACAO: `SAÍDA (${request.region})`,
          QUANTIDADE: reqItem.quantity,
          OBSERVACAO: `ATENDIMENTO VTR ${request.vtr} - ${request.requesterName}`
        }, 'MOVIMENTACAO_ESTOQUE');
      }
      
      setInventory(currentInv);
      await syncToGoogleSheets(currentInv, 'ATUALIZAR_ESTOQUE_TOTAL');
    }

    setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
    await syncToGoogleSheets({ 
      ID_PEDIDO: id, 
      STATUS: status === 'served' ? 'ATENDIDO' : 'PENDENTE' 
    }, 'ATUALIZACAO_STATUS_PEDIDO');
    
    fetchFromSheets();
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <header className="bg-[#003366] text-white p-4 shadow-xl flex items-center justify-between sticky top-0 z-50">
          <Link to="/" className="flex items-center gap-3 group">
            <BucketTruckIcon className="w-10 h-10 text-white group-hover:text-[#FF8C00] transition-colors" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Linha Viva</h1>
              <p className="text-[10px] uppercase tracking-widest opacity-80">
                {syncError ? 'Modo Offline' : 'Sistema Nuvem'}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {isSyncing ? (
              <div className="flex items-center gap-2 text-[10px] bg-[#FF8C00] text-white px-3 py-1.5 rounded-full font-black animate-pulse">
                SYNC
              </div>
            ) : (
              <div className={`w-2 h-2 rounded-full ${syncError ? 'bg-red-500' : 'bg-green-500'} shadow-sm shadow-current`}></div>
            )}
            {syncError && (
              <button onClick={fetchFromSheets} className="bg-red-500/10 text-red-500 text-[9px] px-2 py-1 rounded border border-red-500/20 font-bold">RECONECTAR</button>
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
          &copy; {new Date().getFullYear()} Linha Viva - {lastSync ? `Última atualização: ${new Date(lastSync).toLocaleTimeString()}` : 'Conectando...'}
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
