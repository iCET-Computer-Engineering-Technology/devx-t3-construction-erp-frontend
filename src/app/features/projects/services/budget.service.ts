import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Budget {
  id?: number;
  project_id?: number;
  total_estimated_amount?: number;
  status?: string;
  created_at?: Date;
}

export interface BudgetItem {
  id?: number;
  budget_id?: number;
  cost_code?: string;
  description?: string;
  estimated_amount?: number;
  committed_amount?: number;
  actual_amount?: number;
}

export interface Expense {
  id?: number;
  budget_item_id?: number;
  amount?: number;
  expense_type?: string;
  reference_id?: string;
  date_incurred?: Date;
  created_at?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/budget';

  createBudget(projectId: number, budget: Budget): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/projects/${projectId}/budget`, budget);
  }

  getBudgetByProjectId(projectId: number): Observable<Budget> {
    return this.http.get<Budget>(`${this.apiUrl}/projects/${projectId}/budget`);
  }

  addBudgetItem(budgetId: number, item: BudgetItem): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/budgets/${budgetId}/items`, item);
  }

  getBudgetItems(budgetId: number): Observable<BudgetItem[]> {
    return this.http.get<BudgetItem[]>(`${this.apiUrl}/budgets/${budgetId}/items`);
  }

  logExpense(itemId: number, expense: Expense): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/budget-items/${itemId}/expenses`, expense);
  }

  getExpenses(itemId: number): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/budget-items/${itemId}/expenses`);
  }
}
