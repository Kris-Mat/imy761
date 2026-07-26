import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// EXISTING DATA
// ---------------------------------------------------------------------------

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

const monoliths = [
  {
    id: 101, name: 'Avalon Monolith A', modelUrl: 'gs://assets/avalon.glb', finalSoilForm: 'Avalon'
  },
  {
    id: 102, name: 'Hutton Monolith A', modelUrl: 'gs://assets/hutton.glb', finalSoilForm: 'Hutton'
  },
  // --- Added for the gamified "hill journey" levels below ---
  // NOTE: modelUrl values are PLACEHOLDERS. Replace with real digitised
  // 3D monolith assets once those farms/soil forms have been scanned.
  {
    id: 103, name: 'Mispah Monolith A', modelUrl: 'gs://assets/PLACEHOLDER-mispah.glb', finalSoilForm: 'Mispah'
  },
  {
    id: 104, name: 'Glenrosa Monolith A', modelUrl: 'gs://assets/PLACEHOLDER-glenrosa.glb', finalSoilForm: 'Glenrosa'
  },
  {
    id: 105, name: 'Clovelly Monolith A', modelUrl: 'gs://assets/PLACEHOLDER-clovelly.glb', finalSoilForm: 'Clovelly'
  },
  {
    id: 106, name: 'Bainsvlei Monolith A', modelUrl: 'gs://assets/PLACEHOLDER-bainsvlei.glb', finalSoilForm: 'Bainsvlei'
  },
  {
    id: 107, name: 'Estcourt Monolith A', modelUrl: 'gs://assets/PLACEHOLDER-estcourt.glb', finalSoilForm: 'Estcourt'
  },
  {
    id: 108, name: 'Fernwood Monolith A', modelUrl: 'gs://assets/PLACEHOLDER-fernwood.glb', finalSoilForm: 'Fernwood'
  }
];

// ---------------------------------------------------------------------------
// FARMS ("hill journey" locations)
// Ordered as a hydrological catena (toposequence) from hilltop to valley
// floor, which is how these soil forms are actually taught to relate to one
// another in the source material and in SA soil classification generally.
// Each farm's description draws on facts the theory document states about
// that named soil form; Clovelly's is the most lightly grounded, since the
// document only mentions it in passing (as a comparison, not a profile).
// ---------------------------------------------------------------------------

const farms = [
  {
    id: 1,
    name: 'The Rocky Outcrop',
    farmerName: 'Farmer Sarel Botha',
    description: 'Shallow, rocky soils at the top of the hill where hard rock lies close to the surface - a Mispah profile, with orthic topsoil sitting directly on unweathered rock.',
    monolithId: 103
  },
  {
    id: 2,
    name: 'The Weathering Slope',
    farmerName: 'Farmer Palesa Mahlangu',
    description: 'Partly-weathered rock horizons just below the hilltop, where soil is beginning to form - a Glenrosa profile, with orthic topsoil over a lithic horizon of weathering rock.',
    monolithId: 104
  },
  {
    id: 3,
    name: 'The Red Loam Fields',
    farmerName: 'Farmer Johan Pretorius',
    description: 'A deep, freely-drained red soil popular for dryland and irrigated cropping - a Hutton profile, with orthic topsoil over a red apedal horizon.',
    monolithId: 102
  },
  {
    id: 4,
    name: 'The Yellow Fields',
    farmerName: 'Farmer Nomvula Zulu',
    description: 'A yellow-brown counterpart to the red loam soils, similarly deep and well drained - a Clovelly profile, with orthic topsoil over a yellow-brown apedal horizon lacking luvic character.',
    monolithId: 105
  },
  {
    id: 5,
    name: 'The Water Table Farm',
    farmerName: 'Farmer Kagiso Mokoena',
    description: 'A deep soil with a soft plinthic horizon that stores water for use in dry periods - a Bainsvlei profile, prized in the semi-arid western Free State as a "water table soil".',
    monolithId: 106
  },
  {
    id: 6,
    name: 'The Luvic Water Table Farm',
    farmerName: 'Farmer Anna van Wyk',
    description: 'Similar to the Water Table Farm, but with a textural jump (luvic character) into the plinthic horizon - an Avalon profile.',
    monolithId: 101
  },
  {
    id: 7,
    name: 'The Duplex Footslope',
    farmerName: 'Farmer Bongani Ndlovu',
    description: 'A structured, abruptly-transitioning subsoil that restricts water and root penetration - an Estcourt profile, sometimes showing continuous black cutans on vertical prism faces.',
    monolithId: 107
  },
  {
    id: 8,
    name: 'The Sandy Valley',
    farmerName: 'Farmer Lindiwe Khoza',
    description: 'A leached, sandy valley-floor soil with distinctive banded lamellae in its subsurface horizon - a Fernwood profile.',
    monolithId: 108
  }
];

// ---------------------------------------------------------------------------
// FARM DIALOG LINES
// The sequenced narration that walks a player through each farm's soil
// profile before/around the actual Questions. questionId is left null here
// since no Question rows are seeded yet (they depend on your game design -
// see the note at the end of this file) - once questions exist, later lines
// in each farm's sequence can be pointed at a specific questionId.
// ---------------------------------------------------------------------------

const farmDialogLines = [
  // Farm 1: The Rocky Outcrop (Mispah) -> questions 5 (MUNSELL), 6 (DELINEATION)
  { id: 1, sequence: 1, speaker: 'Farmer Sarel Botha', text: 'Welcome to my hilltop camp! Not much grows here - the soil is thin and rock is never far below.', farmId: 1, questionId: null },
  { id: 2, sequence: 2, speaker: 'Farmer Sarel Botha', text: 'See how the topsoil sits right on hard rock? No weathered layer in between - that\'s what makes this a Mispah.', farmId: 1, questionId: null },
  { id: 3, sequence: 3, speaker: 'Farmer Sarel Botha', text: 'Go on, try matching the Munsell colour of my topsoil - hue, value and chroma.', farmId: 1, questionId: 5 },
  { id: 4, sequence: 4, speaker: 'Farmer Sarel Botha', text: 'Now mark exactly where the topsoil ends and the hard rock begins.', farmId: 1, questionId: 6 },

  // Farm 2: The Weathering Slope (Glenrosa) -> questions 7 (MUNSELL), 8 (DELINEATION)
  { id: 5, sequence: 1, speaker: 'Farmer Palesa Mahlangu', text: 'A little further downhill from Sarel\'s place, and already the rock is starting to break down into soil.', farmId: 2, questionId: null },
  { id: 6, sequence: 2, speaker: 'Farmer Palesa Mahlangu', text: 'Underneath my topsoil is partly-weathered rock, not solid rock like up at the outcrop.', farmId: 2, questionId: null },
  { id: 7, sequence: 3, speaker: 'Farmer Palesa Mahlangu', text: 'Match the Munsell colour of my topsoil for me before we go any deeper.', farmId: 2, questionId: 7 },
  { id: 8, sequence: 4, speaker: 'Farmer Palesa Mahlangu', text: 'Now mark where that topsoil gives way to the weathering rock below.', farmId: 2, questionId: 8 },

  // Farm 3: The Red Loam Fields (Hutton) -> questions 3 (MUNSELL), 4 (DELINEATION)
  { id: 9, sequence: 1, speaker: 'Farmer Johan Pretorius', text: 'Now this is a proper farming soil - deep, red, and easy to work with.', farmId: 3, questionId: null },
  { id: 10, sequence: 2, speaker: 'Farmer Johan Pretorius', text: 'That red colour runs uniform all the way down, with no real structure to speak of.', farmId: 3, questionId: null },
  { id: 11, sequence: 3, speaker: 'Farmer Johan Pretorius', text: 'Match the Munsell colour of that red horizon for me.', farmId: 3, questionId: 3 },
  { id: 12, sequence: 4, speaker: 'Farmer Johan Pretorius', text: 'Now mark where my topsoil ends and the red apedal horizon begins.', farmId: 3, questionId: 4 },

  // Farm 4: The Yellow Fields (Clovelly) -> questions 9 (MUNSELL), 10 (DELINEATION)
  { id: 13, sequence: 1, speaker: 'Farmer Nomvula Zulu', text: 'My fields sit right next to Johan\'s, but you\'ll notice the colour is different.', farmId: 4, questionId: null },
  { id: 14, sequence: 2, speaker: 'Farmer Nomvula Zulu', text: 'Yellow-brown all the way down here, and no sharp jump in clay content either.', farmId: 4, questionId: null },
  { id: 15, sequence: 3, speaker: 'Farmer Nomvula Zulu', text: 'Match the Munsell colour of that yellow-brown horizon for me.', farmId: 4, questionId: 9 },
  { id: 16, sequence: 4, speaker: 'Farmer Nomvula Zulu', text: 'Now mark where my topsoil transitions into that yellow-brown horizon.', farmId: 4, questionId: 10 },

  // Farm 5: The Water Table Farm (Bainsvlei) -> questions 11 (MUNSELL), 12 (DELINEATION)
  { id: 17, sequence: 1, speaker: 'Farmer Kagiso Mokoena', text: 'This is one of our "water table" farms - it holds onto moisture deep down, even in the dry months.', farmId: 5, questionId: null },
  { id: 18, sequence: 2, speaker: 'Farmer Kagiso Mokoena', text: 'Look for the mottled patches lower in the profile - that\'s the plinthic horizon storing water.', farmId: 5, questionId: null },
  { id: 19, sequence: 3, speaker: 'Farmer Kagiso Mokoena', text: 'Match the Munsell colour of that yellow-brown horizon above the mottling.', farmId: 5, questionId: 11 },
  { id: 20, sequence: 4, speaker: 'Farmer Kagiso Mokoena', text: 'Now mark exactly where that horizon gives way to the mottled plinthic layer below.', farmId: 5, questionId: 12 },

  // Farm 6: The Luvic Water Table Farm (Avalon) -> questions 1 (MUNSELL), 2 (DELINEATION)
  { id: 21, sequence: 1, speaker: 'Farmer Anna van Wyk', text: 'My farm looks a lot like Kagiso\'s at first glance, but check the clay content carefully.', farmId: 6, questionId: null },
  { id: 22, sequence: 2, speaker: 'Farmer Anna van Wyk', text: 'There\'s a real jump in clay as you move into the horizon below the topsoil here.', farmId: 6, questionId: null },
  { id: 23, sequence: 3, speaker: 'Farmer Anna van Wyk', text: 'Match the Munsell colour of my topsoil to start us off.', farmId: 6, questionId: 1 },
  { id: 24, sequence: 4, speaker: 'Farmer Anna van Wyk', text: 'Now mark both boundaries: topsoil into the yellow-brown horizon, and that horizon into the plinthic layer.', farmId: 6, questionId: 2 },

  // Farm 7: The Duplex Footslope (Estcourt) -> questions 13 (MUNSELL), 14 (DELINEATION)
  { id: 25, sequence: 1, speaker: 'Farmer Bongani Ndlovu', text: 'Careful with a spade here - the subsoil changes hardness very suddenly.', farmId: 7, questionId: null },
  { id: 26, sequence: 2, speaker: 'Farmer Bongani Ndlovu', text: 'Some parts of my land even show dark coatings on the vertical faces of the soil structure.', farmId: 7, questionId: null },
  { id: 27, sequence: 3, speaker: 'Farmer Bongani Ndlovu', text: 'Match the Munsell colour of my topsoil before you go looking for that hard layer.', farmId: 7, questionId: 13 },
  { id: 28, sequence: 4, speaker: 'Farmer Bongani Ndlovu', text: 'Now mark that abrupt boundary where the topsoil meets the prismacutanic horizon.', farmId: 7, questionId: 14 },

  // Farm 8: The Sandy Valley (Fernwood) -> questions 15 (MUNSELL), 16 (DELINEATION)
  { id: 29, sequence: 1, speaker: 'Farmer Lindiwe Khoza', text: 'You\'ve made it to the bottom of the hill - my soil here is sandy and pale.', farmId: 8, questionId: null },
  { id: 30, sequence: 2, speaker: 'Farmer Lindiwe Khoza', text: 'Look closely below the surface and you\'ll see thin wavy bands running through the sand.', farmId: 8, questionId: null },
  { id: 31, sequence: 3, speaker: 'Farmer Lindiwe Khoza', text: 'Match the Munsell colour of that pale albic horizon for me.', farmId: 8, questionId: 15 },
  { id: 32, sequence: 4, speaker: 'Farmer Lindiwe Khoza', text: 'Now mark the topsoil boundary and trace those wavy lamellae bands you found.', farmId: 8, questionId: 16 }
];

// ---------------------------------------------------------------------------
// LEVELS
// Level is now just the progression wrapper - one level per farm, in the
// same hilltop-to-valley order.
// ---------------------------------------------------------------------------

const levels = [
  { id: 1, levelNumber: 1, farmId: 1 },
  { id: 2, levelNumber: 2, farmId: 2 },
  { id: 3, levelNumber: 3, farmId: 3 },
  { id: 4, levelNumber: 4, farmId: 4 },
  { id: 5, levelNumber: 5, farmId: 5 },
  { id: 6, levelNumber: 6, farmId: 6 },
  { id: 7, levelNumber: 7, farmId: 7 },
  { id: 8, levelNumber: 8, farmId: 8 }
];

// ---------------------------------------------------------------------------
// QUESTIONS
// Two questions per monolith (one MUNSELL, one DELINEATION), grounded in the
// known horizon sequence for each soil form as described in the theory
// document and already reflected in the `farms` descriptions above. These
// are templates describing WHAT to look for - not exact scored answers,
// since real measured Munsell/depth values require actual digitised
// monoliths (not yet available). Expect these to be revised/reseeded once
// real monolith data and final game-design wording are locked in.
// ---------------------------------------------------------------------------

const questions = [
  // Monolith 101: Avalon (orthic / yellow-brown apedal, luvic / soft plinthic)
  { id: 1, category: 'MUNSELL', basePoints: 10, description: 'Identify the Munsell hue, value and chroma of the orthic topsoil horizon in this Avalon profile.', monolithId: 101 },
  { id: 2, category: 'DELINEATION', basePoints: 15, description: 'Mark the boundary where the topsoil transitions into the underlying yellow-brown apedal horizon, then mark where that horizon transitions into the soft plinthic horizon below.', monolithId: 101 },

  // Monolith 102: Hutton (orthic / red apedal)
  { id: 3, category: 'MUNSELL', basePoints: 10, description: 'Identify the Munsell hue, value and chroma of the red apedal horizon in this Hutton profile.', monolithId: 102 },
  { id: 4, category: 'DELINEATION', basePoints: 10, description: 'Mark the boundary where the orthic topsoil transitions into the red apedal horizon.', monolithId: 102 },

  // Monolith 103: Mispah (orthic / hard rock)
  { id: 5, category: 'MUNSELL', basePoints: 10, description: 'Identify the Munsell hue, value and chroma of the orthic topsoil horizon in this Mispah profile.', monolithId: 103 },
  { id: 6, category: 'DELINEATION', basePoints: 10, description: 'Mark the boundary where the topsoil ends and the hard rock horizon begins.', monolithId: 103 },

  // Monolith 104: Glenrosa (orthic / lithic - weathering rock)
  { id: 7, category: 'MUNSELL', basePoints: 10, description: 'Identify the Munsell hue, value and chroma of the orthic topsoil horizon in this Glenrosa profile.', monolithId: 104 },
  { id: 8, category: 'DELINEATION', basePoints: 15, description: 'Mark the boundary where the topsoil transitions into the underlying lithic horizon of weathering rock.', monolithId: 104 },

  // Monolith 105: Clovelly (orthic / yellow-brown apedal, aluvic)
  { id: 9, category: 'MUNSELL', basePoints: 10, description: 'Identify the Munsell hue, value and chroma of the yellow-brown apedal horizon in this Clovelly profile.', monolithId: 105 },
  { id: 10, category: 'DELINEATION', basePoints: 10, description: 'Mark the boundary where the orthic topsoil transitions into the yellow-brown apedal horizon.', monolithId: 105 },

  // Monolith 106: Bainsvlei (orthic / yellow-brown apedal / soft plinthic, non-luvic)
  { id: 11, category: 'MUNSELL', basePoints: 10, description: 'Identify the Munsell hue, value and chroma of the yellow-brown apedal horizon in this Bainsvlei profile.', monolithId: 106 },
  { id: 12, category: 'DELINEATION', basePoints: 15, description: 'Mark the boundary where the yellow-brown apedal horizon transitions into the soft plinthic horizon below.', monolithId: 106 },

  // Monolith 107: Estcourt (orthic / prismacutanic)
  { id: 13, category: 'MUNSELL', basePoints: 10, description: 'Identify the Munsell hue, value and chroma of the orthic topsoil horizon in this Estcourt profile.', monolithId: 107 },
  { id: 14, category: 'DELINEATION', basePoints: 15, description: 'Mark the abrupt boundary where the topsoil transitions into the prismacutanic horizon below.', monolithId: 107 },

  // Monolith 108: Fernwood (orthic / albic with lamellae)
  { id: 15, category: 'MUNSELL', basePoints: 10, description: 'Identify the Munsell hue, value and chroma of the albic horizon in this Fernwood profile.', monolithId: 108 },
  { id: 16, category: 'DELINEATION', basePoints: 15, description: 'Mark the boundary where the topsoil transitions into the albic horizon, then trace the depth range of the first band of lamellae you can find.', monolithId: 108 }
];

// ---------------------------------------------------------------------------
// DIAGNOSTIC HORIZON REFERENCE DATA
// Extracted from: Soil Classification Theory.pdf (Mudaly, GKD 350)
//
// category is either "Topsoil" or "Subsoil" per the source document's own
// grouping. criticalConcepts is pulled from the "Critical concept(s) for
// identification" summary tables at the end of each section.
//
// ecosystem: null means the source material did not provide an ecosystem
// write-up for that horizon (only diagnostic criteria were given) - no
// EcosystemRef row is created for those.
// ---------------------------------------------------------------------------

interface EcosystemSeed {
  naturalEcosystemNotes: string;   // mapped from "Natural ecosystem" notes
  agriculturalNotes: string;        // mapped from "Agricultural ecosystem" notes
  urbanEcosystemNotes: string; // mapped from "Urban ecosystem" notes
}

interface DiagnosticHorizonSeed {
  id: number;
  name: string;
  category: 'Topsoil' | 'Subsoil';
  criticalConcepts: string;
  ecosystem: EcosystemSeed | null;
}

const NA = 'No data recorded for this ecosystem context in the source material.';

const diagnosticHorizons: DiagnosticHorizonSeed[] = [
  // ---- Topsoil horizons ----
  {
    id: 1,
    name: 'Peat',
    category: 'Topsoil',
    criticalConcepts: 'Very high organic carbon; dark; wet.',
    ecosystem: null
  },
  {
    id: 2,
    name: 'Organic',
    category: 'Topsoil',
    criticalConcepts: 'High organic carbon; dark; wet.',
    ecosystem: {
      naturalEcosystemNotes: 'Usually associated with wetland soils; part of wetland ecology supporting diverse flora and fauna.',
      agriculturalNotes: 'Should not be cultivated but may support subsistence farming and grazing.',
      urbanEcosystemNotes: NA
    }
  },
  {
    id: 3,
    name: 'Vertic',
    category: 'Topsoil',
    criticalConcepts: 'Moderate to strong, coarse blocky structure; dark; slickensides; cracks.',
    ecosystem: {
      naturalEcosystemNotes: 'Cracking nature controls water movement and dissolved pollutants; high pH and CEC aid pollution management if carefully managed.',
      agriculturalNotes: 'Inherently very fertile with extreme physical properties; resistant to fertility, chemical and physical degradation; drought sensitive as they dry out faster and deeper than sandy soils.',
      urbanEcosystemNotes: 'Expensive to build on due to shrink-swell movement (to about 1.5 m depth); can lift buildings, fences and pipelines; solutions range from piling to keeping soil consistently moist or dry; useful for dam cores, refuse dump isolation and cricket pitches.'
    }
  },
  {
    id: 4,
    name: 'Melanic',
    category: 'Topsoil',
    criticalConcepts: 'Moderate to strong, blocky structure; dark; slickensides absent.',
    ecosystem: {
      naturalEcosystemNotes: NA,
      agriculturalNotes: 'Inherently very fertile and physically active; resistant to fertility, chemical and physical degradation; drought sensitive.',
      urbanEcosystemNotes: NA
    }
  },
  {
    id: 5,
    name: 'Humic',
    category: 'Topsoil',
    criticalConcepts: 'Dark; carbon-rich; apedal to weak structure; freely drained.',
    ecosystem: {
      naturalEcosystemNotes: 'Provides recharge zones for hillslope seeps and wetlands; very high biological activity results in high organic carbon sequestration.',
      agriculturalNotes: 'Important role in rain-fed agriculture; favourable physical properties; can supply large amounts of nitrogen to crops, but not sustainably.',
      urbanEcosystemNotes: NA
    }
  },
  {
    id: 6,
    name: 'Orthic',
    category: 'Topsoil',
    criticalConcepts: 'None of the other topsoil criteria met; may be dark, chromic or bleached.',
    ecosystem: null
  },

  // ---- Subsoil horizons ----
  {
    id: 7,
    name: 'Gley',
    category: 'Subsoil',
    criticalConcepts: 'Grey colours (blue-grey in sands); luvic character; apedal to weak structure; little mottling; often wet.',
    ecosystem: {
      naturalEcosystemNotes: 'Often the end product of fractured rock soilscape flowpaths, acting as storage that releases water slowly to natural vegetation.',
      agriculturalNotes: 'Occurs in wetlands and should not be disturbed; unsuitable for crop production due to waterlogging; permanent pasture is the best cropping system where cultivated; suitable for irrigated grapes in drier winter-rainfall variants.',
      urbanEcosystemNotes: 'Occurs in wetlands and should not be developed; large urban projects have been halted where sites were found to be wetlands.'
    }
  },
  {
    id: 8,
    name: 'Albic',
    category: 'Subsoil',
    criticalConcepts: 'Grey colours; apedal to weak structure; few mottles (< 10%).',
    ecosystem: {
      naturalEcosystemNotes: 'Serves as a flowpath for downslope water; an important indicator of hydrological response and pollutant fate in the landscape.',
      agriculturalNotes: 'Waterlogged only for short periods, usually not limiting to summer cash crops; prone to compaction and hard-setting when dry; permanent pastures do well as they tolerate waterlogging better.',
      urbanEcosystemNotes: 'Not suitable for urban development; can damage walls and foundations; gardens can become inaccessible when wet; often wetland soils best kept natural.'
    }
  },
  {
    id: 9,
    name: 'Gleyic',
    category: 'Subsoil',
    criticalConcepts: 'Grey colours; moderate to strong structure; grey colour variation on ped exteriors.',
    ecosystem: null
  },
  {
    id: 10,
    name: 'Yellow-Brown Apedal',
    category: 'Subsoil',
    criticalConcepts: 'Uniform yellow and brown colouring; apedal to weak structure; non-calcareous.',
    ecosystem: {
      naturalEcosystemNotes: 'Potential recharge soils releasing excess water to fractured rock; may cause interflow; saturates only for short periods.',
      agriculturalNotes: 'Popular dryland and irrigation soils; freely drained with homogenous bulk density; good root growth and water movement, often improved by deep ripping.',
      urbanEcosystemNotes: 'Good for engineering structures - easy to dig and move, physically inactive and freely drained.'
    }
  },
  {
    id: 11,
    name: 'Red Apedal',
    category: 'Subsoil',
    criticalConcepts: 'Uniform red colouring; apedal to weak structure; non-calcareous.',
    ecosystem: {
      naturalEcosystemNotes: 'Potential recharge soils releasing excess water to the deep subsoil and fractured rock, which may force interflow.',
      agriculturalNotes: 'Popular for dryland cropping and irrigation; good root growth and water holding; sandy variants are compaction sensitive but can be ameliorated with deep ripping.',
      urbanEcosystemNotes: 'Good for engineering structures - easy to dig and move, physically inactive and freely drained.'
    }
  },
  {
    id: 12,
    name: 'Red Structured',
    category: 'Subsoil',
    criticalConcepts: 'Uniform red colouring; moderate to strong structure; red cutans.',
    ecosystem: {
      naturalEcosystemNotes: 'Potential recharge soils releasing excess water to groundwater; water moves freely through them.',
      agriculturalNotes: 'Good for cropping due to high water holding capacity and homogenous bulk density; unlikely to saturate; slightly acid to neutral pH.',
      urbanEcosystemNotes: 'Moderate shrink/swell capacity.'
    }
  },
  {
    id: 13,
    name: 'Soft Plinthic',
    category: 'Subsoil',
    criticalConcepts: 'Accumulation of vesicular Fe/Mn mottles (> 10%); grey colours in or below horizon; apedal to weak structure.',
    ecosystem: {
      naturalEcosystemNotes: 'Indicates a very low degree of groundwater recharge; occurs on flat areas in semi-arid climates and steeper slopes in wetter climates; historically supported temporary water tables under natural vegetation, now more persistent under dryland cropping.',
      agriculturalNotes: 'Good for water storage and not a root hazard, but indicates underlying impeding layers; valuable as drought buffer in semi-arid areas ("water table soils") and prized when occurring between 1-2 m depth.',
      urbanEcosystemNotes: NA
    }
  },
  {
    id: 14,
    name: 'Hard Plinthic',
    category: 'Subsoil',
    criticalConcepts: 'Accumulation of vesicular Fe/Mn mottles; cemented.',
    ecosystem: {
      naturalEcosystemNotes: 'Acts as a storage mechanism rather than a flowpath; subsoil saturation tends to reduce reducible substances like nitrate; rarely forms where water actively moves through the landscape.',
      agriculturalNotes: 'Indicates stored subsoil water and a fluctuating water table; variable permeability; can cause excessive wear on tillage implements.',
      urbanEcosystemNotes: 'May be too wet for development within 0.6 m of the surface, requiring drainage; stable material used in road building where thick enough to excavate.'
    }
  },
  {
    id: 15,
    name: 'Podzol',
    category: 'Subsoil',
    criticalConcepts: 'Enriched with iron and organic matter; commonly dark. Occurs in the Southern Cape.',
    ecosystem: {
      naturalEcosystemNotes: 'An integrated product and control mechanism of the ecosystems where it occurs; its ecosystem function is not well studied despite study of its formation.',
      agriculturalNotes: 'Not cultivated to a large extent.',
      urbanEcosystemNotes: NA
    }
  },
  {
    id: 16,
    name: 'Placic Pan',
    category: 'Subsoil',
    criticalConcepts: 'Thin, wavy; dark; occurs in association with podzols. Occurs in the Southern Cape.',
    ecosystem: {
      naturalEcosystemNotes: NA,
      agriculturalNotes: 'Limits root growth; not widely used for agro-ecosystems.',
      urbanEcosystemNotes: NA
    }
  },
  {
    id: 17,
    name: 'Prismacutanic',
    category: 'Subsoil',
    criticalConcepts: 'Structured; vertical prisms; abrupt transition; absence of gleying.',
    ecosystem: {
      naturalEcosystemNotes: 'Related to parent material and topography; Karoo sedimentary parent materials form duplex soils on crests, while genesis on footslopes/toeslopes is linked to soilscape hydrology.',
      agriculturalNotes: 'Not good agricultural soils; limits water and root penetration; natural veld is prone to degradation and needs careful management; black-cutan families show signs of wetness.',
      urbanEcosystemNotes: 'Variable physical activity - sandy or thick-silican variants are physically inactive, clay variants are physically active and dispersive ("sugar clay").'
    }
  },
  {
    id: 18,
    name: 'Pedocutanic',
    category: 'Subsoil',
    criticalConcepts: 'Structured (moderate to strong); absence of gleying.',
    ecosystem: {
      naturalEcosystemNotes: NA,
      agriculturalNotes: 'Relatively poor agricultural soils requiring special cash-crop practices; natural veld is prone to degradation; limits permeability and root penetration to a crop-dependent extent; suitable for some crops under infield rain-water harvesting; dispersive, so should not be ploughed to avoid crusting.',
      urbanEcosystemNotes: NA
    }
  },
  {
    id: 19,
    name: 'Neocutanic',
    category: 'Subsoil',
    criticalConcepts: 'Apedal to weak structure; colour variegation; not gleyed; non-calcareous.',
    ecosystem: {
      naturalEcosystemNotes: 'Behaves like apedal soils in the natural ecosystem.',
      agriculturalNotes: 'Variable suitability for cash crops; some cases of severely affected production under dryland and irrigated conditions with an uncertain cause.',
      urbanEcosystemNotes: 'Behaves like apedal soils in the urban ecosystem.'
    }
  },
  {
    id: 20,
    name: 'Neocarbonate',
    category: 'Subsoil',
    criticalConcepts: 'Calcareous, intimately mixed in the soil matrix; apedal to weak structure; colour variegation; absence of gleying.',
    ecosystem: {
      naturalEcosystemNotes: 'Differs from non-calcareous equivalents mainly in chemical characteristics; implies high pH, pH buffer capacity and high Ca, Mg and often Mn content.',
      agriculturalNotes: 'Plant availability of micronutrients and phosphorus, and nitrogen fertilizer reactions, are affected by the CaCO3-related high pH; CaCO3 buffers against acidification.',
      urbanEcosystemNotes: 'Differs from non-calcareous equivalents mainly in chemical characteristics associated with CaCO3.'
    }
  },
  {
    id: 21,
    name: 'Soft Carbonate',
    category: 'Subsoil',
    criticalConcepts: 'Calcareous (carbonate material dominates, often powdery or nodular); absence of gleying; colour variegation.',
    ecosystem: {
      naturalEcosystemNotes: 'CaCO3 buffers against pH change, giving resistance to acid rain and acidifying fertilizers; its distribution indicates landscape flowpaths and water storage positions.',
      agriculturalNotes: 'Stores large amounts of water; used effectively for dryland agriculture, though some saline variants should be avoided.',
      urbanEcosystemNotes: 'Very stable urban soils.'
    }
  },
  {
    id: 22,
    name: 'Hard Carbonate',
    category: 'Subsoil',
    criticalConcepts: 'Cemented calcareous layer; usually hard to very hard; little soil present. Occurs in semi-arid to arid areas.',
    ecosystem: {
      naturalEcosystemNotes: 'CaCO3 buffers against pH change and its distribution indicates flowpaths and storage positions in landscape hydrology.',
      agriculturalNotes: 'Limits plant roots and water movement; limits drainage of excess water in irrigation schemes.',
      urbanEcosystemNotes: 'Very stable urban soils.'
    }
  },
  {
    id: 23,
    name: 'Gypsic',
    category: 'Subsoil',
    criticalConcepts: 'Powdery or crystalline gypsum accumulation (>= 5% gypsum); may be cemented.',
    ecosystem: null
  },
  {
    id: 24,
    name: 'Dorbank',
    category: 'Subsoil',
    criticalConcepts: 'Cemented siliceous layer; usually hard to very hard; little soil present. Occurs in arid areas.',
    ecosystem: {
      naturalEcosystemNotes: NA,
      agriculturalNotes: 'A limitation to plant roots and water movement.',
      urbanEcosystemNotes: NA
    }
  },
  {
    id: 25,
    name: 'Alluvial',
    category: 'Subsoil',
    criticalConcepts: 'Unconsolidated; apedal to weak structure; usually has fine stratifications; may contain wetness. Often in low-lying areas.',
    ecosystem: {
      naturalEcosystemNotes: 'Forms the riparian zone of a river with specific vegetation; draws water from both the river and the wider soilscape, and may consume large amounts of water.',
      agriculturalNotes: 'Naturally fertile due to topsoil origins; some vineyards grow without added fertilizer; layering limits root growth and should be treated before planting perennial crops.',
      urbanEcosystemNotes: NA
    }
  },
  {
    id: 26,
    name: 'Unconsolidated Material with Wetness',
    category: 'Subsoil',
    criticalConcepts: 'Unconsolidated; apedal to weak structure; irregular texture variations; gleyed.',
    ecosystem: null
  },
  {
    id: 27,
    name: 'Regic Sand',
    category: 'Subsoil',
    criticalConcepts: 'Recent aeolian deposit; sandy; little or no structure; usually grey to red colours. Dunes may occur.',
    ecosystem: {
      naturalEcosystemNotes: 'Typical of deserts where it dominates the soilscape; wet at depth, indicating recharge is dominant once water escapes the surface evaporation zone.',
      agriculturalNotes: 'Can be irrigated, but profile-available water is low and infiltration rates may be too fast.',
      urbanEcosystemNotes: NA
    }
  },
  {
    id: 28,
    name: 'Lithic',
    category: 'Subsoil',
    criticalConcepts: 'Dominantly weathering rock material; some soil will be present.',
    ecosystem: {
      naturalEcosystemNotes: 'A true lithic soil with soil penetrating fractured rock is indicative of groundwater recharge, with some fractured-rock interflow expected.',
      agriculturalNotes: 'A poor growth medium; used for perennial crops under irrigation in the winter-rainfall region; soft families can be improved with deep ripping; not used for cropping in summer-rainfall regions.',
      urbanEcosystemNotes: 'Good foundations for engineering structures.'
    }
  },
  {
    id: 29,
    name: 'Hard Rock',
    category: 'Subsoil',
    criticalConcepts: 'Rock material; no soil; may be fractured or solid.',
    ecosystem: {
      naturalEcosystemNotes: 'Restricts water movement; where it occurs under an orthic topsoil on near-level slopes, the topsoil is bleached due to periodic saturation.',
      agriculturalNotes: 'A limitation to plant roots and water movement.',
      urbanEcosystemNotes: 'Not a good urban substratum; very stable but expensive to trench for services or build streets on, due to limited fill material.'
    }
  }
];

// ---------------------------------------------------------------------------
// SEEDING LOGIC
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user
    });
  }

  for (const monolith of monoliths) {
    await prisma.monolith.upsert({
      where: { id: monolith.id },
      update: {},
      create: monolith
    });
  }

  for (const question of questions) {
    await prisma.question.upsert({
      where: { id: question.id },
      update: {},
      create: {
        id: question.id,
        category: question.category as 'MUNSELL' | 'DELINEATION',
        basePoints: question.basePoints,
        description: question.description,
        monolithId: question.monolithId
      }
    });
  }

  for (const farm of farms) {
    await prisma.farm.upsert({
      where: { id: farm.id },
      update: {},
      create: {
        id: farm.id,
        name: farm.name,
        farmerName: farm.farmerName,
        description: farm.description,
        monolithId: farm.monolithId
      }
    });
  }

  for (const line of farmDialogLines) {
    await prisma.farmDialogLine.upsert({
      where: { id: line.id },
      update: {},
      create: {
        id: line.id,
        sequence: line.sequence,
        speaker: line.speaker,
        text: line.text,
        farmId: line.farmId,
        questionId: line.questionId ?? undefined
      }
    });
  }

  for (const level of levels) {
    await prisma.level.upsert({
      where: { id: level.id },
      update: {},
      create: {
        id: level.id,
        levelNumber: level.levelNumber,
        farmId: level.farmId
      }
    });
  }

  for (const horizon of diagnosticHorizons) {
    await prisma.diagnosticHorizonRef.upsert({
      where: { id: horizon.id },
      update: {},
      create: {
        id: horizon.id,
        name: horizon.name,
        category: horizon.category,
        criticalConcepts: horizon.criticalConcepts
      }
    });

    if (horizon.ecosystem) {
      await prisma.ecosystemRef.upsert({
        // Using the same id as the diagnostic horizon since this dataset is 1:1.
        // If you later add multiple EcosystemRef rows per horizon, switch to a
        // findFirst + create pattern instead of upsert-by-id.
        where: { id: horizon.id },
        update: {},
        create: {
          id: horizon.id,
          naturalEcosystemNotes: horizon.ecosystem.naturalEcosystemNotes,
          agriculturalNotes: horizon.ecosystem.agriculturalNotes,
          urbanEcosystemNotes: horizon.ecosystem.urbanEcosystemNotes,
          diagRefId: horizon.id
        }
      });
    }
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
