// Tiny sqlite helpers for React Native/Expo.
// Note: expo-sqlite is not yet installed in this project. We'll add it next.

export function sqlDateNow(): string {
  // YYYY-MM-DD
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

