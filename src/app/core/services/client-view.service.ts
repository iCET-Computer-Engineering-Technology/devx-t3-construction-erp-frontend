import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientViewService {
  private readonly baseUrl = '/client_access';
  private readonly http = inject(HttpClient);

  getProjectDetails(projectId: number, token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/project-details/${projectId}`, {
      params: { token: token }
    });
  }
}