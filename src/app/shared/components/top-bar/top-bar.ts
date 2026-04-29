import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatRippleModule } from '@angular/material/core';

export interface TopBarUser {
  name: string;
  role: string;
  avatarUrl?: string;
}

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatBadgeModule, MatRippleModule],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.css',
})
export class TopBarComponent {
  user                = input<TopBarUser | null>(null);
  searchPlaceholder   = input<string>('Search projects, tasks, or resources...');
  notificationCount   = input<number>(0);
  messageCount        = input<number>(0);

  searchChange         = output<string>();
  notificationsClicked = output<void>();
  messagesClicked      = output<void>();
  profileClicked       = output<void>();
  logoutClicked        = output<void>();   // ← new

  protected searchValue = '';

  onSearchInput(value: string): void {
    this.searchValue = value;
    this.searchChange.emit(value);
  }

  onNotifications(): void { this.notificationsClicked.emit(); }
  onMessages():      void { this.messagesClicked.emit(); }
  onProfile():       void { this.profileClicked.emit(); }
  onLogout():        void { this.logoutClicked.emit(); }   // ← new

  protected getUserInitials(): string {
    const name = this.user()?.name;
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}