import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { BudgetService, Budget, BudgetItem, Expense } from '../projects/services/budget.service';
import { ProjectService } from '../projects/services/project.service';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatRippleModule],
  templateUrl: './budget.component.html',
  styleUrl: './budget.component.css',
})
export class BudgetComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private projectService = inject(ProjectService);

  readonly projects = this.projectService.projects;
  readonly selectedProjectId = signal<number | null>(null);
  readonly activeTab = signal<'overview' | 'items' | 'expenses'>('overview');

  readonly budget = signal<Budget | null>(null);
  readonly budgetItems = signal<BudgetItem[]>([]);
  readonly isLoading = signal(false);
  readonly selectedItem = signal<BudgetItem | null>(null);
  readonly itemExpenses = signal<Expense[]>([]);

  // Dialogs
  readonly showCreateBudgetDialog = signal(false);
  readonly showAddItemDialog = signal(false);
  readonly showLogExpenseDialog = signal(false);

  // Forms
  newBudgetAmount = 0;
  newItem = { cost_code: '', description: '', estimated_amount: 0, committed_amount: 0 };
  newExpense = { amount: 0, expense_type: 'MATERIAL', reference_id: '', date_incurred: '' };

  // Computed summaries
  readonly totalEstimated = computed(() =>
    this.budgetItems().reduce((sum, i) => sum + (i.estimated_amount || 0), 0)
  );
  readonly totalCommitted = computed(() =>
    this.budgetItems().reduce((sum, i) => sum + (i.committed_amount || 0), 0)
  );
  readonly totalActual = computed(() =>
    this.budgetItems().reduce((sum, i) => sum + (i.actual_amount || 0), 0)
  );
  readonly remaining = computed(() => {
    const b = this.budget();
    return (b?.total_estimated_amount || 0) - this.totalActual();
  });
  readonly utilization = computed(() => {
    const b = this.budget();
    const total = b?.total_estimated_amount || 0;
    if (total === 0) return 0;
    return Math.round((this.totalActual() / total) * 100);
  });
  readonly budgetHealth = computed(() => {
    const u = this.utilization();
    if (u >= 90) return 'critical';
    if (u >= 70) return 'warning';
    return 'healthy';
  });

  ngOnInit(): void {
    const projList = this.projects();
    if (projList.length > 0) {
      this.selectProject(projList[0].id);
    }
  }

  selectProject(projectId: number): void {
    this.selectedProjectId.set(projectId);
    this.isLoading.set(true);
    this.selectedItem.set(null);
    this.itemExpenses.set([]);

    this.budgetService.getBudgetByProjectId(projectId).subscribe({
      next: (budget) => {
        this.budget.set(budget);
        if (budget?.id) {
          this.loadBudgetItems(budget.id);
        } else {
          this.budgetItems.set([]);
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.budget.set(null);
        this.budgetItems.set([]);
        this.isLoading.set(false);
      },
    });
  }

  loadBudgetItems(budgetId: number): void {
    this.budgetService.getBudgetItems(budgetId).subscribe({
      next: (items) => {
        this.budgetItems.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.budgetItems.set([]);
        this.isLoading.set(false);
      },
    });
  }

  selectBudgetItem(item: BudgetItem): void {
    this.selectedItem.set(item);
    if (item.id) {
      this.budgetService.getExpenses(item.id).subscribe({
        next: (expenses) => this.itemExpenses.set(expenses),
        error: () => this.itemExpenses.set([]),
      });
    }
  }

  closeItemDetail(): void {
    this.selectedItem.set(null);
    this.itemExpenses.set([]);
  }

  // ── Create Budget ──
  openCreateBudget(): void {
    this.newBudgetAmount = 0;
    this.showCreateBudgetDialog.set(true);
  }

  createBudget(): void {
    const projId = this.selectedProjectId();
    if (!projId || this.newBudgetAmount <= 0) return;

    this.budgetService.createBudget(projId, {
      total_estimated_amount: this.newBudgetAmount,
      status: 'ACTIVE',
    }).subscribe({
      next: () => {
        this.showCreateBudgetDialog.set(false);
        this.selectProject(projId);
      },
      error: (err) => console.error('Failed to create budget', err),
    });
  }

  // ── Add Budget Item ──
  openAddItem(): void {
    this.newItem = { cost_code: '', description: '', estimated_amount: 0, committed_amount: 0 };
    this.showAddItemDialog.set(true);
  }

  addBudgetItem(): void {
    const b = this.budget();
    if (!b?.id || !this.newItem.cost_code || this.newItem.estimated_amount <= 0) return;

    this.budgetService.addBudgetItem(b.id, this.newItem).subscribe({
      next: () => {
        this.showAddItemDialog.set(false);
        this.loadBudgetItems(b.id!);
      },
      error: (err) => console.error('Failed to add item', err),
    });
  }

  // ── Log Expense ──
  openLogExpense(item: BudgetItem): void {
    this.selectedItem.set(item);
    this.newExpense = { amount: 0, expense_type: 'MATERIAL', reference_id: '', date_incurred: '' };
    this.showLogExpenseDialog.set(true);
  }

  logExpense(): void {
    const item = this.selectedItem();
    if (!item?.id || this.newExpense.amount <= 0) return;

    this.budgetService.logExpense(item.id, this.newExpense).subscribe({
      next: () => {
        this.showLogExpenseDialog.set(false);
        const b = this.budget();
        if (b?.id) this.loadBudgetItems(b.id);
        this.selectBudgetItem(item);
      },
      error: (err) => console.error('Failed to log expense', err),
    });
  }

  // ── Helpers ──
  setTab(tab: 'overview' | 'items' | 'expenses'): void {
    this.activeTab.set(tab);
  }

  getItemUtilization(item: BudgetItem): number {
    const est = item.estimated_amount || 0;
    if (est === 0) return 0;
    return Math.round(((item.actual_amount || 0) / est) * 100);
  }

  getUtilizationClass(pct: number): string {
    if (pct >= 90) return 'util-critical';
    if (pct >= 70) return 'util-warning';
    return 'util-healthy';
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '$0.00';
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(d: Date | string | undefined): string {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getCostCodeIcon(code: string): string {
    const c = (code || '').toLowerCase();
    if (c.includes('labor') || c.includes('labour')) return 'engineering';
    if (c.includes('material')) return 'inventory_2';
    if (c.includes('equip')) return 'construction';
    if (c.includes('sub')) return 'groups';
    if (c.includes('permit') || c.includes('fee')) return 'gavel';
    if (c.includes('overhead') || c.includes('admin')) return 'business';
    return 'receipt_long';
  }

  getExpenseTypeIcon(type: string): string {
    switch ((type || '').toUpperCase()) {
      case 'MATERIAL': return 'inventory_2';
      case 'LABOR': return 'engineering';
      case 'EQUIPMENT': return 'construction';
      case 'SUBCONTRACT': return 'groups';
      default: return 'receipt_long';
    }
  }
}
