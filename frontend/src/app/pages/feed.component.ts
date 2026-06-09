import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { SeoService, SITE_URL } from '../core/seo.service';
import { PostCardComponent } from '../shared/post-card.component';
import type { Post } from '../core/models';

@Component({
  selector: 'sc-feed',
  imports: [PostCardComponent],
  template: `
    <section class="hero">
      <h1>World Cup 2026 — insights from certified sports professionals</h1>
      <p class="muted">
        Tactical analysis, sports-science data, and player-workload intelligence from verified
        coaches, analysts, scientists, and officials. Powered by semantic search over MongoDB
        Atlas Vector Search.
      </p>
    </section>

    @if (error()) {
      <div class="card">
        <p class="muted">
          Couldn't load the feed. Make sure the backend API is running and seeded.
        </p>
        <p class="muted">{{ error() }}</p>
      </div>
    } @else if (posts() === null) {
      @for (i of [1, 2, 3]; track i) {
        <div class="card">
          <div class="skeleton" style="height: 16px; width: 40%; margin-bottom: 12px"></div>
          <div class="skeleton" style="height: 14px; width: 100%; margin-bottom: 6px"></div>
          <div class="skeleton" style="height: 14px; width: 80%"></div>
        </div>
      }
    } @else {
      @for (post of posts(); track post.slug) {
        <sc-post-card [post]="post" />
      } @empty {
        <div class="card"><p class="muted">No posts yet.</p></div>
      }
    }
  `,
  styles: [
    `
      .hero {
        margin-bottom: 24px;
      }
      .hero h1 {
        font-size: 28px;
      }
    `,
  ],
})
export class FeedComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly seo = inject(SeoService);

  readonly posts = signal<Post[] | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.seo.apply({
      title: 'World Cup 2026 Feed for Certified Sports Professionals',
      description:
        'World Cup 2026 tactical analysis, sports-science data, and player-workload insights from verified coaches, analysts, and sports scientists on Sportscertify.',
      path: '/feed',
      type: 'website',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'World Cup 2026 Feed — Sportscertify',
        url: `${SITE_URL}/feed`,
        about: 'World Cup 2026 sports science and tactical analysis',
      },
    });

    this.api.getFeed().subscribe({
      next: (res) => this.posts.set(res.posts),
      error: (err) => this.error.set(err?.message ?? 'Request failed'),
    });
  }
}
