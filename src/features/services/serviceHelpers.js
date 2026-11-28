export const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
export const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
export const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
