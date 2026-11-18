import { Button } from "@/components/ui/Button";
import { IconPlayerStop, IconVolume } from "@tabler/icons-react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

function getLocalVoice(speech: SpeechSynthesis) {
  const voices = speech
    .getVoices()
    .filter((voice) => voice.localService === true);
  for (const language of navigator.languages) {
    const tag = language.toLowerCase();
    const match =
      voices.find((voice) => voice.lang.toLowerCase() === tag) ??
      voices.find(
        (voice) => voice.lang.toLowerCase().split("-")[0] === tag.split("-")[0]
      );
    if (match) return match;
  }
  return voices.find((voice) => voice.default) ?? voices[0];
}

export default function ListenButton({ text }: { text: string }) {
  const { t } = useTranslation();
  const statusId = useId();
  const speech =
    typeof window.SpeechSynthesisUtterance === "function"
      ? window.speechSynthesis
      : undefined;
  const active = useRef<SpeechSynthesisUtterance | null>(null);
  const [hasVoice, setHasVoice] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [failed, setFailed] = useState(false);

  useLayoutEffect(() => {
    if (!speech) return;
    const updateVoices = () => setHasVoice(!!getLocalVoice(speech));
    speech.addEventListener("voiceschanged", updateVoices);
    updateVoices();
    return () => speech.removeEventListener("voiceschanged", updateVoices);
  }, [speech]);

  useLayoutEffect(() => {
    setSpeaking(false);
    setFailed(false);
    return () => {
      if (active.current) {
        active.current = null;
        speech?.cancel();
      }
    };
  }, [speech, text]);

  function toggle() {
    if (!speech) return;
    if (active.current) {
      active.current = null;
      speech.cancel();
      setSpeaking(false);
      return;
    }

    const voice = getLocalVoice(speech);
    if (!voice) {
      setHasVoice(false);
      return;
    }
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    const finish = (error: boolean) => {
      if (active.current !== utterance) return;
      active.current = null;
      setSpeaking(false);
      setFailed(error);
    };
    utterance.onend = () => finish(false);
    utterance.onerror = () => finish(true);
    active.current = utterance;
    setSpeaking(true);
    setFailed(false);
    try {
      speech.speak(utterance);
    } catch (error) {
      console.warn("Local speech playback failed", error);
      finish(true);
    }
  }

  const status = failed
    ? t("learning.listen-failed")
    : !hasVoice
      ? t("learning.listen-no-local-voice")
      : !text
        ? t("learning.listen-no-text")
        : "";

  return (
    <div className="learn-view__listen">
      <Button
        size="sm"
        variant="subtle"
        disabled={!speaking && (!hasVoice || !text)}
        aria-describedby={status ? statusId : undefined}
        leftSection={
          speaking ? (
            <IconPlayerStop size={16} aria-hidden="true" />
          ) : (
            <IconVolume size={16} aria-hidden="true" />
          )
        }
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.stopPropagation();
          }
        }}
      >
        {t(speaking ? "learning.listen-stop" : "learning.listen")}
      </Button>
      <output id={statusId}>{status}</output>
    </div>
  );
}
