"""
LLM Service for ChaCha-Chaudari.
Supports OpenRouter (e.g. OpenAI GPT-4o) and local Transformers (Phi-3 / Llama-2),
with age-adaptive prompt assembly, token streaming, and offline rule fallback.
"""
from __future__ import annotations

import os
import json
import logging
import threading
from typing import Optional, List, Dict, Any, Generator
import requests

log = logging.getLogger(__name__)

try:
    import torch
    from transformers import (
        AutoTokenizer,
        AutoModelForCausalLM,
        TextIteratorStreamer,
        BitsAndBytesConfig,
    )
    _TRANSFORMERS_AVAILABLE = True
except Exception as _e:
    log.warning("Transformers/PyTorch not fully available: %s", _e)
    torch = None  # type: ignore
    AutoTokenizer = None  # type: ignore
    AutoModelForCausalLM = None  # type: ignore
    TextIteratorStreamer = None  # type: ignore
    BitsAndBytesConfig = None  # type: ignore
    _TRANSFORMERS_AVAILABLE = False


class LLMService:
    def __init__(
        self,
        model_name: Optional[str] = None,
        fallback_model_name: Optional[str] = None,
        use_4bit: bool = True,
        force_cpu: bool = False,
    ):
        self.provider = os.getenv("LLM_PROVIDER", "openrouter").strip().lower()
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
        self.openrouter_model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o")
        self.openrouter_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions")

        self.model_name = model_name or os.getenv("MODEL_PATH", "microsoft/Phi-3-mini-4k-instruct")
        self.fallback_model_name = fallback_model_name or os.getenv("FALLBACK_MODEL_PATH", "meta-llama/Llama-2-7b-chat-hf")
        self.use_4bit = use_4bit
        self.force_cpu = force_cpu
        self.tokenizer = None
        self.model = None
        self.device = "cpu"
        self._loaded = False
        self._load_lock = threading.Lock()

    def is_openrouter_enabled(self) -> bool:
        """Check if OpenRouter cloud provider is enabled and configured."""
        return (
            self.provider == "openrouter"
            and bool(self.openrouter_key)
            and not self.openrouter_key.startswith("change-me")
            and os.getenv("ENABLE_LOCAL_LLM", "false").lower() != "testing"
        )

    def ensure_loaded(self) -> bool:
        """Lazily load model and tokenizer on first use, or verify OpenRouter availability."""
        if self.is_openrouter_enabled():
            return True

        if self._loaded:
            return self.model is not None

        with self._load_lock:
            if self._loaded:
                return self.model is not None

            if os.getenv("ENABLE_LOCAL_LLM", "true").lower() in ("false", "0", "no"):
                log.info("ENABLE_LOCAL_LLM is disabled; running in rule-based offline fallback mode.")
                self._loaded = True
                return False

            if not _TRANSFORMERS_AVAILABLE or torch is None:
                log.info("Transformers not installed; running in lightweight fallback mode.")
                self._loaded = True
                return False

            if not self.force_cpu and torch.cuda.is_available():
                self.device = "cuda"
            else:
                self.device = "cpu"

            log.info("Attempting to load local LLM on device '%s' (model: %s)...", self.device, self.model_name)

            # Try primary model then fallback
            models_to_try = [self.model_name, self.fallback_model_name]
            for m_path in models_to_try:
                if not m_path:
                    continue
                try:
                    tok = AutoTokenizer.from_pretrained(m_path, trust_remote_code=True)
                    if tok.pad_token_id is None and tok.eos_token_id is not None:
                        tok.pad_token_id = tok.eos_token_id

                    bnb_config = None
                    if self.use_4bit and self.device == "cuda" and BitsAndBytesConfig is not None:
                        bnb_config = BitsAndBytesConfig(
                            load_in_4bit=True,
                            bnb_4bit_compute_dtype=torch.float16,
                            bnb_4bit_use_double_quant=True,
                        )

                    mod = AutoModelForCausalLM.from_pretrained(
                        m_path,
                        quantization_config=bnb_config,
                        device_map="auto" if self.device == "cuda" else None,
                        torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                        trust_remote_code=True,
                        low_cpu_mem_usage=True,
                    )
                    if self.device == "cpu":
                        mod = mod.to("cpu")

                    self.tokenizer = tok
                    self.model = mod
                    self._loaded = True
                    log.info("Successfully loaded local LLM '%s' on %s", m_path, self.device)
                    return True
                except Exception as e:
                    log.warning("Could not load LLM model '%s': %s", m_path, e)

            self._loaded = True
            log.warning("Local LLM load failed; operating in fallback mode.")
            return False

    def build_prompt(
        self,
        user_prompt: str,
        context_chunks: List[str],
        age_group: str = "adult",
        user_name: Optional[str] = None,
        lang: str = "en",
    ) -> str:
        """Format an age-adaptive prompt grounded in RAG context chunks."""
        name_str = f"The user's name is {user_name}." if user_name else ""
        context_str = "\n\n---\n\n".join(context_chunks) if context_chunks else "No specific official document excerpt available."

        if age_group == "kid":
            persona = (
                "You are Chacha Chaudhary, the beloved Indian comic mascot and Ganga ambassador. "
                "You are speaking to a child (age under 13). Use simple, inspiring language, short sentences, "
                "and relatable examples about nature, river dolphins, and clean ghats. Keep it friendly and educational."
            )
        elif age_group == "teen":
            persona = (
                "You are Chacha Chaudhary, youth guide and environmental champion. "
                "You are speaking to a teenager. Be informative, scientifically accurate about river ecology, "
                "and highlight practical actions youth can take for river rejuvenation."
            )
        else:
            persona = (
                "You are Chacha Chaudhary, digital mascot of the Namami Gange programme. "
                "You are speaking to an adult citizen. Provide a structured, data-grounded, factual explanation "
                "referencing conservation objectives, government initiatives, sewage treatment, or riverine biodiversity."
            )

        lang_instruction = "Respond in Hindi (Devanagari script)." if lang.startswith("hi") else "Respond in English."

        prompt = (
            f"<|system|>\n{persona}\n{name_str}\n{lang_instruction}\n\n"
            f"Ground your answer in the following official document excerpts whenever relevant:\n"
            f"{context_str}\n<|end|>\n"
            f"<|user|>\n{user_prompt}\n<|end|>\n"
            f"<|assistant|>\n"
        )
        return prompt

    def _prompt_to_messages(self, prompt: str) -> List[Dict[str, str]]:
        """Parse structured XML-like delimiters into chat completion role messages."""
        messages = []
        if "<|system|>" in prompt and "<|end|>" in prompt:
            parts = prompt.split("<|system|>")
            if len(parts) > 1:
                sys_part = parts[1].split("<|end|>")[0].strip()
                messages.append({"role": "system", "content": sys_part})
        if "<|user|>" in prompt and "<|end|>" in prompt:
            user_part = prompt.split("<|user|>")[1].split("<|end|>")[0].strip()
            messages.append({"role": "user", "content": user_part})
        if not messages:
            messages = [{"role": "user", "content": prompt}]
        return messages

    def _generate_openrouter(self, prompt: str, max_new_tokens: int = 500) -> Optional[str]:
        """Synchronous chat completion via OpenRouter API."""
        try:
            headers = {
                "Authorization": f"Bearer {self.openrouter_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://smartganga.org",
                "X-Title": "SmartGanga Mascot Chacha Chaudhary",
            }
            body = {
                "model": self.openrouter_model,
                "messages": self._prompt_to_messages(prompt),
                "max_tokens": max_new_tokens,
                "temperature": 0.7,
            }
            resp = requests.post(self.openrouter_url, headers=headers, json=body, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return content.strip()
            else:
                log.error("OpenRouter error %d: %s", resp.status_code, resp.text)
                return None
        except Exception as e:
            log.error("OpenRouter API request failed: %s", e)
            return None

    def _stream_openrouter(self, prompt: str, max_new_tokens: int = 500) -> Generator[str, None, None]:
        """Streaming chat completion via OpenRouter Server-Sent Events."""
        try:
            headers = {
                "Authorization": f"Bearer {self.openrouter_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://smartganga.org",
                "X-Title": "SmartGanga Mascot Chacha Chaudhary",
            }
            body = {
                "model": self.openrouter_model,
                "messages": self._prompt_to_messages(prompt),
                "max_tokens": max_new_tokens,
                "temperature": 0.7,
                "stream": True,
            }
            resp = requests.post(self.openrouter_url, headers=headers, json=body, stream=True, timeout=30)
            if resp.status_code != 200:
                log.error("OpenRouter stream failed with %d: %s", resp.status_code, resp.text)
                return

            for line in resp.iter_lines():
                if not line:
                    continue
                decoded = line.decode("utf-8").strip()
                if decoded.startswith("data: "):
                    raw_data = decoded[6:].strip()
                    if raw_data == "[DONE]":
                        break
                    try:
                        chunk_json = json.loads(raw_data)
                        delta = chunk_json.get("choices", [{}])[0].get("delta", {}).get("content", "")
                        if delta:
                            yield delta
                    except Exception:
                        pass
        except Exception as e:
            log.error("OpenRouter streaming error: %s", e)

    def generate(self, prompt: str, max_new_tokens: int = 350) -> Optional[str]:
        """Generate text using OpenRouter or local Transformers model."""
        if self.is_openrouter_enabled():
            res = self._generate_openrouter(prompt, max_new_tokens)
            if res:
                return res

        if not self.ensure_loaded() or self.model is None or self.tokenizer is None:
            return None

        try:
            inputs = self.tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1536)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            with torch.no_grad():
                out = self.model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    do_sample=False,
                    pad_token_id=self.tokenizer.pad_token_id,
                )
            input_len = inputs["input_ids"].shape[1]
            gen_tokens = out[0][input_len:]
            return self.tokenizer.decode(gen_tokens, skip_special_tokens=True).strip()
        except Exception as e:
            log.error("Local generation error: %s", e)
            return None

    def stream_generate(
        self, prompt: str, max_new_tokens: int = 500
    ) -> Generator[str, None, None]:
        """Stream generated tokens one-by-one via OpenRouter SSE or local TextIteratorStreamer."""
        if self.is_openrouter_enabled():
            yield from self._stream_openrouter(prompt, max_new_tokens)
            return

        if not self.ensure_loaded() or self.model is None or self.tokenizer is None or TextIteratorStreamer is None:
            return

        try:
            inputs = self.tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1536)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True, skip_special_tokens=True)

            generate_kwargs = dict(
                **inputs,
                streamer=streamer,
                max_new_tokens=max_new_tokens,
                do_sample=False,
                pad_token_id=self.tokenizer.pad_token_id,
            )

            th = threading.Thread(target=self.model.generate, kwargs=generate_kwargs, daemon=True)
            th.start()

            for new_text in streamer:
                if new_text:
                    yield new_text

            th.join(timeout=30)
        except Exception as e:
            log.error("Stream generation error: %s", e)

    def get_fallback_response(
        self,
        prompt: str,
        age_group: str = "adult",
        user_name: Optional[str] = None,
        lang: str = "en",
    ) -> str:
        """High quality deterministic fallback when LLM is offline or not installed."""
        is_hindi = lang.startswith("hi")
        p_lower = (prompt or "").lower()

        if is_hindi:
            if "डॉल्फ़िन" in prompt or "dolphin" in p_lower:
                return (
                    "गंगा नदी की डॉल्फ़िन (Platanista gangetica) भारत का राष्ट्रीय जलीय जीव है। "
                    "यह मीठे पानी में रहती है और देखने के बजाय ध्वनि तरंगों (इकोलोकेशन) से तैरती है। "
                    "नमामि गंगे कार्यक्रम के तहत इनके आवास को प्रदूषण मुक्त रखने के विशेष प्रयास किए जा रहे हैं।"
                )
            if "सफाई" in prompt or "नमामि" in prompt:
                return (
                    "नमामि गंगे एक राष्ट्रीय मिशन है जिसका उद्देश्य गंगा नदी के प्रदूषण को समाप्त करना और "
                    "इसके जल प्रवाह और पारिस्थितिकी तंत्र का कायाकल्प करना है। इसमें नए सीवेज ट्रीटमेंट प्लांट (STP), "
                    "घाटों का पुनर्विकास और जन-जागरूकता अभियान शामिल हैं।"
                )
            return (
                "नमस्ते! मैं आपका मित्र चाचा चौधरी हूँ। गंगा हमारी राष्ट्रीय धरोहर और जीवन रेखा है। "
                "नमामि गंगे अभियान के तहत नदी को स्वच्छ रखना हम सभी की सामूहिक जिम्मेदारी है। "
                "आप मुझसे गंगा की जैव विविधता, संरक्षण परियोजनाओं या घाटों के बारे में कुछ भी पूछ सकते हैं!"
            )

        # English fallbacks
        nm = user_name or "my friend"
        if "dolphin" in p_lower:
            return (
                f"Hello {nm}! The Ganges River Dolphin is India's National Aquatic Animal. "
                "It is virtually blind and navigates through ultrasonic echolocation. "
                "Under the Namami Gange mission, special conservation sanctuaries have been established to protect them."
            )
        if "clean" in p_lower or "namami" in p_lower or "mission" in p_lower:
            return (
                f"Namaste {nm}! The Namami Gange Programme is an integrated conservation mission "
                "approved by the Government of India with a comprehensive focus on sewage infrastructure, "
                "riverfront development, river surface cleaning, biodiversity conservation, and public awareness."
            )
        return (
            f"Namaste {nm}! I am Chacha Chaudhary, digital ambassador for Namami Gange. "
            "Our brains work faster than a computer when it comes to keeping Mother Ganga pristine! "
            "Ask me anything about Ganga biodiversity, sewage treatment, sacred ghats, or how you can make a difference."
        )
