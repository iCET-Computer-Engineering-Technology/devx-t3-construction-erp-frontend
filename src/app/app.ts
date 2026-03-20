import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarComponent, type SidebarConfig } from './shared/components/sidebar/sidebar';
import { TopBarComponent, type TopBarUser } from './shared/components/top-bar/top-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, TopBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('construction-erp-frontend');
  protected readonly isAuthPage = signal(true);

  private router = inject(Router);

  protected readonly sidebarConfig: SidebarConfig = {
    brandName: 'BuildFlow',
    brandSubtitle: 'ENTERPRISE ERP',
    mainNav: [
      { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
      { label: 'My Tasks', icon: 'assignment_turned_in', route: '/my-tasks' },
      { label: 'Projects', icon: 'folder_open', route: '/projects' },
      { label: 'Tasks', icon: 'task_alt', route: '/tasks' },
      { label: 'WBS', icon: 'account_tree', route: '/wbs' },
      { label: 'Progress', icon: 'trending_up', route: '/progress' },
      { label: 'Equipment', icon: 'construction', route: '/equipment' },
      { label: 'Workforce', icon: 'groups', route: '/workforce' },
      { label: 'Budget', icon: 'account_balance_wallet', route: '/budget' },
      { label: 'Documents', icon: 'description', route: '/documents' },
      { label: 'Reports', icon: 'bar_chart', route: '/reports' },
      { label: 'Users', icon: 'manage_accounts', route: '/users' },
    ],
    bottomNav: [
      { label: 'RBAC', icon: 'admin_panel_settings', route: '/rbac' },
      { label: 'Settings', icon: 'settings', route: '/settings' },
    ],
  };

  protected readonly currentUser: TopBarUser = {
    name: 'James Wilson',
    role: 'Project Director',
  };

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.isAuthPage.set((e as NavigationEnd).urlAfterRedirects === '/login');
      });
  }
}
