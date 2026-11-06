import type { ActivityType, CardSource, ErrorCategory } from '@prisma/client';

export const ERROR_CATEGORIES = ['verb_tense', 'preposition', 'article', 'word_order', 'word_choice', 'portuguese_word', 'spelling', 'other'] as const satisfies readonly ErrorCategory[];
export const ACTIVITY_TYPES = ['chat', 'flashcard', 'video', 'dictation'] as const satisfies readonly ActivityType[];
export const CARD_SOURCES = ['chat', 'cronograma', 'aleatorio', 'erro'] as const satisfies readonly CardSource[];
