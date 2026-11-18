import "@/i18n";
import type { Deck } from "@/logic/deck/deck";
import { BasicNoteTypeAdapter } from "@/logic/type-implementations/normal/BasicNote";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { expect, it, vi } from "vitest";
import NewNotesView from "./NewNotesView";

vi.mock("@/logic/db", () => ({ db: {} }));
vi.mock("@/logic/deck/hooks/useDeckFromUrl", () => {
  const deck: Deck = {
    id: "first-deck",
    name: "First deck",
    subDecks: [],
    cards: [],
    notes: [],
    options: { newToReviewRatio: 0.5, dailyNewCards: 25 },
  };
  return { useDeckFromUrl: () => [deck, true] };
});
vi.mock("@/logic/deck/hooks/useDecks", () => ({
  useDecks: () => [[], true],
}));
vi.mock("@/logic/settings/hooks/useSettings", async () => {
  const { defaultSettings } = await import("@/logic/settings/defaultSettings");
  const settings = { ...defaultSettings, "#useBubbleMenu": false };
  return { useSettings: () => [settings, true] };
});
vi.mock("@/components/Notification/Notification", () => {
  return { successfullyAdded: vi.fn(), addFailed: vi.fn() };
});

it("submits a card on the first click and lets the user add another", async () => {
  const createNote = vi
    .spyOn(BasicNoteTypeAdapter, "createNote")
    .mockResolvedValue("new-note");

  render(
    <MemoryRouter initialEntries={["/new/first-deck"]}>
      <Routes>
        <Route path="/new/:deckId" element={<NewNotesView />} />
      </Routes>
    </MemoryRouter>
  );

  const [front, back] = await screen.findAllByRole("textbox");
  const addCard = screen.getByRole("button", { name: "Add Card" });

  const submitCard = (question: string, answer: string) => {
    for (const [editor, text] of [
      [front, question],
      [back, answer],
    ] as const) {
      fireEvent.paste(editor, {
        clipboardData: {
          getData: (type: string) => (type === "text/plain" ? text : ""),
        },
      });
    }
    fireEvent.click(addCard);
  };

  submitCard("First question", "First answer");
  await waitFor(() => {
    expect(createNote).toHaveBeenCalledTimes(1);
    expect(front).not.toHaveTextContent("First question");
    expect(back).not.toHaveTextContent("First answer");
  });
  expect(createNote).toHaveBeenNthCalledWith(
    1,
    { front: "<p>First question</p>", back: "<p>First answer</p>" },
    expect.objectContaining({ id: "first-deck" })
  );

  submitCard("Second question", "Second answer");
  await waitFor(() => expect(createNote).toHaveBeenCalledTimes(2));
  expect(createNote).toHaveBeenNthCalledWith(
    2,
    { front: "<p>Second question</p>", back: "<p>Second answer</p>" },
    expect.objectContaining({ id: "first-deck" })
  );
});
