import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectProgress } from './project-progress';

describe('ProjectProgress', () => {
  let component: ProjectProgress;
  let fixture: ComponentFixture<ProjectProgress>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectProgress]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectProgress);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
