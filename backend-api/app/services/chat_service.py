"""
Chat Service

Provides the chat_call() function that proxies user messages and a
system prompt to an external LLM REST API.
"""

import logging
import requests as http_requests
from app.config import URL as LLM_URL, api_key as LLM_API_KEY, TEMPERATURE, MAX_TOKENS

logger = logging.getLogger(__name__)


def chat_call(user_input: str, system_prompt: str) -> str:
    """
    Send a single-turn question to the external LLM API.

    Combines the system_prompt and user_input into one prompt string,
    as per the reference implementation in the LLM feature overview.

    Args:
        user_input:    The user's question.
        system_prompt: Context injected by the frontend (e.g. cost summary text).

    Returns:
        The LLM's answer string.

    Raises:
        requests.HTTPError: If the LLM API returns a non-2xx status.
        Exception: For any other network or parsing error.
    """
    if not LLM_URL:
        raise ValueError(
            "LLM_API_URL is not configured. "
            "Set LLM_API_URL and LLM_API_KEY in the backend .env file."
        )

    prompt = system_prompt + " Question: " + user_input
    logger.info(f"[chat_call] Sending prompt to LLM ({len(prompt)} chars)")

    response = http_requests.post(
        LLM_URL,
        data={
            "prompt": prompt,
            "temperature": TEMPERATURE,
            "max_tokens": MAX_TOKENS,
        },
        headers={"Authorization": f"Bearer {LLM_API_KEY}"},
        timeout=120,
    )
    response.raise_for_status()

    answer = response.json().get("answer", "")
    logger.info(f"[chat_call] Received answer ({len(answer)} chars)")
    return answer
