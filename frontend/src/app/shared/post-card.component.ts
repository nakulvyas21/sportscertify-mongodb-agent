import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { POST_TYPE_LABEL, type Post } from '../core/models';

@Component({
  selector: 'sc-post-card',
  imports: [RouterLink, DatePipe],
  template: `
    <article class="card post">
      <div class="post__head">
        <a class="post__author" [routerLink]="['/u', post.author_handle]">
          {{ post.author_display_name }}
        </a>
        <span class="muted post__role">{{ post.author_role }}</span>
        <span class="chip post__type">{{ typeLabel }}</span>
      </div>

      <a class="post__content" [routerLink]="['/post', post.slug]">{{ post.content }}</a>

      <div class="post__tags">
        @for (tag of post.tags; track tag) {
          <span class="tag">{{ tag }}</span>
        }
      </div>

      <div class="post__meta muted">
        <span>♥ {{ post.like_count }}</span>
        <span>⟲ {{ post.repost_count }}</span>
        <span>💬 {{ post.top_comments.length }}</span>
        <span>{{ post.created_at | date: 'mediumDate' }}</span>
      </div>
    </article>
  `,
  styles: [
    `
      .post__head {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 10px;
      }
      .post__author {
        font-weight: 700;
        color: var(--text);
      }
      .post__role {
        font-size: 13px;
      }
      .post__type {
        margin-left: auto;
      }
      .post__content {
        display: block;
        color: var(--text);
        font-size: 16px;
        margin-bottom: 12px;
      }
      .post__content:hover {
        text-decoration: none;
        color: var(--accent);
      }
      .post__tags {
        margin-bottom: 10px;
      }
      .post__meta {
        display: flex;
        gap: 16px;
        font-size: 13px;
      }
    `,
  ],
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;

  get typeLabel(): string {
    return POST_TYPE_LABEL[this.post.post_type] ?? this.post.post_type;
  }
}
