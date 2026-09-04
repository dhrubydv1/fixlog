import "server-only";

import type { FixCategory } from "@/lib/fix-categories";

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "with", "when", "where", "while", "was", "were", "will", "you", "your",
]);
const MINIMUM_SCORE = 0.3;

export type SimilarFixInput = {
  title?: string;
  problem?: string;
  errorMessage?: string;
  cause?: string;
  solution?: string;
  tags?: string;
  category?: FixCategory | null;
};

export type SimilarFixCandidate = {
  id: number;
  title: string;
  problem: string;
  errorMessage: string | null;
  cause: string | null;
  solution: string;
  tags: string | null;
  category: string | null;
};

export type SimilarFixMatch = {
  id: number;
  title: string;
  problem: string;
  errorMessage: string | null;
  category: string | null;
  tags: string | null;
  score: number;
};

function tokens(value: string | null | undefined): Set<string> {
  return new Set(
    (value?.toLocaleLowerCase().match(/[a-z0-9][a-z0-9._/-]*/g) ?? [])
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  );
}

function tagSet(value: string | null | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(/[\s,]+/)
      .map((tag) => tag.replace(/^#+/, "").trim().toLocaleLowerCase())
      .filter(Boolean),
  );
}

function overlap(left: Set<string>, right: Set<string>) {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  const shared = [...left].filter((token) => right.has(token)).length;

  return shared / Math.min(left.size, right.size);
}

export function findSimilarFixes(
  input: SimilarFixInput,
  candidates: SimilarFixCandidate[],
): SimilarFixMatch[] {
  const titleTokens = tokens(input.title);
  const problemTokens = tokens(input.problem);
  const errorTokens = tokens(input.errorMessage);
  const causeTokens = tokens(input.cause);
  const solutionTokens = tokens(input.solution);
  const inputTags = tagSet(input.tags);

  return candidates
    .flatMap((candidate) => {
      let score = 0;
      let possibleScore = 0;
      let hasMeaningfulMatch = false;

      if (inputTags.size > 0) {
        const tagOverlap = overlap(inputTags, tagSet(candidate.tags));
        score += tagOverlap * 4;
        possibleScore += 4;
        hasMeaningfulMatch ||= tagOverlap > 0;
      }

      if (input.category) {
        score += input.category === candidate.category ? 1.5 : 0;
        possibleScore += 1.5;
      }

      if (titleTokens.size > 0) {
        const titleOverlap = overlap(titleTokens, tokens(candidate.title));
        score += titleOverlap * 3.5;
        possibleScore += 3.5;
        hasMeaningfulMatch ||= titleOverlap > 0;
      }

      if (errorTokens.size > 0) {
        const errorOverlap = overlap(errorTokens, tokens(candidate.errorMessage));
        score += errorOverlap * 4.5;
        possibleScore += 4.5;
        hasMeaningfulMatch ||= errorOverlap > 0;
      }

      if (problemTokens.size > 0) {
        const problemOverlap = overlap(problemTokens, tokens(candidate.problem));
        score += problemOverlap * 2.5;
        possibleScore += 2.5;
        hasMeaningfulMatch ||= problemOverlap > 0;
      }

      if (causeTokens.size > 0) {
        score += overlap(causeTokens, tokens(candidate.cause)) * 1;
        possibleScore += 1;
      }

      if (solutionTokens.size > 0) {
        score += overlap(solutionTokens, tokens(candidate.solution)) * 0.75;
        possibleScore += 0.75;
      }

      const normalizedScore = possibleScore === 0 ? 0 : score / possibleScore;

      if (!hasMeaningfulMatch || normalizedScore < MINIMUM_SCORE) {
        return [];
      }

      return [{
        id: candidate.id,
        title: candidate.title,
        problem: candidate.problem,
        errorMessage: candidate.errorMessage,
        category: candidate.category,
        tags: candidate.tags,
        score: Math.round(normalizedScore * 100) / 100,
      }];
    })
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, 5);
}
