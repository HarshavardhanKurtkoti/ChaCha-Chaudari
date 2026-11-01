"""
Chat Routes for ChaCha-Chaudari.
Implements age-adaptive grounded AI chat:
- POST /llama-chat (synchronous response)
- POST /llama-chat-stream (NDJSON streamed response)
"""
from __future__ import annotations

import json
import logging
from flask import Blueprint, request, jsonify, Response, stream_with_context

from services.llm_service import LLMService
from services.rag_service import RAGService
from services.translation_service import TranslationService

log = logging.getLogger(__name__)

chat_bp = Blueprint("chat", __name__)

llm_service = LLMService()
rag_service = RAGService()
translation_service = TranslationService(llm_service=llm_service)


def _prepare_query_context(data: dict):
    prompt = (data.get("prompt") or "").strip()
    age_group = (data.get("ageGroup") or "adult").strip().lower()
    user_name = data.get("name")
    lang = (data.get("lang") or "en").strip().lower()

    if not prompt:
        return None, None, None, None, None

    # Determine if query is in Hindi
    is_hindi = lang.startswith("hi") or translation_service.is_devanagari(prompt)

    # If prompt is in Hindi, translate to English for RAG retrieval over English corpus
    search_prompt = prompt
    if is_hindi and not translation_service.is_mostly_english(prompt):
        english_query = translation_service.translate_to_english(prompt)
        if english_query:
            search_prompt = english_query

    # RAG Retrieval
    retrieved = rag_service.retrieve(search_prompt, top_k=3)
    context_chunks = [r["chunk"] for r in retrieved]

    # Formulate age-adaptive LLM prompt
    built_prompt = llm_service.build_prompt(
        user_prompt=prompt,
        context_chunks=context_chunks,
        age_group=age_group,
        user_name=user_name,
        lang="hi" if is_hindi else "en",
    )

    return prompt, built_prompt, context_chunks, age_group, is_hindi


@chat_bp.route("/llama-chat", methods=["POST"])
def llama_chat():
    data = request.get_json(silent=True) or {}
    raw_prompt, built_prompt, context_chunks, age_group, is_hindi = _prepare_query_context(data)

    if not raw_prompt:
        return jsonify({"error": "Missing 'prompt' in request body"}), 400

    # Attempt LLM generation
    result_text = None
    if llm_service.ensure_loaded():
        result_text = llm_service.generate(built_prompt, max_new_tokens=400)

    # If LLM didn't produce text, use age-adaptive fallback
    if not result_text:
        result_text = llm_service.get_fallback_response(
            prompt=raw_prompt,
            age_group=age_group,
            user_name=data.get("name"),
            lang="hi" if is_hindi else "en",
        )

    return jsonify({
        "result": result_text,
        "response": result_text,
        "retrieved_count": len(context_chunks or []),
        "sources": context_chunks or [],
        "age_group": age_group,
        "is_hindi": is_hindi,
    })


@chat_bp.route("/llama-chat-stream", methods=["POST"])
def llama_chat_stream():
    data = request.get_json(silent=True) or {}
    raw_prompt, built_prompt, context_chunks, age_group, is_hindi = _prepare_query_context(data)

    if not raw_prompt:
        return jsonify({"error": "Missing 'prompt' in request body"}), 400

    def generate_stream():
        has_streamed_any = False

        if llm_service.ensure_loaded():
            try:
                for token in llm_service.stream_generate(built_prompt, max_new_tokens=500):
                    if token:
                        has_streamed_any = True
                        yield json.dumps({"delta": token, "token": token}) + "\n"
            except Exception as e:
                log.error("Error during streaming generation: %s", e)

        # Fallback if streaming failed or LLM not available
        if not has_streamed_any:
            fallback = llm_service.get_fallback_response(
                prompt=raw_prompt,
                age_group=age_group,
                user_name=data.get("name"),
                lang="hi" if is_hindi else "en",
            )
            # Emit in short chunks for responsive typing experience
            words = fallback.split(" ")
            for i in range(0, len(words), 3):
                chunk = " ".join(words[i:i + 3]) + " "
                yield json.dumps({"delta": chunk, "token": chunk}) + "\n"

        # Signal completion with metadata
        yield json.dumps({
            "done": True,
            "retrieved_count": len(context_chunks or []),
            "age_group": age_group,
        }) + "\n"

    return Response(
        stream_with_context(generate_stream()),
        mimetype="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
