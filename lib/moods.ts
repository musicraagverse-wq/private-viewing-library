/** Mood-based browsing: moods map to trope tags known to exist in the catalog. */

export interface Mood {
  slug: string;
  title: string;
  description: string;
  icon: string;
  tropes: string[];
}

export const MOODS: Mood[] = [
  {
    slug: "revenge-fix",
    title: "Revenge Fix",
    description: "They wronged her. Now they pay. Satisfying payback arcs only.",
    icon: "🔥",
    tropes: ["Revenge", "Rebirth Revenge", "Betrayal", "Divorce", "Ex-Husband Regret"],
  },
  {
    slug: "cozy-romance",
    title: "Cozy Romance",
    description: "Billionaires, secret weddings, and happily-ever-afters.",
    icon: "💕",
    tropes: ["Billionaire", "CEO Romance", "Heir Revealed", "Rags to Riches"],
  },
  {
    slug: "family-feuds",
    title: "Family Feuds",
    description: "Scheming in-laws, secret twins, and household warfare.",
    icon: "🏠",
    tropes: ["Stepfamily Drama", "Evil Mother-in-Law", "Orphan", "Twins"],
  },
  {
    slug: "dark-underworld",
    title: "Dark Underworld",
    description: "Mafia bosses, undercover agents, and dangerous secrets.",
    icon: "🌃",
    tropes: ["Mafia", "Undercover", "Kidnapping"],
  },
  {
    slug: "second-chances",
    title: "Second Chances",
    description: "Rebirth, time travel, and doing it all over — better.",
    icon: "🔄",
    tropes: ["Rebirth Revenge", "Amnesia", "Time Travel"],
  },
  {
    slug: "supernatural",
    title: "Supernatural",
    description: "Werewolves, vampires, and cultivators beyond the ordinary.",
    icon: "🌙",
    tropes: ["Werewolf", "Vampire", "Cultivation"],
  },
];

export function getMood(slug: string): Mood | undefined {
  return MOODS.find((m) => m.slug === slug);
}
