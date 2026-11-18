import { AppHeaderContent } from "@/app/shell/Header/Header";
import NotFound from "@/components/NotFound";
import { Modal } from "@/components/ui/Modal";
import { Paper } from "@/components/ui/Paper";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { getAdapter } from "@/logic/NoteTypeAdapter";
import { useDeckFromUrl } from "@/logic/deck/hooks/useDeckFromUrl";
import { useNote } from "@/logic/note/hooks/useNote";
import { useSetting } from "@/logic/settings/hooks/useSetting";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FinishedLearningView from "../FinishedLearningView/FinishedLearningView";
import LearnViewCurrentCardStateIndicator from "../LearnViewCurrentCardStateIndicator/LearnViewCurrentCardStateIndicator";
import CognitivePromptConnector from "./CognitivePromptConnector";
import "./LearnView.css";
import LearnViewFooter from "./LearnViewFooter";
import LearnViewHeader, { stopwatchResult } from "./LearnViewHeader";
import ListenButton from "./ListenButton";
import QuickAddNote from "./QuickAddNote";
import VisualFeedback from "./VisualFeedback";
import { getStudySpeechText } from "./getStudySpeechText";
import { useLearnSession } from "./useLearnSession";

const BASE = "learn-view";

function LearnView() {
  const [useVisualFeedback] = useSetting("#useVisualFeedback");
  const [showCognitivePrompts] = useSetting("#showCognitivePrompts");
  const [newToReviewRatio] = useSetting("#learn_newToReviewRatio");

  const navigate = useNavigate();
  const [deck, isReady, params] = useDeckFromUrl();

  const {
    controller,
    currentRating,
    selectedPrompt,
    showPrompts,
    answerCard,
    togglePrompt,
    closeQuickAdd,
  } = useLearnSession({
    deck,
    learnAll: params === "all",
    newToReviewRatio,
  });

  const card = controller.currentCard;
  const note = useNote(card?.note ?? "");
  const cardContent = note?.id === card?.note ? note?.content : undefined;
  const inlineRatings = controller.showingAnswer;
  const controls = (
    <LearnViewFooter
      controller={controller}
      answer={answerCard}
      inline={inlineRatings}
    />
  );

  const [debouncedFinish] = useDebouncedValue(controller.isFinished, 50);

  useEffect(() => {
    if (controller.isFinished) {
      stopwatchResult && stopwatchResult.pause();
    } else {
      stopwatchResult && stopwatchResult.start();
    }
  }, [controller.isFinished]);
  if (isReady && !deck) {
    return <NotFound />;
  }

  return (
    <div className={BASE}>
      <AppHeaderContent>
        <LearnViewHeader
          currentCard={controller.currentCard ?? undefined}
          controller={controller}
          deck={deck}
        />
      </AppHeaderContent>

      <div className={`${BASE}__wrapper`}>
        {useVisualFeedback && <VisualFeedback rating={currentRating} />}
        <div
          className={`${BASE}__card-container${inlineRatings ? ` ${BASE}__card-container--inline-ratings` : ""}`}
        >
          <div className={`${BASE}__card-stack`}>
            <LearnViewCurrentCardStateIndicator
              currentCardModel={controller.currentCard?.model}
            />
            <Paper shadow="xs" withBorder className={`${BASE}__card`}>
              {!controller.showingAnswer &&
                controller.currentCard &&
                getAdapter(controller.currentCard).displayQuestion(
                  controller.currentCard,
                  cardContent
                )}
              {controller.showingAnswer &&
                controller.currentCard &&
                getAdapter(controller.currentCard).displayAnswer(
                  controller.currentCard,
                  cardContent
                )}
            </Paper>
            {card && !controller.isFinished && (
              <ListenButton
                key={`${card.id}:${controller.showingAnswer}`}
                text={
                  cardContent
                    ? getStudySpeechText(
                        card,
                        cardContent,
                        controller.showingAnswer
                      )
                    : ""
                }
              />
            )}
            {inlineRatings && controls}
            {showCognitivePrompts && controller.showingAnswer && (
              <>
                {showPrompts && (
                  <CognitivePromptConnector
                    onToggle={togglePrompt}
                    selectedPrompt={selectedPrompt}
                  />
                )}
                {selectedPrompt &&
                  deck &&
                  typeof controller.currentCard?.note === "string" && (
                    <QuickAddNote
                      deck={deck}
                      sourceNoteId={controller.currentCard.note}
                      prompt={selectedPrompt}
                      onClose={closeQuickAdd}
                    />
                  )}
              </>
            )}
          </div>
        </div>
        {!inlineRatings && controls}

        {debouncedFinish && (
          <Modal
            opened={debouncedFinish}
            onClose={() => navigate("/home")}
            showCloseButton={false}
            fullscreen
          >
            <FinishedLearningView
              statistics={controller.statistics}
              time={stopwatchResult}
              deck={deck}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}

export default LearnView;
