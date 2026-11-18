import { useHotkeys } from "@/lib/hooks/useHotkeys";
import { Content } from "@/logic/card/CardContent";
import { createCardSkeleton } from "@/logic/card/createCardSkeleton";
import { NoteContent } from "@/logic/note/NoteContent";
import { NoteType } from "@/logic/note/note";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ListenButton from "./ListenButton";
import { getStudySpeechText } from "./getStudySpeechText";

class MockUtterance {
  constructor(readonly text: string) {}
}

const local = { lang: "en-US", localService: true, default: false };
const remote = { lang: "en-US", localService: false, default: true };
const speak = vi.fn<(utterance: MockUtterance) => void>();
const cancel = vi.fn();
const getVoices = vi.fn();
const shortcuts = vi.fn();
const basic = { type: NoteType.Basic } as const;
const basicNote = {
  ...basic,
  front: "<p>Unique &amp; prompt</p>",
  back: "Secret answer",
};

function StudyFace({
  content,
  note,
  showingAnswer = false,
  cardId = "current",
}: {
  content: Content<NoteType>;
  note: NoteContent<NoteType>;
  showingAnswer?: boolean;
  cardId?: string;
}) {
  useHotkeys([
    ["Enter", shortcuts],
    ["Space", shortcuts],
  ]);
  const card = { ...createCardSkeleton(), id: cardId, note: "note", content };
  return (
    <ListenButton
      key={`${card.id}:${showingAnswer}`}
      text={getStudySpeechText(card, note, showingAnswer)}
    />
  );
}

function listen() {
  return screen.getByRole("button", { name: "Listen" });
}

describe("Listen mode", () => {
  let speech: EventTarget;

  beforeEach(() => {
    vi.clearAllMocks();
    getVoices.mockReturnValue([remote, local]);
    speech = Object.assign(new EventTarget(), { getVoices, speak, cancel });
    vi.stubGlobal("speechSynthesis", speech);
    vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("only sends the current side to a local voice, on demand", () => {
    const { rerender } = render(<StudyFace content={basic} note={basicNote} />);
    expect(speak).not.toHaveBeenCalled();
    fireEvent.click(listen());
    expect(speak).toHaveBeenLastCalledWith(
      expect.objectContaining({
        text: "Unique & prompt",
        voice: local,
        lang: local.lang,
      })
    );
    rerender(<StudyFace content={basic} note={basicNote} showingAnswer />);
    expect(cancel).toHaveBeenCalledOnce();
    expect(speak).toHaveBeenCalledOnce();
    fireEvent.click(listen());
    expect(speak).toHaveBeenLastCalledWith(
      expect.objectContaining({ text: "Secret answer" })
    );
    rerender(<StudyFace content={basic} note={basicNote} cardId="next" />);
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(speak).toHaveBeenCalledTimes(2);
  });

  it.each([true, false])(
    "respects double-sided direction (field 1 first: %s)",
    (frontIsField1) => {
      const content = { type: NoteType.DoubleSided, frontIsField1 } as const;
      const note = {
        type: NoteType.DoubleSided,
        field1: "First side",
        field2: "Second side",
      } as const;
      const { rerender } = render(<StudyFace content={content} note={note} />);
      fireEvent.click(listen());
      expect(speak.mock.lastCall?.[0].text).toBe(
        frontIsField1 ? "First side" : "Second side"
      );
      rerender(<StudyFace content={content} note={note} showingAnswer />);
      fireEvent.click(listen());
      expect(speak.mock.lastCall?.[0].text).toBe(
        frontIsField1 ? "Second side" : "First side"
      );
    }
  );

  it("skips every active cloze blank before reveal", () => {
    const content = { type: NoteType.Cloze, occlusionNumber: 1 } as const;
    const note = {
      type: NoteType.Cloze,
      text: "<p>See {{c1::<b>hidden A</b>}} with {{c2::visible B}} and {{c1::hidden C}}.</p>",
    } as const;
    const { rerender } = render(<StudyFace content={content} note={note} />);
    fireEvent.click(listen());
    expect(speak.mock.lastCall?.[0].text).toBe("See with visible B and .");
    rerender(<StudyFace content={content} note={note} showingAnswer />);
    expect(speak).toHaveBeenCalledOnce();
    fireEvent.click(listen());
    expect(speak.mock.lastCall?.[0].text).toBe(
      "See hidden A with visible B and hidden C."
    );
  });

  it("waits for a local voice without queuing speech, and supports Stop and exit", () => {
    getVoices.mockReturnValue([]);
    const { unmount } = render(<ListenButton text="Prompt" />);
    expect(listen()).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "No on-device voice available."
    );
    fireEvent.click(listen());
    expect(speak).not.toHaveBeenCalled();

    getVoices.mockReturnValue([remote]);
    act(() => {
      speech.dispatchEvent(new Event("voiceschanged"));
    });
    expect(listen()).toBeDisabled();
    getVoices.mockReturnValue([local]);
    act(() => {
      speech.dispatchEvent(new Event("voiceschanged"));
    });
    expect(listen()).toBeEnabled();
    expect(speak).not.toHaveBeenCalled();
    fireEvent.click(listen());
    fireEvent.click(screen.getByRole("button", { name: "Stop listening" }));
    expect(cancel).toHaveBeenCalledOnce();
    fireEvent.click(listen());
    unmount();
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it("does not speak image metadata or trigger study hotkeys on the Listen button", () => {
    const { rerender } = render(
      <StudyFace
        content={basic}
        note={{ ...basicNote, front: '<img alt="Private metadata">' }}
      />
    );
    expect(listen()).toBeDisabled();
    fireEvent.click(listen());
    expect(speak).not.toHaveBeenCalled();
    rerender(<StudyFace content={basic} note={basicNote} />);
    listen().focus();
    fireEvent.keyDown(listen(), { key: "Enter" });
    fireEvent.keyDown(listen(), { key: " " });
    expect(shortcuts).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(shortcuts).toHaveBeenCalledOnce();
  });
});
