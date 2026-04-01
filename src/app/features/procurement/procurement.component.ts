import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProcurementService } from './service/procurement.service';
import { ProjectService } from '../projects/services/project.service';
import { MaterialRequisition, PurchaseOrder, GoodsReceipt, Supplier } from './model/procurement.model';

@Component({
  selector: 'app-procurement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './procurement.component.html',
  styleUrl: './procurement.component.css'
})
export class ProcurementComponent implements OnInit {
  private procurementService = inject(ProcurementService);
  private projectService = inject(ProjectService);

  requisitions = signal<MaterialRequisition[]>([]);
  purchaseOrders = signal<PurchaseOrder[]>([]);
  goodsReceipts = signal<GoodsReceipt[]>([]);
  suppliers = signal<Supplier[]>([]);

  // Bound from ProjectService
  projects = this.projectService.projects;

  activeTab = signal<'requisitions' | 'purchaseOrders' | 'goodsReceipts' | 'suppliers'>('requisitions');

  // Modal State
  isModalOpen = signal(false);
  
  // Form Model
  newRequisition = {
    projectId: null as number | null,
    requiredDate: '',
  };

  // Item Selection State
  catalogItems = signal([
    { id: 1, name: 'Portland Cement Bag (50kg)' },
    { id: 2, name: 'Steel Rebar (12mm)' },
    { id: 3, name: 'Standard Red Bricks' },
    { id: 4, name: 'River Sand (Ton)' },
    { id: 5, name: 'Crushed Gravel (Ton)' },
    { id: 6, name: 'Lumber (2x4 Pine)' },
  ]);

  newRequisitionItems = signal<{itemId: number, name: string, quantity: number}[]>([]);
  selectedItemId = signal<number | null>(null);
  itemQuantity = signal<number | null>(null);

  ngOnInit() {
    this.loadData();
    this.loadSuppliers();
  }

  loadData() {
    this.procurementService.getRequisitions().subscribe({
      next: (res) => {
        if (!res || res.length === 0) {
          this.requisitions.set([
            { id: 101, projectId: 1, requestedBy: 10, status: 'APPROVED', requiredDate: '2026-04-10', createdAt: new Date().toISOString() },
            { id: 102, projectId: 3, requestedBy: 12, status: 'PENDING', requiredDate: '2026-04-12', createdAt: new Date().toISOString() },
            { id: 103, projectId: 2, requestedBy: 15, status: 'REJECTED', requiredDate: '2026-03-28', createdAt: new Date().toISOString() }
          ]);
        } else {
          this.requisitions.set(res);
        }
      },
      error: () => {
        this.requisitions.set([
            { id: 101, projectId: 1, requestedBy: 10, status: 'APPROVED', requiredDate: '2026-04-10', createdAt: new Date().toISOString() },
            { id: 102, projectId: 3, requestedBy: 12, status: 'PENDING', requiredDate: '2026-04-12', createdAt: new Date().toISOString() },
        ]);
      }
    });

    this.procurementService.getPurchaseOrders().subscribe({
      next: (res) => {
        if (!res || res.length === 0) {
          this.purchaseOrders.set([
            { id: 501, mrId: 101, supplierId: 3, status: 'ISSUED', expectedDelivery: '2026-04-05', createdAt: new Date().toISOString() },
            { id: 502, mrId: 102, supplierId: 1, status: 'DRAFT', expectedDelivery: '2026-04-10', createdAt: new Date().toISOString() }
          ]);
        } else {
          this.purchaseOrders.set(res);
        }
      },
      error: () => Object
    });

    this.procurementService.getGoodsReceipts().subscribe({
      next: (res) => {
        if (!res || res.length === 0) {
          this.goodsReceipts.set([
            { id: 901, poId: 501, receivedBy: 1, receivedDate: new Date().toISOString(), notes: 'All 500 bags of cement received.' }
          ]);
        } else {
          this.goodsReceipts.set(res);
        }
      },
      error: () => Object
    });
  }

  // Supplier Modal State
  isSupplierModalOpen = signal(false);
  newSupplier: Supplier = { name: '', contactEmail: '', phone: '', address: '' };

  loadSuppliers() {
    this.procurementService.getSuppliers().subscribe({
      next: (res) => {
        if (!res || res.length === 0) {
          this.loadDummySuppliers();
        } else {
          this.suppliers.set(res);
        }
      },
      error: (err) => {
        console.error('Failed to load real suppliers', err);
        this.loadDummySuppliers();
      }
    });
  }

  private loadDummySuppliers() {
    this.suppliers.set([
      { id: 1, name: 'Apex BuildMats Ltd.', contactEmail: 'sales@apexbuild.com', phone: '+1 (555) 123-4567', address: '100 Industrial Dr, City, State' },
      { id: 2, name: 'Global Steel Co.', contactEmail: 'orders@globalsteel.com', phone: '+1 (555) 987-6543', address: '400 Metalworks Way, City, State' },
      { id: 3, name: 'Titan Concrete & Cement', contactEmail: 'contact@titanconcrete.net', phone: '+1 (555) 888-1111', address: '22 Stone Quarry Rd, City, State' },
      { id: 4, name: 'Lumber Logistics', contactEmail: 'sales@lumberlog.io', phone: '+1 (555) 444-3333', address: 'Tree Lane 5, Forest City' }
    ]);
  }

  openSupplierModal() {
    this.isSupplierModalOpen.set(true);
  }

  closeSupplierModal() {
    this.isSupplierModalOpen.set(false);
    this.newSupplier = { name: '', contactEmail: '', phone: '', address: '' };
  }

  saveSupplier() {
    if (!this.newSupplier.name || !this.newSupplier.contactEmail) {
      alert('Validation Error: Supplier Name and Email are required.');
      return;
    }

    this.procurementService.createSupplier(this.newSupplier).subscribe({
      next: (savedSupplier) => {
        // Add to the top of the list
        this.suppliers.update(list => [savedSupplier, ...list]);
        this.closeSupplierModal();
      },
      error: (err) => {
        console.error('Failed to create supplier', err);
        // Fallback for demo if API is down
        const fakeSup = { ...this.newSupplier, id: Math.floor(Math.random() * 1000) };
        this.suppliers.update(list => [fakeSup, ...list]);
        this.closeSupplierModal();
      }
    });
  }

  setTab(tab: 'requisitions' | 'purchaseOrders' | 'goodsReceipts' | 'suppliers') {
    this.activeTab.set(tab);
  }

  createNew() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  addRequisitionItem() {
    const id = this.selectedItemId();
    const qty = this.itemQuantity();
    
    if (!id || !qty || qty <= 0) {
      alert('You must select a valid item and enter a quantity greater than 0.');
      return;
    }
    
    const item = this.catalogItems().find(i => i.id === Number(id));
    if (item) {
      this.newRequisitionItems.update(list => [...list, { itemId: item.id, name: item.name, quantity: qty }]);
      // Reset inputs
      this.selectedItemId.set(null);
      this.itemQuantity.set(null);
    }
  }

  removeRequisitionItem(index: number) {
    this.newRequisitionItems.update(list => list.filter((_, i) => i !== index));
  }

  saveRequisition() {
    if (!this.newRequisition.projectId) {
      alert('Validation Error: You must select a Project.');
      return;
    }
    if (!this.newRequisition.requiredDate) {
      alert('Validation Error: You must enter a Required By Date.');
      return;
    }
    if (this.newRequisitionItems().length === 0) {
      alert('Validation Error: You must add at least one item to the requisition.');
      return;
    }
    
    const payload = {
      requisition: {
        projectId: Number(this.newRequisition.projectId),
        requestedBy: 99, // Current User placeholder
        status: 'PENDING',
        requiredDate: this.newRequisition.requiredDate
      },
      items: this.newRequisitionItems().map(item => ({
        itemId: item.itemId,
        quantity: item.quantity
      }))
    };

    this.procurementService.createRequisition(payload).subscribe({
      next: (savedReq) => {
        // Update list with the real requisition returned from the backend
        this.requisitions.update(list => [savedReq, ...list]);
        
        // Reset and close
        this.newRequisition = { projectId: null, requiredDate: '' };
        this.newRequisitionItems.set([]);
        this.closeModal();
      },
      error: (err) => {
        console.error('Failed to create requisition', err);
        alert('Error creating requisition. Please try again.');
        
        // DEMO FALLBACK: If backend fails, we still create it locally for the demo flow to not break
        const demoReq: MaterialRequisition = {
          id: Math.floor(Math.random() * 1000) + 200, 
          projectId: Number(this.newRequisition.projectId),
          requestedBy: 99, 
          status: 'PENDING',
          requiredDate: this.newRequisition.requiredDate,
          createdAt: new Date().toISOString()
        };
        this.requisitions.update(list => [demoReq, ...list]);
        this.newRequisition = { projectId: null, requiredDate: '' };
        this.newRequisitionItems.set([]);
        this.closeModal();
      }
    });
  }
}
