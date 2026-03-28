export type ItemType = 'MATERIAL' | 'EQUIPMENT';

export type ItemStatus = 'IN_USE' | 'AVAILABLE' | 'LOW_STOCK' | 'MAINTENANCE';

export interface EquipmentItem {
  id: number;
  itemName: string;
  itemType: ItemType;
  totalQuantity: number;
  availableQuantity: number;
  sku: string;
  location: string;
  status: ItemStatus;
  description?: string;
  stockLevel?: number; // percentage 0-100
}

export interface CreateItemRequest {
  itemName: string;
  itemType: ItemType;
  totalQuantity: number;
  availableQuantity: number;
}

export interface UpdateItemRequest {
  itemName?: string;
  itemType?: ItemType;
  totalQuantity?: number;
  availableQuantity?: number;
}

export interface AssignItemRequest {
  itemId: number;
  quantityAssigned: number;
}

export interface Project {
  id: number;
  name: string;
}
