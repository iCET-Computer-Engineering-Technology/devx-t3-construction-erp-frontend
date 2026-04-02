import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ClientViewService } from './client-view.service';

describe('ClientViewService', () => {
  let service: ClientViewService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClientViewService]
    });
    service = TestBed.inject(ClientViewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
