
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

  const [sheetsUrl, setSheetsUrl] = useState<string>(() => {
    const saved = localStorage.getItem('sheetsUrl');
    return saved || GOOGLE_SHEETS_URL;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);

  const fetchFromSheets = useCallback(async () => {
    const urlToUse = sheetsUrl || GOOGLE_SHEETS_URL;
    if (!urlToUse) return;

    setIsSyncing(true);
    try {
      const response = await fetch(`${urlToUse}?nocache=${Date.now()}`);
      if (response.ok) {
        const cloudData = await response.json();
        if (Array.isArray(cloudData) && cloudData.length > 0) {
          setInventory(cloudData);
          setLastSync(Date.now());
          localStorage.setItem('inventory', JSON.stringify(cloudData));
        }
      }
    } catch (error) {
      console.warn("Linha Viva: Falha ao carregar dados da nuvem. Usando local.", error);
    } finally {
      setIsSyncing(false);
    }
  }, [sheetsUrl]);

  const syncToGoogleSheets = async (payload: any, type: string) => {
    const urlToUse = sheetsUrl || GOOGLE_SHEETS_URL;
    if (!urlToUse) {
      console.error("URL da planilha não configurada.");
      return false;
    }

    setIsSyncing(true);
    try {
      const response = await fetch(urlToUse, {
        method: 'POST',
        mode: 'cors', 
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Obrigatório para evitar Preflight OPTIONS no Apps Script
        },
        body: JSON.stringify({ type, payload })
      });
      
      const text = await response.text();
      try {
        const result = JSON.parse(text);
        console.log(`Linha Viva: Sync [${type}] - ${result.status}`);
        return result.status === 'success';
      } catch (e) {
        console.log(`Linha Viva: Resposta recebida, mas não é JSON. Verifique a implantação.`);
        return true; // Muitas vezes o registro ocorre mesmo que o JSON falhe no retorno
      }
    } catch (error) {
      console.error(`Linha Viva: Erro crítico na sincronização [${type}]`, error);
      return false;
    } finally {
      setTimeout(() => setIsSyncing(false), 1500);
    }
  };

  useEffect(() => {
    fetchFromSheets();
  }, [fetchFromSheets]);

  useEffect(() => {
    localStorage.setItem('requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('sheetsUrl', sheetsUrl);
  }, [sheetsUrl]);

  const addItem = async (item: InventoryItem) => {
    const updatedInv = [item, ...inventory];
    setInventory(updatedInv);
    localStorage.setItem('inventory', JSON.stringify(updatedInv));

    // Primeiro envia o estoque total
    await syncToGoogleSheets(updatedInv, 'ATUALIZAR_ESTOQUE_TOTAL');
    
    // Depois registra a movimentação de entrada inicial
    const logPayload = {
      ID_TRANSACAO: `CAD-${Date.now()}`,
      DATA: new Date().toLocaleString('pt-BR'),
      ID_MATERIAL: item.id,
      MATERIAL: item.name.toUpperCase(),
      MOVIMENTACAO: 'ENTRADA',
      QUANTIDADE: item.balance,
      OBSERVACAO: `CADASTRO INICIAL`
    };
    
    await syncToGoogleSheets(logPayload, 'MOVIMENTACAO_ESTOQUE');
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const item = inventory.find(i => i.id === transaction.itemId);
    const itemName = item ? item.name : 'MATERIAL DESCONHECIDO';

    const fullTx: Transaction = {
      ...transaction,
      id: `TX-${Date.now()}`,
      timestamp: Date.now(),
    };

    const updatedInv = inventory.map(i => {
      if (i.id === transaction.itemId) {
        const delta = transaction.type === 'in' ? transaction.quantity : -transaction.quantity;
        return { ...i, balance: Math.max(0, i.balance + delta) };
      }
      return i;
    });

    setInventory(updatedInv);
    localStorage.setItem('inventory', JSON.stringify(updatedInv));

    // 1. Log da Movimentação (Mais importante para rastro)
    const logPayload = {
      ID_TRANSACAO: fullTx.id,
      DATA: new Date(fullTx.timestamp).toLocaleString('pt-BR'),
      ID_MATERIAL: fullTx.itemId,
      MATERIAL: itemName.toUpperCase(),
      MOVIMENTACAO: fullTx.type === 'in' ? 'ENTRADA' : 'SAÍDA',
      QUANTIDADE: fullTx.quantity,
      OBSERVACAO: (fullTx.description || 'MOVIMENTAÇÃO MANUAL').toUpperCase()
    };
    await syncToGoogleSheets(logPayload, 'MOVIMENTACAO_ESTOQUE');

    // 2. Atualiza Saldo na aba Estoque
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
    
    const requestPayload = {
      ID_PEDIDO: newRequest.id,
      DATA: new Date(newRequest.timestamp).toLocaleString('pt-BR'),
      VTR: newRequest.vtr,
      SOLICITANTE: newRequest.requesterName.toUpperCase(),
      ITENS: newRequest.items.map(i => `${i.itemName} (${i.quantity})`).join(' | '),
      STATUS: 'PENDENTE'
    };

    await syncToGoogleSheets(requestPayload, 'NOVA_SOLICITACAO');
  };

  const updateRequestStatus = async (id: string, status: 'pending' | 'served') => {
    const request = requests.find(r => r.id === id);
    if (!request || request.status === status) return;

    let updatedInv = [...inventory];

    if (status === 'served') {
      setIsSyncing(true);
      
      // Itera sobre os itens do pedido e registra as movimentações e atualiza o saldo
      for (const reqItem of request.items) {
        updatedInv = updatedInv.map(invItem => {
          if (invItem.id === reqItem.itemId) {
            return { ...invItem, balance: Math.max(0, invItem.balance - reqItem.quantity) };
          }
          return invItem;
        });

        const logPayload = {
          ID_TRANSACAO: `PED-${request.vtr}-${Date.now()}`,
          DATA: new Date().toLocaleString('pt-BR'),
          ID_MATERIAL: reqItem.itemId,
          MATERIAL: reqItem.itemName.toUpperCase(),
          MOVIMENTACAO: 'SAÍDA',
          QUANTIDADE: reqItem.quantity,
          OBSERVACAO: `ATENDIMENTO VTR ${request.vtr} - ${request.requesterName.toUpperCase()}`
        };
        
        await syncToGoogleSheets(logPayload, 'MOVIMENTACAO_ESTOQUE');
      }
      
      setInventory(updatedInv);
      localStorage.setItem('inventory', JSON.stringify(updatedInv));
      await syncToGoogleSheets(updatedInv, 'ATUALIZAR_ESTOQUE_TOTAL');
    }

    // Atualiza o status na planilha
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
              <p className="text-[10px] uppercase tracking-widest opacity-80">Itabaiana</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {isSyncing && (
              <div className="flex items-center gap-2 text-[10px] bg-orange-500/20 text-orange-200 px-4 py-2 rounded-full border border-orange-500/30 font-black animate-pulse">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-ping"></span>
                SINCRONIZANDO...
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
                  addItem={addItem}
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
