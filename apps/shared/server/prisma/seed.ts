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

// Content transcribed exactly from "Plain App questions + answers.pdf". Munsell
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

const monoliths: MonolithSeed[] = [
  {
    name: 'Hutton',
    imageUrl: '/monoliths/hutton.png',
    finalSoilForm: 'Hutton',
    orderIndex: 1,
    horizons: [
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
    ],
    questions: [
      {
        category: QuestionCategory.DIAGNOSTIC_HORIZONS,
        orderIndex: 1,
        prompt: 'Which diagnostic horizons are present?',
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
      {
        category: QuestionCategory.SOIL_FORM,
        orderIndex: 2,
        prompt: 'Identify the soil form.',
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
      {
        category: QuestionCategory.LANDSCAPE_POSITION,
        orderIndex: 3,
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
        category: QuestionCategory.SUITABILITY,
        orderIndex: 4,
        prompt: 'Is this soil suitable for maize production?',
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
    ],
    soilFamilyCode: {
      finalCode: '1210',
      soilFamilyName: 'Hutton',
      fields: [
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
      ]
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
    horizons: [
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
    ],
    questions: [
      {
        category: QuestionCategory.DIAGNOSTIC_HORIZONS,
        orderIndex: 1,
        prompt: 'Which diagnostic horizons are present?',
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
      {
        category: QuestionCategory.SOIL_FORM,
        orderIndex: 2,
        prompt: 'Identify the soil form.',
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
      {
        category: QuestionCategory.LANDSCAPE_POSITION,
        orderIndex: 3,
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
        category: QuestionCategory.SUITABILITY,
        orderIndex: 4,
        prompt: 'Is this soil suitable for soybean production?',
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
    ],
    soilFamilyCode: {
      finalCode: '2130',
      soilFamilyName: 'Avalon',
      fields: [
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
      ]
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
    horizons: [
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
    ],
    questions: [
      {
        category: QuestionCategory.DIAGNOSTIC_HORIZONS,
        orderIndex: 1,
        prompt: 'Which diagnostic horizons are present?',
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
      {
        category: QuestionCategory.SOIL_FORM,
        orderIndex: 2,
        prompt: 'Identify the soil form.',
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
      {
        category: QuestionCategory.LANDSCAPE_POSITION,
        orderIndex: 3,
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
        category: QuestionCategory.SUITABILITY,
        orderIndex: 4,
        prompt: 'Is this soil suitable for pasture production?',
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
    ],
    soilFamilyCode: {
      finalCode: '0220',
      soilFamilyName: 'Rensburg',
      fields: [
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
      ]
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

  // Content tables are reset and rebuilt on every seed run so re-seeding
  // stays reproducible while this content is still being finalised.
  // userGameStat and level go first since level.soilFamilyCodeId FKs into
  // the soilFamilyCode rows being rebuilt below.
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
    const createdMonolith = await prisma.monolith.create({
      include: { soilFamilyCode: true },
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
        questions: {
          create: monolith.questions.map((question) => ({
            category: question.category,
            orderIndex: question.orderIndex,
            prompt: question.prompt,
            options: {
              create: question.options.map((option, index) => ({
                text: option.text, isCorrect: option.isCorrect, orderIndex: index + 1
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
