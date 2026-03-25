import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarComponent, type SidebarConfig } from './shared/components/sidebar/sidebar';
import { TopBarComponent, type TopBarUser } from './shared/components/top-bar/top-bar';
import { AuthService } from './core/services/auth.service';
import { UserRole } from './core/models/user.model';

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
  private authService = inject(AuthService);

  protected readonly currentUserRole = signal<UserRole | null>(null);

  // protected readonly sidebarConfig: SidebarConfig = {
  //   brandName: 'BuildFlow',
  //   brandSubtitle: 'ENTERPRISE ERP',
  //   mainNav: [
  //     { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  //     { label: 'Projects', icon: 'folder_open', route: '/projects' },
  //     { label: 'Tasks', icon: 'task_alt', route: '/tasks' },
  //     { label: 'WBS', icon: 'account_tree', route: '/wbs' },
  //     { label: 'Progress', icon: 'trending_up', route: '/progress' },
  //     { label: 'Equipment', icon: 'construction', route: '/equipment' },
  //     { label: 'Workforce', icon: 'groups', route: '/workforce' },
  //     { label: 'Budget', icon: 'account_balance_wallet', route: '/budget' },
  //     { label: 'Documents', icon: 'description', route: '/documents' },
  //     { label: 'Reports', icon: 'bar_chart', route: '/reports' },
  //     { label: 'Users', icon: 'manage_accounts', route: '/users' },
  //   ],
  //   bottomNav: [
  //     { label: 'RBAC', icon: 'admin_panel_settings', route: '/rbac' },
  //     { label: 'Settings', icon: 'settings', route: '/settings' },
  //   ],
  // };

  private readonly ALL_MAIN_NAV = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', roles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'ACCOUNTANT', 'WORKER'] },
    { label: 'My Tasks', icon: 'assignments', route: '/my-tasks',   roles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'WORKER'] },
    { label: 'Projects', icon: 'folder_open', route: '/projects', roles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'ACCOUNTANT'] },
    { label: 'Tasks', icon: 'task_alt', route: '/tasks',          roles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'] },
    { label: 'WBS', icon: 'account_tree', route: '/wbs',          roles: ['ADMIN', 'PROJECT_MANAGER'] },
    { label: 'Progress', icon: 'timeline', route: '/progress',   roles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'WORKER'] },
    { label: 'Equipment', icon: 'construction', route: '/equipmemt', roles: ['ADMIN', 'SITE_ENGINEER'] },
    { label: 'Workforce', icon: 'groups', route: '/workforce',  roles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'] },
    { label: 'Budget', icon: 'account_balance_wallet', route: '/budget',          roles: ['ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT'] },
    { label: 'Documents', icon: 'description', route: '/documents',  roles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'ACCOUNTANT'] },
    { label: 'Reports', icon: 'assessment', route: '/reports',        roles: ['ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT'] },
    { label: 'Users', icon: 'manage_accounts', route: '/users',              roles: ['ADMIN', ] }, 


    // { label: 'Projects', icon: 'folder_open', route: '/projects', roles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'WORKER'] },
    // { label: 'Tasks', icon: 'task_alt', route: '/tasks', roles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'WORKER'] },
    // { label: 'WBS', icon: 'account_tree', route: '/wbs', roles: ['ADMIN', 'PROJECT_MANAGER'] },
    // { label: 'Progress', icon: 'trending_up', route: '/progress', roles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'] },
    // { label: 'Equipment', icon: 'construction', route: '/equipment', roles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'] },
    // { label: 'Workforce', icon: 'groups', route: '/workforce', roles: ['ADMIN', 'PROJECT_MANAGER'] },
    // { label: 'Budget', icon: 'account_balance_wallet', route: '/budget', roles: ['ACCOUNTANT'] },
    // { label: 'Documents', icon: 'description', route: '/documents', roles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'] },
    // { label: 'Reports', icon: 'bar_chart', route: '/reports', roles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'] },
    // { label: 'Users', icon: 'manage_accounts', route: '/users', roles: ['ADMIN'] },
  ];

  private readonly ALL_BOTTOM_NAV = [
    { label: 'RBAC', icon: 'admin_panel_settings', route: '/rbac', roles: ['ADMIN'] },
    { label: 'Settings', icon: 'settings', route: '/settings', roles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'ACCOUNTANT', 'WORKER'] },
  ];

  // protected currentUser: TopBarUser = {
  //   name: 'James Wilson',
  //   role: 'Project Director',
  // };

  protected readonly sidebarConfig = computed<SidebarConfig>(() => {
    const role = this.currentUserRole()?.toString() || '';
    
    return {
      brandName: 'BuildFlow',
      brandSubtitle: 'ENTERPRISE ERP',
      mainNav: this.ALL_MAIN_NAV.filter(item => item.roles.includes(role)),
      bottomNav: this.ALL_BOTTOM_NAV.filter(item => item.roles.includes(role)),
    };
  });

  protected currentUser: TopBarUser | null = null;

  constructor() {
    // Current user ge information update karanna
    this.authService.currentUserInfo$.subscribe(info => {
      if (info) {
        this.currentUser = {
          name: info.name,
          role: info.role,
        };
        this.currentUserRole.set(info.role);
      } else {
        this.currentUser = null;
        this.currentUserRole.set(null);
      }
    });

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.isAuthPage.set((e as NavigationEnd).urlAfterRedirects === '/login');
      });
  }

  // constructor() {
  //   this.router.events
  //     .pipe(filter((e) => e instanceof NavigationEnd))
  //     .subscribe((e) => {
  //       this.isAuthPage.set((e as NavigationEnd).urlAfterRedirects === '/login');
  //     });
  // }
}
