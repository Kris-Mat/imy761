import { PrismaClient, QuestionCategory } from '@prisma/client';

const prisma = new PrismaClient();

const users = [
  {
    username: 'thabo.m', email: 'thabo.mokoena@example.com', firstName: 'Thabo', lastName: 'Mokoena'
  },
  {
    username: 'amahle.d', email: 'amahle.dlamini@example.com', firstName: 'Amahle', lastName: 'Dlamini'
  },
  {
    username: 'sipho.n', email: 'sipho.nkosi@example.com', firstName: 'Sipho', lastName: 'Nkosi'
  },
  {
    username: 'naledi.k', email: 'naledi.khumalo@example.com', firstName: 'Naledi', lastName: 'Khumalo'
  },
  {
    username: 'johan.v', email: 'johan.vandermerwe@example.com', firstName: 'Johan', lastName: 'van der Merwe'
  }
];

// Content transcribed from "Plain App questions + answers.pdf" and
// "Non-Gamified_App_Questions_Answers_Spec.pdf" (the latter added the
// SOIL_FAMILY_CODE question — previously only a typed fill-in table — as a
// proper multiple-choice question, per its Implementation Notes). Munsell
// hue/value/chroma below are approximated onto the single supplied 7.5YR chart
// page (it has no grey/gley page, so the two Rensburg greys are the least
// faithful match available) — this is a display-colour estimate, not part of
// the source content itself.
interface HorizonSeed {
  label: string;
  orderIndex: number;
  colourText: string;
  colourHue: string;
  colourValue: number;
  colourChroma: number;
  characteristics: string[];
}

interface QuestionSeed {
  category: QuestionCategory;
  orderIndex: number;
  prompt: string;
  options: { text: string; isCorrect: boolean; }[];
  // Set only for a horizon-linked colour question — resolved to a real
  // Horizon id in main() once horizons have actually been created, since a
  // nested Prisma write can't cross-reference a sibling nested create within
  // the same call.
  horizonLabel?: string;
}

interface SoilFamilyFieldSeed {
  label: string;
  correctValue: string;
}

interface LevelSeed {
  levelNumber: number;
  title: string;
  description: string;
  farmerName: string;
  scenario: string;
}

interface AchievementSeed {
  title: string;
  description: string;
  criteriaCode: string;
}

// Evaluated by achievement.service.ts after each attempt — criteriaCode is
// the stable key it matches on. criteriaCode has no @unique constraint in
// the schema, so these are upserted by a find-then-write below rather than
// a real prisma upsert().
const achievements: AchievementSeed[] = [
  {
    title: 'First Steps',
    description: 'Submit your very first attempt.',
    criteriaCode: 'FIRST_ATTEMPT'
  },
  {
    title: 'Perfect Harvest',
    description: 'Score 100% on any level.',
    criteriaCode: 'PERFECT_LEVEL'
  },
  {
    title: 'Rising Rank',
    description: 'Advance to a new level.',
    criteriaCode: 'LEVEL_UP'
  },
  {
    title: 'First Try Farmer',
    description: 'Pass a level without retrying a single question.',
    criteriaCode: 'NO_RETRY_PASS'
  },
  {
    title: 'Master Farmer',
    description: 'Complete every level.',
    criteriaCode: 'MASTER_FARMER'
  }
];

// Students build a Soil Family Code one digit at a time by dragging the
// correct number (0-4) into place — see the "Step 1/Step 2" tables in
// Gamified_App_Questions___Answers.docx / Plain_App_questions___answers.docx
// — so each digit position is its own graded question rather than one
// whole-code multiple-choice question.
const DIGIT_OPTIONS = ['0', '1', '2', '3', '4'];

// Generated directly from a monolith's own SoilFamilyField list (label +
// correctValue), never hand-typed, so the digit questions can't drift from
// the family-code data seeded alongside them — same fields array is passed
// to both.
function soilFamilyDigitQuestions(fields: SoilFamilyFieldSeed[]): Omit<QuestionSeed, 'orderIndex'>[] {
  return fields.map((field) => ({
    category: QuestionCategory.SOIL_FAMILY_CODE,
    prompt: `What is the correct digit for ${field.label}?`,
    options: DIGIT_OPTIONS.map((digit) => ({
      text: digit, isCorrect: digit === field.correctValue
    }))
  }));
}

// Only Hutton and Avalon have a verified 7.5YR chart page for their colours
// — Rensburg's greys are explicitly noted above as the least faithful match
// available, so no graded colour question is generated for them (pass an
// empty horizons array for Rensburg).
//
// Distractors are adjacent chips on that same chart page (±1 value or +1
// chroma step from the real reading), not arbitrary numbers — plausible
// near-misses a student could actually mis-read the chart as. Rotated by
// the horizon's position in its monolith so the correct option isn't always
// in the same slot.
function nearbyMunsellOptions(value: number, chroma: number, rotateBy: number): { text: string; isCorrect: boolean; }[] {
  const points = [
    {
      value, chroma, isCorrect: true
    },
    {
      value: value + 1, chroma, isCorrect: false
    },
    {
      value: value - 1, chroma, isCorrect: false
    },
    {
      value, chroma: chroma + 1, isCorrect: false
    }
  ];
  const offset = rotateBy % points.length;
  const rotated = [...points.slice(offset), ...points.slice(0, offset)];
  return rotated.map((point) => ({
    text: `${point.value}/${point.chroma}`, isCorrect: point.isCorrect
  }));
}

// One DIAGNOSTIC_HORIZONS question per horizon, linked via horizonLabel —
// derived directly from that horizon's own colourValue/colourChroma, same
// "one source of truth" pattern as soilFamilyDigitQuestions above.
function horizonColourQuestions(horizons: HorizonSeed[]): (Omit<QuestionSeed, 'orderIndex'> & { horizonLabel: string; })[] {
  return horizons.map((horizon, index) => ({
    category: QuestionCategory.DIAGNOSTIC_HORIZONS,
    prompt: `What is the correct Munsell value and chroma for ${horizon.label}'s colour?`,
    horizonLabel: horizon.label,
    options: nearbyMunsellOptions(horizon.colourValue, horizon.colourChroma, index)
  }));
}

const CHARACTERISTIC_DISTRACTOR_COUNT = 3;

// One DIAGNOSTIC_HORIZONS single-select question per horizon: "which of
// these is a characteristic of this horizon?" The correct option is the
// horizon's own first listed characteristic; distractors are real
// characteristics of OTHER horizons — never invented text. Preference order
// for where distractors come from: other horizons in the same monolith
// first (keeps the contrast meaningful), falling back to horizons in other
// monoliths (via `allHorizons`) when a monolith's own horizons don't supply
// enough distinct options — Hutton only has 2 horizons, so that fallback is
// expected to trigger there.
//
// A candidate is excluded if it's already been picked, OR if it also
// appears in the TARGET horizon's own characteristics list — even when
// sourced from a different horizon/monolith, reusing that exact text as a
// "wrong" answer would be factually incorrect if it's also genuinely true
// of the horizon being asked about.
function horizonCharacteristicQuestions(
  monolithHorizons: HorizonSeed[],
  allHorizons: HorizonSeed[]
): (Omit<QuestionSeed, 'orderIndex'> & { horizonLabel: string; })[] {
  return monolithHorizons.map((targetHorizon, index) => {
    const correctText = targetHorizon.characteristics[0];
    const distractorTexts: string[] = [];
    const isUsable = (text: string) => !targetHorizon.characteristics.includes(text) && !distractorTexts.includes(text);

    const sameMonolithPool = monolithHorizons
      .filter((horizon) => horizon !== targetHorizon)
      .flatMap((horizon) => horizon.characteristics);
    for (const text of sameMonolithPool) {
      if (distractorTexts.length >= CHARACTERISTIC_DISTRACTOR_COUNT) break;
      if (isUsable(text)) distractorTexts.push(text);
    }

    if (distractorTexts.length < CHARACTERISTIC_DISTRACTOR_COUNT) {
      const otherMonolithPool = allHorizons
        .filter((horizon) => !monolithHorizons.includes(horizon))
        .flatMap((horizon) => horizon.characteristics);
      for (const text of otherMonolithPool) {
        if (distractorTexts.length >= CHARACTERISTIC_DISTRACTOR_COUNT) break;
        if (isUsable(text)) distractorTexts.push(text);
      }
    }

    const points = [
      {
        text: correctText, isCorrect: true
      },
      ...distractorTexts.map((text) => ({
        text, isCorrect: false
      }))
    ];
    const offset = index % points.length;
    const rotated = [...points.slice(offset), ...points.slice(0, offset)];

    return {
      category: QuestionCategory.DIAGNOSTIC_HORIZONS,
      prompt: `Which of these is a characteristic of ${targetHorizon.label}?`,
      horizonLabel: targetHorizon.label,
      options: rotated
    };
  });
}

// Assembles a monolith's full question list in a fixed category order and
// assigns sequential orderIndex across all of them afterward, so orderIndex
// never has to be hand-kept in sync with however many family-code digit or
// horizon-colour/characteristic questions a monolith ends up with.
function buildQuestions(
  diagnosticHorizons: Omit<QuestionSeed, 'orderIndex' | 'category'>,
  horizonColourQuestionSeeds: Omit<QuestionSeed, 'orderIndex'>[],
  horizonCharacteristicQuestionSeeds: Omit<QuestionSeed, 'orderIndex'>[],
  soilForm: Omit<QuestionSeed, 'orderIndex' | 'category'>,
  soilFamilyFields: SoilFamilyFieldSeed[],
  landscapePosition: Omit<QuestionSeed, 'orderIndex' | 'category'>,
  suitability: Omit<QuestionSeed, 'orderIndex' | 'category'>
): QuestionSeed[] {
  const unordered: Omit<QuestionSeed, 'orderIndex'>[] = [
    {
      category: QuestionCategory.DIAGNOSTIC_HORIZONS, ...diagnosticHorizons
    },
    ...horizonColourQuestionSeeds,
    ...horizonCharacteristicQuestionSeeds,
    {
      category: QuestionCategory.SOIL_FORM, ...soilForm
    },
    ...soilFamilyDigitQuestions(soilFamilyFields),
    {
      category: QuestionCategory.LANDSCAPE_POSITION, ...landscapePosition
    },
    {
      category: QuestionCategory.SUITABILITY, ...suitability
    }
  ];
  return unordered.map((question, index) => ({
    ...question, orderIndex: index + 1
  }));
}

interface MonolithSeed {
  name: string;
  imageUrl: string;
  finalSoilForm: string;
  orderIndex: number;
  horizons: HorizonSeed[];
  questions: QuestionSeed[];
  soilFamilyCode: {
    finalCode: string;
    soilFamilyName: string;
    fields: SoilFamilyFieldSeed[];
  };
  // The gamified app's "farm" for this soil profile — one level per
  // soilFamilyCode, numbered to match the plain app's chapter order above.
  level: LevelSeed;
}

// Declared once per monolith and reused for both the SoilFamilyCode.fields
// seed data and the generated digit questions below, so there's exactly one
// place each farm's field labels/values are written.
const huttonFamilyFields: SoilFamilyFieldSeed[] = [
  {
    label: 'Topsoil colour', correctValue: '1'
  },
  {
    label: 'Base status', correctValue: '2'
  },
  {
    label: 'Textural contrast', correctValue: '1'
  },
  {
    label: 'Final family digit', correctValue: '0'
  }
];

const avalonFamilyFields: SoilFamilyFieldSeed[] = [
  {
    label: 'Topsoil colour', correctValue: '2'
  },
  {
    label: 'Base status', correctValue: '1'
  },
  {
    label: 'Texture', correctValue: '3'
  },
  {
    label: 'Final family digit', correctValue: '0'
  }
];

const rensburgFamilyFields: SoilFamilyFieldSeed[] = [
  {
    label: 'Topsoil colour', correctValue: '0'
  },
  {
    label: 'Base status', correctValue: '2'
  },
  {
    label: 'Texture', correctValue: '2'
  },
  {
    label: 'Final family digit', correctValue: '0'
  }
];

// Declared once per monolith and reused for both the Horizon seed data and
// (Hutton/Avalon only) the generated colour questions below.
const huttonHorizons: HorizonSeed[] = [
  {
    label: 'Horizon A',
    orderIndex: 1,
    colourText: 'Dark brown',
    colourHue: '7.5YR',
    colourValue: 3,
    colourChroma: 2,
    characteristics: ['Many roots', 'Granular structure']
  },
  {
    label: 'Horizon B',
    orderIndex: 2,
    colourText: 'Red',
    colourHue: '7.5YR',
    colourValue: 4,
    colourChroma: 6,
    characteristics: ['Apedal', 'Massive appearance', 'Deep profile']
  }
];

const avalonHorizons: HorizonSeed[] = [
  {
    label: 'Horizon A',
    orderIndex: 1,
    colourText: 'Brown',
    colourHue: '7.5YR',
    colourValue: 5,
    colourChroma: 4,
    characteristics: ['Many roots', 'Granular structure']
  },
  {
    label: 'Horizon B',
    orderIndex: 2,
    colourText: 'Yellow-brown',
    colourHue: '7.5YR',
    colourValue: 6,
    colourChroma: 6,
    characteristics: ['Apedal', 'Massive appearance']
  },
  {
    label: 'Horizon C',
    orderIndex: 3,
    colourText: 'Light yellow-brown',
    colourHue: '7.5YR',
    colourValue: 7,
    colourChroma: 4,
    characteristics: ['Soft plinthic horizon', 'Rocky texture', 'Signs of seasonal wetness']
  }
];

// No 7.5YR-chart-verified colour questions for Rensburg — see the file
// header comment: its greys are the least faithful match available.
const rensburgHorizons: HorizonSeed[] = [
  {
    label: 'Horizon A',
    orderIndex: 1,
    colourText: 'Dark grey',
    colourHue: '7.5YR',
    colourValue: 3,
    colourChroma: 0,
    characteristics: ['High clay content', 'Surface cracks']
  },
  {
    label: 'Horizon B',
    orderIndex: 2,
    colourText: 'Grey',
    colourHue: '7.5YR',
    colourValue: 5,
    colourChroma: 0,
    characteristics: ['Gleyed appearance', 'Massive clay structure', 'Poorly drained']
  }
];

// Fallback distractor pool for horizonCharacteristicQuestions when a
// monolith's own horizons don't offer enough distinct characteristics.
const allHorizons: HorizonSeed[] = [...huttonHorizons, ...avalonHorizons, ...rensburgHorizons];

const monoliths: MonolithSeed[] = [
  {
    name: 'Hutton',
    imageUrl: '/monoliths/hutton.png',
    finalSoilForm: 'Hutton',
    orderIndex: 1,
    horizons: huttonHorizons,
    questions: buildQuestions(
      {
        prompt: 'Which diagnostic horizons are present in this soil profile?',
        options: [
          {
            text: 'Orthic A + Red Apedal B', isCorrect: true
          },
          {
            text: 'Orthic A + Yellow-brown Apedal', isCorrect: false
          },
          {
            text: 'Orthic A + Soft Plinthic', isCorrect: false
          }
        ]
      },
      horizonColourQuestions(huttonHorizons),
      horizonCharacteristicQuestions(huttonHorizons, allHorizons),
      {
        prompt: 'Which soil form is represented by this profile?',
        options: [
          {
            text: 'Avalon', isCorrect: false
          },
          {
            text: 'Rensburg', isCorrect: false
          },
          {
            text: 'Hutton', isCorrect: true
          }
        ]
      },
      huttonFamilyFields,
      {
        prompt: 'Where would this soil most likely occur in the landscape?',
        options: [
          {
            text: 'Upper slope', isCorrect: true
          },
          {
            text: 'Mid slope', isCorrect: false
          },
          {
            text: 'Foot slope', isCorrect: false
          }
        ]
      },
      {
        prompt: 'How suitable is this soil for maize production?',
        options: [
          {
            text: 'Highly suitable', isCorrect: true
          },
          {
            text: 'Moderately suitable', isCorrect: false
          },
          {
            text: 'Unsuitable', isCorrect: false
          }
        ]
      }
    ),
    soilFamilyCode: {
      finalCode: '1210',
      soilFamilyName: 'Hutton',
      fields: huttonFamilyFields
    },
    level: {
      levelNumber: 1,
      title: 'Redridge Farm',
      farmerName: 'Pieter Koekemoer',
      description: 'A sprawling maize farm on the upper slopes, where deep red apedal soil drains freely and rarely lets the farmer down.',
      scenario: "Pieter needs your help explaining why his maize yields are so consistent on Redridge Farm's upper slopes. "
        + 'Investigate the horizon profile to confirm the diagnostic horizons, soil form, landscape position, and suitability for maize.'
    }
  },
  {
    name: 'Avalon',
    imageUrl: '/monoliths/avalon.png',
    finalSoilForm: 'Avalon',
    orderIndex: 2,
    horizons: avalonHorizons,
    questions: buildQuestions(
      {
        prompt: 'Which diagnostic horizons are present in this soil profile?',
        options: [
          {
            text: 'Orthic A + Red Apedal B', isCorrect: false
          },
          {
            text: 'Orthic A + Yellow-brown Apedal + Soft Plinthic', isCorrect: true
          },
          {
            text: 'Vertic A + G Horizon', isCorrect: false
          }
        ]
      },
      horizonColourQuestions(avalonHorizons),
      horizonCharacteristicQuestions(avalonHorizons, allHorizons),
      {
        prompt: 'Which soil form is represented by this profile?',
        options: [
          {
            text: 'Hutton', isCorrect: false
          },
          {
            text: 'Avalon', isCorrect: true
          },
          {
            text: 'Rensburg', isCorrect: false
          }
        ]
      },
      avalonFamilyFields,
      {
        prompt: 'Where would this soil most likely occur in the landscape?',
        options: [
          {
            text: 'Upper slope', isCorrect: false
          },
          {
            text: 'Mid slope', isCorrect: false
          },
          {
            text: 'Foot slope', isCorrect: true
          }
        ]
      },
      {
        prompt: 'How suitable is this soil for soybean production?',
        options: [
          {
            text: 'Highly suitable', isCorrect: false
          },
          {
            text: 'Suitable, but monitor seasonal water conditions', isCorrect: true
          },
          {
            text: 'Unsuitable', isCorrect: false
          }
        ]
      }
    ),
    soilFamilyCode: {
      finalCode: '2130',
      soilFamilyName: 'Avalon',
      fields: avalonFamilyFields
    },
    level: {
      levelNumber: 2,
      title: 'Avalon Vale Farm',
      farmerName: 'Nomsa Radebe',
      description: 'A foot-slope soybean farm where a soft plinthic horizon holds onto seasonal moisture a little too well.',
      scenario: "Nomsa has noticed her soybean fields waterlog after the rains. Study Avalon Vale Farm's horizons to identify "
        + 'the soft plinthic layer and advise her on managing the seasonal wetness.'
    }
  },
  {
    name: 'Rensburg',
    imageUrl: '/monoliths/rensburg.png',
    finalSoilForm: 'Rensburg',
    orderIndex: 3,
    horizons: rensburgHorizons,
    questions: buildQuestions(
      {
        prompt: 'Which diagnostic horizons are present in this soil profile?',
        options: [
          {
            text: 'Orthic A + Red Apedal B', isCorrect: false
          },
          {
            text: 'Orthic A + Yellow-brown Apedal', isCorrect: false
          },
          {
            text: 'Vertic A + G Horizon', isCorrect: true
          }
        ]
      },
      [], // no colour questions for Rensburg — see rensburgHorizons above
      horizonCharacteristicQuestions(rensburgHorizons, allHorizons),
      {
        prompt: 'Which soil form is represented by this profile?',
        options: [
          {
            text: 'Hutton', isCorrect: false
          },
          {
            text: 'Avalon', isCorrect: false
          },
          {
            text: 'Rensburg', isCorrect: true
          }
        ]
      },
      rensburgFamilyFields,
      {
        prompt: 'Where would this soil most likely occur in the landscape?',
        options: [
          {
            text: 'Upper slope', isCorrect: false
          },
          {
            text: 'Mid slope', isCorrect: false
          },
          {
            text: 'Foot slope', isCorrect: true
          }
        ]
      },
      {
        prompt: 'How suitable is this soil for pasture production?',
        options: [
          {
            text: 'Highly suitable', isCorrect: false
          },
          {
            text: 'Moderately suitable', isCorrect: false
          },
          {
            text: 'Suitable, but careful management is required because of poor drainage', isCorrect: true
          }
        ]
      }
    ),
    soilFamilyCode: {
      finalCode: '0220',
      soilFamilyName: 'Rensburg',
      fields: rensburgFamilyFields
    },
    level: {
      levelNumber: 3,
      title: 'Rensburg Vlei Farm',
      farmerName: 'Willem Botha',
      description: 'A low-lying pasture farm on heavy, gleyed clay that cracks in the dry season and floods in the wet.',
      scenario: "Willem's cattle pasture struggles with drainage every wet season. Examine Rensburg Vlei Farm's vertic clay "
        + 'horizons to determine why, and whether pasture is still the right choice here.'
    }
  }
];

async function main(): Promise<void> {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user
    });
  }

  // Not reset with the content tables below — earned UserAchievement rows
  // reference these by id, so they're kept stable across reseeds instead.
  for (const achievement of achievements) {
    const existing = await prisma.achievementMaster.findFirst({
      where: { criteriaCode: achievement.criteriaCode }
    });
    if (existing) {
      await prisma.achievementMaster.update({
        where: { id: existing.id },
        data: achievement
      });
    } else {
      await prisma.achievementMaster.create({ data: achievement });
    }
  }

  // Content tables are reset and rebuilt on every seed run so re-seeding
  // stays reproducible while this content is still being finalised.
  // userAttempt goes first since it FKs into question (RESTRICT, not
  // CASCADE) — deleting a question with attempts still on it would
  // otherwise fail once the app has actually been played against. Backfilled
  // via UserService.ensureGameStat on the next /users/sync after this wipes
  // userGameStat and userAttempt.
  await prisma.userAttempt.deleteMany();
  await prisma.userGameStat.deleteMany();
  await prisma.level.deleteMany();
  await prisma.soilFamilyField.deleteMany();
  await prisma.soilFamilyCode.deleteMany();
  await prisma.answerOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.horizonCharacteristic.deleteMany();
  await prisma.horizon.deleteMany();
  await prisma.monolith.deleteMany();

  for (const monolith of monoliths) {
    // Horizons and soilFamilyCode are still nested creates, but questions
    // are created afterward in a separate loop — a horizon-linked question's
    // horizonId needs the real id Prisma assigns the horizon it references,
    // which isn't available yet while horizons and questions are still
    // sibling nested creates under the same monolith.create() call.
    const createdMonolith = await prisma.monolith.create({
      include: {
        horizons: true, soilFamilyCode: true
      },
      data: {
        name: monolith.name,
        imageUrl: monolith.imageUrl,
        finalSoilForm: monolith.finalSoilForm,
        orderIndex: monolith.orderIndex,
        horizons: {
          create: monolith.horizons.map((horizon) => ({
            label: horizon.label,
            orderIndex: horizon.orderIndex,
            colourText: horizon.colourText,
            colourHue: horizon.colourHue,
            colourValue: horizon.colourValue,
            colourChroma: horizon.colourChroma,
            characteristics: {
              create: horizon.characteristics.map((text, index) => ({
                text, orderIndex: index + 1
              }))
            }
          }))
        },
        soilFamilyCode: {
          create: {
            finalCode: monolith.soilFamilyCode.finalCode,
            soilFamilyName: monolith.soilFamilyCode.soilFamilyName,
            fields: {
              create: monolith.soilFamilyCode.fields.map((field, index) => ({
                label: field.label, correctValue: field.correctValue, orderIndex: index + 1
              }))
            }
          }
        }
      }
    });

    const horizonIdByLabel = new Map(createdMonolith.horizons.map((horizon) => [horizon.label, horizon.id]));

    for (const question of monolith.questions) {
      await prisma.question.create({
        data: {
          category: question.category,
          orderIndex: question.orderIndex,
          prompt: question.prompt,
          monolithId: createdMonolith.id,
          horizonId: question.horizonLabel ? horizonIdByLabel.get(question.horizonLabel) : undefined,
          options: {
            create: question.options.map((option, index) => ({
              text: option.text, isCorrect: option.isCorrect, orderIndex: index + 1
            }))
          }
        }
      });
    }

    await prisma.level.create({
      data: {
        levelNumber: monolith.level.levelNumber,
        title: monolith.level.title,
        description: monolith.level.description,
        farmerName: monolith.level.farmerName,
        scenario: monolith.level.scenario,
        soilFamilyCodeId: createdMonolith.soilFamilyCode!.id
      }
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
