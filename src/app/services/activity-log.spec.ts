import { TestBed } from '@angular/core/testing';

import { ActivityLog, ActivityLogService } from './activity-log';

describe('ActivityLog', () => {
  let service: ActivityLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityLogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
