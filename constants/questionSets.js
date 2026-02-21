/**
 * Registry of all available question sets.
 * Add new sets here after uploading the JSON to /public/questions/.
 * The key becomes the questionSetId stored in Firestore.
 */
export const QUESTION_SETS = {
  sample: {
    label: "Aptitude Week 1",
    category: "Aptitude",
    difficulty: "Medium",
    questionCount: 10,
    url: "/questions/sample.json",
  },
  "programming-basics": {
    label: "Programming Basics",
    category: "Coding",
    difficulty: "Easy",
    questionCount: 10,
    url: "/questions/programming-basics.json",
  },
};

export const DEFAULT_SET_ID = "sample";

export function getQuestionSetUrl(setId) {
  return QUESTION_SETS[setId]?.url ?? QUESTION_SETS[DEFAULT_SET_ID].url;
}
