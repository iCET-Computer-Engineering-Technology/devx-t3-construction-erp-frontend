import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientViewService {
  private baseUrl = 'http://localhost:8080/client_access'; 

  constructor(private http: HttpClient) { }

  getProjectDetails(projectId: number, token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/project-details/${projectId}`, {
      params: { token: token }
    });
  }
}