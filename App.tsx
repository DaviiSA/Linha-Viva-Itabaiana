
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { BucketTruckIcon } from './components/Icons';
import { INITIAL_INVENTORY, GOOGLE_SHEETS_URL } from './constants';
import { InventoryItem, MaterialRequest, Transaction } from './types';
import Home from './screens/Home';
import AdminDashboard from './screens/AdminDashboard';
import RequestForm from './screens/RequestForm';
import AdminLogin from './screens/AdminLogin';

// Converte dados crus da planilha para o Formato de Inventário do App
const migrateInventory = (items: any[]): InventoryItem[] => {
  if (!Array.isArray(items)) return [];
  return items
    .filter(item => item && (item.ID_MATERIAL || item.id))
    .map(item => ({
      id: String(item.ID_MATERIAL || item.id || '').trim(),
      name: String(item.MATERIAL || item.name || '').toUpperCase().trim(),
      balanceItabaiana: Number(item.SALDO_ITABAIANA ?? item.balanceItabaiana ?? 0),
      balanceDores: Number(item.SALDO_DORES ?? item.balanceDores ?? 0)
    }))
    .filter(item => item.id !== "" && !item.name.includes("STATUS") && !item.name.includes("DATA"));
};

// Converte dados crus da planilha para o Formato de Pedidos do App
const migrateRequests = (items: any[]): MaterialRequest[] => {
  if (!Array.isArray(items)) return [];
  return items.map(item => {
    if (!item || (!item.ID_PEDIDO && !item.id)) return null;

    const itemsRaw = String(item.ITENS || '');
    const parsedItems = itemsRaw.split(' | ').filter(s => s).map(s => {
      const match = s.match(/(.+) \((\d+)\)/);
      return {
        itemId: 'cloud',
        itemName: match ? match[1].trim() : s.trim(),
        quantity: match ? parseInt(match[2]) : 1
      };
    });

    return {
      id: String(item.ID_PEDIDO || item.id || ''),
      vtr: String(item.VTR || ''),
      region: String(item.REGIAO || 'ITABAIANA').toUpperCase(),
      requesterName: String(item.SOLICITANTE || 'N/A').toUpperCase(),
      status: (String(item.STATUS || '').toLowerCase().includes('atendido') ? 'served' : 'pending') as 'served' | 'pending',
      timestamp: item.DATA ? new Date(item.DATA).getTime() : Date.now(),
      items: parsedItems
    } as MaterialRequest;
  }).filter((r): r is MaterialRequest => r !== null && r.id !== "");
};

const App: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('inventory');
    return saved ? migrateInventory(JSON.parse(saved)) : INITIAL_INVENTORY;
  });

  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [sheetsUrl, setSheetsUrl] = useState<string>(() => localStorage.getItem('sheetsUrl') || GOOGLE_SHEETS_URL);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const isFetchingRef = useRef(false);

  // BUSCA GLOBAL: Estoque e Pedidos
  const fetchFromSheets = useCallback(async () => {
    if (isFetchingRef.current) return;
    const urlToUse = sheetsUrl || GOOGLE_SHEETS_URL;
    if (!urlToUse) return;

    isFetchingRef.current = true;
    setIsSyncing(true);
    
    try {
      // 1. Busca Estoque
      const invRes = await fetch(`${urlToUse}?action=read&t=${Date.now()}`, { cache: 'no-store' });
      if (invRes.ok) {
        const cloudInv = await invRes.json();
        const filteredInv = migrateInventory(cloudInv);
        if (filteredInv.length > 0) {
          setInventory(filteredInv);
          localStorage.setItem('inventory', JSON.stringify(filteredInv));
        }
      } else {
        console.error("Erro ao ler estoque: Status", invRes.status);
      }

      // 2. Busca Pedidos
      const reqRes = await fetch(`${urlToUse}?action=read_requests&t=${Date.now()}`, { cache: 'no-store' });
      if (reqRes.ok) {
        const cloudReq = await reqRes.json();
        const filteredReq = migrateRequests(cloudReq);
        setRequests(filteredReq);
      } else {
        console.warn("Erro ao ler pedidos ou ação 'read_requests' não existe no script.");
      }

      setLastSync(Date.now());
      setSyncError(false);
    } catch (error) {
      console.error("Falha crítica na sincronização:", error);
      setSyncError(true);
    } finally {
      setIsSyncing(false);
      isFetchingRef.current = false;
    }
  }, [sheetsUrl]);

  useEffect(() => {
    fetchFromSheets();
    const interval = setInterval(fetchFromSheets, 60000); // 1 minuto
    return () => clearInterval(interval);
  }, [fetchFromSheets]);

  const syncToGoogleSheets = async (payload: any, type: string) => {
    const urlToUse = sheetsUrl || GOOGLE_SHEETS_URL;
    if (!urlToUse) return false;

    setIsSyncing(true);
    try {
      // Usamos text/plain para evitar o Preflight CORS (OPTIONS)
      await fetch(urlToUse, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ type, payload, timestamp: new Date().toISOString() })
      });
      
      // Como mode 'no-cors' não permite ler a resposta, aguardamos e forçamos refresh
      setTimeout(fetchFromSheets, 3000);
      return true;
    } catch (error) {
      console.error(`Erro ao enviar ${type}:`, error);
      setSyncError(true);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const addItem = async (item: InventoryItem) => {
    const updated = [item, ...inventory];
    setInventory(updated);
    const cleanPayload = updated.map(i => ({
      ID_MATERIAL: i.id,
      MATERIAL: i.name,
      SALDO_ITABAIANA: i.balanceItabaiana,
      SALDO_DORES: i.balanceDores
    }));
    await syncToGoogleSheets(cleanPayload, 'ATUALIZAR_ESTOQUE_TOTAL');
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
    const targetItem = updatedInv.find(i => i.id === item.id);
    
    await syncToGoogleSheets({
      DATA: new Date().toLocaleString('pt-BR'),
      ID_MATERIAL: item.id,
      MATERIAL: item.name,
      MOVIMENTACAO: `${transaction.type === 'in' ? 'ENTRADA' : 'SAÍDA'} (${transaction.region})`,
      QUANTIDADE: transaction.quantity,
      OBSERVACAO: transaction.description.toUpperCase(),
      SALDO_FINAL: transaction.region === 'ITABAIANA' ? targetItem?.balanceItabaiana : targetItem?.balanceDores
    }, 'MOVIMENTACAO_ESTOQUE');

    const cleanPayload = updatedInv.map(i => ({
      ID_MATERIAL: i.id,
      MATERIAL: i.name,
      SALDO_ITABAIANA: i.balanceItabaiana,
      SALDO_DORES: i.balanceDores
    }));
    await syncToGoogleSheets(cleanPayload, 'ATUALIZAR_ESTOQUE_TOTAL');
  };

  const addRequest = async (request: Omit<MaterialRequest, 'id' | 'timestamp' | 'status'>) => {
    const requestId = `PED-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    await syncToGoogleSheets({
      ID_PEDIDO: requestId,
      DATA: new Date().toLocaleString('pt-BR'),
      VTR: request.vtr,
      REGIAO: request.region.toUpperCase(),
      SOLICITANTE: request.requesterName.toUpperCase(),
      ITENS: request.items.map(i => `${i.itemName} (${i.quantity})`).join(' | '),
      STATUS: 'PENDENTE'
    }, 'NOVA_SOLICITACAO');
  };

  const updateRequestStatus = async (id: string, status: 'pending' | 'served') => {
    const request = requests.find(r => r.id === id);
    if (!request || request.status === status) return;

    if (status === 'served') {
      let currentInv = [...inventory];
      const regionKey = request.region === 'ITABAIANA' ? 'balanceItabaiana' : 'balanceDores';
      
      for (const reqItem of request.items) {
        currentInv = currentInv.map(invItem => {
          if (invItem.name === reqItem.itemName || invItem.id === reqItem.itemId) {
            return { ...invItem, [regionKey]: Math.max(0, invItem[regionKey] - reqItem.quantity) };
          }
          return invItem;
        });

        await syncToGoogleSheets({
          DATA: new Date().toLocaleString('pt-BR'),
          ID_MATERIAL: reqItem.itemId,
          MATERIAL: reqItem.itemName.toUpperCase(),
          MOVIMENTACAO: `SAÍDA (${request.region})`,
          QUANTIDADE: reqItem.quantity,
          OBSERVACAO: `ATENDIMENTO VTR ${request.vtr} - ${request.requesterName}`
        }, 'MOVIMENTACAO_ESTOQUE');
      }
      
      setInventory(currentInv);
      const cleanPayload = currentInv.map(i => ({
        ID_MATERIAL: i.id,
        MATERIAL: i.name,
        SALDO_ITABAIANA: i.balanceItabaiana,
        SALDO_DORES: i.balanceDores
      }));
      await syncToGoogleSheets(cleanPayload, 'ATUALIZAR_ESTOQUE_TOTAL');
    }

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
              <p className="text-[10px] uppercase tracking-widest opacity-80">
                {syncError ? 'Erro de Conexão' : (isSyncing ? 'Sincronizando...' : 'Online')}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full ${syncError ? 'bg-red-500 animate-pulse' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}></div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto smooth-scroll">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard inventory={inventory} requests={requests} addTransaction={addTransaction} addItem={addItem} updateRequestStatus={updateRequestStatus} setInventory={setInventory} sheetsUrl={sheetsUrl} setSheetsUrl={setSheetsUrl} fetchFromSheets={fetchFromSheets} lastSync={lastSync} />} />
            <Route path="/request" element={<RequestForm inventory={inventory} addRequest={addRequest} isSyncing={isSyncing} />} />
          </Routes>
        </main>
        <footer className="bg-white text-gray-400 text-[10px] p-3 text-center border-t">
          {lastSync ? `Atualizado em: ${new Date(lastSync).toLocaleTimeString()}` : 'Tentando conectar à nuvem...'}
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
