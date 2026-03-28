export interface Supplier {
  id?: number;
  name: string;
  contactEmail: string;
  phone: string;
  address: string;
}

export interface MaterialRequisition {
  id?: number;
  projectId: number;
  requestedBy: number;
  status?: string;
  requiredDate?: string;
  createdAt?: string;
}

export interface MaterialRequisitionItem {
  id?: number;
  mrId?: number;
  itemId: number;
  quantity: number;
}

export interface PurchaseOrder {
  id?: number;
  supplierId: number;
  mrId?: number;
  status?: string;
  expectedDelivery?: string;
  createdAt?: string;
}

export interface PurchaseOrderItem {
  id?: number;
  poId?: number;
  itemId: number;
  quantity: number;
  unitPrice?: number;
}

export interface GoodsReceipt {
  id?: number;
  poId: number;
  receivedBy: number;
  receivedDate?: string;
  notes?: string;
}

export interface GoodsReceiptItem {
  id?: number;
  grnId?: number;
  poItemId: number;
  quantityReceived: number;
}

export interface CreateRequisitionRequest {
  requisition: MaterialRequisition;
  items: MaterialRequisitionItem[];
}

export interface CreatePurchaseOrderRequest {
  purchaseOrder: PurchaseOrder;
  items: PurchaseOrderItem[];
}

export interface LogGoodsReceiptRequest {
  goodsReceipt: GoodsReceipt;
  items: GoodsReceiptItem[];
}
