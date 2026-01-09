
export interface InventoryItem {
  id: string;
  name: string;
  balance: number;
}

export interface RequestedItem {
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface MaterialRequest {
  id: string;
  vtr: string;
  items: RequestedItem[];
  status: 'pending' | 'served';
  timestamp: number;
  requesterName: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  type: 'in' | 'out';
  quantity: number;
  timestamp: number;
  description: string;
}
