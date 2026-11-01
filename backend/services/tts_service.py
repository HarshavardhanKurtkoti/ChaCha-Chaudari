"""
TTS Service for ChaCha-Chaudari.
Implements robust multi-engine fallback orchestration:
Piper (Offline, High-Quality Indian voices)
  ↓
gTTS (Google TTS)
  ↓
edge-tts (Microsoft Edge TTS)
  ↓
pyttsx3 (System SAPI / Offline fallback)
"""
from __future__ import annotations

import os
import re
import uuid
import logging
from typing import Optional, Dict, List, Any

log = logging.getLogger(__name__)

try:
    from piper_tts import list_piper_voices, synthesize_with_piper  # type: ignore
    _PIPER_AVAILABLE = True
except Exception:
    list_piper_voices = None  # type: ignore
    synthesize_with_piper = None  # type: ignore
    _PIPER_AVAILABLE = False


def sanitize_text_for_tts(text: str) -> str:
    """Strip markdown formatting, code fences, and parentheticals for clear speech."""
    if not text:
        return ""
    s = str(text)
    # Drop parenthetical stage instructions
    s = re.sub(r"\([^)]*\)", " ", s)
    # Drop code blocks and inline code
    s = re.sub(r"```[\s\S]*?```", " ", s)
    s = re.sub(r"`([^`]*)`", r"\1", s)
    # Drop markdown bold/italic
    s = re.sub(r"\*\*(.*?)\*\*", r"\1", s)
    s = re.sub(r"__(.*?)__", r"\1", s)
    s = re.sub(r"\*(.*?)\*", r"\1", s)
    s = re.sub(r"_(.*?)_", r"\1", s)
    s = s.replace("`", "").replace("*", "")
    s = re.sub(r"\r\n|\r", "\n", s)
    s = re.sub(r"\n{2,}", "\n", s)
    s = re.sub(r"[ \t]{2,}", " ", s)
    return s.strip()


class TTSService:
    def __init__(
        self,
        data_dir: Optional[str] = None,
        voices_dir: Optional[str] = None,
        piper_path: Optional[str] = None,
    ):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        self.data_dir = data_dir or os.path.join(base_dir, "Data")
        self.voices_dir = voices_dir or os.path.join(base_dir, "voices", "piper")
        self.piper_path = piper_path or os.path.join(base_dir, "piper", "piper.exe")

        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.voices_dir, exist_ok=True)

    def _unique_file(self, prefix: str = "speech", ext: str = "wav") -> str:
        return os.path.join(self.data_dir, f"{prefix}_{uuid.uuid4().hex}.{ext}")

    def list_voices(self) -> List[Dict[str, Any]]:
        """List available voices from Piper directory with friendly fallbacks."""
        voices = []
        if _PIPER_AVAILABLE and list_piper_voices and os.path.isdir(self.voices_dir):
            try:
                voices = list_piper_voices(self.voices_dir) or []
            except Exception as e:
                log.warning("Error reading Piper voices: %s", e)

        if not voices:
            voices = [
                {"id": "hi_IN-rohan-medium", "shortName": "hi_IN-rohan-medium", "locale": "hi-IN"},
                {"id": "en_US-kusal-medium", "shortName": "en_US-kusal-medium", "locale": "en-IN"},
                {"id": "en_GB-aru-medium", "shortName": "en_GB-aru-medium", "locale": "en-GB"},
            ]
        return voices

    def pick_voice(self, preferred_id: Optional[str], lang: Optional[str] = None) -> Optional[Dict[str, Any]]:
        voices = self.list_voices()
        if not voices:
            return None

        if preferred_id:
            for v in voices:
                if v.get("id") == preferred_id or v.get("shortName") == preferred_id:
                    return v

        is_hindi = lang and str(lang).lower().startswith("hi")
        if is_hindi:
            for v in voices:
                if "hi_in" in str(v.get("id", "")).lower():
                    return v

        for v in voices:
            if "kusal" in str(v.get("id", "")).lower() or "en_in" in str(v.get("id", "")).lower():
                return v

        return voices[0]

    def synthesize(
        self,
        text: str,
        voice_id: Optional[str] = None,
        lang: Optional[str] = None,
        rate: Optional[float] = None,
    ) -> Tuple[str, str, str]:
        """
        Synthesize speech from text using fallback chain.
        Returns: (output_file_path, mimetype, engine_label)
        """
        clean = sanitize_text_for_tts(text)
        if not clean:
            raise ValueError("Input text is empty")

        # 1. Try Piper TTS (Offline)
        if _PIPER_AVAILABLE and os.path.isfile(self.piper_path):
            voice = self.pick_voice(voice_id, lang)
            if voice and "paths" in voice and os.path.isfile(voice["paths"].get("model", "")):
                try:
                    out_wav = self._unique_file("speech_piper", "wav")
                    synthesize_with_piper(
                        self.piper_path,
                        voice["paths"]["model"],
                        voice["paths"]["config"],
                        clean,
                        out_wav,
                        length_scale=rate,
                    )
                    log.info("Synthesized audio via Piper TTS (%s)", voice.get("id"))
                    return out_wav, "audio/wav", "piper"
                except Exception as e:
                    log.warning("Piper synthesis failed; falling back: %s", e)

        # 2. Try gTTS (Google Text-to-Speech)
        try:
            from gtts import gTTS  # type: ignore
            lang_code = "hi" if (lang and lang.lower().startswith("hi")) else "en"
            out_mp3 = self._unique_file("speech_gtts", "mp3")
            tts = gTTS(text=clean, lang=lang_code, slow=False)
            tts.save(out_mp3)
            log.info("Synthesized audio via gTTS (lang=%s)", lang_code)
            return out_mp3, "audio/mpeg", "gTTS"
        except Exception as e:
            log.warning("gTTS synthesis failed; falling back: %s", e)

        # 3. Try edge-tts
        try:
            import asyncio
            import edge_tts  # type: ignore
            edge_voice = "hi-IN-MadhurNeural" if (lang and lang.lower().startswith("hi")) else "en-IN-PrabhatNeural"
            out_mp3 = self._unique_file("speech_edge", "mp3")

            async def _run_edge():
                com = edge_tts.Communicate(clean, edge_voice)
                await com.save(out_mp3)

            asyncio.run(_run_edge())
            log.info("Synthesized audio via edge-tts (%s)", edge_voice)
            return out_mp3, "audio/mpeg", "edge-tts"
        except Exception as e:
            log.warning("edge-tts synthesis failed; falling back: %s", e)

        # 4. Final Fallback: pyttsx3 (Pure offline OS synthesizer)
        try:
            import pyttsx3  # type: ignore
            out_wav = self._unique_file("speech_pyttsx3", "wav")
            engine = pyttsx3.init()
            if rate is not None:
                try:
                    engine.setProperty("rate", int(200 * rate))
                except Exception:
                    pass
            engine.save_to_file(clean, out_wav)
            engine.runAndWait()
            log.info("Synthesized audio via pyttsx3 (OS fallback)")
            return out_wav, "audio/wav", "pyttsx3"
        except Exception as e:
            log.error("All TTS engines failed: %s", e)
            raise RuntimeError("All available TTS engines failed to synthesize audio") from e

