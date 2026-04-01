import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService, Budget, BudgetItem, Expense } from '../services/budget.service';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

@Component({
  selector: 'app-project-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatRippleModule],
  templateUrl: './project-budget.component.html',
  styleUrls: ['./project-budget.component.css']
})
export class ProjectBudgetComponent implements OnInit {
  @Input({ required: true }) projectId!: number;
  
  private budgetService = inject(BudgetService);
  
  budget = signal<Budget | null>(null);
  budgetItems = signal<BudgetItem[]>([]);
  isLoading = signal<boolean>(true);
  
  ngOnInit(): void {
    this.loadBudget();
  }
  
  loadBudget() {
    this.isLoading.set(true);
    this.budgetService.getBudgetByProjectId(this.projectId).subscribe({
      next: (b) => {
        this.budget.set(b);
        if (b.id) {
          this.loadBudgetItems(b.id);
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        // No budget exists yet
        this.budget.set(null);
        this.isLoading.set(false);
      }
    });
  }
  
  loadBudgetItems(budgetId: number) {
    this.budgetService.getBudgetItems(budgetId).subscribe({
      next: (items) => {
        this.budgetItems.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.budgetItems.set([]);
        this.isLoading.set(false);
      }
    });
  }
  
  createBudget() {
    this.isLoading.set(true);
    const newBudget: Budget = {
      total_estimated_amount: 0,
      status: 'DRAFT'
    };
    
    this.budgetService.createBudget(this.projectId, newBudget).subscribe({
      next: (id) => {
        this.loadBudget(); 
      },
      error: (err) => {
        console.error('Error creating budget', err);
        this.isLoading.set(false);
      }
    });
  }
  
  getVariance(item: BudgetItem): number {
    const est = item.estimated_amount || 0;
    const comm = item.committed_amount || 0;
    const act = item.actual_amount || 0;
    return est - (comm + act);
  }

  getTotalCommitted(): number {
    return this.budgetItems().reduce((acc, curr) => acc + (curr.committed_amount || 0), 0);
  }

  getTotalActual(): number {
    return this.budgetItems().reduce((acc, curr) => acc + (curr.actual_amount || 0), 0);
  }

  getTotalVariance(): number {
    const est = this.budget()?.total_estimated_amount || 0;
    return est - (this.getTotalCommitted() + this.getTotalActual());
  }

  addExampleBudgetItem() {
    const b = this.budget();
    if (!b || !b.id) return;
    
    const randomCode = `0${Math.floor(Math.random() * 9) + 1}-Mat`;
    const newItem: BudgetItem = {
      cost_code: randomCode,
      description: 'Example Construction Material',
      estimated_amount: Math.floor(Math.random() * 50000) + 10000,
      committed_amount: 0,
      actual_amount: 0
    };

    this.budgetService.addBudgetItem(b.id, newItem).subscribe(() => {
      this.loadBudgetItems(b.id!);
      
      const currentBudget = this.budget();
      if (currentBudget) {
        currentBudget.total_estimated_amount = (currentBudget.total_estimated_amount || 0) + (newItem.estimated_amount || 0);
        this.budget.set({...currentBudget});
      }
    });
  }

  logExampleExpense(item: BudgetItem) {
    if (!item.id) return;
    const expense: Expense = {
      amount: Math.floor(Math.random() * 5000) + 500,
      expense_type: 'MATERIAL',
      reference_id: 'EXP-' + Math.floor(Math.random() * 10000)
    };
    this.budgetService.logExpense(item.id, expense).subscribe(() => {
      this.loadBudgetItems(this.budget()!.id!);
    });
  }
}
