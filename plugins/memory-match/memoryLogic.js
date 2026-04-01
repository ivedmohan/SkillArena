export function createShuffledDeck(pairs) {
  if (!pairs) return [];
  const duplicated = [...pairs, ...pairs];
  // Fisher-Yates shuffle
  for (let i = duplicated.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [duplicated[i], duplicated[j]] = [duplicated[j], duplicated[i]];
  }
  return duplicated.map((emoji, index) => ({ id: index, emoji, isMatched: false }));
}

export function calcPoints() {
  return 100; // Base points for a successful match (combo multiplier applies on top)
}
