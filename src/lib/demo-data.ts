import type { AuditLog, Consultation, InteractionEvent, Instruction } from "./care-types";

// All identities and conversations are fictitious demo data.

export const DOCTOR = {
  name: "Dr. Amira Ben Salah",
  specialty: "Pédiatre",
  email: "dr.bensalah@3awedhni.tn",
  initials: "AB",
};

export const DEMO_CONSULTATION_ID = "demo-consultation-001";

export const consultations: Consultation[] = [
  {
    id: DEMO_CONSULTATION_ID,
    patientCode: "DEMO-001",
    patientLabel: "Patient DEMO-001",
    age: "6 ans",
    consultedAt: "2026-11-21T10:20:00",
    diagnosis: "Angine (diagnostic posé en consultation)",
    status: "validée",
    secureCode: "3AW-7K2-Q9",
  },
  {
    id: "demo-consultation-002",
    patientCode: "DEMO-002",
    patientLabel: "Patient DEMO-002",
    age: "3 ans",
    consultedAt: "2026-11-21T11:05:00",
    diagnosis: "Rhinopharyngite",
    status: "validée",
    secureCode: "3AW-M4P-X1",
  },
  {
    id: "demo-consultation-003",
    patientCode: "DEMO-003",
    patientLabel: "Patient DEMO-003",
    age: "9 ans",
    consultedAt: "2026-11-21T15:40:00",
    diagnosis: "Gastro-entérite",
    status: "brouillon",
  },
  {
    id: "demo-consultation-004",
    patientCode: "DEMO-004",
    patientLabel: "Patient DEMO-004",
    age: "18 mois",
    consultedAt: "2026-11-20T09:15:00",
    diagnosis: "Otite moyenne",
    status: "révoquée",
  },
];

export const instructions: Instruction[] = [
  {
    id: "INS-001-A",
    consultationId: DEMO_CONSULTATION_ID,
    intent: "gorge",
    situation: "Douleur de gorge persistante",
    applicability:
      "Douleur de gorge sans difficulté respiratoire ni impossibilité d'avaler la salive",
    permittedAction:
      "Rappeler de poursuivre le traitement prescrit jusqu'au bout, proposer des boissons tièdes fréquentes ; reprendre rendez-vous si la douleur persiste après 3 jours de traitement.",
    reply: {
      fr: "D'après les consignes validées par votre médecin : poursuivez le traitement prescrit jusqu'au bout et proposez des boissons tièdes souvent. Si la douleur persiste après 3 jours de traitement, reprenez rendez-vous.",
      darja:
        "حسب التعليمات اللي صادق عليها الطبيب: كمّل الدواء اللي كتبهولو للآخر، وعطيه مشروبات دافية برشا مرات. كان الوجيعة مازالت بعد 3 أيام من الدواء، اعمل موعد جديد.",
      arabizi:
        "7asb et-ta3limet elli sade9 3liha tbib: kammel eddwa elli ktebhoulou lel ekher, w a3tih machroubet dafya barcha marrat. Ken el wji3a mazelet ba3d 3 ayyem mel dwa, a3mel rendez-vous jdid.",
    },
    escalation: [
      "Difficulté respiratoire",
      "Impossibilité d'avaler sa salive",
      "Aggravation importante",
    ],
    version: 2,
    approvedBy: "Dr. Amira Ben Salah",
    approvedAt: "2026-11-21T10:41:00",
    active: true,
  },
  {
    id: "INS-001-B",
    consultationId: DEMO_CONSULTATION_ID,
    intent: "fievre",
    situation: "Fièvre modérée (< 39,5 °C)",
    applicability: "Température déclarée inférieure à 39,5 °C, enfant réactif",
    permittedAction:
      "Donner l'antipyrétique selon l'ordonnance remise, découvrir l'enfant, faire boire ; consulter si la fièvre persiste plus de 48 h.",
    reply: {
      fr: "Selon les consignes de votre médecin : donnez l'antipyrétique exactement comme indiqué sur l'ordonnance, découvrez l'enfant et faites-le boire. Si la fièvre dure plus de 48 h, consultez.",
      darja:
        "حسب تعليمات الطبيب: عطيه دواء السخانة كيف ما مكتوب في الوصفة بالضبط، نحّيلو الحوايج الزايدة وشرّبو. كان السخانة دامت أكثر من 48 ساعة، ارجع للطبيب.",
      arabizi:
        "7asb ta3limet tbib: a3tih dwa skhana kima mektoub fel ordonnance bel dhabt, na77ilou l7wayej ezzayda w charrbou. Ken skhana dammet akther men 48 se3a, arja3 lel tbib.",
    },
    escalation: ["Température ≥ 40 °C", "Enfant très abattu", "Fièvre > 48 h"],
    version: 1,
    approvedBy: "Dr. Amira Ben Salah",
    approvedAt: "2026-11-21T10:41:00",
    active: true,
  },
  {
    id: "INS-001-C",
    consultationId: DEMO_CONSULTATION_ID,
    intent: "alimentation",
    situation: "Refus de manger",
    applicability: "L'enfant boit mais mange peu à cause de la douleur",
    permittedAction:
      "Proposer de petites quantités fréquentes, des aliments mous et frais ; l'hydratation reste prioritaire.",
    reply: {
      fr: "Votre médecin conseille : proposez de petites quantités souvent, des aliments mous et frais. Le plus important est qu'il continue à boire.",
      darja: "الطبيب ينصح: عطيه شوية شوية وبرشا مرات، ماكلة رطبة وباردة. الأهم إنو يكمّل يشرب.",
      arabizi:
        "Tbib yansa7: a3tih chwaya chwaya w barcha marrat, mekla rotba w barda. El aham ennou ykammel yochrob.",
    },
    escalation: ["Refus de boire", "Signes de déshydratation"],
    version: 1,
    approvedBy: "Dr. Amira Ben Salah",
    approvedAt: "2026-11-21T10:41:00",
    active: true,
  },
  {
    id: "INS-001-D",
    consultationId: DEMO_CONSULTATION_ID,
    intent: "oubli",
    situation: "Oubli d'une prise du traitement",
    applicability: "Une seule prise oubliée",
    permittedAction:
      "Ne pas doubler la dose ; reprendre à l'heure habituelle de la prise suivante.",
    reply: {
      fr: "Consigne de votre médecin : ne doublez pas la dose. Donnez la prise suivante à l'heure habituelle.",
      darja: "تعليمات الطبيب: ما تضاعفش الدوز. عطيه الدوز الجاية في وقتها العادي.",
      arabizi: "Ta3limet tbib: ma tdha3efch eddose. A3tih eddose ejjeya fi wa9tha el 3adi.",
    },
    escalation: ["Plusieurs prises oubliées"],
    version: 1,
    approvedBy: "Dr. Amira Ben Salah",
    approvedAt: "2026-11-21T10:41:00",
    active: true,
  },
];

export const alertSigns = [
  "Température ≥ 40 °C chez l'enfant",
  "Difficulté respiratoire",
  "Impossibilité d'avaler sa salive",
  "Altération majeure de l'état général",
];

export const initialEvents: InteractionEvent[] = [
  {
    id: "EVT-1042",
    patientCode: "DEMO-001",
    timestamp: "2026-11-21T22:47:00",
    language: "Arabizi",
    message: "Weldi skhantou 41 w ta3eb barcha",
    summary: "Température ≥ 40 °C chez l'enfant",
    outcome: "urgence",
    needsCallback: true,
  },
  {
    id: "EVT-1041",
    patientCode: "DEMO-001",
    timestamp: "2026-11-21T21:12:00",
    language: "Darja",
    message: "ولدي مازال يشكي من حلقو، شنوة نعمل؟",
    summary: "Douleur de gorge persistante",
    outcome: "transmise",
    instructionId: "INS-001-A",
    instructionVersion: 2,
    needsCallback: false,
  },
  {
    id: "EVT-1040",
    patientCode: "DEMO-002",
    timestamp: "2026-11-21T20:30:00",
    language: "Mixte",
    message: "3andou fièvre 39.7 w ma y7ebbech yekel",
    summary: "Fièvre 39.7 °C — avis médical",
    outcome: "escalade",
    needsCallback: true,
  },
  {
    id: "EVT-1039",
    patientCode: "DEMO-002",
    timestamp: "2026-11-21T19:05:00",
    language: "Français",
    message: "Est-ce qu'il peut aller à l'école demain ?",
    summary: "Situation non couverte",
    outcome: "non_couverte",
    needsCallback: true,
  },
  {
    id: "EVT-1038",
    patientCode: "DEMO-001",
    timestamp: "2026-11-21T18:22:00",
    language: "Arabizi",
    message: "nsit eddwa mta3 sbe7, chna3mel?",
    summary: "Oubli d'une prise du traitement",
    outcome: "transmise",
    instructionId: "INS-001-D",
    instructionVersion: 1,
    needsCallback: false,
  },
  {
    id: "EVT-1037",
    patientCode: "DEMO-004",
    timestamp: "2026-11-21T14:10:00",
    language: "Darja",
    message: "بنتي ما عندهاش السخانة أما تبكي برشا",
    summary: "Situation non couverte",
    outcome: "non_couverte",
    needsCallback: true,
  },
];

export const weeklyActivity = [
  { day: "Lun", transmise: 12, non_couverte: 3, escalade: 2, urgence: 0 },
  { day: "Mar", transmise: 15, non_couverte: 2, escalade: 1, urgence: 1 },
  { day: "Mer", transmise: 9, non_couverte: 4, escalade: 2, urgence: 0 },
  { day: "Jeu", transmise: 18, non_couverte: 2, escalade: 3, urgence: 1 },
  { day: "Ven", transmise: 14, non_couverte: 5, escalade: 1, urgence: 0 },
  { day: "Sam", transmise: 11, non_couverte: 3, escalade: 2, urgence: 2 },
  { day: "Dim", transmise: 6, non_couverte: 2, escalade: 1, urgence: 1 },
];

export const benchmark = [
  { label: "Exactitude extraction (symptômes, °C, négation)", value: 94 },
  { label: "Rappel des signes d'alerte (scénarios préparés)", value: 100 },
  { label: "Réponses traçables à une consigne validée", value: 100 },
  { label: "Refus appropriés si consigne absente", value: 96 },
];

export const initialAudit: AuditLog[] = [
  {
    id: "AUD-311",
    actor: "Assistant 3awedhni",
    resource: "EVT-1042",
    action: "Orientation urgente émise",
    timestamp: "2026-11-21T22:47:04",
  },
  {
    id: "AUD-310",
    actor: "Patient DEMO-001 (représentant)",
    resource: "demo-consultation-001",
    action: "Authentification OTP réussie",
    timestamp: "2026-11-21T22:46:31",
  },
  {
    id: "AUD-309",
    actor: "Dr. Amira Ben Salah",
    resource: "INS-001-A",
    action: "Consigne modifiée → v2 et validée",
    timestamp: "2026-11-21T10:41:00",
  },
  {
    id: "AUD-308",
    actor: "Système",
    resource: "demo-consultation-001",
    action: "Transcription et extraction du brouillon",
    timestamp: "2026-11-21T10:33:12",
  },
  {
    id: "AUD-307",
    actor: "Dr. Amira Ben Salah",
    resource: "demo-consultation-001",
    action: "Audio individuel chargé (1 min 42 s)",
    timestamp: "2026-11-21T10:31:50",
  },
  {
    id: "AUD-306",
    actor: "Inconnu",
    resource: "demo-consultation-002",
    action: "Accès refusé : nom + date de naissance sans 2e facteur",
    timestamp: "2026-11-21T09:58:20",
  },
  {
    id: "AUD-305",
    actor: "Dr. Amira Ben Salah",
    resource: "demo-consultation-004",
    action: "Consultation révoquée",
    timestamp: "2026-11-20T17:02:00",
  },
];

export const demoTranscript = `Patient DEMO-001, né le 14 mars 2020, consultation du 21 novembre 2026. Diagnostic : angine. Traitement déjà prescrit selon l'ordonnance remise aux parents.
Situation un : si la gorge reste douloureuse, poursuivre le traitement jusqu'au bout, boissons tièdes ; si ça persiste après trois jours de traitement, reprendre rendez-vous.
Situation deux : fièvre en dessous de trente-neuf et demi, antipyrétique selon l'ordonnance, découvrir l'enfant, faire boire ; au-delà de quarante-huit heures, consulter.
Situation trois : s'il refuse de manger, petites quantités, aliments mous et frais, l'hydratation d'abord.
Situation quatre : prise oubliée, ne pas doubler.
Signes d'alerte : difficulté à respirer, impossible d'avaler sa salive, fièvre à quarante ou plus, enfant très abattu : urgences directement.`;
