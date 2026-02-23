"""
Chat Service

Provides the chat_call() function that proxies user messages and a
system prompt to an external LLM REST API.
"""

import logging
import json
import requests as http_requests
from app.config import URL as LLM_URL, api_key as LLM_API_KEY, TEMPERATURE, MAX_TOKENS

logger = logging.getLogger(__name__)

# Log LLM configuration at import time
logger.info(f"[chat_service] LLM_URL configured: {'YES (' + LLM_URL[:30] + '...)' if LLM_URL else 'NO (empty)'}")
logger.info(f"[chat_service] LLM_API_KEY configured: {'YES (' + LLM_API_KEY[:8] + '...)' if LLM_API_KEY else 'NO (empty)'}")
logger.info(f"[chat_service] TEMPERATURE={TEMPERATURE}, MAX_TOKENS={MAX_TOKENS}")


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
        logger.error("[chat_call] LLM_API_URL is empty/not set! Check your .env file.")
        raise ValueError(
            "LLM_API_URL is not configured. "
            "Set LLM_API_URL and LLM_API_KEY in the backend .env file."
        )

    prompt = system_prompt + " Question: " + user_input

    logger.info("=" * 60)
    logger.info("[chat_call] === NEW LLM REQUEST ===")
    logger.info(f"[chat_call] LLM URL: {LLM_URL}")
    logger.info(f"[chat_call] Total prompt length: {len(prompt)} chars")
    logger.info(f"[chat_call] System prompt length: {len(system_prompt)} chars")
    logger.info(f"[chat_call] User input: {user_input}")
    logger.info(f"[chat_call] System prompt preview (first 500 chars):")
    logger.info(f"  {system_prompt[:500]}{'...' if len(system_prompt) > 500 else ''}")
    logger.info(f"[chat_call] Temperature: {TEMPERATURE}, Max tokens: {MAX_TOKENS}")

    try:
        logger.info(f"[chat_call] Sending POST to {LLM_URL} (form-encoded)...")
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

        logger.info(f"[chat_call] Response status: {response.status_code}")
        logger.info(f"[chat_call] Response headers: {dict(response.headers)}")

        # Log raw response body for debugging
        raw_body = response.text
        logger.info(f"[chat_call] Raw response body ({len(raw_body)} chars):")
        logger.info(f"  {raw_body[:1000]}{'...' if len(raw_body) > 1000 else ''}")

        response.raise_for_status()

        # Try to parse as JSON
        try:
            response_json = response.json()
            logger.info(f"[chat_call] Parsed JSON keys: {list(response_json.keys())}")
        except json.JSONDecodeError as e:
            logger.error(f"[chat_call] Failed to parse response as JSON: {e}")
            logger.error(f"[chat_call] Raw text: {raw_body[:500]}")
            raise ValueError(f"LLM returned non-JSON response: {raw_body[:200]}")

        answer = response_json.get("answer", "")

        if not answer:
            # Try alternative response keys that different LLM APIs use
            for alt_key in ["response", "text", "output", "content", "result", "message"]:
                answer = response_json.get(alt_key, "")
                if answer:
                    logger.info(f"[chat_call] Found answer in alternative key: '{alt_key}'")
                    break

            # Check for nested structures (OpenAI-style)
            if not answer and "choices" in response_json:
                choices = response_json["choices"]
                if choices and len(choices) > 0:
                    choice = choices[0]
                    answer = choice.get("text", "") or choice.get("message", {}).get("content", "")
                    logger.info(f"[chat_call] Found answer in choices[0] (OpenAI-style)")

            if not answer:
                logger.warning(f"[chat_call] No 'answer' key in response. Full response: {response_json}")
                answer = f"(LLM responded but no 'answer' field found. Response keys: {list(response_json.keys())})"

        logger.info(f"[chat_call] Answer ({len(answer)} chars): {answer[:200]}{'...' if len(answer) > 200 else ''}")
        logger.info("=" * 60)
        return answer

    except http_requests.exceptions.Timeout:
        logger.error("[chat_call] Request timed out after 120 seconds!")
        raise
    except http_requests.exceptions.ConnectionError as e:
        logger.error(f"[chat_call] Connection error: {e}")
        logger.error(f"[chat_call] Is the LLM server running at {LLM_URL}?")
        raise
    except http_requests.exceptions.HTTPError as e:
        logger.error(f"[chat_call] HTTP error: {e}")
        logger.error(f"[chat_call] Response body: {e.response.text[:500] if e.response else 'N/A'}")
        raise
    except Exception as e:
        logger.error(f"[chat_call] Unexpected error: {type(e).__name__}: {e}", exc_info=True)
        raise
