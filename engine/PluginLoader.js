/**
 * PluginLoader.js — Dynamically imports the right game plugin by gameId.
 *
 * To add a new game: add one entry to PLUGIN_REGISTRY + create the plugin folder.
 * Zero engine changes required.
 */

const PLUGIN_REGISTRY = {
  "aptitude-blitz": () => import("../plugins/aptitude-blitz/AptitudeGame"),
  "word-builder":   () => import("../plugins/word-builder/WordBuilderGame"),
  "sudoku":         () => import("../plugins/sudoku/SudokuGame"),
};

export function getRegisteredGameIds() {
  return Object.keys(PLUGIN_REGISTRY);
}

export function isRegistered(gameId) {
  return gameId in PLUGIN_REGISTRY;
}

export async function loadPlugin(gameId) {
  const loader = PLUGIN_REGISTRY[gameId];
  if (!loader) throw new Error(`No plugin registered for gameId: "${gameId}"`);
  const mod = await loader();
  return mod.default;
}
