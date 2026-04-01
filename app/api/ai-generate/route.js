import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * POST /api/ai-generate
 *
 * Generates a valid game config JSON using Gemini AI.
 * Supports two modes:
 *   1. Server key (GOOGLE_AI_API_KEY in .env.local) — default
 *   2. User-provided key (sent in request body) — fallback when server key hits quota
 *
 * Body: { gameType, topic, difficulty, questionCount, userApiKey? }
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { gameType, topic, difficulty, questionCount, userApiKey } = body;

    if (!gameType || !topic || !difficulty) {
      return Response.json(
        { error: "Missing required fields: gameType, topic, difficulty" },
        { status: 400 }
      );
    }

    // Use user-provided key as fallback when server key is unavailable or exhausted
    const apiKey = userApiKey || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "No API key available. Please provide your own Gemini API key.", needsKey: true },
        { status: 401 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" } // Force clean JSON from Gemini
    });

    const prompt = buildPrompt(gameType, topic, difficulty, questionCount ?? 10);

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```(?:json)?\s*([\s\S]*?)```/, '$1').trim(); // Ensure no backticks just in case

    let config;
    try {
      config = JSON.parse(text);
    } catch (parseErr) {
      console.error("Failed to parse AI JSON:", text.substring(0, 100));
      return Response.json({ error: "AI generated invalid JSON. Please try again." }, { status: 500 });
    }

    // Validate the generated config
    if (!config.meta?.gameId || !config.meta?.gameType || !config.config) {
      return Response.json(
        { error: "AI generated an invalid config structure. Please try again." },
        { status: 500 }
      );
    }

    return Response.json({ config, generatedBy: "gemini-2.0-flash" });
  } catch (err) {
    const isQuotaError =
      err.message?.includes("429") ||
      err.message?.includes("quota") ||
      err.message?.includes("RESOURCE_EXHAUSTED");

    if (isQuotaError) {
      return Response.json(
        {
          error: "API key quota exhausted. Please provide your own free Gemini API key.",
          needsKey: true,
        },
        { status: 429 }
      );
    }

    console.error("AI generation error:", err);
    return Response.json(
      { error: err.message || "AI generation failed" },
      { status: 500 }
    );
  }
}

function buildPrompt(gameType, topic, difficulty, questionCount) {
  const difficultyGuide = {
    easy: "simple, straightforward problems suitable for beginners",
    medium: "moderate difficulty, requires some thinking",
    hard: "challenging problems that require strong analytical skills",
  };

  if (gameType === "mcq") {
    return `You are a game config generator for an educational game engine. Generate a JSON config for an MCQ aptitude game.

REQUIREMENTS:
- Topic: ${topic}
- Difficulty: ${difficulty} (${difficultyGuide[difficulty] || difficultyGuide.medium})
- Number of questions: ${questionCount}
- Each question must have exactly 4 options
- Each question must have exactly 1 correct answer
- Include explanations for each answer
- Questions should be appropriate for Indian campus placement exams

OUTPUT EXACTLY this JSON structure (no extra text):
\`\`\`json
{
  "meta": {
    "gameId": "aptitude-blitz",
    "gameType": "mcq",
    "title": "AI: ${topic}",
    "description": "AI-generated ${difficulty} ${topic} quiz",
    "difficulty": "${difficulty}",
    "timeLimit": ${questionCount * 15},
    "timePerQuestion": ${difficulty === "easy" ? 20 : difficulty === "hard" ? 12 : 15},
    "lives": 3,
    "version": "1.0",
    "targetSkills": ["problem-solving", "numerical-aptitude", "speed"],
    "learningOutcome": "Strengthen ${topic} skills for campus placements",
    "aiGenerated": true
  },
  "config": {
    "questions": [
      {
        "id": "q1",
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "answer": "correct option exactly matching one of the options",
        "topic": "${topic}",
        "difficulty": "easy|medium|hard",
        "points": 10,
        "explanation": "Step-by-step explanation"
      }
    ]
  }
}
\`\`\`

Generate ${questionCount} unique, accurate questions. Make sure every answer is mathematically/logically correct. Vary the difficulty of individual questions: roughly 30% easy, 40% medium, 30% hard (but all within the ${difficulty} range). Return ONLY the JSON.`;
  }

  if (gameType === "word") {
    return `You are a game config generator for an educational game engine. Generate a JSON config for a Word Builder game.

REQUIREMENTS:
- Topic/Theme: ${topic}
- Difficulty: ${difficulty}
- Generate 3 rounds of letter tiles

OUTPUT EXACTLY this JSON structure (no extra text):
\`\`\`json
{
  "meta": {
    "gameId": "word-builder",
    "gameType": "word",
    "title": "AI: ${topic} Words",
    "description": "AI-generated word building challenge",
    "difficulty": "${difficulty}",
    "timeLimit": 90,
    "lives": 3,
    "version": "1.0",
    "targetSkills": ["vocabulary", "pattern-recognition", "speed"],
    "learningOutcome": "Build vocabulary around ${topic}",
    "aiGenerated": true
  },
  "config": {
    "rounds": [
      {
        "id": "r1",
        "letters": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
        "minWordLength": 3,
        "pointsPerLetter": 5,
        "bonusWords": ["WORD1", "WORD2"],
        "bonusMultiplier": 2
      }
    ]
  }
}
\`\`\`

Make sure the letter tiles in each round can actually form the bonus words. Use 10-12 letters per round. Return ONLY the JSON.`;
  }

  if (gameType === "memory") {
    return `You are a game config generator for an educational game engine. Generate a JSON config for a visual Memory Match game.

REQUIREMENTS:
- Topic/Theme: ${topic}
- Difficulty: ${difficulty}
- Generate an array of 8 unique but highly thematic Emojis based on the topic.

OUTPUT EXACTLY this JSON structure (no extra text):
\`\`\`json
{
  "meta": {
    "gameId": "memory-match",
    "gameType": "memory",
    "title": "AI: ${topic} Memory",
    "description": "AI-generated spatial visual challenge",
    "difficulty": "${difficulty}",
    "timeLimit": 60,
    "lives": "infinite",
    "version": "1.0",
    "targetSkills": ["spatial-memory", "pattern-recognition", "focus"],
    "learningOutcome": "Enhance spatial recall using ${topic} themes",
    "aiGenerated": true
  },
  "config": {
    "pairs": ["🚀", "🛸", "🌍", "🌙", "☄️", "🛰️", "👨‍🚀", "🔭"]
  }
}
\`\`\`

Pick 8 unique Emojis that perfectly match the theme "${topic}". Return ONLY the JSON.`;
  }

  // Default / logic type
  return `You are a game config generator for an educational game engine. Generate a JSON config for an MCQ logic/reasoning game.

REQUIREMENTS:
- Topic: ${topic}
- Difficulty: ${difficulty} (${difficultyGuide[difficulty] || difficultyGuide.medium})
- Number of questions: ${questionCount}

OUTPUT EXACTLY this JSON structure:
\`\`\`json
{
  "meta": {
    "gameId": "aptitude-blitz",
    "gameType": "mcq",
    "title": "AI: ${topic}",
    "description": "AI-generated ${topic} challenge",
    "difficulty": "${difficulty}",
    "timeLimit": ${questionCount * 15},
    "timePerQuestion": 15,
    "lives": 3,
    "version": "1.0",
    "targetSkills": ["logic", "problem-solving", "algorithms"],
    "learningOutcome": "Develop reasoning skills in ${topic}",
    "aiGenerated": true
  },
  "config": {
    "questions": [
      {
        "id": "q1",
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "answer": "correct option",
        "topic": "${topic}",
        "difficulty": "easy|medium|hard",
        "points": 10,
        "explanation": "explanation"
      }
    ]
  }
}
\`\`\`

Generate ${questionCount} unique, accurate questions. Return ONLY the JSON.`;
}
