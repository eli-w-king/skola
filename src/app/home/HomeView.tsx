import { AppBreadcrumbs } from "@/components/AppBreadcrumbs";
import EmptyNotice from "@/components/EmptyNotice";
import { Button, Kbd, Tooltip } from "@/components/ui";
import { forkSource } from "@/lib/forkSource";
import { useDocumentTitle } from "@/lib/hooks/useDocumentTitle";
import { useHotkeys } from "@/lib/hooks/useHotkeys";
import { getCardsOf } from "@/logic/card/getCardsOf";
import { getSimplifiedStatesOf } from "@/logic/card/getSimplifiedStatesOf";
import { useTopLevelDecks } from "@/logic/deck/hooks/useTopLevelDecks";
import { useSetting } from "@/logic/settings/hooks/useSetting";
import { IconFolder, IconPlus } from "@tabler/icons-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import DeckModal from "../deck/DeckModal";
import DeckTable from "../deck/DeckTable";
import { AppHeaderContent } from "../shell/Header/Header";
import "./HomeView.css";

const BASE = "home-view";

export default function HomeView() {
  useDocumentTitle("Skola");
  const [t] = useTranslation();
  const [newDeckModalOpened, setNewDeckModalOpened] = useState(false);
  const [decks, isReady] = useTopLevelDecks();
  const [userName, userNameIsReady] = useSetting("#name");
  const navigate = useNavigate();
  const timeline = useLiveQuery(async () => {
    if (!decks) return undefined;
    const entries = await Promise.all(
      decks.map(async (deck) => {
        const states = getSimplifiedStatesOf(await getCardsOf(deck));
        return { deck, count: states.new + states.learning + states.review };
      })
    );
    return entries
      .filter((entry) => entry.count > 0)
      .sort((a, b) => a.deck.name.localeCompare(b.deck.name));
  }, [decks]);

  useHotkeys([["n", () => setNewDeckModalOpened(true)]]);

  return (
    <>
      <AppHeaderContent>
        <AppBreadcrumbs />
        <Tooltip
          label={
            <>
              {t("deck.create-deck-tooltip")}
              <Kbd>n</Kbd>
            </>
          }
          position="left"
        >
          <Button
            onClick={() => setNewDeckModalOpened(true)}
            leftSection={<IconPlus />}
            variant="ghost"
          >
            {t("deck.new-deck-button")}
          </Button>
        </Tooltip>
      </AppHeaderContent>

      <div className={`${BASE}__content`}>
        <section className={`${BASE}__welcome-section`}>
          <h1
            className={`${BASE}__welcome-title ${!userNameIsReady && "invisible"}`}
          >
            {userName
              ? t("home.welcome-user", { name: userName })
              : t("home.welcome")}
          </h1>
          <sub className={`${BASE}__welcome-subtitle`}>
            {t("home.welcome-subtitle")}
          </sub>
        </section>
        {timeline && timeline.length > 0 && (
          <section
            className={`${BASE}__timeline-section`}
            aria-labelledby="timeline-heading"
          >
            <div className={`${BASE}__timeline-heading`}>
              <div>
                <h2 id="timeline-heading">{t("home.timeline-title")}</h2>
                <p>{t("home.timeline-subtitle")}</p>
              </div>
              <span>
                {t("home.timeline-ready", {
                  count: timeline.reduce((sum, entry) => sum + entry.count, 0),
                })}
              </span>
            </div>
            <ol className={`${BASE}__timeline`}>
              {timeline.map(({ deck, count }, index) => (
                <li className={`${BASE}__stop`} key={deck.id}>
                  <span className={`${BASE}__marker`} aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <article className={`${BASE}__stop-card`}>
                    <div className={`${BASE}__stop-main`}>
                      <span className={`${BASE}__deck-icon`} aria-hidden="true">
                        {deck.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <h3>{deck.name}</h3>
                        <p>{t("home.timeline-ready", { count })}</p>
                      </div>
                    </div>
                    <Button
                      variant={index === 0 ? "primary" : "subtle"}
                      onClick={() => navigate(`/learn/${deck.id}`)}
                    >
                      {t("home.timeline-study", { name: deck.name })}
                    </Button>
                  </article>
                </li>
              ))}
            </ol>
          </section>
        )}
        {timeline?.length === 0 && decks && decks.length > 0 && (
          <section
            className={`${BASE}__timeline-section`}
            aria-labelledby="timeline-heading"
          >
            <div className={`${BASE}__timeline-heading`}>
              <div>
                <h2 id="timeline-heading">{t("home.timeline-title")}</h2>
                <p>{t("home.timeline-empty")}</p>
              </div>
            </div>
          </section>
        )}
        {isReady && decks?.length === 0 ? (
          <div className={`${BASE}__empty-state`}>
            <EmptyNotice
              icon={IconFolder}
              description={t("home.no-decks-found")}
            />
            <Button
              onClick={() => setNewDeckModalOpened(true)}
              leftSection={<IconPlus />}
              variant="primary"
              autoFocus
            >
              {t("deck.new-deck-button")}
            </Button>
          </div>
        ) : (
          <DeckTable deckList={decks} isReady={isReady} />
        )}
        <p className={`${BASE}__fork-credit`}>
          My fork of Skola, modified by Eli King on Nov 18, 2026. Not official
          Skola. <a href={forkSource}>Source for this fork</a>
        </p>
      </div>
      <DeckModal
        mode="create"
        opened={newDeckModalOpened}
        setOpened={setNewDeckModalOpened}
      />
    </>
  );
}
