import { TestBed, inject } from '@angular/core/testing';

import { ModaltrackerService } from './modaltracker.service';

describe('ModaltrackerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ModaltrackerService]
    });
  });

  it('should ...', inject([ModaltrackerService], (service: ModaltrackerService) => {
    expect(service).toBeTruthy();
  }));
});
