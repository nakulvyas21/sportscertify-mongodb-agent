import { DOCUMENT } from '@angular/common';
import { inject, Injectable, RendererFactory2 } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

const SITE_NAME = 'Sportscertify';
const SITE_URL = 'https://sportscertify.com';

export interface SeoData {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article' | 'profile';
  jsonLd?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly renderer = inject(RendererFactory2).createRenderer(null, null);

  apply(data: SeoData): void {
    const url = `${SITE_URL}${data.path}`;
    const fullTitle = `${data.title} · ${SITE_NAME}`;

    this.title.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: data.description });

    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:type', content: data.type ?? 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });

    this.setCanonical(url);
    this.setJsonLd(data.jsonLd);
  }

  private setCanonical(url: string): void {
    const head = this.doc.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.renderer.createElement('link') as HTMLLinkElement;
      this.renderer.setAttribute(link, 'rel', 'canonical');
      this.renderer.appendChild(head, link);
    }
    this.renderer.setAttribute(link, 'href', url);
  }

  private setJsonLd(data?: Record<string, unknown>): void {
    const head = this.doc.head;
    const prev = head.querySelector('script[type="application/ld+json"]');
    if (prev) this.renderer.removeChild(head, prev);
    if (!data) return;

    const script = this.renderer.createElement('script') as HTMLScriptElement;
    this.renderer.setAttribute(script, 'type', 'application/ld+json');
    const text = this.renderer.createText(JSON.stringify(data));
    this.renderer.appendChild(script, text);
    this.renderer.appendChild(head, script);
  }
}

export { SITE_NAME, SITE_URL };
