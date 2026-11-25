import type { SfxEvent } from '../types/protocol';

export type SfxCategory = 'movement' | 'attacks' | 'impacts' | 'defense' | 'ui';

export interface SfxCatalogEntry {
  readonly id: SfxEvent;
  readonly code: string;
  readonly name: string;
  readonly category: SfxCategory;
  readonly trigger: string;
  readonly synthSummary: string;
  readonly durationMs: number;
}

export interface SfxSequencePreset {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly steps: ReadonlyArray<{ readonly event: SfxEvent; readonly delayMs: number }>;
}

export const SFX_CATEGORIES: ReadonlyArray<{ readonly id: 'all' | SfxCategory; readonly label: string }> = [
  { id: 'all', label: 'All Sounds' },
  { id: 'movement', label: 'Movement' },
  { id: 'attacks', label: 'Attacks' },
  { id: 'impacts', label: 'Impacts' },
  { id: 'defense', label: 'Defense & Grabs' },
  { id: 'ui', label: 'Match & UI' },
];

export const SFX_CATALOG: ReadonlyArray<SfxCatalogEntry> = [
  // Movement & Stage (01-07)
  { id: 'jump', code: '01', name: 'Ground Jump', category: 'movement', trigger: 'First hop or short hop from stage', synthSummary: 'Rising pulse sweep + tight pop', durationMs: 110 },
  { id: 'doubleJump', code: '02', name: 'Air Double Jump', category: 'movement', trigger: 'Second mid-air jump boost', synthSummary: 'Dual harmonic chirp + soft air puff', durationMs: 135 },
  { id: 'tripleJump', code: '03', name: 'Triple Jump Spark', category: 'movement', trigger: 'Final third mid-air recovery hop', synthSummary: '3-note ascending chiptune arpeggio', durationMs: 185 },
  { id: 'wallJump', code: '04', name: 'Wall Kick', category: 'movement', trigger: 'Kicking off a vertical stage wall', synthSummary: 'Crisp scuff noise + sharp spring snap', durationMs: 130 },
  { id: 'land', code: '05', name: 'Stage Landing', category: 'movement', trigger: 'Touching down after a jump or fall', synthSummary: 'Low-pass sub thud + filtered dust tap', durationMs: 95 },
  { id: 'springBounce', code: '06', name: 'Spring Pad Boing', category: 'movement', trigger: 'Launching off a stage spring bumper', synthSummary: 'FM pitch-wobble boing + sparkle tail', durationMs: 280 },
  { id: 'wallCling', code: '07', name: 'Wall Cling Latch', category: 'movement', trigger: 'Catching and sliding along a stage wall', synthSummary: 'Short gritty grip tap + friction hiss', durationMs: 75 },

  // Attacks & Swings (08-13)
  { id: 'whiffLight', code: '08', name: 'Light Swing', category: 'attacks', trigger: 'Jabs, tilts, dash attacks, and aerials', synthSummary: 'Bandpass air swoosh + fast pitch drop', durationMs: 105 },
  { id: 'whiffHeavy', code: '09', name: 'Heavy Smash Swing', category: 'attacks', trigger: 'Forward, up, and down smash cleaves', synthSummary: 'Wide resonant wind cleave + bass body', durationMs: 175 },
  { id: 'smashCharge', code: '10', name: 'Smash Charge Pulse', category: 'attacks', trigger: 'Holding smash attack to build power', synthSummary: 'Shimmering fifth harmonic tension blip', durationMs: 130 },
  { id: 'shoot', code: '11', name: 'Projectile Fire', category: 'attacks', trigger: 'Blasters, fireballs, beams, and bombs', synthSummary: '16-bit resonant laser pew + transient snap', durationMs: 145 },
  { id: 'specialCast', code: '12', name: 'Special Activation', category: 'attacks', trigger: 'Neutral, side, and down special moves', synthSummary: 'Energetic FM power flare + rising tail', durationMs: 190 },
  { id: 'upSpecial', code: '13', name: 'Up-Special Recovery', category: 'attacks', trigger: 'Emergency up-B aerial recovery surge', synthSummary: 'Rocket whoosh + high climbing synth whine', durationMs: 250 },

  // Impacts & Elements (14-20)
  { id: 'hitLight', code: '14', name: 'Light Hit Smack', category: 'impacts', trigger: 'Quick jabs, pummels, and sour-spot hits', synthSummary: 'Snappy slap noise + punchy mid-low knock', durationMs: 115 },
  { id: 'hitMedium', code: '15', name: 'Medium Impact Crack', category: 'impacts', trigger: 'Tilts, strong aerials, and dash hits', synthSummary: 'Layered crunch burst + crisp body thump', durationMs: 155 },
  { id: 'hitHeavy', code: '16', name: 'Heavy Smash Bat', category: 'impacts', trigger: 'High-knockback smashes and finishers', synthSummary: 'Sub-bass boom + explosive crack + star ping', durationMs: 290 },
  { id: 'hitFire', code: '17', name: 'Flame Burst Hit', category: 'impacts', trigger: 'Fire-element attacks and PK Fire', synthSummary: 'Roaring low-mid flame whoosh + ember crackle', durationMs: 245 },
  { id: 'hitElectric', code: '18', name: 'Electric Shock Hit', category: 'impacts', trigger: 'Lightning, Pikachu sparks, and stun hits', synthSummary: 'High-voltage FM buzz + crackling arc snap', durationMs: 265 },
  { id: 'hitIce', code: '19', name: 'Frost Shatter Hit', category: 'impacts', trigger: 'Ice-element specials and PK Freeze', synthSummary: 'Glassy high triangle chime + icy crunch', durationMs: 240 },
  { id: 'meteorBounce', code: '20', name: 'Meteor Stage Bounce', category: 'impacts', trigger: 'Downward spike rebounding off the floor', synthSummary: 'Heavy seismic slam + metallic spring rebound', durationMs: 220 },

  // Defense & Grabs (21-25)
  { id: 'shield', code: '21', name: 'Shield Block', category: 'defense', trigger: 'Absorbing an incoming hit on guard', synthSummary: 'Glass-barrier ping + damped shock thud', durationMs: 130 },
  { id: 'shieldBreak', code: '22', name: 'Shield Shatter', category: 'defense', trigger: 'Guard broken to zero, triggering stun', synthSummary: 'Crystal shatter burst + dizzy descending warble', durationMs: 420 },
  { id: 'armorClang', code: '23', name: 'Super Armor Clang', category: 'defense', trigger: 'Heavy move tanking through an attack', synthSummary: 'Metallic FM anvil ring + dense iron thud', durationMs: 195 },
  { id: 'grab', code: '24', name: 'Grab Clinch', category: 'defense', trigger: 'Catching an opponent in a grab hold', synthSummary: 'Tight double-tap leather clinch + grip lock', durationMs: 110 },
  { id: 'throwLaunch', code: '25', name: 'Throw Sling', category: 'defense', trigger: 'Hurling a grabbed fighter in any direction', synthSummary: 'Rising whip whoosh + heavy release snap', durationMs: 185 },

  // Match Flow & UI (26-32)
  { id: 'ko', code: '26', name: 'Blast Zone KO', category: 'ui', trigger: 'Launching a fighter past the blast lines', synthSummary: 'Deep sub-cannon blast + roaring star trail', durationMs: 560 },
  { id: 'respawn', code: '27', name: 'Angel Platform Respawn', category: 'ui', trigger: 'Returning to the arena with invulnerability', synthSummary: 'Soft ascending triad shimmer chime', durationMs: 260 },
  { id: 'victory', code: '28', name: 'Victory Fanfare', category: 'ui', trigger: 'Winning the match on the final stock', synthSummary: '2-voice arcade brass chord fanfare', durationMs: 760 },
  { id: 'menuTick', code: '29', name: 'Cursor Tick', category: 'ui', trigger: 'Moving across menus, fighters, and options', synthSummary: 'Crisp micro pulse blip', durationMs: 55 },
  { id: 'menuConfirm', code: '30', name: 'Menu Confirm', category: 'ui', trigger: 'Locking in a fighter, stage, or mode', synthSummary: 'Bright two-note major fifth chime', durationMs: 170 },
  { id: 'menuBack', code: '31', name: 'Menu Cancel', category: 'ui', trigger: 'Stepping back or closing a panel', synthSummary: 'Clean descending triangle pip', durationMs: 120 },
  { id: 'eraSwap', code: '32', name: 'Era Bit-Shift', category: 'ui', trigger: 'Hot-swapping NES 8-Bit and SNES/SEGA 16-Bit', synthSummary: 'Cartridge power-switch chord sweep', durationMs: 210 },
];

export const SFX_CATALOG_BY_ID: Readonly<Record<SfxEvent, SfxCatalogEntry>> = SFX_CATALOG.reduce(
  (acc, entry) => {
    acc[entry.id] = entry;
    return acc;
  },
  {} as Record<SfxEvent, SfxCatalogEntry>,
);

export const SFX_COMBO_SEQUENCES: ReadonlyArray<SfxSequencePreset> = [
  {
    id: 'combo-ko',
    label: 'Smash Finisher',
    description: 'Charge, heavy cleave, home-run impact, and blast KO',
    steps: [
      { event: 'smashCharge', delayMs: 0 },
      { event: 'smashCharge', delayMs: 160 },
      { event: 'whiffHeavy', delayMs: 320 },
      { event: 'hitHeavy', delayMs: 390 },
      { event: 'ko', delayMs: 680 },
    ],
  },
  {
    id: 'shield-punish',
    label: 'Shield Break',
    description: 'Two blocked hits, crystal shatter, and throw launch',
    steps: [
      { event: 'whiffLight', delayMs: 0 },
      { event: 'shield', delayMs: 55 },
      { event: 'whiffHeavy', delayMs: 230 },
      { event: 'shieldBreak', delayMs: 295 },
      { event: 'grab', delayMs: 760 },
      { event: 'throwLaunch', delayMs: 930 },
    ],
  },
  {
    id: 'elemental-rush',
    label: 'Elemental Rush',
    description: 'Special cast into Fire, Electric, and Ice impacts',
    steps: [
      { event: 'specialCast', delayMs: 0 },
      { event: 'hitFire', delayMs: 170 },
      { event: 'hitElectric', delayMs: 420 },
      { event: 'hitIce', delayMs: 690 },
    ],
  },
  {
    id: 'recovery-tech',
    label: 'Stage Recovery',
    description: 'Wall cling, wall kick, triple jump, spring, and land',
    steps: [
      { event: 'wallCling', delayMs: 0 },
      { event: 'wallJump', delayMs: 140 },
      { event: 'tripleJump', delayMs: 320 },
      { event: 'springBounce', delayMs: 540 },
      { event: 'land', delayMs: 840 },
    ],
  },
];
