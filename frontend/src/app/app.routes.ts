import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'feed' },
  {
    path: 'feed',
    loadComponent: () => import('./pages/feed.component').then((m) => m.FeedComponent),
  },
  {
    path: 'post/:slug',
    loadComponent: () => import('./pages/post.component').then((m) => m.PostComponent),
  },
  {
    path: 'u/:handle',
    loadComponent: () => import('./pages/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found.component').then((m) => m.NotFoundComponent),
  },
];
