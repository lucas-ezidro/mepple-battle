export const RANK_TYPES = ["100", "10", "5", "3"] as const;
export type RankType = (typeof RANK_TYPES)[number];

export const RANK_LABELS: Record<RankType, string> = {
  "100": "Top 100",
  "10": "Top 10",
  "5": "Top 5",
  "3": "Top 3",
};

export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);