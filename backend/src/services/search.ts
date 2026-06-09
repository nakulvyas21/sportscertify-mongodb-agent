import { getDb } from "../config/db.js";
import { COLLECTIONS, getConfig } from "../config/env.js";
import { embedQuery } from "./voyage.js";
import type { PostDocument, UserDocument } from "../types/models.js";

export interface PostSearchHit extends PostDocument {
  score: number;
}

export interface VectorSearchOptions {
  limit?: number;
  filter?: {
    post_type?: PostDocument["post_type"];
    tags?: string;
    author_role?: UserDocument["role"];
  };
  numCandidates?: number;
}

export async function searchPosts(
  query: string,
  opts: VectorSearchOptions = {}
): Promise<PostSearchHit[]> {
  const { limit = 5, numCandidates = limit * 15, filter } = opts;
  const db = await getDb();
  const queryVector = await embedQuery(query);

  const vectorStage: Record<string, unknown> = {
    index: getConfig().VECTOR_INDEX_NAME,
    path: "content_embedding",
    queryVector,
    numCandidates,
    limit,
  };

  if (filter) {
    const f: Record<string, unknown> = {};
    if (filter.post_type) f.post_type = filter.post_type;
    if (filter.tags) f.tags = filter.tags;
    if (filter.author_role) f.author_role = filter.author_role;
    if (Object.keys(f).length > 0) vectorStage.filter = f;
  }

  const pipeline = [
    { $vectorSearch: vectorStage },
    {
      $project: {
        content_embedding: 0,
        score: { $meta: "vectorSearchScore" },
        author_handle: 1,
        author_display_name: 1,
        author_role: 1,
        post_type: 1,
        content: 1,
        tags: 1,
        metrics: 1,
        top_comments: 1,
        like_count: 1,
        repost_count: 1,
        created_at: 1,
      },
    },
  ];

  return db
    .collection<PostDocument>(COLLECTIONS.posts)
    .aggregate<PostSearchHit>(pipeline)
    .toArray();
}

export async function findCertifiedProfessionals(opts: {
  role?: UserDocument["role"];
  specialization?: string;
  verifiedOnly?: boolean;
  limit?: number;
}): Promise<UserDocument[]> {
  const { role, specialization, verifiedOnly = true, limit = 10 } = opts;
  const db = await getDb();

  const match: Record<string, unknown> = {};
  if (role) match.role = role;
  if (verifiedOnly) match["sportscertify_credentials.verified"] = true;
  if (specialization) {
    match["sportscertify_credentials.specializations"] = {
      $regex: specialization,
      $options: "i",
    };
  }

  return db
    .collection<UserDocument>(COLLECTIONS.users)
    .find(match, { projection: { _id: 0 } })
    .limit(limit)
    .toArray();
}
