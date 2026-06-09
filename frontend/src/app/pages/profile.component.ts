import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../core/api.service';
import { SeoService, SITE_URL } from '../core/seo.service';
import { PostCardComponent } from '../shared/post-card.component';
import type { Post, Professional } from '../core/models';

@Component({
  selector: 'sc-profile',
  imports: [RouterLink, DatePipe, PostCardComponent],
  template: `
    @if (error()) {
      <div class="card">
        <p class="muted">{{ error() }}</p>
        <a routerLink="/feed">← Back to the feed</a>
      </div>
    } @else if (pro() === null) {
      <div class="card">
        <div class="skeleton" style="height: 22px; width: 45%; margin-bottom: 14px"></div>
        <div class="skeleton" style="height: 16px; width: 70%"></div>
      </div>
    } @else {
      <header class="profile-head card">
        <div class="profile-top">
          <div class="avatar">{{ initials(pro()!.display_name) }}</div>
          <div>
            <h1>
              {{ pro()!.display_name }}
              @if (pro()!.sportscertify_credentials.verified) {
                <span class="chip chip--accent verified" title="Verified credentials">✓ Verified</span>
              }
            </h1>
            <p class="role">{{ pro()!.role }}</p>
            <p class="muted">
              {{ pro()!.headline }} · {{ pro()!.location.city }}, {{ pro()!.location.country }}
            </p>
          </div>
        </div>

        <div class="stats muted">
          <span><strong>{{ pro()!.follower_count }}</strong> followers</span>
          <span><strong>{{ pro()!.following_count }}</strong> following</span>
          <span>since {{ pro()!.sportscertify_credentials.member_since | date: 'MMM y' }}</span>
        </div>
      </header>

      <section class="card">
        <h2>Coaching philosophy</h2>
        <p>{{ pro()!.coaching_philosophy }}</p>
      </section>

      <section class="card">
        <h2>Specializations</h2>
        <div class="specs">
          @for (s of pro()!.sportscertify_credentials.specializations; track s) {
            <span class="chip">{{ s }}</span>
          }
        </div>
      </section>

      <section class="card">
        <h2>Sportscertify credentials</h2>
        @for (c of pro()!.sportscertify_credentials.certifications; track c.credential_uid) {
          <div class="cred">
            <div class="cred__head">
              <strong>{{ c.course_title }}</strong>
              <span class="chip" [class.chip--accent]="c.status === 'certified'">{{ c.status }}</span>
            </div>
            <p class="muted">
              {{ c.modules_completed }}/{{ c.total_modules }} modules ·
              UID {{ c.credential_uid }}
              @if (c.certified_on) {
                · certified {{ c.certified_on | date: 'MMM y' }}
              }
            </p>
          </div>
        }
      </section>

      <section class="authored">
        <h2>Posts</h2>
        @for (post of posts(); track post.slug) {
          <sc-post-card [post]="post" />
        } @empty {
          <p class="muted">No posts yet.</p>
        }
      </section>

      <a routerLink="/feed">← Back to the feed</a>
    }
  `,
  styles: [
    `
      .profile-top {
        display: flex;
        gap: 16px;
        align-items: center;
        margin-bottom: 14px;
      }
      .avatar {
        flex: 0 0 auto;
        width: 64px;
        height: 64px;
        border-radius: 16px;
        background: var(--surface-2);
        display: grid;
        place-items: center;
        font-weight: 800;
        font-size: 22px;
        color: var(--accent);
        border: 1px solid var(--border);
      }
      h1 {
        font-size: 24px;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .verified {
        font-size: 12px;
      }
      .role {
        color: var(--accent);
        font-weight: 600;
        margin: 2px 0;
      }
      .stats {
        display: flex;
        gap: 18px;
        font-size: 14px;
      }
      .specs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      h2 {
        font-size: 18px;
        margin-bottom: 10px;
      }
      .cred {
        padding: 10px 0;
        border-bottom: 1px solid var(--border);
      }
      .cred:last-child {
        border-bottom: 0;
      }
      .cred__head {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: space-between;
      }
      .authored {
        margin-top: 24px;
      }
      .authored h2 {
        margin-bottom: 14px;
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);

  readonly pro = signal<Professional | null>(null);
  readonly posts = signal<Post[]>([]);
  readonly error = signal<string | null>(null);

  initials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  ngOnInit(): void {
    const handle = this.route.snapshot.paramMap.get('handle')!;
    this.api.getProfessional(handle).subscribe({
      next: (res) => {
        this.pro.set(res.professional);
        this.posts.set(res.posts);
        this.applySeo(res.professional);
      },
      error: (err) =>
        this.error.set(
          err?.status === 404
            ? 'That professional could not be found.'
            : err?.message ?? 'Request failed',
        ),
    });
  }

  private applySeo(p: Professional): void {
    this.seo.apply({
      title: `${p.display_name} — ${p.role}`,
      description: `${p.headline}. ${p.coaching_philosophy.slice(0, 120)}…`,
      path: `/u/${p.handle}`,
      type: 'profile',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        mainEntity: {
          '@type': 'Person',
          name: p.display_name,
          jobTitle: p.role,
          description: p.headline,
          knowsAbout: p.sportscertify_credentials.specializations,
          address: {
            '@type': 'PostalAddress',
            addressLocality: p.location.city,
            addressCountry: p.location.country,
          },
          url: `${SITE_URL}/u/${p.handle}`,
        },
      },
    });
  }
}
