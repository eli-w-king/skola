import { getAdapter } from "@/logic/NoteTypeAdapter";
import { Card } from "@/logic/card/card";
import { NoteContent } from "@/logic/note/NoteContent";
import { NoteType } from "@/logic/note/note";

export function getStudySpeechText(
  card: Card<NoteType>,
  content: NoteContent<NoteType>,
  showingAnswer: boolean
): string {
  if (card.content?.type !== content.type) return "";
  const html = getAdapter(card).getStudySpeechHtml?.(
    card,
    content,
    showingAnswer
  );
  if (!html) return "";

  const template = document.createElement("template");
  template.innerHTML = html;
  template.content
    .querySelectorAll("script, style, template, [hidden], [aria-hidden='true']")
    .forEach((element) => element.remove());
  template.content
    .querySelectorAll(
      "br, p, div, li, blockquote, pre, h1, h2, h3, h4, h5, h6, tr, td, th"
    )
    .forEach((element) => {
      element.before(" ");
      element.after(" ");
    });
  return (template.content.textContent ?? "").replace(/\s+/g, " ").trim();
}
