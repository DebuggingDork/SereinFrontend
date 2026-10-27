export const MOODS = ["bright", "settled", "restless", "tired", "low"] as const;
export type Mood = (typeof MOODS)[number];

export const MOOD_LABEL: Record<Mood, string> = {
  bright: "Bright",
  settled: "Settled",
  restless: "Restless",
  tired: "Tired",
  low: "Low",
};

export interface DiaryEntry {
  id: string;
  entry_on: string;
  title: string;
  body: string;
  mood: Mood | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const PROMPTS = [
  "What did you notice today that you almost missed?",
  "What is taking up the most room in your head?",
  "Who made today a little easier?",
  "What would you tell yourself from this morning?",
  "What did you avoid today, and why?",
  "What felt quiet today?",
  "What are you looking forward to, however small?",
  "What did your body ask for today?",
  "What is one thing you would do again?",
  "What did you change your mind about recently?",
  "Where did the time actually go today?",
  "What are you pretending not to know?",
  "What did you learn by accident?",
  "What would make tomorrow feel lighter?",
];

// The same prompt all day, a different one tomorrow.
export function promptForDay(day: string): string {
  const seed = day.split("-").reduce((sum, part) => sum * 31 + Number(part), 7);
  return PROMPTS[seed % PROMPTS.length]!;
}
