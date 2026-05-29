"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CommunityPost, CommunityPostType } from "../packages/shared/types/phase3";
import { workgraphApiEnabled } from "../lib/workgraph-api";

async function fetchPosts(postType?: CommunityPostType): Promise<CommunityPost[]> {
  const qs = postType ? `?post_type=${encodeURIComponent(postType)}` : "";
  const res = await fetch(`/api/v2/community/posts${qs}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load community posts");
  const data = (await res.json()) as { posts: CommunityPost[] };
  return data.posts;
}

export function useCommunityPosts(postType?: CommunityPostType) {
  return useQuery({
    queryKey: ["workgraph", "community", postType ?? "all"],
    queryFn: () => fetchPosts(postType),
    enabled: workgraphApiEnabled(),
  });
}

export function useCreateCommunityPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      post_type: CommunityPostType;
      title: string;
      body: string;
      company_name?: string;
      is_anonymous?: boolean;
    }) => {
      const res = await fetch("/api/v2/community/posts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to create post");
      }
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["workgraph", "community"] });
      void qc.invalidateQueries({ queryKey: ["workgraph", "dashboard"] });
      void qc.invalidateQueries({ queryKey: ["workgraph", "wallet"] });
    },
  });
}

export function useVoteCommunityPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, vote }: { postId: string; vote: 1 | -1 }) => {
      const res = await fetch(`/api/v2/community/posts/${postId}/vote`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });
      if (!res.ok) throw new Error("Vote failed");
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["workgraph", "community"] });
    },
  });
}
