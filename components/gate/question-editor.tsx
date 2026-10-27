"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { LONG_NUMBER_WARNING, looksLikeLongNumber } from "@/lib/guards";

export interface QuestionDraft {
  question: string;
  answer: string;
}

const SUGGESTIONS = [
  "What was the first street you lived on?",
  "What was your first pet called?",
  "Which teacher do you still think about?",
  "What did you always order as a kid?",
  "What was the name of your first school?",
  "Who was your childhood best friend?",
];

const MAX_QUESTIONS = 10;

export function validateQuestions(questions: QuestionDraft[]): string | null {
  const filled = questions.filter((q) => q.question.trim() || q.answer.trim());
  if (filled.length === 0) return "Add at least one question.";
  for (const { question, answer } of filled) {
    if (question.trim().length < 3) return "Each question needs a few more words.";
    if (!answer.trim()) return "Every question needs an answer.";
    if (looksLikeLongNumber(answer)) return LONG_NUMBER_WARNING;
  }
  const unique = new Set(filled.map((q) => q.question.trim().toLowerCase()));
  if (unique.size !== filled.length) return "Each question can only appear once.";
  return null;
}

export const filledQuestions = (questions: QuestionDraft[]) =>
  questions.filter((q) => q.question.trim() || q.answer.trim());

export function QuestionEditor({
  questions,
  onChange,
}: {
  questions: QuestionDraft[];
  onChange: (questions: QuestionDraft[]) => void;
}) {
  const [suggestionIndex, setSuggestionIndex] = useState(questions.length);

  function update(index: number, patch: Partial<QuestionDraft>) {
    onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function add() {
    onChange([...questions, { question: SUGGESTIONS[suggestionIndex % SUGGESTIONS.length] ?? "", answer: "" }]);
    setSuggestionIndex((i) => i + 1);
  }

  const count = filledQuestions(questions).length;

  return (
    <div className="space-y-4">
      {questions.map((item, index) => (
        <fieldset key={index} className="relative rounded-2xl border border-line bg-field/50 p-4">
          <legend className="sr-only">Question {index + 1}</legend>
          {questions.length > 1 && (
            <button
              type="button"
              aria-label={`Remove question ${index + 1}`}
              onClick={() => onChange(questions.filter((_, i) => i !== index))}
              className="pressable absolute top-3 right-3 cursor-pointer rounded-full p-1 text-ink-3 hover:text-ink"
            >
              <X size={15} aria-hidden />
            </button>
          )}
          <div className="space-y-3">
            <Field label={`Question ${index + 1}`} htmlFor={`question-${index}`}>
              <Input
                id={`question-${index}`}
                value={item.question}
                maxLength={200}
                onChange={(event) => update(index, { question: event.target.value })}
              />
            </Field>
            <Field
              label="Answer"
              htmlFor={`answer-${index}`}
              hint="Capitals and extra spaces will not matter."
            >
              <Input
                id={`answer-${index}`}
                value={item.answer}
                maxLength={200}
                autoComplete="off"
                onChange={(event) => update(index, { answer: event.target.value })}
              />
            </Field>
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="soft" size="sm" onClick={add} disabled={questions.length >= MAX_QUESTIONS}>
          <Plus size={14} aria-hidden />
          Add a question
        </Button>
        <span className="text-[13px] text-ink-3">
          {questions.length} of {MAX_QUESTIONS}
        </span>
      </div>

      {count > 0 && count < 3 && (
        <p className="rounded-xl bg-warn-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-warn">
          One question works, but we recommend at least three. Every extra question makes the account much harder to
          break into, because a guesser never knows which one is coming.
        </p>
      )}
    </div>
  );
}

export const starterQuestions = (): QuestionDraft[] =>
  SUGGESTIONS.slice(0, 3).map((question) => ({ question, answer: "" }));
