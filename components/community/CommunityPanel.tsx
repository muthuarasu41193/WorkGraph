"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { CommunityPostType } from "../../packages/shared/types/phase3";
import { useCommunityPosts, useCreateCommunityPost, useVoteCommunityPost } from "../../hooks/use-community";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { Textarea } from "../ui/textarea";

const POST_TYPES: { value: CommunityPostType; label: string }[] = [
  { value: "interview", label: "Interview experience" },
  { value: "review", label: "Company review" },
  { value: "salary", label: "Salary insight" },
  { value: "template", label: "Resume template" },
  { value: "discussion", label: "Discussion" },
  { value: "referral", label: "Referral" },
];

export default function CommunityPanel() {
  const [filter, setFilter] = useState<CommunityPostType | undefined>();
  const { data: posts, isLoading, error } = useCommunityPosts(filter);
  const createPost = useCreateCommunityPost();
  const vote = useVoteCommunityPost();

  const [postType, setPostType] = useState<CommunityPostType>("interview");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [company, setCompany] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createPost.mutateAsync({
      post_type: postType,
      title,
      body,
      company_name: company || undefined,
      is_anonymous: anonymous,
    });
    setTitle("");
    setBody("");
    setCompany("");
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Share with the community</CardTitle>
          <CardDescription>
            Post interview experiences, reviews, and referrals. Approved posts earn wallet credits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="flex flex-wrap gap-2">
              {POST_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setPostType(t.value)}
                  className={`rounded-md border px-2 py-1 text-caption font-medium ${
                    postType === t.value
                      ? "border-success bg-success-subtle text-success-foreground"
                      : "border-[var(--border-default)] text-[var(--text-secondary)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Input
              placeholder="Company (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <Textarea
              placeholder="Share details (min 20 characters)…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              minLength={20}
            />
            <label className="flex items-center gap-2 text-body text-[var(--text-secondary)]">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              Post anonymously
            </label>
            <Button type="submit" disabled={createPost.isPending}>
              {createPost.isPending ? "Publishing…" : "Publish"}
            </Button>
            {createPost.isError ? (
              <p className="text-body text-red-600">{(createPost.error as Error).message}</p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant={filter === undefined ? "default" : "secondary"} size="sm" onClick={() => setFilter(undefined)}>
          All
        </Button>
        {POST_TYPES.map((t) => (
          <Button
            key={t.value}
            variant={filter === t.value ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {error ? (
        <p className="text-body text-red-600">Could not load community feed. Is WORKGRAPH_API_URL configured?</p>
      ) : null}

      <ul className="space-y-3">
        {(posts ?? []).map((post) => (
          <li key={post.id}>
            <Card>
              <CardContent className="space-y-2 pt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{post.post_type}</Badge>
                  {post.company_name ? <span className="text-caption text-[var(--text-tertiary)]">{post.company_name}</span> : null}
                </div>
                <h4 className="font-semibold text-[var(--text-primary)]">{post.title}</h4>
                <p className="text-body text-[var(--text-secondary)] line-clamp-4">{post.body}</p>
                <div className="flex items-center justify-between gap-2 text-caption text-[var(--text-tertiary)]">
                  <span>{post.author_display}</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => vote.mutate({ postId: post.id, vote: 1 })}
                    className={post.user_vote === 1 ? "text-success-foreground" : ""}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {post.upvotes}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => vote.mutate({ postId: post.id, vote: -1 })}
                    className={post.user_vote === -1 ? "text-red-600" : ""}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    {post.downvotes}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {!isLoading && !posts?.length ? (
        <p className="text-body text-[var(--text-tertiary)]">No posts yet — be the first to contribute.</p>
      ) : null}
    </div>
  );
}
