import { Component, OnInit } from '@angular/core';
import { ActivityLogService } from '../../services/activity-log';
import { ActivityLog } from '../../core/models/activity-log.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './activity-logs.html',
  styleUrls: ['./activity-logs.css']
})

export class ActivityLogsComponent implements OnInit {

  logs: ActivityLog[] = [];
  selectedModule: string = 'TASKS';
  isLoading: any;
  searchText: any;


  constructor(private activityLogService: ActivityLogService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs() {
    this.activityLogService.getActivityLogs()
      .subscribe({
        next: (data) => {
          this.logs = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading logs:', err);
          this.isLoading = false;
        }
      });
  }

  get filterLogs(){
    return this.logs.filter(log => 
      (log.description?.toLowerCase() || '').includes(this.searchText?.toLowerCase())|| 
      (log.action?.toLowerCase() || '').includes(this.searchText?.toLowerCase()) ||
      (log.moduleName?.toLowerCase() || '').includes(this.searchText?.toLowerCase())
    );
  }

}