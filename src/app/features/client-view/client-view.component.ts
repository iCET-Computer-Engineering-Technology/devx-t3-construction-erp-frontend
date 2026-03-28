import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ClientViewService } from '../../core/services/client-view.service';

@Component({
  selector: 'app-client-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-view.component.html',
  styleUrl: './client-view.component.css'
})
export class ClientViewComponent implements OnInit {
  
  projectData: any = null; 
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private clientService: ClientViewService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (token) {

      const projectId = 1;
      
      this.clientService.getProjectDetails(projectId, token).subscribe({
        next: (data) => {
          this.projectData = data; 
          console.log('Project Data Received:', this.projectData);
        },
        error: (err) => {
          this.errorMessage = "Unable to fetch project details. Please try again later.";
          console.error('Error fetching data:', err);
        }
      });
    } else {
      this.errorMessage = "No valid security token found in the link.";
    }
  }
}