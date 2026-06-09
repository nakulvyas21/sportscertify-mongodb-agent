import type { ObjectId } from "mongodb";

export type ProfessionalRole =
  | "Tactical Analyst"
  | "FIFA Referee"
  | "Sports Scientist"
  | "Strength & Conditioning Coach"
  | "Head Coach"
  | "Performance Analyst"
  | "Team Physiotherapist";

export interface SportscertifyCredential {
  course_id: string;
  course_title: string;
  status: "completed" | "in_progress" | "certified" | "expired";
  modules_completed: number;
  total_modules: number;
  certified_on: Date | null;
  credential_uid: string;
}

export interface SportscertifyCredentials {
  verified: boolean;
  member_since: Date;
  specializations: string[];
  certifications: SportscertifyCredential[];
}

export interface UserDocument {
  _id?: ObjectId;
  handle: string;
  display_name: string;
  role: ProfessionalRole;
  headline: string;
  location: {
    city: string;
    country: string;
    host_city: boolean;
  };
  coaching_philosophy: string;
  sportscertify_credentials: SportscertifyCredentials;
  follower_count: number;
  following_count: number;
  created_at: Date;
}

export interface EmbeddedComment {
  comment_id: string;
  author_handle: string;
  author_display_name: string;
  author_role: ProfessionalRole;
  text: string;
  likes: number;
  created_at: Date;
}

export type PostType =
  | "tactical_analysis"
  | "sports_science_data"
  | "team_logistics"
  | "player_workload"
  | "discussion";

export interface PostDocument {
  _id?: ObjectId;
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
  content_embedding?: number[];
  created_at: Date;
}
