import { Instruction, Intent } from "./care-types";

interface ClinicalRule {
  id: string;
  intent: Intent;
  keywords: string[];
  title: string;
  applicability: string;
  defaultAction: string;
  escalation: string[];
  reply: {
    fr: string;
    darja: string;
    arabizi: string;
  };
}

const CLINICAL_RULES: ClinicalRule[] = [
  {
    id: "gorge",
    intent: "gorge",
    keywords: ["gorge", "angine", "déglutition", "deglutition", "avaler", "حلق", "7al9", "amygdale", "amygdales", "wja3 el 7al9"],
    title: "Douleur de gorge ou déglutition douloureuse",
    applicability: "Douleur pharyngée sans détresse respiratoire ni impossibilité d'avaler la salive",
    defaultAction: "Poursuivre les antalgiques prescrits (paracétamol selon le poids). Proposer des boissons tièdes ou fraîches et des aliments mous ou mixés.",
    escalation: [
      "Impossibilité totale d'avaler sa salive avec bave excessive",
      "Difficulté respiratoire ou stridor",
      "Gonflement asymétrique du cou",
    ],
    reply: {
      fr: "Consigne médecin pour la gorge : Poursuivre le traitement prescrit, proposer des boissons tièdes ou fraîches.",
      darja: "تعليمات الطبيب لوجع الحلق: كمل الدوا، واعطيه مشروبات دافية وماكلة رطبة.",
      arabizi: "Ta3limet tbib lel gorge: kammel eddwa w a3tih mekla ratba w ma defi.",
    },
  },
  {
    id: "fievre",
    intent: "fievre",
    keywords: ["fièvre", "fievre", "température", "temperature", "skhana", "سخانة", "حمى", "trente-neuf", "paracétamol", "doliprane", "chaud", "حرارة"],
    title: "Fièvre ou sensation fébrile (< 39.5°C)",
    applicability: "Température inférieure à 39.5°C avec respect d'au moins 6 heures entre les prises",
    defaultAction: "Administrer le paracétamol selon le poids toutes les 6 heures si nécessaire. Découvrir l'enfant sans le refroidir brutalement et faire boire régulièrement.",
    escalation: [
      "Fièvre égale ou supérieure à 40°C",
      "Convulsions fébriles ou somnolence anormale",
      "Fièvre persistante au-delà de 48 heures",
    ],
    reply: {
      fr: "Consigne médecin pour la fièvre : Antipyrétique selon le poids toutes les 6 heures, bien découvrir l'enfant.",
      darja: "تعليمات الطبيب للسخانة: عطي الباراسيتامول حسب الوزن كل 6 سوايع وخفف عليه الدبش.",
      arabizi: "Ta3limet tbib lel skhana: a3tih paracetamol kol 6 swaye3 w khaffef 3lih el debch.",
    },
  },
  {
    id: "toux",
    intent: "toux",
    keywords: ["toux", "tousser", "ko7a", "كحة", "bronche", "bronches", "bronchite", "sirop", "crachat", "encombrement", "tousse"],
    title: "Toux persistante ou encombrement bronchique",
    applicability: "Toux sans détresse respiratoire ni tirage sous-costal",
    defaultAction: "Bien hydrater l'enfant avec de l'eau tiède ou des boissons douces. Donner le sirop prescrit par le médecin. Surélever légèrement la tête du lit.",
    escalation: [
      "Respiration rapide ou sifflement thoracique audible",
      "Tirage sous les côtes à chaque inspiration",
      "Lèvres ou ongles bleutés (cyanose)",
    ],
    reply: {
      fr: "Consigne médecin pour la toux : Bien hydrater, donner le traitement prescrit, surélever la tête de lit.",
      darja: "تعليمات الطبيب للكحة: شرب الماء الدافئ، عطي السيرو اللي كتبهولك وعليلو شوية مخدة النوم.",
      arabizi: "Ta3limet tbib lel ko7a: ochrob ma defi, a3tih essiro mte3ou w 3allilou el mkhadda.",
    },
  },
  {
    id: "respiration",
    intent: "respiration",
    keywords: ["respiration", "respiratoire", "essoufflement", "nefes", "تنفس", "détresse", "dyspnée", "sifflement", "tirage"],
    title: "Gêne respiratoire ou inconfort ventilatoire",
    applicability: "Inconfort ventilatoire léger sans épuisement",
    defaultAction: "Installer le patient en position assise ou semi-assise au calme. Désobstruer le nez au sérum physiologique. Administrer le traitement inhalé prescrit.",
    escalation: [
      "Détresse respiratoire aiguë (battement des ailes du nez, tirage)",
      "Incapacité de parler ou de boire",
      "Cyanose péribuccale",
    ],
    reply: {
      fr: "Consigne médecin : Position assise au calme, lavage nasal, consulter en urgence si essoufflement marqué.",
      darja: "تعليمات الطبيب: قعدو مرتاح، نظفلو خشمو، وإذا ما تنفسش بالباهي هزّو توّا للاستعجالي.",
      arabizi: "Ta3limet tbib: 9a3dou merté7, nadhaflou khachmou w ken yetnafes bessif hezzou l urgence.",
    },
  },
  {
    id: "antibiotique",
    intent: "antibiotique",
    keywords: ["antibiotique", "amoxicilline", "augmentin", "cefixime", "azithromycine", "dawa", "دواء", "traitement", "posologie"],
    title: "Poursuite et durée du traitement antibiotique",
    applicability: "Prescription antibiotique validée en consultation",
    defaultAction: "Prendre l'antibiotique aux heures fixes selon la posologie exacte. Poursuivre impérativement le traitement jusqu'au bout même si les symptômes disparaissent.",
    escalation: [
      "Éruption cutanée allergique avec rougeurs ou gonflement des lèvres/yeux",
      "Vomissements répétés après chaque prise",
      "Diarrhée sévère",
    ],
    reply: {
      fr: "Consigne médecin antibiotique : Poursuivre impérativement la durée complète prescrite sans interrompre.",
      darja: "تعليمات الطبيب للمضاد الحيوي: كمل مدة الدوا كاملة كيف ما كتبهالك حتى لو تحسن الطفل.",
      arabizi: "Ta3limet tbib lel antibiotique: kammel el modda kemla mte3 eddwa hata ken yethassen.",
    },
  },
  {
    id: "nez",
    intent: "nez",
    keywords: ["nez", "rhume", "rhinite", "sérum", "serum", "physiologique", "lavage", "moucher", "khaychoum", "congestion"],
    title: "Lavage nasal et rhinite",
    applicability: "Nez bouché ou écoulement nasal lors d'un rhume",
    defaultAction: "Effectuer des lavages de nez au sérum physiologique avant chaque repas et avant le coucher. Bien moucher ou aspirer les sécrétions.",
    escalation: [
      "Écoulement purulent épais de plus de 10 jours",
      "Gonflement ou rougeur autour des yeux",
      "Fièvre élevée secondaire",
    ],
    reply: {
      fr: "Consigne médecin pour le nez : Lavage au sérum physiologique avant les repas et le coucher.",
      darja: "تعليمات الطبيب للخشم: اغسل بالـsérum physiologique قبل الماكلة وقبل النوم ومسح بالباهي.",
      arabizi: "Ta3limet tbib lel khachm: ghasla b sérum physio 9bal el mekla w 9bal ennoum.",
    },
  },
  {
    id: "alimentation",
    intent: "alimentation",
    keywords: ["manger", "refuse de manger", "appétit", "appetit", "makla", "solide", "nourriture", "aliments", "وجبة", "شهية"],
    title: "Difficulté ou refus d'alimentation",
    applicability: "Refus temporaire d'alimentation solide lors de l'épisode aigu",
    defaultAction: "Ne pas forcer l'alimentation solide. Proposer de petites portions d'aliments mous, frais et faciles à avaler (compotes, yaourts, purées). Priorité absolue à l'hydratation.",
    escalation: [
      "Refus total de boire et de manger depuis plus de 24h",
      "Signes de déshydratation (bouche très sèche, absence d'urines)",
    ],
    reply: {
      fr: "Consigne médecin pour l'alimentation : Ne pas forcer, privilégier de petites quantités d'aliments mous et frais, hydrater en priorité.",
      darja: "تعليمات الطبيب للماكلة: ما تغصبش عليه، عطي ماكلة رطبة وباردة وخليه يشرب الماء بانتظام.",
      arabizi: "Ta3limet tbib lel mekla: ma toghsbouch 3liha, a3tih mekla ratba w barda w aham 7aja el ma.",
    },
  },
  {
    id: "oubli",
    intent: "oubli",
    keywords: ["oubli", "oublie", "prise oubliée", "doubler la dose", "retard prise", "ne pas doubler", "dose oubliée"],
    title: "Oubli d'une prise de médicament",
    applicability: "Oubli ou retard ponctuel d'une prise selon l'ordonnance médicale",
    defaultAction: "Prendre la dose oubliée dès que possible si le délai est raisonnable. Ne JAMAIS doubler la dose suivante pour compenser. Reprendre ensuite les horaires normaux.",
    escalation: [
      "Prise accidentelle d'une double dose ou suspicion de surdosage",
      "Symptômes inhabituels après prise",
    ],
    reply: {
      fr: "Consigne médecin pour oubli de prise : Prendre la dose si encore temps, ne jamais doubler la prise suivante.",
      darja: "تعليمات الطبيب إذا نسيت الدوا: خوذ الجرعة كي تتفكر، وما تدوبلش الجرعة الجاية جملة.",
      arabizi: "Ta3limet tbib ki tinsa eddwa: khoudh eddose wa9telli tetfakker, w rod belek tdoublé eddose.",
    },
  },
  {
    id: "digestif",
    intent: "digestif",
    keywords: ["vomissement", "vomir", "rdha3", "diarrhée", "diarrhee", "krach", "hydration", "boire", "sro", "كرش", "ترجيع"],
    title: "Hydratation et troubles digestifs (vomissements / diarrhée)",
    applicability: "Tolérance de petites gorgées régulières de liquide",
    defaultAction: "Proposer fréquemment de petites gorgées de Solution de Réhydratation Orale (SRO) ou d'eau fraîche. Privilégier une alimentation légère (riz, carottes, compote).",
    escalation: [
      "Vomissements incoercibles empêchant toute hydratation depuis plus de 6h",
      "Absence d'urines depuis plus de 8h",
      "Sang dans les selles ou les vomissements",
    ],
    reply: {
      fr: "Consigne médecin hydratation : Donner des petites gorgées d'eau ou de SRO très souvent, alimentation légère.",
      darja: "تعليمات الطبيب للترجيع والكرش: اعطيه يشرب جرعات صغيرة من الماء ومحلول الجفاف بانتظام.",
      arabizi: "Ta3limet tbib lel rja3: a3tih yochrob mgharef sghar ma w SRO b barcha marrat.",
    },
  },
  {
    id: "reconsultation",
    intent: "autre",
    keywords: ["reconsulter", "revenir", "contrôle", "controle", "rendez-vous", "48h", "72h", "3 jours", "trois jours", "deux jours"],
    title: "Délai de reconsultation et surveillance",
    applicability: "Surveillance normale de la réponse au traitement prescrit",
    defaultAction: "Surveiller l'évolution des symptômes. Reprendre rendez-vous après 48 à 72 heures si l'état ne s'améliore pas franchement avec le traitement.",
    escalation: [
      "Aggravation rapide avant le délai de contrôle",
      "Apparition de tout nouveau signe d'alerte",
    ],
    reply: {
      fr: "Consigne de suivi : Reconsulter après 48 à 72h si l'état ne s'améliore pas franchement.",
      darja: "تعليمات الطبيب للمتابعة: إذا ما فماش تحسن بعد 48 لـ 72 ساعة عاود ارجع للطبيب.",
      arabizi: "Ta3limet tbib lel suivi: ken ma thamech ta7asson ba3d 48 l 72h 3awed chouf etbib.",
    },
  },
];

// --- Clinical Clause Segmentation & Classification Helpers ---

const ACTION_VERBS_REGEX = /(?:donner|administrer|prendre|poursuivre|continuer|hydrater|faire|mettre|boire|appliquer|a3tih|kammel|ochrob|découvrir|fractionner|surveiller|laver|nettoyer|moucher|surélever|aghsellou|garder|ne\s+pas\s+(?:doubler|donner|forcer))/i;

const DIAGNOSTIC_MARKERS_REGEX = /(?:présente|diagnostic|examen|auscultation|constat|consultation\s+pour|a\s+été\s+vu|infection|angine\s+rouge|rhinopharyngite|bronchite|otite\s+moyenne|souffle\s+cardiaque|3andou\s+sder|mridh\s+b)/i;

const RED_FLAG_MARKERS_REGEX = /(?:(?:aller|rendre|partir)\s+(?:immédiatement\s+)?(?:aux\s+)?urgences?|urgences?\s+(?:si|directement)|signes?\s+d'alerte|consulter\s+(?:immédiatement|d'urgence)|attention\s+si|ilzem\s+yemchi\s+lil\s+urgences?|emchi\s+(?:toul\s+)?l(?:il)?\s+urgences?|hezzou\s+toul\s+lel\s+urgences?|rod\s+belek\s+ken|appeler\s+le\s+190|détresse\s+respiratoire|convulsion|cyanose|bleu|bave\s+excessive)/i;

function splitClinicalTranscript(transcript: string): string[] {
  const text = transcript.trim();
  if (!text) return [];

  const normalized = text.replace(/[\r\n]+/g, ". ");

  const markers = [
    "(?:et\\s+|ou\\s+|w\\s+)?pour\\s+(?:la|le|les|l')",
    "(?:et\\s+|ou\\s+|w\\s+)?concernant(?:\\s+(?:la|le|les|l'))?",
    "(?:et\\s+|ou\\s+|w\\s+)?quant\\s+à",
    "(?:et\\s+|ou\\s+|w\\s+)?en\\s+cas\\s+de",
    "(?:et\\s+|ou\\s+|w\\s+)?s'il\\s+(?:refuse|y\\s+a|vomit)",
    "(?:et\\s+|ou\\s+|w\\s+)?bel\\s+nesba\\s+(?:l|li|lel)",
    "(?:et\\s+|ou\\s+|w\\s+)?lel\\s+(?:skhana|ko7a|gorge|sder|khachm)",
    "(?:et\\s+|ou\\s+|w\\s+)?nettoyer\\s+le\\s+nez",
    "(?:et\\s+|ou\\s+|w\\s+)?aghsellou\\s+khachmou",
    "(?:et\\s+|ou\\s+|w\\s+)?lavage\\s+(?:du\\s+)?nez",
    "(?:et\\s+|ou\\s+|w\\s+)?toilette\\s+nasale",
    "(?:et\\s+|ou\\s+|w\\s+)?attention\\s+si",
    "(?:et\\s+|ou\\s+|w\\s+)?rod\\s+belek",
    "(?:et\\s+|ou\\s+|w\\s+)?signes?\\s+d'alerte",
    "(?:et\\s+|ou\\s+|w\\s+)?urgences?\\s+si",
    "(?:et\\s+|ou\\s+|w\\s+)?aller\\s+(?:immédiatement\\s+)?aux\\s+urgences",
    "(?:et\\s+|ou\\s+|w\\s+)?hezzou\\s+toul\\s+lel\\s+urgences?",
  ];

  const markerRegex = new RegExp(`\\b(${markers.join("|")})`, "gi");
  const delimited = normalized.replace(markerRegex, " <<<SPLIT>>> $1");

  const rawClauses = delimited.split(/(?:[\.\;\!]+|\s*<<<SPLIT>>>\s*)/);

  return rawClauses
    .map((c) => c.trim().replace(/^(?:et|ou|w|de plus|d'autre part)\s+/i, "").trim())
    .filter((c) => c.length > 6);
}

function isEmergencyReferral(text: string): boolean {
  return /(?:(?:vers|aux)\s+l'?urgences?|urgences?\s+(?:si|directement)|appeler\s+le\s+190|samu|immédiatement\s+aux\s+urgences|ilzem\s+yemchi\s+lil\s+urgences|hezzou\s+toul\s+lel\s+urgences?|orient[ée]es?\s+directement\s+vers\s+l'urgence)/i.test(
    text
  );
}

function isDiagnosticClause(clause: string): boolean {
  return DIAGNOSTIC_MARKERS_REGEX.test(clause) && !ACTION_VERBS_REGEX.test(clause);
}

function isRedFlagClause(clause: string): boolean {
  return RED_FLAG_MARKERS_REGEX.test(clause);
}

function cleanPermittedAction(clause: string): string {
  const match = ACTION_VERBS_REGEX.exec(clause);
  if (match && match.index > 0) {
    const cleaned = clause.slice(match.index).trim();
    if (cleaned.length > 8) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }
  return clause;
}

/**
 * Extracts ALL distinct clinical situations from a physician dictation or vocal transcript.
 * Accurately separates diagnostic background from home-care actions, and isolates red-flag emergency situations.
 */
export function extractAllInstructionsFromTranscript(
  transcript: string,
  consultationId: string,
  diagnosis: string
): Instruction[] {
  let clean = transcript.trim();
  if (!clean) return [];

  // ASR Acoustic Normalization for common Whisper errors in medical dictation
  clean = clean
    .replace(/\bdouleur\s+de\s+gauche\b/gi, "douleur de gorge")
    .replace(/\bde\s+gauche\b/gi, "de gorge")
    .replace(/\bfévre\b/gi, "fièvre")
    .replace(/\bhongi\b/gi, "angine")
    .replace(/\bantiobique\b/gi, "antibiotique");

  const instructions: Instruction[] = [];
  const seenIds = new Set<string>();

  // --- Step 1: Detect and Extract Alert / Emergency Situation ---
  const alertRegex = /(?:(?:aller|rendre|partir)\s+(?:immédiatement\s+)?(?:aux\s+)?urgences?|urgences?\s+(?:si|directement)|signes?\s+d'alerte|consulter\s+(?:immédiatement|d'urgence)|attention\s+si|ilzem\s+yemchi\s+lil\s+urgences?|emchi\s+(?:toul\s+)?l(?:il)?\s+urgences?|hezzou\s+toul\s+lel\s+urgences?|rod\s+belek\s+ken|orient[ée]es?\s+directement\s+vers\s+l'urgence)[^.\n;]+/gi;
  const alertMatches = clean.match(alertRegex);

  let alertClause = "";
  let alertSigns: string[] = [];
  if (alertMatches && alertMatches.length > 0) {
    alertClause = alertMatches[0]?.trim() ?? "";
    const subSigns = alertClause.split(/(?:si\s+|ou\s+s'il\s+|ou\s+|,\s*|\bet\s+|\bw\s+)/i);
    alertSigns = subSigns
      .map((s) => s.trim())
      .filter(
        (s) =>
          s.length > 6 &&
          !/^(?:aller|urgences|consulter|attention|signe|directement|hezzou|emchi|rod|ilzem|orient)/i.test(s)
      );
  }

  // Look for temperature threshold (>= 40°C)
  if (/(?:40|41)\s*(?:°|degr[ée]s?|c)?/i.test(clean) && !alertSigns.some((s) => s.includes("40") || s.includes("41"))) {
    alertSigns.unshift("Fièvre égale ou supérieure à 40°C ou 41°C");
  }

  // Look for respiratory distress
  if (/(?:détresse|essouffl|respiratoire|yetnafes\s+bessif|tirage)/i.test(clean)) {
    if (!alertSigns.some((s) => s.toLowerCase().includes("respiratoire") || s.toLowerCase().includes("souffle"))) {
      alertSigns.push("Difficulté respiratoire ou essoufflement marqué");
    }
  }

  // Look for swallowing difficulty
  if (/(?:avaler|salive|bave)/i.test(clean)) {
    if (!alertSigns.some((s) => s.toLowerCase().includes("salive"))) {
      alertSigns.push("Impossibilité d'avaler sa salive avec bave excessive");
    }
  }

  if (alertSigns.length === 0) {
    alertSigns = [
      "Fièvre égale ou supérieure à 40°C ou 41°C",
      "Difficulté respiratoire ou essoufflement marqué",
      "Impossibilité d'avaler sa salive avec bave excessive",
    ];
  }

  // --- Step 2: Check for Explicit Numbered Situation Blocks ---
  const explicitRegex = /(?:(?:Première|Deuxième|Troisième|Quatrième|Cinquième|Sixième|Septième|Huitième|1ère|2ème|3ème|4ème|5ème|Situation\s+(?:1|2|3|4|5|6|7|8|9|10|un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)|Consigne\s+\d+|Cas\s+\d+)\s*(?:situation)?\s*[,:\.\-]?\s*)(.+?)(?=(?:Première|Deuxième|Troisième|Quatrième|Cinquième|Sixième|Situation|Consigne|Cas|$))/gis;
  const explicitMatches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = explicitRegex.exec(clean)) !== null) {
    if (match[1]?.trim()) {
      explicitMatches.push(match[1].trim());
    }
  }

  if (explicitMatches.length >= 2) {
    explicitMatches.forEach((text, idx) => {
      const textClean = text.trim();
      if (isEmergencyReferral(textClean)) {
        alertClause = textClean;
        return;
      }

      const lower = textClean.toLowerCase();
      const matchedRule = CLINICAL_RULES.find((r) => !seenIds.has(r.id) && r.keywords.some((k) => lower.includes(k)));

      const keyId = matchedRule ? matchedRule.id : `explicit_${idx + 1}`;
      if (seenIds.has(keyId)) return;
      seenIds.add(keyId);

      const title = matchedRule ? matchedRule.title : `Consigne spécifique #${idx + 1}`;
      const intent: Intent = matchedRule ? matchedRule.intent : "autre";
      const applicability = matchedRule ? matchedRule.applicability : "Selon les consignes du médecin";
      const escalation = matchedRule ? matchedRule.escalation : alertSigns;
      const cleanAction = cleanPermittedAction(textClean);
      const reply = matchedRule
        ? matchedRule.reply
        : {
            fr: `Consigne validée : ${cleanAction}`,
            darja: `تعليمات الطبيب: ${cleanAction}`,
            arabizi: `Ta3limet tbib: ${cleanAction}`,
          };

      instructions.push({
        id: `INS-${consultationId.slice(-4).toUpperCase()}-${idx + 1}`,
        consultationId,
        intent,
        situation: title,
        applicability,
        permittedAction: cleanAction,
        reply,
        escalation,
        version: 1,
        approvedBy: "DR-DEMO-001",
        approvedAt: "",
        active: false,
        category: "home_instruction",
      });
    });

    // Add alert situation card
    if (alertClause || /signes?\s+d'alerte|urgences|urgence/i.test(clean)) {
      instructions.push({
        id: `INS-${consultationId.slice(-4).toUpperCase()}-${instructions.length + 1}`,
        consultationId,
        intent: "autre",
        situation: "🚨 Signes d'alerte & Recours immédiat aux urgences",
        applicability: "Présence d'au moins un signe de gravité ou détresse vitale",
        permittedAction:
          alertClause ||
          "Se rendre immédiatement au service des urgences le plus proche ou appeler le 190 (SAMU).",
        reply: {
          fr: `⚠️ Alerte médicale urgente : ${alertClause || "Consulter immédiatement les urgences (190)."}`.trim(),
          darja: `⚠️ علامة خطر : التوجه فورا إلى الاستعجالي أو الاتصال بالرقم 190.`,
          arabizi: `⚠️ 3lamet khatar: emchi toul lel urgence wala kallem 190.`,
        },
        escalation: alertSigns,
        version: 1,
        approvedBy: "DR-DEMO-001",
        approvedAt: "",
        active: false,
        category: "red_flag_alert",
      });
    }

    return instructions;
  }

  // --- Step 3: Multi-Stage Intelligent Clause Segmentation & Filtering ---
  const rawClauses = splitClinicalTranscript(clean);

  // 3a. Filter out purely diagnostic context and red flag clauses from home care candidates
  const homeClauses = rawClauses.filter((c) => !isRedFlagClause(c) && !isDiagnosticClause(c));

  // 3b. Prioritize directive action clauses
  const actionClauses = homeClauses.filter((c) => ACTION_VERBS_REGEX.test(c));
  const searchClauses = actionClauses.length > 0 ? actionClauses : homeClauses;

  // 3c. Match topics ensuring 1-to-1 mapping with no duplicate clause assignments
  const usedClauseIndices = new Set<number>();
  CLINICAL_RULES.forEach((rule) => {
    if (seenIds.has(rule.id)) return;

    let matchedIdx: number | null = null;
    for (let idx = 0; idx < searchClauses.length; idx++) {
      if (usedClauseIndices.has(idx)) continue;
      const clauseText = searchClauses[idx];
      if (!clauseText) continue;
      const cLower = clauseText.toLowerCase();
      if (rule.keywords.some((k) => cLower.includes(k))) {
        matchedIdx = idx;
        break;
      }
    }

    if (matchedIdx !== null) {
      usedClauseIndices.add(matchedIdx);
      seenIds.add(rule.id);
      const matchedClause = searchClauses[matchedIdx] ?? "";
      const actionText = cleanPermittedAction(matchedClause);
      const finalAction = actionText.length > 10 ? actionText : rule.defaultAction;
      instructions.push({
        id: `INS-${consultationId.slice(-4).toUpperCase()}-${instructions.length + 1}`,
        consultationId,
        intent: rule.intent,
        situation: rule.title,
        applicability: rule.applicability,
        permittedAction: finalAction,
        reply: {
          fr: `Consigne validée : ${finalAction}`,
          darja: `تعليمات الطبيب: ${finalAction}`,
          arabizi: `Ta3limet tbib: ${finalAction}`,
        },
        escalation: rule.escalation || alertSigns,
        version: 1,
        approvedBy: "DR-DEMO-001",
        approvedAt: "",
        active: false,
        category: "home_instruction",
      });
    }
  });

  // --- Step 4: Add the Dedicated Red Flag Alert Situation Card ---
  const hasEmergencyMarkers =
    Boolean(alertClause) ||
    Boolean(alertMatches) ||
    /(?:urgences?|signes?\s+d'alerte|immédiatement\s+aux\s+urgences|ilzem\s+yemchi|hezzou\s+toul|rod\s+belek)/i.test(clean);

  if (hasEmergencyMarkers) {
    instructions.push({
      id: `INS-${consultationId.slice(-4).toUpperCase()}-${instructions.length + 1}`,
      consultationId,
      intent: "autre",
      situation: "🚨 Signes d'alerte & Recours immédiat aux urgences",
      applicability: "Présence d'au moins un signe de gravité ou détresse vitale",
      permittedAction:
        alertClause ||
        "Se rendre immédiatement au service des urgences le plus proche ou appeler le 190 (SAMU). Ne pas attendre le lendemain.",
      reply: {
        fr: `⚠️ Alerte médicale urgente : ${alertClause || "Se rendre immédiatement aux urgences le plus proche."}`.trim(),
        darja: "⚠️ علامة خطر تستوجب التوجه الفوري إلى قسم الاستعجالي أو الاتصال بالرقم 190.",
        arabizi: "⚠️ 3lamet khatar testawjeb el mchi toul lel urgence wala talab 190.",
      },
      escalation: alertSigns,
      version: 1,
      approvedBy: "DR-DEMO-001",
      approvedAt: "",
      active: false,
      category: "red_flag_alert",
    });
  }

  // Step 5: Fallback if empty
  if (instructions.length === 0) {
    instructions.push({
      id: `INS-${consultationId.slice(-4).toUpperCase()}-1`,
      consultationId,
      intent: "autre",
      situation: `Surveillance clinique pour ${diagnosis || "la consultation"}`,
      applicability: "Selon le diagnostic et l'ordonnance médicale",
      permittedAction:
        clean.length > 20
          ? clean
          : "Poursuivre le traitement prescrit jusqu'au bout, hydrater régulièrement et surveiller l'évolution.",
      reply: {
        fr: "Consigne médecin : Poursuivre le traitement prescrit jusqu'au bout et surveiller l'état général.",
        darja: "تعليمات الطبيب: كمل الدوا كيما كتبلك وحافظ على شرب الماء ومراقبة الحالة.",
        arabizi: "Ta3limet tbib: kammel eddwa w ochrob el ma w thabbet fel 7ala.",
      },
      escalation: alertSigns,
      version: 1,
      approvedBy: "DR-DEMO-001",
      approvedAt: "",
      active: false,
      category: "home_instruction",
    });
  }

  return instructions;
}
