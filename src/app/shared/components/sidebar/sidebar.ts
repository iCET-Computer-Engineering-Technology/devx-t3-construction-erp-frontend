import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';


export interface SidebarNavItem {
  label: string;
  icon: string;
  route: string;
}

export interface SidebarUser {
  name: string;
  role: string;
}

export interface SidebarConfig {
  brandName?: string;
  brandSubtitle?: string;
  mainNav: SidebarNavItem[];
  bottomNav?: SidebarNavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatRippleModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  config = input.required<SidebarConfig>();
  collapsed = input<boolean>(false);
  currentUser = input<SidebarUser | null>(null);

  navItemClicked = output<SidebarNavItem>();
  logoutClicked = output<void>();

  protected readonly isCollapsed = signal(false);

  protected readonly userInitials = computed(() => {
    const name = this.currentUser()?.name;
    if (!name) return '?';
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  toggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
  }

  onNavClick(item: SidebarNavItem): void {
    this.navItemClicked.emit(item);
  }

  onLogout(): void {
    this.logoutClicked.emit();
  }
}
