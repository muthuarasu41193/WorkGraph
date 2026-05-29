"""Community posts, votes, and contributor rewards."""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.models_workgraph import (
    POST_TYPES,
    WgCommunityPost,
    WgCommunityVote,
    WgProfile,
    WgUser,
    WgWallet,
    WgWalletTransaction,
)

EARN_CENTS_BY_TYPE: dict[str, int] = {
    "interview": 500,
    "review": 300,
    "salary": 400,
    "template": 250,
    "discussion": 100,
    "referral": 350,
}


def _auto_approve() -> bool:
    return os.getenv("WORKGRAPH_COMMUNITY_AUTO_APPROVE", "true").lower() in ("1", "true", "yes")


def ensure_user(session: Session, user_id: uuid.UUID, email: str | None = None, display_name: str | None = None) -> WgUser:
    user = session.get(WgUser, user_id)
    if user:
        if email and not user.email:
            user.email = email
        if display_name and not user.display_name:
            user.display_name = display_name
        user.updated_at = datetime.now(timezone.utc)
        return user

    user = WgUser(
        id=user_id,
        email=email,
        display_name=display_name or (email.split("@")[0] if email else "Member"),
        auth_provider=os.getenv("WORKGRAPH_AUTH_PROVIDER", "supertokens"),
        external_auth_id=str(user_id),
    )
    session.add(user)
    session.flush()
    session.execute(
        pg_insert(WgProfile)
        .values(id=user_id)
        .on_conflict_do_nothing(index_elements=["id"])
    )
    session.execute(
        pg_insert(WgWallet)
        .values(user_id=user_id)
        .on_conflict_do_nothing(index_elements=["user_id"])
    )
    session.flush()
    return user


def list_posts(
    session: Session,
    *,
    viewer_id: uuid.UUID | None,
    post_type: str | None = None,
    limit: int = 30,
    offset: int = 0,
) -> list[dict]:
    q = select(WgCommunityPost).where(WgCommunityPost.moderation_status == "approved")
    if post_type and post_type in POST_TYPES:
        q = q.where(WgCommunityPost.post_type == post_type)
    q = q.order_by(WgCommunityPost.created_at.desc()).limit(limit).offset(offset)
    posts = list(session.scalars(q).all())

    vote_map: dict[uuid.UUID, int] = {}
    if viewer_id and posts:
        votes = session.scalars(
            select(WgCommunityVote).where(
                WgCommunityVote.user_id == viewer_id,
                WgCommunityVote.post_id.in_([p.id for p in posts]),
            )
        ).all()
        vote_map = {v.post_id: v.vote for v in votes}

    author_names: dict[uuid.UUID, str] = {}
    author_ids = {p.author_id for p in posts if p.author_id and not p.is_anonymous}
    if author_ids:
        users = session.scalars(select(WgUser).where(WgUser.id.in_(author_ids))).all()
        author_names = {u.id: u.display_name or "Member" for u in users}

    return [_post_to_dict(p, viewer_id, vote_map, author_names) for p in posts]


def _post_to_dict(
    post: WgCommunityPost,
    viewer_id: uuid.UUID | None,
    vote_map: dict[uuid.UUID, int],
    author_names: dict[uuid.UUID, str],
) -> dict:
    author_display = "Anonymous"
    if not post.is_anonymous and post.author_id:
        author_display = author_names.get(post.author_id, "Member")
    user_vote = vote_map.get(post.id, 0) if viewer_id else 0
    return {
        "id": str(post.id),
        "author_id": str(post.author_id) if post.author_id else None,
        "author_display": author_display,
        "post_type": post.post_type,
        "title": post.title,
        "body": post.body,
        "company_name": post.company_name,
        "is_anonymous": post.is_anonymous,
        "upvotes": post.upvotes,
        "downvotes": post.downvotes,
        "reputation_delta": post.reputation_delta,
        "moderation_status": post.moderation_status,
        "user_vote": user_vote,
        "created_at": post.created_at.isoformat(),
    }


def create_post(
    session: Session,
    *,
    author_id: uuid.UUID,
    post_type: str,
    title: str,
    body: str,
    company_name: str | None,
    is_anonymous: bool,
) -> dict:
    if post_type not in POST_TYPES:
        raise ValueError(f"Invalid post_type: {post_type}")

    status = "approved" if _auto_approve() else "pending"
    post = WgCommunityPost(
        author_id=author_id,
        post_type=post_type,
        title=title.strip(),
        body=body.strip(),
        company_name=company_name.strip() if company_name else None,
        is_anonymous=is_anonymous,
        moderation_status=status,
    )
    session.add(post)
    session.flush()

    if status == "approved":
        _credit_post_reward(session, author_id, post)

    return _post_to_dict(post, author_id, {}, {})


def _credit_post_reward(session: Session, user_id: uuid.UUID, post: WgCommunityPost) -> None:
    cents = EARN_CENTS_BY_TYPE.get(post.post_type, 100)
    wallet = session.get(WgWallet, user_id)
    if not wallet:
        wallet = WgWallet(user_id=user_id)
        session.add(wallet)
        session.flush()

    wallet.balance_cents += cents
    wallet.updated_at = datetime.now(timezone.utc)
    post.reputation_delta += max(1, cents // 100)

    profile = session.get(WgProfile, user_id)
    if profile:
        profile.contribution_score += max(1, cents // 50)
    else:
        session.add(WgProfile(id=user_id, contribution_score=max(1, cents // 50)))

    session.add(
        WgWalletTransaction(
            user_id=user_id,
            amount_cents=cents,
            kind="earn",
            status="completed",
            description=f"Community post: {post.post_type}",
            reference_id=post.id,
        )
    )


def vote_post(session: Session, *, user_id: uuid.UUID, post_id: uuid.UUID, vote: int) -> dict:
    if vote not in (-1, 1):
        raise ValueError("vote must be -1 or 1")

    post = session.get(WgCommunityPost, post_id)
    if not post or post.moderation_status != "approved":
        raise LookupError("Post not found")

    existing = session.get(WgCommunityVote, {"user_id": user_id, "post_id": post_id})
    if existing:
        if existing.vote == vote:
            session.delete(existing)
            if vote == 1:
                post.upvotes = max(0, post.upvotes - 1)
            else:
                post.downvotes = max(0, post.downvotes - 1)
        else:
            if existing.vote == 1:
                post.upvotes = max(0, post.upvotes - 1)
            else:
                post.downvotes = max(0, post.downvotes - 1)
            existing.vote = vote
            if vote == 1:
                post.upvotes += 1
            else:
                post.downvotes += 1
    else:
        session.add(WgCommunityVote(user_id=user_id, post_id=post_id, vote=vote))
        if vote == 1:
            post.upvotes += 1
        else:
            post.downvotes += 1

    session.flush()
    vote_map = {post_id: vote}
    return _post_to_dict(post, user_id, vote_map, {})
