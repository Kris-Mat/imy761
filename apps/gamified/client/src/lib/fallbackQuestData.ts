import type { FarmProgress } from '@shared/api/models/farm.model';
import type { Monolith } from '@shared/api/models/monolith.model';

// Dev-only stand-in for real backend data, used when the local server is
// unreachable/broken. Only ever consulted behind `import.meta.env.DEV`
// checks in UserContext/useMonoliths — never touches production behaviour.
// IDs are negative so they can never collide with real (positive) database
// ids, and are shared consistently between the two exports below so a farm
// here always has a matching monolith to open.

function soilStripImage(colors: [string, string, string]) {
  const bandHeight = 100 / colors.length;
  const bands = colors
    .map((color, i) => `<rect x="0" y="${i * bandHeight}" width="100" height="${bandHeight}" fill="${color}" />`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150">${bands}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const FALLBACK_FARMS: FarmProgress[] = [
  {
    id: -1, name: 'Redridge Farm', farmerName: 'Pieter Koekemoer', orderIndex: 1, visited: true, completed: true, scorePercent: 82, questions: []
  },
  {
    id: -2, name: 'Green Valley Farm', farmerName: 'Nomsa Radebe', orderIndex: 2, visited: false, completed: false, scorePercent: null, questions: []
  },
  {
    id: -3, name: 'Sunrise Farm', farmerName: 'Willem Botha', orderIndex: 3, visited: false, completed: false, scorePercent: null, questions: []
  }
];

export const FALLBACK_MONOLITHS: Monolith[] = [
  {
    id: -101,
    name: 'Redridge Farm',
    imageUrl: soilStripImage(['#8a5a3c', '#a97155', '#c9a06b']),
    finalSoilForm: 'Hutton',
    orderIndex: 1,
    soilFamilyCode: null,
    horizons: [
      {
        id: -1101,
        label: 'Topsoil',
        orderIndex: 0,
        colourText: 'Dark reddish brown',
        colourHue: '5YR',
        colourValue: 3,
        colourChroma: 3,
        characteristics: [
          {
            id: -11101, text: 'Loose, crumbly structure', orderIndex: 0
          },
          {
            id: -11102, text: 'High organic matter content', orderIndex: 1
          }
        ]
      },
      {
        id: -1102,
        label: 'Subsoil',
        orderIndex: 1,
        colourText: 'Reddish brown',
        colourHue: '2.5YR',
        colourValue: 4,
        colourChroma: 6,
        characteristics: [
          {
            id: -11103, text: 'Well-drained, no mottling', orderIndex: 0
          }
        ]
      }
    ],
    questions: [
      {
        id: -1201,
        category: 'DIAGNOSTIC_HORIZONS',
        orderIndex: 0,
        prompt: 'Which horizon shows the highest organic matter content?',
        options: [
          {
            id: -12011, text: 'Topsoil', isCorrect: true, orderIndex: 0
          },
          {
            id: -12012, text: 'Subsoil', isCorrect: false, orderIndex: 1
          }
        ]
      },
      {
        id: -1202,
        category: 'SUITABILITY',
        orderIndex: 1,
        prompt: 'Given the well-drained subsoil, is this profile suitable for deep-rooted crops?',
        options: [
          {
            id: -12021, text: 'Yes, drainage is not limiting', isCorrect: true, orderIndex: 0
          },
          {
            id: -12022, text: 'No, waterlogging is likely', isCorrect: false, orderIndex: 1
          }
        ]
      }
    ]
  },
  {
    id: -102,
    name: 'Green Valley Farm',
    imageUrl: soilStripImage(['#6b5b3a', '#8f7a4e', '#b9a86b']),
    finalSoilForm: 'Avalon',
    orderIndex: 2,
    soilFamilyCode: null,
    horizons: [
      {
        id: -1201,
        label: 'Topsoil',
        orderIndex: 0,
        colourText: 'Yellowish brown',
        colourHue: '10YR',
        colourValue: 4,
        colourChroma: 4,
        characteristics: [{
          id: -12101, text: 'Moderate organic matter', orderIndex: 0
        }]
      },
      {
        id: -1202,
        label: 'Subsoil',
        orderIndex: 1,
        colourText: 'Pale yellow with mottles',
        colourHue: '2.5Y',
        colourValue: 6,
        colourChroma: 4,
        characteristics: [{
          id: -12102, text: 'Mottling indicates seasonal waterlogging', orderIndex: 0
        }]
      }
    ],
    questions: [
      {
        id: -1301,
        category: 'SOIL_FORM',
        orderIndex: 0,
        prompt: 'What does mottling in the subsoil most likely indicate?',
        options: [
          {
            id: -13011, text: 'Periodic waterlogging', isCorrect: true, orderIndex: 0
          },
          {
            id: -13012, text: 'High organic matter', isCorrect: false, orderIndex: 1
          }
        ]
      },
      {
        id: -1302,
        category: 'LANDSCAPE_POSITION',
        orderIndex: 1,
        prompt: 'A mottled subsoil like this is most typical of which landscape position?',
        options: [
          {
            id: -13021, text: 'Valley bottom / footslope', isCorrect: true, orderIndex: 0
          },
          {
            id: -13022, text: 'Steep hillcrest', isCorrect: false, orderIndex: 1
          }
        ]
      }
    ]
  },
  {
    id: -103,
    name: 'Sunrise Farm',
    imageUrl: soilStripImage(['#4d4033', '#6b5a45', '#8f7a5c']),
    finalSoilForm: 'Mispah',
    orderIndex: 3,
    soilFamilyCode: null,
    horizons: [
      {
        id: -1301,
        label: 'Topsoil',
        orderIndex: 0,
        colourText: 'Dark greyish brown',
        colourHue: '10YR',
        colourValue: 3,
        colourChroma: 2,
        characteristics: [{
          id: -13101, text: 'Shallow, stony', orderIndex: 0
        }]
      },
      {
        id: -1302,
        label: 'Hard rock',
        orderIndex: 1,
        colourText: 'Grey',
        colourHue: 'N',
        colourValue: 5,
        colourChroma: 0,
        characteristics: [{
          id: -13102, text: 'Unweathered bedrock', orderIndex: 0
        }]
      }
    ],
    questions: [
      {
        id: -1401,
        category: 'DIAGNOSTIC_HORIZONS',
        orderIndex: 0,
        prompt: 'What limits root depth in this profile?',
        options: [
          {
            id: -14011, text: 'Shallow hard rock', isCorrect: true, orderIndex: 0
          },
          {
            id: -14012, text: 'Excess organic matter', isCorrect: false, orderIndex: 1
          }
        ]
      },
      {
        id: -1402,
        category: 'SUITABILITY',
        orderIndex: 1,
        prompt: 'Is this profile suitable for deep-rooted orchard crops?',
        options: [
          {
            id: -14021, text: 'No, effective depth is too shallow', isCorrect: true, orderIndex: 0
          },
          {
            id: -14022, text: 'Yes, depth is not limiting', isCorrect: false, orderIndex: 1
          }
        ]
      }
    ]
  }
];
