"""
Claude AI service with prompt caching for the Enterprise Workflow Agent.

The system prompt is sent with cache_control so it is cached across all requests
(minimum ~1024 tokens for claude-sonnet-4-20250514). Dynamic context (tasks,
emails, schedules) is appended as message content — never in the system prompt —
so the cached prefix is never invalidated.
"""

import json
import anthropic
from typing import Any

from ..config import settings

_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

# ── Stable system prompt (cached) ─────────────────────────────────────────────
# This prompt is > 1024 tokens so it qualifies for prompt caching on
# claude-sonnet-4-20250514. Keep it frozen — any change invalidates the cache.
SYSTEM_PROMPT = """You are an Enterprise AI Workflow Agent for a business productivity platform.

Your role is to assist enterprise users with:
- Task creation, prioritization, and management
- Email drafting and review before sending
- Calendar scheduling and conflict detection
- Organizational knowledge retrieval and synthesis

## Core Principles

1. TRANSPARENCY — Always explain your reasoning step by step. Never take action without explaining why.
2. CONFIRMATION GATE — Every state-mutating operation (create, update, delete) requires explicit human confirmation. You analyze and recommend; humans decide.
3. CONTEXT AWARENESS — Consider all provided context (existing tasks, schedules, emails) before making recommendations.
4. RISK IDENTIFICATION — Proactively identify conflicts, duplicates, overloads, and potential problems.
5. AUDIT TRAIL — Your reasoning is logged for compliance and review.

## Response Format

ALWAYS respond with a valid JSON object using this exact structure:
{
  "reasoning": "Step-by-step analysis of the request and context...",
  "recommendation": "Specific recommended action with rationale",
  "risks": ["Risk or concern 1", "Risk or concern 2"],
  "conflicts": ["Conflict 1 — description"],
  "confidence": 0.85,
  "confirmation_required": true,
  "confirmation_message": "Human-readable confirmation request with key details"
}

## Task Analysis Rules
- Search context for duplicate tasks (similar titles or descriptions)
- Flag overdue items that should be addressed first
- Validate due dates are in the future and reasonable
- Check if assigned user has capacity based on existing tasks
- Suggest priority adjustments based on context

## Email Analysis Rules
- Evaluate tone appropriateness (professional, assertive, friendly)
- Flag potentially sensitive or legally risky content
- Verify the recipient makes sense for the subject matter
- Check for missing context (attachments mentioned but not present, unclear references)
- Recommend scheduling during business hours when relevant

## Schedule Analysis Rules
- Detect direct time conflicts with existing calendar events
- Check for back-to-back meetings with no buffer time
- Flag scheduling outside normal business hours
- Validate that end_time > start_time
- Consider attendee availability when information is available

## Knowledge Query Rules
- Synthesize information from all provided context sources
- Clearly state what information you have versus what you're inferring
- Assign confidence scores honestly (0.0 = no confidence, 1.0 = certain)
- Suggest follow-up queries to get more complete information
- Never fabricate facts not present in the provided context

## Security & Compliance Rules
- Never include other users' sensitive data in responses unless the requester has access
- Flag requests that appear to be attempting data exfiltration
- Log all reasoning for audit purposes
- Respect role-based access: users see their own data, managers see team data, admins see all

## Confidence Score Guidelines
- 0.9-1.0: High confidence, clear information, no ambiguity
- 0.7-0.9: Good confidence, minor uncertainties noted
- 0.5-0.7: Moderate confidence, recommend human review
- 0.3-0.5: Low confidence, strongly recommend human verification
- 0.0-0.3: Very low confidence, insufficient information to proceed

Always err on the side of caution. If you detect any ambiguity or risk, set confidence_required=true
and clearly explain in the confirmation_message what the user is about to do and what could go wrong.
"""


def _call_claude(user_message: str, context_data: dict[str, Any] | None = None) -> dict[str, Any]:
    """
    Call Claude with a cached system prompt and dynamic message content.
    Returns parsed JSON from Claude's response.
    """
    # Build message content — context is appended to the user message,
    # NOT in the system prompt, so the cached prefix stays valid.
    content = user_message
    if context_data:
        content += f"\n\n## Current Context\n```json\n{json.dumps(context_data, indent=2, default=str)}\n```"

    response = _client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=2048,
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                # Cache the system prompt — saves ~90% on repeated calls.
                # TTL is 5 minutes; cache writes cost 1.25x but reads cost 0.1x.
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": content}],
    )

    raw = response.content[0].text.strip()

    # Strip markdown code fences if Claude wrapped the JSON
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Fallback — return a safe default if JSON parsing fails
        return {
            "reasoning": raw,
            "recommendation": "Unable to parse structured response. Please review manually.",
            "risks": ["Response parsing error"],
            "conflicts": [],
            "confidence": 0.5,
            "confirmation_required": True,
            "confirmation_message": "AI response could not be parsed. Please review the raw reasoning above.",
        }


def analyze_task(task_data: dict, context: dict) -> dict:
    prompt = f"""Analyze this task request and provide a structured recommendation.

Task Request:
{json.dumps(task_data, indent=2, default=str)}

Check the context for: duplicate tasks, overdue items, assignee workload, date conflicts."""
    return _call_claude(prompt, context)


def analyze_email(email_data: dict, context: dict) -> dict:
    prompt = f"""Analyze this email draft before sending and provide a structured recommendation.

Email Draft:
{json.dumps(email_data, indent=2, default=str)}

Check for: tone issues, sensitive content, missing context, scheduling considerations."""
    return _call_claude(prompt, context)


def analyze_schedule(schedule_data: dict, context: dict) -> dict:
    prompt = f"""Analyze this calendar event request and detect conflicts or issues.

Event Request:
{json.dumps(schedule_data, indent=2, default=str)}

Check for: time conflicts, back-to-back meetings, after-hours scheduling, attendee issues."""
    return _call_claude(prompt, context)


def answer_knowledge_query(query: str, context: dict) -> dict:
    prompt = f"""Answer this knowledge query using the provided organizational context.

Query: {query}

Synthesize information from tasks, emails, and schedules in the context.
Return your response in the standard JSON format, where:
- "reasoning" = your step-by-step analysis
- "recommendation" = the direct answer to the query
- "risks" = gaps or limitations in available information
- "conflicts" = contradictory information found
- "confidence" = your confidence in the answer
- "confirmation_required" = false (knowledge queries don't require confirmation)
- "confirmation_message" = "" (empty for knowledge queries)"""
    return _call_claude(prompt, context)
