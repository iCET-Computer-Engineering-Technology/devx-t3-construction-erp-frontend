import { Component, inject, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { ProjectService } from '../services/project.service';
import { ProjectProgressComponent } from '../project-progress/project-progress';
import { ProjectBudgetComponent } from '../project-budget/project-budget.component';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatRippleModule, ProjectProgressComponent, ProjectBudgetComponent],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.css'
})
export class ProjectDetailsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);

  projectId = computed(() => Number(this.route.snapshot.paramMap.get('id')));

  project = computed(() => {
    return this.projectService.projects().find(p => p.id === this.projectId()) || null;
  });

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}
