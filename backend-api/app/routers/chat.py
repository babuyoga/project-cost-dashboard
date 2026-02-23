"""
Chat Router

Provides the AI chat endpoint. The backend acts as a pass-through:
the frontend supplies the financial context in the system_prompt field,
and the backend proxies it to the external LLM API.
"""

import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest
from app.services.chat_service import chat_call

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("")
def chat(request: ChatRequest):
    """
    Send a user question to the external LLM, with financial context
    injected via the system_prompt by the frontend.

    Args:
        request: { user_input, system_prompt }

    Returns:
        { "answer": "<LLM response>" }
    """
    logger.info("POST /api/chat")
    logger.info(f"  user_input: {request.user_input[:80]}{'...' if len(request.user_input) > 80 else ''}")
    logger.info(f"  system_prompt length: {len(request.system_prompt)} chars")

    try:
        answer = chat_call(request.user_input, request.system_prompt)
        logger.info(f"  LLM responded with {len(answer)} chars")
        return {"answer": answer}
    except ValueError as e:
        # LLM not configured
        logger.warning(f"  LLM not configured: {e}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"  Chat failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
