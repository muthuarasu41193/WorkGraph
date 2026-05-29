"""WorkGraph user, community, and wallet ORM models (self-hosted Postgres)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base

POST_TYPES = (
    "interview",
    "review",
    "salary",
    "template",
    "discussion",
    "referral",
)


class WgUser(Base):
    __tablename__ = "wg_users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str | None] = mapped_column(Text, unique=True, nullable=True)
    display_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    auth_provider: Mapped[str] = mapped_column(Text, nullable=False, default="email")
    external_auth_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[str] = mapped_column(Text, nullable=False, default="user")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )


class WgProfile(Base):
    __tablename__ = "wg_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wg_users.id", ondelete="CASCADE"), primary_key=True
    )
    full_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(Text, nullable=True)
    headline: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    years_of_experience: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    skills: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    education: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    work_experience: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    certifications: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    projects: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    linkedin_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    github_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    website_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    resume_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    resume_raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ats_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ats_feedback: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    profile_completeness: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    trust_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    contribution_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )


class WgCommunityPost(Base):
    __tablename__ = "wg_community_posts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wg_users.id", ondelete="SET NULL"), nullable=True
    )
    post_type: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    company_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    upvotes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    downvotes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reputation_delta: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    moderation_status: Mapped[str] = mapped_column(Text, nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )


class WgCommunityVote(Base):
    __tablename__ = "wg_community_votes"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wg_users.id", ondelete="CASCADE"), primary_key=True
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wg_community_posts.id", ondelete="CASCADE"), primary_key=True
    )
    vote: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )


class WgWallet(Base):
    __tablename__ = "wg_wallets"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wg_users.id", ondelete="CASCADE"), primary_key=True
    )
    balance_cents: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    pending_cents: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    currency: Mapped[str] = mapped_column(Text, nullable=False, default="USD")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )


class WgWalletTransaction(Base):
    __tablename__ = "wg_wallet_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wg_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    kind: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="completed")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    reference_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )


class WgSavedJob(Base):
    __tablename__ = "wg_saved_jobs"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wg_users.id", ondelete="CASCADE"), primary_key=True
    )
    job_id: Mapped[int] = mapped_column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True)


class WgJobApplication(Base):
    __tablename__ = "wg_job_applications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wg_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_id: Mapped[int] = mapped_column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="applied")
