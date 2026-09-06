import { MoodOption, ReflectionTemplate } from '../types';

export const MOOD_OPTIONS: MoodOption[] = [
  { id: 'centered', label: 'Centered', color: 'border-emerald-400/40 text-emerald-300 bg-emerald-500/10' },
  { id: 'grateful', label: 'Grateful', color: 'border-amber-400/40 text-amber-300 bg-amber-500/10' },
  { id: 'focused', label: 'Focused', color: 'border-indigo-400/40 text-indigo-300 bg-indigo-500/10' },
  { id: 'anxious', label: 'Anxious / Tense', color: 'border-rose-400/40 text-rose-300 bg-rose-500/10' },
  { id: 'fatigued', label: 'Fatigued', color: 'border-violet-400/40 text-violet-300 bg-violet-500/10' },
  { id: 'energized', label: 'Energized', color: 'border-cyan-400/40 text-cyan-300 bg-cyan-500/10' },
];

export const REFLECTION_TEMPLATES: ReflectionTemplate[] = [
  {
    id: 'evening-winddown',
    name: 'Evening Wind-Down',
    description: 'Decompress, celebrate wins, and set intentions',
    mode: 'reflection',
    defaultTitle: 'Evening Wind-Down & Retrospective',
    tags: ['evening', 'retrospective'],
    content: `### 1. Significant Wins & Grace Moments
- What went surprisingly well today?
- 

### 2. Points of Friction or Cognitive Resistance
- Where did I feel drained, defensive, or reactive?
- 

### 3. Tomorrow's Singular Priority
- What is the one thing that will make tomorrow meaningful?
- `,
  },
  {
    id: 'stoic-reframe',
    name: 'Stoic Reframe',
    description: 'Dichotomy of control & emotional equanimity',
    mode: 'reflection',
    defaultTitle: 'Stoic Perspective Reframe',
    tags: ['mindset', 'stoicism'],
    content: `### The Situation or Friction:
Describe the scenario causing stress or unease:
- 

### What is STRICTLY Within My Control?
(My judgements, actions, emotional responses, words)
- 

### What is OUTSIDE My Direct Control?
(Other people's reactions, outcomes, unforeseen delays)
- 

### Where Will I Direct My Next Action?
- `,
  },
  {
    id: 'rose-thorn-bud',
    name: 'Rose, Thorn & Bud',
    description: 'Classic framework for holistic awareness',
    mode: 'reflection',
    defaultTitle: 'Rose, Thorn & Bud Reflection',
    tags: ['clarity', 'growth'],
    content: `### 🌹 The Rose (A Highlight, Joy, or Success)
- 

### 🌵 The Thorn (A Challenge, Pain Point, or Setback)
- 

### 🌱 The Bud (A Spark of Potential, Opportunity, or Idea)
- `,
  },
  {
    id: 'decision-crossroads',
    name: 'Decision Crossroads',
    description: 'Unpack competing paths and hidden trade-offs',
    mode: 'brainstorm',
    defaultTitle: 'Strategic Decision Analysis',
    tags: ['decision', 'strategy'],
    content: `### The Crossroads:
What key decision am I grappling with right now?
- 

### Path A vs. Path B:
- **Path A**: 
  - Upside:
  - Downside & Risk:
- **Path B**: 
  - Upside:
  - Downside & Risk:

### If I Look Back 5 Years From Now, Which Choice Has Less Regret?
- `,
  },
];
