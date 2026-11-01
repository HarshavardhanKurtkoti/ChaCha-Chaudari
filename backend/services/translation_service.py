"""
Translation Service for ChaCha-Chaudari.
Provides bilingual (Hindi <-> English) translation with provider abstraction,
LLM-based translation, and rule/dictionary fallbacks.
"""
from __future__ import annotations

import re
import logging
from typing import Optional, Any

log = logging.getLogger(__name__)

DEVANAGARI_RANGE = re.compile(r'[\u0900-\u097F]')

COMMON_HINDI_CONVERSATION_MAP = {
    "नमस्ते": "Hello",
    "आप कैसे हैं": "How are you",
    "गंगा": "Ganga",
    "गंगा नदी": "Ganga river",
    "नमामि गंगे": "Namami Gange",
    "डॉल्फ़िन": "Dolphin",
    "प्रदूषण": "Pollution",
    "सफाई": "Cleaning",
    "घाट": "Ghat",
    "धन्यवाद": "Thank you",
}

class TranslationService:
    def __init__(self, llm_service: Optional[Any] = None):
        self.llm_service = llm_service

    def is_devanagari(self, text: str) -> bool:
        """Check if string contains significant Devanagari (Hindi) characters."""
        if not text:
            return False
        matches = DEVANAGARI_RANGE.findall(text)
        return len(matches) >= 3

    def is_mostly_english(self, text: str) -> bool:
        """Heuristic check if string is mostly English ASCII."""
        if not text:
            return True
        non_ascii = [c for c in text if ord(c) > 127]
        return (len(non_ascii) / max(len(text), 1)) < 0.2

    def translate_to_english(self, text: str) -> str:
        """Translate Hindi or mixed prompt to English for RAG/inference."""
        if not text or not text.strip():
            return ""

        trimmed = text.strip()
        if self.is_mostly_english(trimmed) and not self.is_devanagari(trimmed):
            return trimmed

        # Try LLM-based translation if loaded
        if self.llm_service and hasattr(self.llm_service, "generate"):
            try:
                prompt = (
                    "Translate the following text to English. "
                    "Do not add any extra explanation, examples, or questions. "
                    "Keep sentences short and clear.\n\nText:\n" + trimmed + "\n\nEnglish:"
                )
                res = self.llm_service.generate(prompt, max_new_tokens=250)
                if res and res.strip():
                    return res.strip()
            except Exception as e:
                log.debug("LLM translation to English failed: %s", e)

        # Fallback to dictionary keyword matching
        translated = trimmed
        for hi, en in COMMON_HINDI_CONVERSATION_MAP.items():
            translated = translated.replace(hi, en)

        return translated

    def translate_to_hindi(self, text: str) -> str:
        """Translate English text to Hindi for display and Hindi TTS."""
        if not text or not text.strip():
            return ""

        trimmed = text.strip()
        if self.is_devanagari(trimmed):
            return trimmed

        # Try LLM-based translation if loaded
        if self.llm_service and hasattr(self.llm_service, "generate"):
            try:
                prompt = (
                    "Translate the following text to Hindi in Devanagari script. "
                    "Do not add any extra explanation, examples, or questions. "
                    "Keep sentences short and clear.\n\nText:\n" + trimmed + "\n\nHindi:"
                )
                res = self.llm_service.generate(prompt, max_new_tokens=350)
                if res and res.strip():
                    return res.strip()
            except Exception as e:
                log.debug("LLM translation to Hindi failed: %s", e)

        return trimmed

