import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'sc-not-found',
  imports: [RouterLink],
  template: `
    <div class="card" style="text-align: center; padding: 48px 20px">
      <h1>404 — Not found</h1>
      <p class="muted">That page doesn't exist or has moved.</p>
      <a routerLink="/feed">← Back to the feed</a>
    </div>
  `,
})
export class NotFoundComponent implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.apply({
      title: 'Page not found',
      description: 'The page you requested could not be found on Sportscertify.',
      path: '/404',
    });
  }
}
