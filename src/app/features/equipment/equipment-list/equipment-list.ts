import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { EquipmentService } from '../../../core/services/equipment.service';
import { EquipmentItem, ItemStatus } from '../../../core/models/equipment.model';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatRippleModule],
  templateUrl: './equipment-list.html',
  styleUrls: ['./equipment-list.css']
})
export class EquipmentListComponent implements OnInit {
  items = signal<EquipmentItem[]>([]);
  selectedItem = signal<EquipmentItem | null>(null);
  
  // Filtering and active tab state
  tabs = ['All', 'Equipment', 'Materials', 'Maintenance'];
  activeTab = signal('All');
  searchQuery = signal('');

  filteredItems = computed(() => {
    let filtered = this.items();
    const tab = this.activeTab();
    
    if (tab === 'Equipment') {
      filtered = filtered.filter(item => item.itemType === 'EQUIPMENT');
    } else if (tab === 'Materials') {
      filtered = filtered.filter(item => item.itemType === 'MATERIAL');
    } else if (tab === 'Maintenance') {
      filtered = filtered.filter(item => item.status === 'MAINTENANCE');
    }

    const q = this.searchQuery().toLowerCase();
    if (q) {
      filtered = filtered.filter(item => 
        item.itemName.toLowerCase().includes(q) || 
        item.sku.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    }
    
    return filtered;
  });

  // Example stats for the top cards
  stats = computed(() => {
    const all = this.items();
    return {
      total: all.length,
      equipment: all.filter(i => i.itemType === 'EQUIPMENT').length,
      materials: all.filter(i => i.itemType === 'MATERIAL').length,
      maintenance: all.filter(i => i.status === 'MAINTENANCE').length,
      lowStock: all.filter(i => i.status === 'LOW_STOCK').length,
    };
  });

  constructor(private equipmentService: EquipmentService) {}

  ngOnInit() {
    this.equipmentService.getEquipment().subscribe((data) => {
      this.items.set(data);
    });
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
    this.selectedItem.set(null);
  }

  updateSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  selectItem(item: EquipmentItem) {
    if (this.selectedItem()?.id === item.id) {
      this.selectedItem.set(null); // toggle off
    } else {
      this.selectedItem.set(item);
    }
  }

  triggerAdd() {
    // Add logic here (e.g. open dialog)
    console.log('Add Item triggered');
  }

  requestMaintenance(item: EquipmentItem) {
    console.log('Maintenance requested for:', item.itemName);
  }

  requestOrder(item: EquipmentItem) {
    console.log('Re-order requested for:', item.itemName);
  }

  // UI Helpers
  getStatusColor(status: ItemStatus): string {
    switch (status) {
      case 'AVAILABLE': return 'text-green-700 bg-green-50 border-green-200';
      case 'IN_USE': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'LOW_STOCK': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'MAINTENANCE': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  }

  getStatusIcon(status: ItemStatus): string {
    switch (status) {
      case 'AVAILABLE': return 'check_circle';
      case 'IN_USE': return 'engineering';
      case 'LOW_STOCK': return 'warning';
      case 'MAINTENANCE': return 'build';
      default: return 'info';
    }
  }

  getTypeIcon(type: string): string {
    return type === 'EQUIPMENT' ? 'precision_manufacturing' : 'inventory_2';
  }

  getTypeIconBgColor(type: string): string {
    return type === 'EQUIPMENT' ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-500';
  }
}