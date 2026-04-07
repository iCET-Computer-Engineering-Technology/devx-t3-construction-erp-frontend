import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { EquipmentItem, ItemType, ItemStatus } from '../models/equipment.model';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private apiUrl = '/api/equipment'; // Example API route
  
  // Mock data for immediate preview
  private mockItems: EquipmentItem[] = [
    { id: 1, itemName: 'Excavator Cat 320', itemType: 'EQUIPMENT', totalQuantity: 3, availableQuantity: 2, sku: 'EQ-001', location: 'Site Alpha', status: 'IN_USE' },
    { id: 2, itemName: 'Caterpillar D9 Bulldozer', itemType: 'EQUIPMENT', totalQuantity: 1, availableQuantity: 1, sku: 'EQ-002', location: 'Main Depot', status: 'AVAILABLE' },
    { id: 3, itemName: 'Portland Cement', itemType: 'MATERIAL', totalQuantity: 500, availableQuantity: 50, sku: 'MT-104', location: 'Warehouse B', status: 'LOW_STOCK' },
    { id: 4, itemName: 'Scaffolding Kits', itemType: 'EQUIPMENT', totalQuantity: 100, availableQuantity: 0, sku: 'EQ-059', location: 'Site Bravo', status: 'MAINTENANCE' },
    { id: 5, itemName: 'Steel Rebar (tons)', itemType: 'MATERIAL', totalQuantity: 200, availableQuantity: 200, sku: 'MT-088', location: 'Warehouse A', status: 'AVAILABLE' }
  ];

  constructor(private http: HttpClient) {}

  getEquipment(): Observable<EquipmentItem[]> {
    return of(this.mockItems);
    // return this.http.get<EquipmentItem[]>(this.apiUrl);
  }
}