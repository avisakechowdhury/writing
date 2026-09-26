export const MOODS = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'peaceful', label: 'Peaceful', emoji: '😌' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
  { value: 'excited', label: 'Excited', emoji: '🤩' },
  { value: 'thoughtful', label: 'Thoughtful', emoji: '🤔' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😤' },
] as const;

export type MoodValue = (typeof MOODS)[number]['value'];

export const MOOD_FILTER_OPTIONS = ['all', ...MOODS.map((m) => m.value)];
