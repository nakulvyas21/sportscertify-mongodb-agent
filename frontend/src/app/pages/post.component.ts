import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { ApiService } from '../core/api.service';
import { SeoService, SITE_URL } from '../core/seo.service';
import { POST_TYPE_LABEL, type Post } from '../core/models';

@Component({
  selector: 'sc-post',
  imports: [RouterLink, DatePipe, KeyValuePipe],
  template: `
    @if (error()) {
      <div class="card">
        <p class="muted">{{ error() }}</p>
        <a routerLink="/feed">← Back to the feed</a>
      </div>
    } @else if (post() === null) {
      <div class="card">
        <div class="skeleton" style="height: 18px; width: 50%; margin-bottom: 14px"></div>
        <div class="skeleton" style="height: 16px; width: 100%; margin-bottom: 8px"></div>
        <div class="skeleton" style="height: 16px; width: 90%"></div>
      </div>
    } @else {
      <article>
        <div class="post-head">
          <span class="chip chip--accent">{{ typeLabel(post()!) }}</span>
          <a class="author" [routerLink]="['/u', post()!.author_handle]">
            {{ post()!.author_display_name }}
          </a>
          <span class="muted">· {{ post()!.author_role }}</span>
          <span class="muted">· {{ post()!.created_at | date: 'longDate' }}</span>
        </div>

        <h1>{{ post()!.content }}</h1>

        <div class="tags">
          @for (tag of post()!.tags; track tag) {
            <span class="tag">{{ tag }}</span>
          }
        </div>

        @if (post()!.metrics) {
          <div class="card metrics">
            <h3>Key data</h3>
            <dl>
              @for (m of post()!.metrics! | keyvalue; track m.key) {
                <div class="metric">
                  <dt class="muted">{{ pretty(m.key) }}</dt>
                  <dd>{{ m.value }}</dd>
                </div>
              }
            </dl>
          </div>
        }

        <section class="comments">
          <h2>Discussion ({{ post()!.top_comments.length }})</h2>
          @for (c of post()!.top_comments; track c.comment_id) {
            <div class="card comment">
              <div class="comment__head">
                <a [routerLink]="['/u', c.author_handle]" class="author">
                  {{ c.author_display_name }}
                </a>
                <span class="muted">· {{ c.author_role }}</span>
                <span class="muted comment__likes">♥ {{ c.likes }}</span>
              </div>
              <p>{{ c.text }}</p>
            </div>
          } @empty {
            <p class="muted">No comments yet.</p>
          }
        </section>

        <a routerLink="/feed">← Back to the feed</a>
      </article>
    }
  `,
  styles: [
    `
      .post-head {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 14px;
        font-size: 14px;
      }
      .author {
        font-weight: 700;
        color: var(--text);
      }
      h1 {
        font-size: 24px;
        margin-bottom: 14px;
      }
      .tags {
        margin-bottom: 20px;
      }
      .metrics h3 {
        margin-bottom: 12px;
      }
      .metrics dl {
        margin: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
      }
      .metric dt {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .metric dd {
        margin: 2px 0 0;
        font-size: 18px;
        font-weight: 700;
      }
      .comments {
        margin: 28px 0;
      }
      .comments h2 {
        font-size: 18px;
        margin-bottom: 14px;
      }
      .comment__head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
        font-size: 14px;
      }
      .comment__likes {
        margin-left: auto;
      }
      .comment p {
        margin: 0;
      }
    `,
  ],
})
export class PostComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);

  readonly post = signal<Post | null>(null);
  readonly error = signal<string | null>(null);

  typeLabel(p: Post): string {
    return POST_TYPE_LABEL[p.post_type] ?? p.post_type;
  }

  pretty(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.api.getPost(slug).subscribe({
      next: (res) => {
        const p = res.post;
        this.post.set(p);
        this.applySeo(p);
      },
      error: (err) =>
        this.error.set(
          err?.status === 404 ? 'That post could not be found.' : err?.message ?? 'Request failed',
        ),
    });
  }

  private applySeo(p: Post): void {
    const description = p.content.length > 155 ? p.content.slice(0, 152) + '…' : p.content;
    this.seo.apply({
      title: p.content.slice(0, 70),
      description,
      path: `/post/${p.slug}`,
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: p.content.slice(0, 110),
        articleBody: p.content,
        keywords: p.tags.join(', '),
        datePublished: p.created_at,
        author: {
          '@type': 'Person',
          name: p.author_display_name,
          jobTitle: p.author_role,
          url: `${SITE_URL}/u/${p.author_handle}`,
        },
        publisher: { '@type': 'Organization', name: 'Sportscertify' },
        url: `${SITE_URL}/post/${p.slug}`,
      },
    });
  }
}
