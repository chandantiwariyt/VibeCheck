import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lightbulb,
  FileText,
  MessageCircle,
  Send,
  Tag,
  Loader2,
  Compass,
  Mic,
  MicOff,
  LayoutTemplate,
  Smile,
} from 'lucide-react';
import { ReflectionMode, ReflectionPromptIdea, JournalEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import { createJournalEntry, addEntryMessage } from '../services/journalService';
import { generateReflection } from '../services/geminiService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { MOOD_OPTIONS, REFLECTION_TEMPLATES } from '../data/templates';

const PROMPT_IDEAS: ReflectionPromptIdea[] = [
  {
    id: 'p1',
    category: 'Introspection',
    mode: 'reflection',
    prompt: 'What was the most challenging tension I faced today, and how did I react to it?',
  },
  {
    id: 'p2',
    category: 'Gratitude & Wins',
    mode: 'reflection',
    prompt: 'What are three unexpected moments of grace, gratitude, or progress from this past week?',
  },
  {
    id: 'p3',
    category: 'Decision Making',
    mode: 'brainstorm',
    prompt: "I am facing an important crossroad in my career/life. Here are the options and my uncertainties...",
  },
  {
    id: 'p4',
    category: 'Creative Problem',
    mode: 'brainstorm',
    prompt: "I want to invent a new approach or project for...",
  },
  {
    id: 'p5',
    category: 'Synthesis',
    mode: 'summary',
    prompt: 'Here are my notes and fragmented thoughts from today. Help me synthesize them into clear lessons and action items:',
  },
];

interface JournalEditorProps {
  onEntryStarted: (entry: JournalEntry, initialAiText: string) => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({ onEntryStarted }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<ReflectionMode>('reflection');
  const [tagsText, setTagsText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Speech Recognition Hook for hands-free dictation
  const {
    isSupported: isSpeechSupported,
    isListening,
    transcript,
    errorMessage: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Append transcribed speech to content as it arrives
  useEffect(() => {
    if (transcript) {
      setContent((prev) => (prev ? prev + ' ' + transcript : transcript));
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const handleToggleDictation = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSelectTemplate = (template: typeof REFLECTION_TEMPLATES[0]) => {
    setSelectedTemplateId(template.id);
    setMode(template.mode);
    setContent(template.content);
    if (!title || title.startsWith('Reflection on')) {
      setTitle(template.defaultTitle);
    }
    const currentTags = tagsText.split(',').map((t) => t.trim()).filter(Boolean);
    const combined = Array.from(new Set([...currentTags, ...template.tags])).slice(0, 5);
    setTagsText(combined.join(', '));
  };

  const handleSelectPrompt = (idea: ReflectionPromptIdea) => {
    setMode(idea.mode);
    if (!content) {
      setContent(idea.prompt + '\n\n');
    } else {
      setContent((prev) => prev + '\n\n' + idea.prompt + '\n\n');
    }
    if (!title) {
      setTitle(idea.category + ' Reflection');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!content.trim()) {
      setErrorMessage('Please write a reflection or question before continuing.');
      return;
    }

    if (isListening) {
      stopListening();
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const finalTitle = title.trim() || 'Reflection on ' + new Date().toLocaleDateString();
    
    // Parse tags and incorporate mood tag if selected
    const initialTags = tagsText
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    if (selectedMood && !initialTags.includes(`mood:${selectedMood}`) && initialTags.length < 5) {
      initialTags.push(`mood:${selectedMood}`);
    }
    const parsedTags = initialTags.slice(0, 5);

    // Build prompt sent to Gemini, enriching with emotional state if specified
    const enrichedPrompt = selectedMood
      ? `[Emotional State / Baseline: ${selectedMood.toUpperCase()}]\n\n${content.trim()}`
      : content.trim();

    try {
      // 1. Ask Gemini on the server
      const aiResponseText = await generateReflection({
        prompt: enrichedPrompt,
        title: finalTitle,
        mode,
      });

      // 2. Persist Journal Entry to Cloud Firestore
      const entryId = await createJournalEntry({
        userId: user.uid,
        title: finalTitle,
        content: content.trim(),
        mode,
        summary: '',
        tags: parsedTags,
      });

      // 3. Persist initial user message & initial model message to subcollection
      await addEntryMessage({
        entryId,
        userId: user.uid,
        role: 'user',
        content: content.trim(),
      });

      await addEntryMessage({
        entryId,
        userId: user.uid,
        role: 'model',
        content: aiResponseText,
      });

      const newEntry: JournalEntry = {
        id: entryId,
        userId: user.uid,
        title: finalTitle,
        content: content.trim(),
        mode,
        summary: '',
        tags: parsedTags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onEntryStarted(newEntry, aiResponseText);
    } catch (err: any) {
      console.error('Failed to start reflection session:', err);
      setErrorMessage(err?.message || 'Failed to generate reflection or save entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Header Info */}
      <div className="text-left space-y-1.5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-mono">
          Chronicle Entry
        </div>
        <h2 className="font-serif italic text-3xl sm:text-4xl font-normal text-white">
          New Reflection
        </h2>
        <p className="text-xs sm:text-sm text-white/50 font-light max-w-xl">
          Record your thoughts, pose queries, or unpack tensions. Gemini will reflect, explore nuances, and converse with you.
        </p>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          id="mode-reflection"
          onClick={() => setMode('reflection')}
          className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            mode === 'reflection'
              ? 'border-white bg-white text-black shadow-xl'
              : 'border-white/10 bg-[#080808] text-white/70 hover:border-white/20 hover:bg-white/5'
          }`}
        >
          <Sparkles className={`h-4 w-4 mb-3 ${mode === 'reflection' ? 'text-black' : 'text-indigo-400'}`} />
          <span className="text-xs font-semibold tracking-wide">Mindful Reflection</span>
          <span className={`text-[10px] mt-1 leading-tight font-light ${mode === 'reflection' ? 'text-neutral-600' : 'text-white/30'}`}>
            Explore feelings &amp; self-awareness
          </span>
        </button>

        <button
          type="button"
          id="mode-brainstorm"
          onClick={() => setMode('brainstorm')}
          className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            mode === 'brainstorm'
              ? 'border-white bg-white text-black shadow-xl'
              : 'border-white/10 bg-[#080808] text-white/70 hover:border-white/20 hover:bg-white/5'
          }`}
        >
          <Lightbulb className={`h-4 w-4 mb-3 ${mode === 'brainstorm' ? 'text-black' : 'text-indigo-400'}`} />
          <span className="text-xs font-semibold tracking-wide">Brainstorming</span>
          <span className={`text-[10px] mt-1 leading-tight font-light ${mode === 'brainstorm' ? 'text-neutral-600' : 'text-white/30'}`}>
            Generate solutions &amp; vectors
          </span>
        </button>

        <button
          type="button"
          id="mode-summary"
          onClick={() => setMode('summary')}
          className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            mode === 'summary'
              ? 'border-white bg-white text-black shadow-xl'
              : 'border-white/10 bg-[#080808] text-white/70 hover:border-white/20 hover:bg-white/5'
          }`}
        >
          <FileText className={`h-4 w-4 mb-3 ${mode === 'summary' ? 'text-black' : 'text-indigo-400'}`} />
          <span className="text-xs font-semibold tracking-wide">Executive Summary</span>
          <span className={`text-[10px] mt-1 leading-tight font-light ${mode === 'summary' ? 'text-neutral-600' : 'text-white/30'}`}>
            Synthesize key takeaways
          </span>
        </button>

        <button
          type="button"
          id="mode-conversation"
          onClick={() => setMode('conversation')}
          className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            mode === 'conversation'
              ? 'border-white bg-white text-black shadow-xl'
              : 'border-white/10 bg-[#080808] text-white/70 hover:border-white/20 hover:bg-white/5'
          }`}
        >
          <MessageCircle className={`h-4 w-4 mb-3 ${mode === 'conversation' ? 'text-black' : 'text-indigo-400'}`} />
          <span className="text-xs font-semibold tracking-wide">Open Dialogue</span>
          <span className={`text-[10px] mt-1 leading-tight font-light ${mode === 'conversation' ? 'text-neutral-600' : 'text-white/30'}`}>
            Dynamic back-and-forth chat
          </span>
        </button>
      </div>

      {/* Structured Reflection Templates */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-mono text-white/40">
            <LayoutTemplate className="h-3.5 w-3.5 text-indigo-400" />
            <span>Structured Reflection Frameworks</span>
          </div>
          {selectedTemplateId && (
            <button
              type="button"
              onClick={() => setSelectedTemplateId(null)}
              className="text-[10px] font-mono text-white/40 hover:text-white underline cursor-pointer"
            >
              Clear Template
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {REFLECTION_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleSelectTemplate(tmpl)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedTemplateId === tmpl.id
                  ? 'border-indigo-400/50 bg-indigo-500/10 text-white shadow-lg'
                  : 'border-white/10 bg-[#080808] text-white/70 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif italic text-white font-medium">{tmpl.name}</span>
                <span className="text-[9px] font-mono uppercase tracking-widest text-indigo-400/80 bg-white/5 px-2 py-0.5 rounded-sm border border-white/5">
                  {tmpl.mode}
                </span>
              </div>
              <p className="text-[11px] text-white/40 mt-1 font-light leading-snug">
                {tmpl.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Emotional Baseline / Mood Selector */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-mono text-white/40">
            <Smile className="h-3.5 w-3.5 text-indigo-400" />
            <span>Emotional Baseline (Shapes Gemini's Tone)</span>
          </div>
          {selectedMood && (
            <button
              type="button"
              onClick={() => setSelectedMood(null)}
              className="text-[10px] font-mono text-white/40 hover:text-white underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((mood) => {
            const isSelected = selectedMood === mood.id;
            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => setSelectedMood(isSelected ? null : mood.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                  isSelected
                    ? `${mood.color} shadow-md`
                    : 'border-white/10 bg-[#080808] text-white/50 hover:text-white hover:border-white/20'
                }`}
              >
                {mood.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-mono text-white/40">
          <Compass className="h-3.5 w-3.5 text-indigo-400" />
          <span>Inspiration Vectors (Click to load)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PROMPT_IDEAS.map((idea) => (
            <button
              key={idea.id}
              type="button"
              onClick={() => handleSelectPrompt(idea)}
              className="text-left text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-3.5 py-2 rounded-xl transition-all max-w-full truncate cursor-pointer"
            >
              <span className="font-mono text-[10px] text-indigo-400/80 mr-2 uppercase">[{idea.category}]</span>
              <span>{idea.prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Journal Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        {speechError && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300 font-mono">
            {speechError}
          </div>
        )}

        {/* Title Input */}
        <div>
          <label htmlFor="journal-title-input" className="block text-[10px] uppercase tracking-[0.2em] font-mono text-white/40 mb-1.5">
            Entry Title (Optional)
          </label>
          <input
            id="journal-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Navigating Team Friction, Creative Roadmap, Evening Reflections"
            maxLength={200}
            className="w-full rounded-2xl border border-white/10 bg-[#0C0C0C] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-hidden focus:border-white/30 focus:ring-1 focus:ring-white/20 font-sans transition-colors"
          />
        </div>

        {/* Content Textarea with Voice Dictation */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <label htmlFor="journal-content-input" className="block text-[10px] uppercase tracking-[0.2em] font-mono text-white/40">
                Journal Content &amp; Thoughts <span className="text-indigo-400">*</span>
              </label>
              {isListening && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  Recording Audio...
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isSpeechSupported && (
                <button
                  type="button"
                  id="journal-voice-dictate-btn"
                  onClick={handleToggleDictation}
                  className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    isListening
                      ? 'border-rose-500/40 bg-rose-500/20 text-rose-300'
                      : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  title={isListening ? 'Stop Voice Dictation' : 'Start Voice Dictation'}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-3 w-3 text-rose-400 animate-pulse" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3 w-3 text-indigo-400" />
                      <span>Dictate Voice</span>
                    </>
                  )}
                </button>
              )}
              <span className="text-[10px] font-mono text-white/20">
                {content.length} / 10,000
              </span>
            </div>
          </div>
          <textarea
            id="journal-content-input"
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write freely or use voice dictation. Share what is on your mind, describe what happened, explore what feels confusing or exciting..."
            maxLength={10000}
            className="w-full rounded-2xl border border-white/10 bg-[#0C0C0C] p-4 text-sm text-white placeholder:text-white/20 focus:outline-hidden focus:border-white/30 focus:ring-1 focus:ring-white/20 leading-relaxed resize-y font-sans transition-colors"
          />
        </div>

        {/* Tags input */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-mono text-white/40 mb-1.5">
            <Tag className="h-3 w-3 text-white/30" />
            <label htmlFor="journal-tags-input">Tags (Comma-separated, up to 5)</label>
          </div>
          <input
            id="journal-tags-input"
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="mindset, leadership, philosophy, clarity"
            className="w-full rounded-2xl border border-white/10 bg-[#0C0C0C] px-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-hidden focus:border-white/30 focus:ring-1 focus:ring-white/20 font-sans transition-colors"
          />
        </div>

        {/* Action Button */}
        <div className="pt-3 flex justify-end">
          <button
            id="journal-submit-btn"
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="inline-flex items-center gap-2.5 rounded-xl bg-white px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-black shadow-xl hover:bg-neutral-200 disabled:opacity-40 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Reflecting with Gemini...</span>
              </>
            ) : (
              <>
                <span>Begin Reflection</span>
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
