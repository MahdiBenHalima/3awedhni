import type { Instruction, Intent, Outcome, PatientLanguage } from "./care-types";

/**
 * Deterministic, conservative safety engine.
 * Red flags are evaluated BEFORE any instruction lookup, and only active,
 * physician-approved instructions of the authorised consultation can be quoted.
 * Thresholds are provisional values and must be reviewed by a clinician.
 */

export const URGENT_TEMPERATURE = 40;
export const ESCALATE_TEMPERATURE = 39.5;

export interface Analysis {
  language: PatientLanguage;
  temperature: number | null;
  feverMentioned: boolean;
  feverNegated: boolean;
  redFlags: string[];
  injection: boolean;
  intent: Intent | null;
  outcome: Outcome;
  instruction: Instruction | null;
  reply: string;
  summary: string;
  trace: string[];
}

const ARABIC = /[\u0600-\u06FF]/;
const ARABIZI_HINT =
  /\b\w*[2379]\w*[a-z]\w*\b|\b[a-z]+[2379]\w*\b|\b(weldi|bnti|3andou|3andi|barcha|chna|chnowa|mazal|yechki|skhana|skhantou|ma3andouch|ynajjemch|najamch|yebla3)\b/;
const FRENCH_HINT =
  /\b(fièvre|fievre|gorge|mon|fils|fille|enfant|il|elle|est|pas|respire|avaler|médicament|medicament|oublié|oublie|mange|que|faire|bonjour|j'ai|depuis)\b/;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectLanguage(text: string): PatientLanguage {
  const t = normalize(text);
  const hasArabic = ARABIC.test(t);
  const latin = t.replace(/[\u0600-\u06FF]/g, " ");
  const hasFrench = FRENCH_HINT.test(latin);
  const hasArabizi = ARABIZI_HINT.test(latin);
  if (hasArabic) return hasFrench ? "Mixte" : "Darja";
  if (hasArabizi && hasFrench) return "Mixte";
  if (hasArabizi) return "Arabizi";
  return "Français";
}

export function extractTemperature(text: string): number | null {
  const t = normalize(text).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const matches = t.match(/\b(3[5-9]|4[0-3])(?:[.,](\d))?\b/g);
  if (!matches) return null;
  const values = matches.map((m) => parseFloat(m.replace(",", ".")));
  return Math.max(...values);
}

const FEVER = [/سخان/, /حرار/, /skhan/, /s5an/, /fi[èe]vre/, /temp[ée]rature/, /\bfi[eè]vr/];
const FEVER_NEGATION = [
  /ما\s*(عندو|عندها|عندي)ش\s*(ال)?سخان/,
  /\bma\s*3and(ou|ha|i)ch\s*s(kh|5)ana/,
  /\bma3and(ou|ha|i)ch\s*s(kh|5)ana/,
  /pas\s+de\s+fi[èe]vre/,
  /n'a\s+pas\s+de\s+fi[èe]vre/,
];

const RED_FLAGS: { label: string; patterns: RegExp[] }[] = [
  {
    label: "Signe d'alerte / Red Flag explicite",
    patterns: [
      /\bred[-_ ]?flags?\b/,
      /\bemergency\b/,
      /\bemergencies\b/,
      /\burgences?\b/,
      /\burgent(e)?\b/,
      /\bcas\s+urgent\b/,
      /\bsituation\s+urgente\b/,
      /(signes?|crit[èe]res?)\s+d['\s]*(alerte|gravit[ée])/,
      /(علامة|علامات|إشارة|إشارات)\s*(خطر|الخطر)/,
      /(حالة|وضع)\s*(استعجالي|استعجالية|طارئة|خطيرة)/,
      /\b(استعجالي|طوارئ|إسعاف)\b/,
      /\b(3lamet|3alemet|signe)\s*(khatar|el[\s-]?khatar|alerte)\b/,
      /\b(isti3jeli|isti3jili)\b/,
      /\bkhatar\b/,
      /\bdanger\s+(vital|grave|imm[ée]diat)\b/,
    ],
  },
  {
    label: "Difficulté respiratoire",
    patterns: [
      /يتنفس\s*ب\s*صعوب/,
      /صعوبة\s*(في\s*)?التنفس/,
      /ما\s*(ي|ت)نجم(ش)?\s*(ي|ت)تنفس/,
      /ضيق\s*(في\s*)?(ال)?نفس/,
      /نهجة\s*كبيرة/,
      /خنقة|مخنوق/,
      /yetnaf[ea]s\s*b\s*s[3e]ouba/,
      /s[3e]ouba\s*f\s*tnafa[sz]/,
      /ma\s*(y|t)n(a|e)jj?(a|e)mch\s*(y|t)etnaffes/,
      /nahja\s*kbira/,
      /dhi9\s*(f\s*)?tnafas/,
      /difficult[ée]s?\s+respiratoires?/,
      /difficult[ée]s?\s+(à|a)\s+respirer/,
      /d[ée]tresse\s+respiratoire/,
      /respire\s+(mal|difficilement|tr[èe]s\s+mal)/,
      /ne\s+respire\s+(pas|plus)\s+bien/,
      /\b(essouffl[ée]|essoufflement|dyspn[ée]e|[ée]touffement|asphyxie)\b/,
    ],
  },
  {
    label: "Impossibilité d'avaler sa salive",
    patterns: [
      /ما\s*(ي|ت)نجم(ش)?\s*(ي|ت)بلع\s*ريق/,
      /ما\s*يقدرش\s*يبلع/,
      /ريقه\s*يسيل/,
      /بلع\s*الريق/,
      /ma\s*(y|t)?n(a|e)jj?(a|e)mch\s*(y|t)ebla3\s*ri9/,
      /ma\s*yebla3ch\s*ri9ou/,
      /bille3\s*rou9ou/,
      /ri9ou\s*ysil/,
      /impossible\s+d['\s]*avaler/,
      /ne\s+peut\s+(pas|plus)\s+avaler/,
      /avaler\s+sa\s+salive/,
      /\b(bave|bave\s+excessive)\b/,
    ],
  },
  {
    label: "Altération majeure de l'état général",
    patterns: [
      /تشنج|تشنجات/,
      /فاقد\s*الوعي|فقدان\s*الوعي/,
      /غيبوبة/,
      /دايخ\s*وما\s*يفيقش/,
      /ما\s*يفيقش|ما\s*يتحركش/,
      /\b(convulsion|convulsions|spasmes)\b/,
      /\b(inconscient|inconsciente|perte\s+de\s+connaissance|coma)\b/,
      /ne\s+r[ée]agit\s+(plus|pas)/,
      /fa9ed\s*(el)?\s*wa3i/,
      /dayekh\s*ma\s*yfi9ch/,
      /ghaybouba/,
      /l[ée]thargie\s*s[ée]v[èe]re/,
    ],
  },
];

const INJECTION = [
  /ignore/,
  /oublie\s+(toutes?\s+)?(les\s+)?(consignes|instructions|r[èe]gles)/,
  /autre\s+patient/,
  /dossier\s+d'un\s+autre/,
  /system\s*prompt/,
  /tu\s+es\s+(maintenant\s+)?(un\s+)?m[ée]decin/,
];

const INTENTS: { intent: Intent; patterns: RegExp[] }[] = [
  {
    intent: "oubli",
    patterns: [/نسيت\s*(ال)?دوا/, /\bnsit\b/, /oubli[ée]?\s+(le|la|de|son|sa|du)/],
  },
  {
    intent: "alimentation",
    patterns: [
      /ما\s*(ي|ت)حب(ش)?\s*(ي|ت)اكل/,
      /ma\s*(y|t)7ebb?ech\s*(y|t)ekel/,
      /ne\s+mange\s+(pas|plus|rien)/,
      /mange\s+pas/,
    ],
  },
  { intent: "gorge", patterns: [/حلق/, /7al9/, /hal9/, /gorge/, /angine/] },
  { intent: "toux", patterns: [/كحة/, /ko7a/, /toux/, /sirop/, /tousse/] },
  { intent: "antibiotique", patterns: [/antibiotique/, /amoxicilline/, /دواء/, /dawa/] },
  { intent: "nez", patterns: [/خشم/, /khachm/, /nez/, /rhume/, /sérum/] },
  { intent: "digestif", patterns: [/ترجيع/, /vomir/, /diarrhée/, /كرش/, /krach/] },
  { intent: "oreille", patterns: [/ودن/, /oudhen/, /oreille/, /otite/] },
  { intent: "eruption", patterns: [/حبوب/, /hboub/, /bouton/, /rougeur/, /éruption/] },
];

const URGENT_REPLY = {
  Français:
    "⚠️ Ce que vous décrivez nécessite une évaluation médicale urgente. Rendez-vous immédiatement aux urgences les plus proches ou appelez le SAMU (190). N'attendez pas le matin. Votre médecin sera informé.",
  Darja:
    "⚠️ اللي قاعد تحكي عليه يستحق فحص طبي عاجل. توجّه توّا لأقرب استعجالي ولا كلّم الـSAMU (190). ما تستناش للصباح. الطبيب متاعك باش يتعلم.",
  Arabizi:
    "⚠️ Elli 9a3ed te7ki 3lih yest7a9 fa7s tebbi 3ajel. Twajjeh tawa l a9rab ist3jeli wala kallem SAMU (190). Ma testanech lel sbe7. Tbibek bech yet3allem.",
};

const NOT_COVERED_REPLY = {
  Français:
    "Je n'ai pas de consigne validée par votre médecin pour cette situation. Par prudence, contactez le cabinet ou un professionnel de santé. En cas d'aggravation, rendez-vous aux urgences.",
  Darja:
    "ما عنديش تعليمات مصادق عليها من الطبيب على الحالة هاذي. باش نكونو محتاطين، كلّم العيادة ولا طبيب. كان الحالة تزيد تخيب، امشي للاستعجالي.",
  Arabizi:
    "Ma 3andich ta3limet msade9 3liha mel tbib 3al 7ala hedhi. Kallem el 3iyada wala tbib. Ken el 7ala tzid tkhib, emchi lel isti3jeli.",
};

const ESCALATE_REPLY = {
  Français:
    "Cette situation dépasse les consignes prévues par votre médecin. Contactez le cabinet aujourd'hui pour un avis médical. Si l'état s'aggrave, rendez-vous aux urgences.",
  Darja:
    "الحالة هاذي فايتة التعليمات اللي حضّرها الطبيب. كلّم العيادة اليوم باش تاخو رأي طبي. كان الحالة تزيد تخيب، امشي للاستعجالي.",
  Arabizi:
    "El 7ala hedhi fayta et-ta3limet elli 7adherha tbib. Kallem el 3iyada lyoum. Ken el 7ala tzid tkhib, emchi lel isti3jeli.",
};

const REFUSAL_REPLY = {
  Français:
    "Je ne peux répondre qu'à partir des consignes validées de votre propre consultation. Cette demande ne peut pas être traitée.",
  Darja: "ننجم نجاوب كان بالتعليمات المصادق عليها متاع الاستشارة متاعك. الطلب هذا ما نجمش نعملو.",
  Arabizi:
    "Nnajjem njaweb ken bel ta3limet el msade9 3lihom mta3 consultation mte3ek. Ma nnajjemch na3mel hedha.",
};

function pick(texts: Record<"Français" | "Darja" | "Arabizi", string>, lang: PatientLanguage) {
  if (lang === "Darja") return texts.Darja;
  if (lang === "Arabizi") return texts.Arabizi;
  if (lang === "Mixte") return texts.Arabizi;
  return texts.Français;
}

function pickInstruction(instruction: Instruction, lang: PatientLanguage) {
  if (lang === "Darja") return instruction.reply.darja;
  if (lang === "Arabizi" || lang === "Mixte") return instruction.reply.arabizi;
  return instruction.reply.fr;
}

export function analyzeMessage(
  text: string,
  instructions: Instruction[],
  consultationId: string,
): Analysis {
  const t = normalize(text);
  const trace: string[] = [];
  const language = detectLanguage(text);
  trace.push(`Langue détectée : ${language}`);

  const injection = INJECTION.some((p) => p.test(t));
  const temperature = extractTemperature(text);
  const feverNegated = FEVER_NEGATION.some((p) => p.test(t));
  const feverMentioned = !feverNegated && (FEVER.some((p) => p.test(t)) || temperature !== null);
  if (temperature !== null) trace.push(`Température déclarée : ${temperature} °C`);
  if (feverNegated) trace.push("Négation respectée : absence de fièvre signalée");

  const redFlags = RED_FLAGS.filter((f) => f.patterns.some((p) => p.test(t))).map((f) => f.label);
  if (temperature !== null && temperature >= URGENT_TEMPERATURE && !feverNegated) {
    redFlags.unshift(`Température ≥ ${URGENT_TEMPERATURE} °C chez l'enfant`);
  }

  const base = { language, temperature, feverMentioned, feverNegated, redFlags, injection, trace };

  // 1. Safety rules first — always win over ordinary instructions.
  if (redFlags.length > 0) {
    trace.push(`Signe(s) d'alerte : ${redFlags.join(", ")}`);
    trace.push("Décision : orientation urgente immédiate");
    return {
      ...base,
      intent: null,
      outcome: "urgence",
      instruction: null,
      reply: pick(URGENT_REPLY, language),
      summary: redFlags.join(" · "),
    };
  }
  trace.push("Aucun signe d'alerte détecté");

  // 2. Prompt-injection / cross-record attempts are refused.
  if (injection) {
    trace.push("Tentative de contournement détectée → refus");
    return {
      ...base,
      intent: null,
      outcome: "non_couverte",
      instruction: null,
      reply: pick(REFUSAL_REPLY, language),
      summary: "Tentative de contournement refusée",
    };
  }

  // 3. Fever between escalate and urgent thresholds → physician advice.
  if (feverMentioned && temperature !== null && temperature >= ESCALATE_TEMPERATURE) {
    trace.push(`Fièvre ≥ ${ESCALATE_TEMPERATURE} °C hors consigne → escalade`);
    return {
      ...base,
      intent: "fievre",
      outcome: "escalade",
      instruction: null,
      reply: pick(ESCALATE_REPLY, language),
      summary: `Fièvre ${temperature} °C — avis médical`,
    };
  }

  // 4. Intent recognition.
  let intent: Intent | null =
    INTENTS.find((i) => i.patterns.some((p) => p.test(t)))?.intent ?? null;
  if (!intent && feverMentioned) intent = "fievre";
  trace.push(intent ? `Intention reconnue : ${intent}` : "Intention non reconnue");

  // 5. Only active, approved instructions of the authorised consultation.
  const instruction =
    intent === null
      ? null
      : (instructions.find(
          (i) => i.consultationId === consultationId && i.active && i.intent === intent,
        ) ?? null);

  if (!instruction) {
    trace.push("Aucune consigne validée et active applicable → orientation humaine");
    return {
      ...base,
      intent,
      outcome: "non_couverte",
      instruction: null,
      reply: pick(NOT_COVERED_REPLY, language),
      summary: intent ? `Consigne « ${intent} » indisponible` : "Situation non couverte",
    };
  }

  trace.push(`Consigne citée : ${instruction.id} (v${instruction.version})`);
  return {
    ...base,
    intent,
    outcome: "transmise",
    instruction,
    reply: pickInstruction(instruction, language),
    summary: instruction.situation,
  };
}
