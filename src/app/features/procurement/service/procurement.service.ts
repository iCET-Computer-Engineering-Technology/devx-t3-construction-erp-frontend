import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Supplier,
  MaterialRequisition,
  MaterialRequisitionItem,
  PurchaseOrder,
  PurchaseOrderItem,
  GoodsReceipt,
  GoodsReceiptItem,
  CreateRequisitionRequest,
  CreatePurchaseOrderRequest,
  LogGoodsReceiptRequest
} from '../model/procurement.model';

@Injectable({ providedIn: 'root' })
export class ProcurementService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/procurement';
  private readonly supplierApiUrl = '/api/suppliers';

  // --- Suppliers ---
  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.supplierApiUrl}`);
  }

  createSupplier(supplier: Supplier): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.supplierApiUrl}`, supplier);
  }

  // --- Material Requisitions ---
  getRequisitions(): Observable<MaterialRequisition[]> {
    return this.http.get<MaterialRequisition[]>(`${this.apiUrl}/requisitions`);
  }

  getRequisitionItems(id: number): Observable<MaterialRequisitionItem[]> {
    return this.http.get<MaterialRequisitionItem[]>(`${this.apiUrl}/requisitions/${id}/items`);
  }

  createRequisition(payload: CreateRequisitionRequest): Observable<MaterialRequisition> {
    return this.http.post<MaterialRequisition>(`${this.apiUrl}/requisitions`, payload);
  }

  approveRequisition(id: number): Observable<MaterialRequisition> {
    return this.http.post<MaterialRequisition>(`${this.apiUrl}/requisitions/${id}/approve`, {});
  }

  // --- Purchase Orders ---
  getPurchaseOrders(): Observable<PurchaseOrder[]> {
    return this.http.get<PurchaseOrder[]>(`${this.apiUrl}/purchase-orders`);
  }

  getPurchaseOrderItems(id: number): Observable<PurchaseOrderItem[]> {
    return this.http.get<PurchaseOrderItem[]>(`${this.apiUrl}/purchase-orders/${id}/items`);
  }

  createPurchaseOrder(payload: CreatePurchaseOrderRequest): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.apiUrl}/purchase-orders`, payload);
  }

  // --- Goods Receipts ---
  getGoodsReceipts(): Observable<GoodsReceipt[]> {
    return this.http.get<GoodsReceipt[]>(`${this.apiUrl}/goods-receipts`);
  }

  getGoodsReceiptItems(id: number): Observable<GoodsReceiptItem[]> {
    return this.http.get<GoodsReceiptItem[]>(`${this.apiUrl}/goods-receipts/${id}/items`);
  }

  receiveGoods(payload: LogGoodsReceiptRequest): Observable<GoodsReceipt> {
    return this.http.post<GoodsReceipt>(`${this.apiUrl}/goods-receipts`, payload);
  }
}
