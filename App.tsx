
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { BucketTruckIcon } from './components/Icons';
import { INITIAL_INVENTORY, GOOGLE_SHEETS_URL } from './constants';
import { InventoryItem, MaterialRequest, Transaction } from './types';
import Home from './screens/Home';
import AdminDashboard from './screens/AdminDashboard';
import RequestForm from './screens/RequestForm';
import AdminLogin from './screens/AdminLogin';

const App: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [requests, setRequests] = useState<MaterialRequest[]>(() => {
    const saved = localStorage.getItem('requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [sheetsUrl, setSheetsUrl] = useState<string>(() => {
    const saved = localStorage.getItem('sheetsUrl');
    return saved || GOOGLE_SHEETS_URL;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);

  // Função para buscar dados da Planilha
  const fetchFromSheets = useCallback(async () => {
    const urlToUse = sheetsUrl || GOOGLE_SHEETS_URL;
    if (!urlToUse) return;

    setIsSyncing(true);
    try {
      const response = await fetch(urlToUse);
      if (response.ok) {
        const cloudData = await response.json();
        if (Array.isArray(cloudData) && cloudData.length > 0) {
          setInventory(cloudData);
          setLastSync(Date.now());
          console.log("Linha Viva: Dados sincronizados da nuvem.");
        }
      }
    } catch (error) {
      console.warn("Linha Viva: Não foi possível baixar dados da nuvem. Usando local.", error);
    } finally {
      setIsSyncing(false);
    }
  }, [sheetsUrl]);

  // Sincroniza ao abrir o App
  useEffect(() => {
    fetchFromSheets();
  }, [fetchFromSheets]);

  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('sheetsUrl', sheetsUrl);
  }, [sheetsUrl]);

  const syncToGoogleSheets = async (payload: any, type: string) => {
    const urlToUse = sheetsUrl || GOOGLE_SHEETS_URL;
    if (!urlToUse) return;

    setIsSyncing(true);
    try {
      await fetch(urlToUse, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          type,
          payload,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error("Linha Viva: Erro de rede na sincronização", error);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const processInventoryUpdate = (transaction: Omit<Transaction, 'id' | 'timestamp'>, currentInventory: InventoryItem[]) => {
    const item = currentInventory.find(i => i.id === transaction.itemId);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };

    const syncPayload = {
      ...newTransaction,
      itemName: item ? item.name : "Material Desconhecido"
    };

    setTransactions(prev => [newTransaction, ...prev]);
    syncToGoogleSheets(syncPayload, 'MOVIMENTACAO_ESTOQUE');

    return currentInventory.map(it => {
      if (it.id === transaction.itemId) {
        const delta = transaction.type === 'in' ? transaction.quantity : -transaction.quantity;
        return { ...it, balance: Math.max(0, it.balance + delta) };
      }
      return it;
    });
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const updatedInventory = processInventoryUpdate(transaction, inventory);
    setInventory(updatedInventory);
    syncToGoogleSheets(updatedInventory, 'ATUALIZAR_ESTOQUE_TOTAL');
  };

  const addRequest = (request: Omit<MaterialRequest, 'id' | 'timestamp' | 'status'>) => {
    const newRequest: MaterialRequest = {
      ...request,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      status: 'pending',
    };
    setRequests(prev => [newRequest, ...prev]);
    syncToGoogleSheets(newRequest, 'NOVA_SOLICITACAO');
  };

  const updateRequestStatus = (id: string, status: 'pending' | 'served') => {
    const request = requests.find(r => r.id === id);
    if (!request) return;

    let updatedInv = [...inventory];

    if (status === 'served' && request.status !== 'served') {
      request.items.forEach(reqItem => {
        updatedInv = processInventoryUpdate({
          itemId: reqItem.itemId,
          type: 'out',
          quantity: reqItem.quantity,
          description: `Atendimento VTR ${request.vtr}`
        }, updatedInv);
      });
      
      setInventory(updatedInv);
      syncToGoogleSheets(updatedInv, 'ATUALIZAR_ESTOQUE_TOTAL');
    }

    setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
    syncToGoogleSheets({ id, status, vtr: request.vtr }, 'ATUALIZACAO_STATUS_PEDIDO');
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <header className="bg-[#003366] text-white p-4 shadow-xl flex items-center justify-between sticky top-0 z-50">
          <Link to="/" className="flex items-center gap-3 group">
            <BucketTruckIcon className="w-10 h-10 text-white group-hover:text-[#FF8C00] transition-colors" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Linha Viva</h1>
              <p className="text-[10px] uppercase tracking-widest opacity-80">Itabaiana</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {isSyncing && (
              <div className="flex items-center gap-2 text-[10px] bg-orange-500/20 text-orange-200 px-3 py-1.5 rounded-full animate-pulse border border-orange-500/30">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-ping"></span>
                CONECTANDO NUVEM...
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <AdminDashboard 
                  inventory={inventory} 
                  requests={requests} 
                  addTransaction={addTransaction}
                  updateRequestStatus={updateRequestStatus}
                  setInventory={setInventory}
                  sheetsUrl={sheetsUrl}
                  setSheetsUrl={setSheetsUrl}
                  fetchFromSheets={fetchFromSheets}
                  lastSync={lastSync}
                />
              } 
            />
            <Route 
              path="/request" 
              element={<RequestForm inventory={inventory} addRequest={addRequest} isSyncing={isSyncing} />} 
            />
          </Routes>
        </main>

        <footer className="bg-white text-gray-400 text-[10px] p-3 text-center border-t">
          &copy; {new Date().getFullYear()} Linha Viva Itabaiana - Gestão de Materiais
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
