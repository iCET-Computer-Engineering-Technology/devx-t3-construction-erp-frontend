import { Component, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

export interface SidebarNavItem {
  label: string;
  icon: string;
  route: string;
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
  navItemClicked = output<SidebarNavItem>();

  protected readonly isCollapsed = signal(false);

  toggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
  }

  onNavClick(item: SidebarNavItem): void {
    this.navItemClicked.emit(item);
  }
}
