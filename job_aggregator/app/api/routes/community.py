"""Community posts and voting."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_user_id
from app.services.community_service import create_post, list_posts, vote_post

router = APIRouter()


class CreatePostBody(BaseModel):
    post_type: str
    title: str = Field(..., min_length=4, max_length=200)
    body: str = Field(..., min_length=20, max_length=12000)
    company_name: str | None = None
    is_anonymous: bool = False


class VoteBody(BaseModel):
    vote: int = Field(..., description="1 for upvote, -1 for downvote")


@router.get("/posts")
def get_posts(
    user_id: uuid.UUID = Depends(require_user_id),
    db: Session = Depends(get_db),
    post_type: str | None = Query(default=None),
    limit: int = Query(default=30, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    posts = list_posts(db, viewer_id=user_id, post_type=post_type, limit=limit, offset=offset)
    return {"posts": posts, "count": len(posts)}


@router.post("/posts")
def post_create(
    body: CreatePostBody,
    user_id: uuid.UUID = Depends(require_user_id),
    db: Session = Depends(get_db),
) -> dict:
    try:
        post = create_post(
            db,
            author_id=user_id,
            post_type=body.post_type,
            title=body.title,
            body=body.body,
            company_name=body.company_name,
            is_anonymous=body.is_anonymous,
        )
        db.commit()
        return {"post": post}
    except ValueError as exc:
        db.rollback()
        raise HTTPException(422, str(exc)) from exc


@router.post("/posts/{post_id}/vote")
def post_vote(
    post_id: uuid.UUID,
    body: VoteBody,
    user_id: uuid.UUID = Depends(require_user_id),
    db: Session = Depends(get_db),
) -> dict:
    try:
        post = vote_post(db, user_id=user_id, post_id=post_id, vote=body.vote)
        db.commit()
        return {"post": post}
    except LookupError as exc:
        db.rollback()
        raise HTTPException(404, str(exc)) from exc
    except ValueError as exc:
        db.rollback()
        raise HTTPException(422, str(exc)) from exc
