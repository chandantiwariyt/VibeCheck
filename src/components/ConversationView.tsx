import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Loader2,
  FileCheck2,
  ArrowLeft,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  Tag,
  ListTodo,
  Star,
  Download,
  Mic,
  MicOff,
  HelpCircle,
} from 'lucide-react';
import { JournalEntry, JournalMessage, SummaryResult } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  fetchEntryMessages,
  addEntryMessage,
  updateJournalEntry,
} from '../services/journalService';
import { generateReflection, generateSummary } from '../services/geminiService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface ConversationViewProps {
  entry: JournalEntry;
  onBack: () => void;
  onEntryUpdated?: (updatedEntry: JournalEntry) => void;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  entry,
  onBack,
  onEntryUpdated,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryResult | null>(
    entry.summary ? { summary: entry.summary, keyTakeaways: [] } : null
  );
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isTogglingStar, setIsTogglingStar] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Speech Recognition Hook for hands-free replies
  const {
    isSupported: isSpeechSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setReplyText((prev) => (prev ? prev + ' ' + transcript : transcript));
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const isStarred = (entry.tags || []).includes('starred');

  const handleToggleStar = async () => {
    if (!user || isTogglingStar) return;
    setIsTogglingStar(true);
    try {
      const currentTags = entry.tags || [];
      const newTags = isStarred
        ? currentTags.filter((t) => t !== 'starred')
        : [...currentTags.filter((t) => t !== 'starred'), 'starred'].slice(0, 5);

      await updateJournalEntry(entry.id, { tags: newTags });
      const updatedEntry = { ...entry, tags: newTags };
      onEntryUpdated?.(updatedEntry);
    } catch (err: any) {
      console.error('Failed to toggle star status:', err);
      setErrorNotice('Could not update favorite status in Firestore.');
    } finally {
      setIsTogglingStar(false);
    }
  };

  const handleExport = (format: 'md' | 'txt') => {
    setShowExportMenu(false);
    let output = '';
    const dateFormatted = new Date(entry.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (format === 'md') {
      output = `# ${entry.title}\n\n`;
      output += `> *Mode: ${entry.mode.toUpperCase()} | Created: ${dateFormatted}*\n`;
      if (entry.tags && entry.tags.length > 0) {
        output += `> *Tags: ${entry.tags.join(', ')}*\n`;
      }
      output += `\n---\n\n`;

      if (summaryData?.summary) {
        output += `## 🧭 Executive Synthesis\n\n${summaryData.summary}\n\n`;
        if (summaryData.tone) {
          output += `*Observed Tone: ${summaryData.tone}*\n\n`;
        }
        if (summaryData.keyTakeaways && summaryData.keyTakeaways.length > 0) {
          output += `### Key Takeaways\n`;
          summaryData.keyTakeaways.forEach((k) => {
            output += `- ${k}\n`;
          });
          output += `\n`;
        }
        output += `---\n\n`;
      }

      output += `## 💬 Reflection Dialogue\n\n`;
      messages.forEach((msg) => {
        const speaker = msg.role === 'user' ? 'You' : 'Gemini Reflection Guide';
        const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        output += `### ${speaker} (${time})\n\n${msg.content}\n\n`;
      });
    } else {
      // Plain text
      output = `${entry.title.toUpperCase()}\n`;
      output += `Mode: ${entry.mode.toUpperCase()} | Date: ${dateFormatted}\n`;
      if (entry.tags && entry.tags.length > 0) {
        output += `Tags: ${entry.tags.join(', ')}\n`;
      }
      output += `\n========================================\n\n`;

      if (summaryData?.summary) {
        output += `EXECUTIVE SYNTHESIS:\n${summaryData.summary}\n\n`;
        if (summaryData.keyTakeaways?.length) {
          output += `KEY TAKEAWAYS:\n`;
          summaryData.keyTakeaways.forEach((k) => {
            output += `* ${k}\n`;
          });
          output += `\n`;
        }
        output += `========================================\n\n`;
      }

      output += `DIALOGUE TRANSCRIPT:\n\n`;
      messages.forEach((msg) => {
        const speaker = msg.role === 'user' ? 'YOU' : 'GEMINI';
        output += `[${speaker}]:\n${msg.content}\n\n`;
      });
    }

    const mime = format === 'md' ? 'text/markdown;charset=utf-8;' : 'text/plain;charset=utf-8;';
    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = entry.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 35);
    link.download = `vibecheck-${sanitizedTitle || 'reflection'}-${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load message history from Firestore
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const msgs = await fetchEntryMessages(entry.id, user!.uid);
        if (isMounted) {
          setMessages(msgs);
        }
      } catch (err: any) {
        console.error('Error fetching messages:', err);
        if (isMounted) {
          setErrorNotice('Could not load prior message history from Firestore.');
        }
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    }

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [entry.id, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSendReply = async (customPrompt?: string) => {
    const textToSend = customPrompt || replyText.trim();
    if (!textToSend || !user || isSending) return;

    setReplyText('');
    setIsSending(true);
    setErrorNotice(null);

    // Optimistic user message representation
    const tempUserMsgId = 'temp-' + Date.now();
    const tempUserMsg: JournalMessage = {
      id: tempUserMsgId,
      entryId: entry.id,
      userId: user.uid,
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      // 1. Save user message to Firestore
      const userMsgId = await addEntryMessage({
        entryId: entry.id,
        userId: user.uid,
        role: 'user',
        content: textToSend,
      });

      // 2. Call Gemini on the server with full conversational context
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const aiResponse = await generateReflection({
        prompt: textToSend,
        title: entry.title,
        mode: entry.mode,
        history: historyPayload,
      });

      // 3. Save Gemini's reply to Firestore
      const aiMsgId = await addEntryMessage({
        entryId: entry.id,
        userId: user.uid,
        role: 'model',
        content: aiResponse,
      });

      // 4. Update entry updatedAt in Firestore
      await updateJournalEntry(entry.id, {});

      // Replace temp message with verified IDs
      setMessages((prev) =>
        prev
          .map((m) => (m.id === tempUserMsgId ? { ...m, id: userMsgId } : m))
          .concat({
            id: aiMsgId,
            entryId: entry.id,
            userId: user.uid,
            role: 'model',
            content: aiResponse,
            createdAt: new Date().toISOString(),
          })
      );
    } catch (err: any) {
      console.error('Failed to send turn:', err);
      setErrorNotice(err?.message || 'Failed to communicate with Gemini or save to Firestore.');
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (isSummarizing) return;
    setIsSummarizing(true);
    setErrorNotice(null);

    try {
      const messagesList = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await generateSummary({
        title: entry.title,
        content: entry.content,
        messages: messagesList,
      });

      setSummaryData(res);

      // Save summary to Firestore entry document
      await updateJournalEntry(entry.id, {
        summary: res.summary,
      });

      if (onEntryUpdated) {
        onEntryUpdated({
          ...entry,
          summary: res.summary,
        });
      }
    } catch (err: any) {
      console.error('Failed to generate summary:', err);
      setErrorNotice(err?.message || 'Failed to generate summary with Gemini.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopyText = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
      {/* Session Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-[#080808] p-5 rounded-t-3xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Chronicle</span>
          </button>
          <div>
            <h3 className="font-serif italic text-lg sm:text-xl font-normal text-white leading-tight truncate max-w-[280px] sm:max-w-md">
              {entry.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono tracking-widest text-indigo-400/80 uppercase bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-sm">
                {entry.mode}
              </span>
              <span className="text-[10px] font-mono text-white/30">
                {new Date(entry.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Star Favorite Toggle */}
          <button
            id="toggle-star-btn"
            onClick={handleToggleStar}
            disabled={isTogglingStar}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
              isStarred
                ? 'border-amber-400/40 bg-amber-400/10 text-amber-300 shadow-sm'
                : 'border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
            }`}
            title={isStarred ? 'Remove from Starred' : 'Star this Reflection'}
          >
            <Star className={`h-3.5 w-3.5 ${isStarred ? 'fill-amber-300 text-amber-300' : 'text-white/40'}`} />
            <span className="hidden sm:inline">{isStarred ? 'Starred' : 'Star'}</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              id="export-btn"
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10 transition-colors shadow-sm cursor-pointer"
              title="Export Reflection"
            >
              <Download className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0C0C0C] border border-white/15 p-2 shadow-2xl z-20 space-y-1 text-left font-mono text-xs">
                <button
                  onClick={() => handleExport('md')}
                  className="w-full text-left px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Markdown (.md)</span>
                  <span className="text-[9px] text-indigo-400 font-bold">PRO</span>
                </button>
                <button
                  onClick={() => handleExport('txt')}
                  className="w-full text-left px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Plain Text (.txt)
                </button>
              </div>
            )}
          </div>

          <button
            id="generate-summary-btn"
            onClick={handleGenerateSummary}
            disabled={isSummarizing || messages.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-[11px] font-medium tracking-[0.15em] uppercase text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
          >
            {isSummarizing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            ) : (
              <FileCheck2 className="h-3.5 w-3.5 text-indigo-400" />
            )}
            <span>{summaryData ? 'Regenerate Synthesis' : 'Distill Synthesis'}</span>
          </button>
        </div>
      </div>

      {/* Summary Banner (if generated) */}
      {summaryData && (
        <div className="bg-[#0C0C0C] text-white/90 p-5 sm:p-6 border-x border-b border-white/10 text-left space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-mono text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Gemini Executive Synthesis</span>
            </div>
            {summaryData.tone && (
              <span className="text-[10px] font-mono uppercase bg-white/5 text-white/40 border border-white/10 px-2.5 py-0.5 rounded-sm">
                Tone: {summaryData.tone}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base text-white/90 leading-relaxed font-serif italic">
            {summaryData.summary}
          </p>
          {summaryData.keyTakeaways && summaryData.keyTakeaways.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-mono text-white/40 mb-2">
                <ListTodo className="h-3 w-3 text-indigo-400" />
                <span>Key Takeaways:</span>
              </div>
              <ul className="list-disc list-inside text-xs text-white/70 space-y-1 font-light">
                {summaryData.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx}>{takeaway}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {errorNotice && (
        <div className="bg-rose-950/40 border-x border-b border-rose-500/30 p-3 text-xs text-rose-300 text-left font-mono">
          {errorNotice}
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[#050505] border-x border-white/10">
        {loadingMessages ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-3 text-white/30">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            <p className="text-xs font-mono uppercase tracking-widest text-white/30">Loading chronicle dialogue from Firestore...</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3.5 text-left ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar Icon */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
                      isUser
                        ? 'bg-white/10 text-white border border-white/15'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                    }`}
                  >
                    {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`group relative max-w-[85%] sm:max-w-[78%] p-5 sm:p-6 text-sm leading-relaxed shadow-xl ${
                      isUser
                        ? 'bg-white/5 border border-white/10 text-white/80 rounded-3xl rounded-tr-none'
                        : 'bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 text-white/90 rounded-3xl rounded-tl-none shadow-2xl backdrop-blur-xs'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap font-sans text-white/80 leading-relaxed">{msg.content}</div>
                    ) : (
                      <div className="markdown-body prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-serif prose-headings:italic text-white/90">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    )}

                    {/* Message Action Footer */}
                    <div
                      className={`flex items-center justify-between gap-4 mt-3 pt-2 border-t text-[10px] font-mono ${
                        isUser
                          ? 'border-white/5 text-white/30'
                          : 'border-white/10 text-white/30'
                      }`}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      <button
                        onClick={() => handleCopyText(msg.content, msg.id)}
                        className="inline-flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity cursor-pointer text-white/60 hover:text-white"
                        title="Copy text"
                      >
                        {copiedMessageId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-start gap-3.5 text-left">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-2.5 text-xs font-mono text-indigo-400/90">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                    <span>Gemini is reflecting &amp; synthesizing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Suggested Follow-up Prompts */}
      <div className="bg-[#080808] px-4 py-2.5 border-x border-t border-white/10 flex items-center gap-2 overflow-x-auto text-xs text-white/50">
        <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/30 shrink-0">Inquiries:</span>
        <button
          onClick={() => handleSendReply('What is an underlying assumption or blind spot I might be holding here?')}
          disabled={isSending}
          className="shrink-0 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-1.5 rounded-xl border border-white/10 transition-colors text-xs cursor-pointer"
        >
          Identify blind spots
        </button>
        <button
          onClick={() => handleSendReply('If a close, trusted friend brought this situation to me, what advice would I offer them?')}
          disabled={isSending}
          className="shrink-0 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-1.5 rounded-xl border border-white/10 transition-colors text-xs cursor-pointer"
        >
          Advise a friend
        </button>
        <button
          onClick={() => handleSendReply('What are 3 concrete action steps or immediate experiments I should run?')}
          disabled={isSending}
          className="shrink-0 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-1.5 rounded-xl border border-white/10 transition-colors text-xs cursor-pointer"
        >
          3 action steps
        </button>
        <button
          onClick={() => handleSendReply('How will this dilemma or realization matter 5 years from now?')}
          disabled={isSending}
          className="shrink-0 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-1.5 rounded-xl border border-white/10 transition-colors text-xs cursor-pointer"
        >
          5-year horizon
        </button>
      </div>

      {/* Message Input Box */}
      <div className="p-3 sm:p-4 bg-[#080808] border border-white/10 rounded-b-3xl shadow-xl space-y-2">
        {isListening && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-rose-400 px-1">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span>Listening to voice dictation... Speak clearly to transcribe into your reply.</span>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendReply();
          }}
          className="flex items-center gap-2.5"
        >
          <input
            type="text"
            id="conversation-reply-input"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply to Gemini or deepen your reflection..."
            disabled={isSending}
            className="flex-1 rounded-2xl border border-white/10 bg-[#0C0C0C] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-hidden focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors font-sans"
          />

          {isSpeechSupported && (
            <button
              type="button"
              id="conversation-dictate-btn"
              onClick={() => {
                if (isListening) stopListening();
                else startListening();
              }}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition-all cursor-pointer shrink-0 ${
                isListening
                  ? 'border-rose-500/50 bg-rose-500/20 text-rose-300'
                  : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title={isListening ? 'Stop recording voice' : 'Dictate with voice'}
            >
              {isListening ? (
                <MicOff className="h-4 w-4 text-rose-400 animate-pulse" />
              ) : (
                <Mic className="h-4 w-4 text-indigo-400" />
              )}
            </button>
          )}

          <button
            type="submit"
            id="conversation-send-btn"
            disabled={isSending || !replyText.trim()}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black shadow-xl hover:bg-neutral-200 disabled:opacity-40 transition-all cursor-pointer shrink-0"
            title="Send reply"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};
