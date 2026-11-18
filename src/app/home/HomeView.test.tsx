import "@/i18n";
import { createCardSkeleton } from "@/logic/card/createCardSkeleton";
import { getCardsOf } from "@/logic/card/getCardsOf";
import { NoteType } from "@/logic/note/note";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { State } from "fsrs.js";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import HomeView from "./HomeView";

const fixtures = vi.hoisted(() => ({
  userName: "",
  decks: [
    {
      id: "spanish",
      name: "Spanish",
      cards: [],
      subDecks: [],
      notes: [],
      options: {},
    },
    {
      id: "anatomy",
      name: "Anatomy",
      cards: [],
      subDecks: [],
      notes: [],
      options: {},
    },
    {
      id: "finished",
      name: "Finished",
      cards: [],
      subDecks: [],
      notes: [],
      options: {},
    },
  ],
}));

vi.mock("@/logic/deck/hooks/useTopLevelDecks", () => ({
  useTopLevelDecks: () => [fixtures.decks, true],
}));
vi.mock("@/logic/settings/hooks/useSetting", () => ({
  useSetting: () => [fixtures.userName, true],
}));
vi.mock("@/logic/card/getCardsOf", () => ({ getCardsOf: vi.fn() }));
vi.mock("dexie-react-hooks", async () => {
  const { useEffect, useState } = await import("react");
  return {
    useLiveQuery: <T,>(query: () => Promise<T>, dependencies: unknown[]) => {
      const [value, setValue] = useState<T>();
      useEffect(() => {
        void query().then(setValue);
      }, dependencies);
      return value;
    },
  };
});
vi.mock("../deck/DeckModal", () => ({ default: () => null }));
vi.mock("../deck/DeckTable", () => ({ default: () => <div>All decks</div> }));

afterEach(() => {
  cleanup();
  fixtures.userName = "";
});

it("shows a single personalized welcome line", () => {
  fixtures.userName = "Eli";
  vi.mocked(getCardsOf).mockResolvedValue([]);
  render(
    <MemoryRouter>
      <HomeView />
    </MemoryRouter>
  );
  expect(
    screen.getByRole("heading", { name: "Welcome back, Eli!", level: 1 })
  ).toBeInTheDocument();
  expect(
    screen.queryByText("Ready to start studying?")
  ).not.toBeInTheDocument();
});

it("shows real ready counts in order and starts the chosen deck", async () => {
  const card = { ...createCardSkeleton(), note: "note" };
  vi.mocked(getCardsOf).mockImplementation(async (deck) => {
    if (deck?.id === "anatomy") {
      return [
        {
          ...card,
          model: { ...card.model, state: State.New },
          content: { type: NoteType.Basic },
        },
      ];
    }
    if (deck?.id === "spanish") {
      return [
        {
          ...card,
          model: { ...card.model, state: State.Review, due: new Date(0) },
          content: { type: NoteType.Basic },
        },
        {
          ...card,
          model: {
            ...card.model,
            state: State.Review,
            due: new Date("2100-01-01"),
          },
          content: { type: NoteType.Basic },
        },
      ];
    }
    return [];
  });
  render(
    <MemoryRouter initialEntries={["/home"]}>
      <Routes>
        <Route path="/home" element={<HomeView />} />
        <Route path="/learn/:deckId" element={<div>Study session</div>} />
      </Routes>
    </MemoryRouter>
  );
  expect(await screen.findByText("2 cards ready")).toBeInTheDocument();
  const buttons = screen.getAllByRole("button", { name: /^Study / });
  expect(buttons.map((button) => button.textContent)).toEqual([
    "Study Anatomy",
    "Study Spanish",
  ]);
  expect(
    screen.queryByRole("button", { name: "Study Finished" })
  ).not.toBeInTheDocument();
  expect(screen.getByText("All decks")).toBeInTheDocument();
  fireEvent.click(buttons[1]);
  expect(screen.getByText("Study session")).toBeInTheDocument();
});

it("shows an empty timeline when no cards are ready", async () => {
  vi.mocked(getCardsOf).mockResolvedValue([]);
  render(
    <MemoryRouter>
      <HomeView />
    </MemoryRouter>
  );
  expect(
    await screen.findByText("No cards are ready to study right now.")
  ).toBeInTheDocument();
});
