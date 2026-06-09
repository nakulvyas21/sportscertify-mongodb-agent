import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import type {
  FeedResponse,
  PostResponse,
  ProfessionalResponse,
  SearchResponse,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getFeed(): Observable<FeedResponse> {
    return this.http.get<FeedResponse>(`${this.base}/feed`);
  }

  getPost(slug: string): Observable<PostResponse> {
    return this.http.get<PostResponse>(`${this.base}/post/${encodeURIComponent(slug)}`);
  }

  getProfessional(handle: string): Observable<ProfessionalResponse> {
    return this.http.get<ProfessionalResponse>(
      `${this.base}/professionals/${encodeURIComponent(handle)}`,
    );
  }

  search(query: string, limit = 8): Observable<SearchResponse> {
    const q = encodeURIComponent(query);
    return this.http.get<SearchResponse>(`${this.base}/search?q=${q}&limit=${limit}`);
  }
}
