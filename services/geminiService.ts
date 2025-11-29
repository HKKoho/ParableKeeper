import { GoogleGenAI } from "@google/genai";
import { RoleType, Challenge } from '../types';

const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY not found in environment");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateSermon = async (
  score: number,
  saved: number,
  lost: number,
  role: RoleType,
  language: 'en' | 'zh' = 'en'
): Promise<string> => {
  const ai = getAiClient();

  const fallbackSermons = {
    en: "The service has ended. Go in peace.",
    zh: "聚會已結束。願你平安。"
  };

  if (!ai) return fallbackSermons[language];

  try {
    const languageInstruction = language === 'zh'
      ? 'Write in Traditional Chinese (繁體中文) with biblical language and tone.'
      : 'Write in English with biblical, encouraging, slightly archaic but readable tone.';

    const prompt = `
      You are writing a very short (2 sentences max) closing thought for a church service game.
      Role played: ${role}.
      Stats: Saved ${saved} souls, Lost ${lost} souls to the world.
      Score: ${score}.

      Based on the Parable of the Sower, give a short, thematic encouragement or admonition.
      If they did well (high saved), praise the harvest.
      If they did poorly (high lost), encourage them to sow more broadly or tend the soil better.

      ${languageInstruction}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || fallbackSermons[language];
  } catch (error) {
    console.error("Gemini API Error:", error);
    const fallbackMessages = {
      en: "The harvest is plentiful, but the laborers are few.",
      zh: "莊稼多，做工的人少。"
    };
    return fallbackMessages[language];
  }
};

export const generateChallenge = async (role: RoleType): Promise<Challenge> => {
  const ai = getAiClient();

  // Fallback challenges if AI is unavailable
  const fallbackChallenges: Record<RoleType, Challenge[]> = {
    [RoleType.PASTOR]: [
      {
        id: Math.random().toString(36),
        distractionText: "Deacons need budget approval. Members want meeting time.",
        distractionTextZh: "執事需要預算批准。會友要求會議時間。",
        bibleStatement: "For where your treasure is, there your heart will be also.",
        bibleStatementZh: "因為你的財寶在哪裡，你的心也在那裡。",
        isRealVerse: true,
        role: RoleType.PASTOR
      },
      {
        id: Math.random().toString(36),
        distractionText: "Members request policy changes. Deacons need signatures.",
        distractionTextZh: "會友要求政策改變。執事需要簽名。",
        bibleStatement: "Blessed are those who hunger and thirst for paperwork.",
        bibleStatementZh: "那些渴慕文件工作的人有福了。",
        isRealVerse: false,
        role: RoleType.PASTOR
      }
    ],
    [RoleType.DEACON]: [
      {
        id: Math.random().toString(36),
        distractionText: "Pastor needs report. Members complain about facilities.",
        distractionTextZh: "牧師需要報告。會友抱怨設施。",
        bibleStatement: "Cast all your anxiety on him because he cares for you.",
        bibleStatementZh: "你們要將一切的憂慮卸給神，因為他顧念你們。",
        isRealVerse: true,
        role: RoleType.DEACON
      },
      {
        id: Math.random().toString(36),
        distractionText: "Members want help. Pastor requests committee work.",
        distractionTextZh: "會友需要幫助。牧師要求委員會工作。",
        bibleStatement: "He who complains the loudest shall receive double blessings.",
        bibleStatementZh: "抱怨最多的人將得到雙倍祝福。",
        isRealVerse: false,
        role: RoleType.DEACON
      }
    ],
    [RoleType.MEMBER]: [
      {
        id: Math.random().toString(36),
        distractionText: "Pastor asks for event volunteers. Deacon needs helpers.",
        distractionTextZh: "牧師尋求活動志願者。執事需要幫手。",
        bibleStatement: "Love your neighbor as yourself.",
        bibleStatementZh: "要愛人如己。",
        isRealVerse: true,
        role: RoleType.MEMBER
      },
      {
        id: Math.random().toString(36),
        distractionText: "Deacon invites to committee. Pastor requests choir practice.",
        distractionTextZh: "執事邀請加入委員會。牧師要求詩班練習。",
        bibleStatement: "Blessed are the busy, for they shall inherit the earth.",
        bibleStatementZh: "忙碌的人有福了，因為他們必承受地土。",
        isRealVerse: false,
        role: RoleType.MEMBER
      }
    ]
  };

  if (!ai) {
    const challenges = fallbackChallenges[role];
    return challenges[Math.floor(Math.random() * challenges.length)];
  }

  try {
    const distractorInfo = {
      [RoleType.PASTOR]: "deacons and members bothering with admin work and meetings",
      [RoleType.DEACON]: "pastors and members with complaints and work requests",
      [RoleType.MEMBER]: "pastors and deacons diverting attention to church activities"
    };

    const prompt = `Generate a bilingual church service challenge scenario. Return ONLY valid JSON with no markdown, no code blocks, no explanation.

Role: ${role}
Distraction: ${distractorInfo[role]}

Generate a JSON object with these exact fields:
{
  "distractionText": "Brief scenario in less than 15 words (English) describing how ${distractorInfo[role]}",
  "distractionTextZh": "Same scenario in Traditional Chinese (繁體中文)",
  "bibleStatement": "Either a real Bible verse OR a fake one that sounds Biblical (English)",
  "bibleStatementZh": "Same verse in Traditional Chinese (繁體中文)",
  "isRealVerse": true or false
}

Make it ${Math.random() > 0.5 ? 'a REAL Bible verse' : 'a FAKE verse that sounds Biblical but is not from the Bible'}.
For Traditional Chinese, use proper biblical language.
Return ONLY the JSON object, nothing else.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    const text = response.text?.trim() || '';
    // Remove markdown code blocks if present
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(jsonText);

    return {
      id: Math.random().toString(36).substr(2, 9),
      distractionText: parsed.distractionText,
      distractionTextZh: parsed.distractionTextZh,
      bibleStatement: parsed.bibleStatement,
      bibleStatementZh: parsed.bibleStatementZh,
      isRealVerse: parsed.isRealVerse,
      role
    };
  } catch (error) {
    console.error("Challenge generation error:", error);
    const challenges = fallbackChallenges[role];
    return challenges[Math.floor(Math.random() * challenges.length)];
  }
};