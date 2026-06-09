export type ProfessionalRole =
  | 'Tactical Analyst'
  | 'FIFA Referee'
  | 'Sports Scientist'
  | 'Strength & Conditioning Coach'
  | 'Head Coach'
  | 'Performance Analyst'
  | 'Team Physiotherapist';

export type PostType =
  | 'tactical_analysis'
  | 'sports_science_data'
  | 'team_logistics'
  | 'player_workload'
  | 'discussion';

export interface EmbeddedComment {
  comment_id: string;
  author_handle: string;
  author_display_name: string;
  author_role: ProfessionalRole;
  text: string;
  likes: number;
  created_at: string;
}

export interface Post {
  slug: string;
  author_handle: string;
  author_display_name: string;
  author_role: ProfessionalRole;
  post_type: PostType;
  content: string;
  tags: string[];
  metrics?: Record<string, number | string>;
  top_comments: EmbeddedComment[];
  like_count: number;
  repost_count: number;
  created_at: string;
}

export interface Credential {
  course_id: string;
  course_title: string;
  status: 'completed' | 'in_progress' | 'certified' | 'expired';
  modules_completed: number;
  total_modules: number;
  certified_on: string | null;
  credential_uid: string;
}

export interface Professional {
  handle: string;
  display_name: string;
  role: ProfessionalRole;
  headline: string;
  location: { city: string; country: string; host_city: boolean };
  coaching_philosophy: string;
  sportscertify_credentials: {
    verified: boolean;
    member_since: string;
    specializations: string[];
    certifications: Credential[];
  };
  follower_count: number;
  following_count: number;
  created_at: string;
}

export interface FeedResponse {
  count: number;
  posts: Post[];
}
export interface PostResponse {
  post: Post;
}
export interface ProfessionalResponse {
  professional: Professional;
  posts: Post[];
}
export interface SearchResponse {
  query: string;
  count: number;
  hits: Array<Post & { score: number }>;
}

export const POST_TYPE_LABEL: Record<PostType, string> = {
  tactical_analysis: 'Tactical Analysis',
  sports_science_data: 'Sports Science',
  team_logistics: 'Team Logistics',
  player_workload: 'Player Workload',
  discussion: 'Discussion',
};
