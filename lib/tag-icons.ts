/** Emoji icons for genre / trope pills. Unmapped tags show text only. */

const GENRE_ICONS: Record<string, string> = {
  "romance": "💕",
  "revenge": "🗡️",
  "contemporary romance": "💑",
  "counterattack": "👊",
  "dark romance": "🌙",
  "hidden identity": "🎭",
  "plot": "📖",
  "fantasy": "✨",
  "sweet romance": "💗",
  "ceo romance": "💼",
  "women's growth": "🌸",
  "contract marriage": "📝",
  "betrayal": "💔",
  "rebirth": "🔥",
  "second chance": "🔄",
  "werewolf": "🐺",
  "love after marriage": "💍",
  "love triangle": "🔺",
  "mafia": "🤵",
  "rags to riches": "💰",
  "time travel": "⏳",
  "suspense": "😱",
  "love": "❤️",
  "modern romance": "🏙️",
  "thriller": "🔪",
  "comedy": "😂",
  "drama": "🎬",
  "action": "💥",
  "mystery": "🔍",
  "horror": "👻",
};

const TROPE_ICONS: Record<string, string> = {
  "betrayal": "💔",
  "rebirth revenge": "🔥",
  "billionaire": "💰",
  "revenge": "🗡️",
  "ceo romance": "💼",
  "heir revealed": "👑",
  "werewolf": "🐺",
  "pregnant bride": "🤰",
  "mafia": "🤵",
  "stepfamily drama": "👨‍👩‍👧",
  "divorce": "📄",
  "twins": "👯",
  "orphan": "🧒",
  "doctor romance": "🩺",
  "contract marriage": "📝",
  "vampire": "🧛",
  "cultivation": "🧘",
  "hidden identity": "🎭",
  "ex-husband regret": "😤",
  "undercover": "🕵️",
  "kidnapping": "🚨",
  "amnesia": "🧠",
  "bodyguard romance": "🛡️",
  "evil mother-in-law": "😈",
  "secretary romance": "📎",
  "secret baby": "👶",
  "love triangle": "🔺",
  "second chance": "🔄",
  "time travel": "⏳",
  "hidden marriage": "💍",
};

export function genreIcon(genre: string): string | null {
  return GENRE_ICONS[genre.toLowerCase().trim()] ?? null;
}

export function tropeIcon(trope: string): string | null {
  return TROPE_ICONS[trope.toLowerCase().trim()] ?? null;
}
