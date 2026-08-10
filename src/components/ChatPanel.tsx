import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { streamGroqChat } from "../lib/groq";
import { Bot, SendHorizonal, Sparkles, X } from "lucide-react";

interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatPanelProps {
  subtopicId: string | null;
  subtopicName?: string | null;
  onClose: () => void;
}

export default function ChatPanel({ subtopicId, subtopicName, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Initialize session history from localStorage
  useEffect(() => {
    if (subtopicId) {
      const cached = localStorage.getItem(`chat_history_${subtopicId}`);
      if (cached) {
        try {
          setMessages(JSON.parse(cached));
        } catch(e) {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
    setHistoryLoaded(true);
  }, [subtopicId]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (subtopicId && messages.length > 0) {
      localStorage.setItem(`chat_history_${subtopicId}`, JSON.stringify(messages));
    }
  }, [messages, subtopicId]);

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  // Focus input when not streaming
  useEffect(() => {
    if (!streaming) inputRef.current?.focus();
  }, [streaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || !subtopicId || streaming) return;

    setError(null);
    const userMsg: ChatMessage = { role: "user", content: msg };
    const historyForApi = [...messages, userMsg];
    
    // Add empty assistant bubble to state so the stream chunker can update it
    setMessages([...historyForApi, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let fullContent = "";
    
    // Construct messages for Groq API
    const topicContext = subtopicName ? ` The user is currently studying "${subtopicName}".` : " The user is currently studying a math topic.";
    const systemPrompt = `You are a helpful, encouraging math tutor.${topicContext} Answer their questions clearly, step-by-step, using LaTeX for math expressions if needed. Be concise.`;
    
    const chatHistory = [
      { role: "system" as const, content: systemPrompt },
      ...historyForApi.slice(-10).map((m) => ({ role: m.role, content: m.content }))
    ];

    await streamGroqChat(
      chatHistory,
      (chunk) => {
        fullContent += chunk;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = { ...last, content: fullContent };
          }
          return next;
        });
      },
      () => {
        setStreaming(false);
        abortRef.current = null;
      },
      (err) => {
        setError(err);
        setStreaming(false);
        abortRef.current = null;
        // Remove the empty assistant bubble on failure
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant" && !last.content) {
            next.pop();
          }
          return next;
        });
      },
      controller.signal
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col h-full" role="complementary" aria-label="AI Tutor chat">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0"
           style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="font-heading font-bold text-white text-base leading-tight">AI Tutor</p>
            <p className="text-white/60 text-xs">Ask me anything about this topic</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-card/15 hover:bg-card/25 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close tutor"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {historyLoaded && messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-10 h-10 text-primary/30 mb-2" aria-hidden="true" />
            <p className="text-sm text-foreground/60">
              Ask a question about this topic.
            </p>
            <p className="text-xs text-foreground/40 mt-1">
              I'll explain step-by-step based on the study guide.
            </p>
          </div>
        )}

        {!historyLoaded && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={msg.id ?? idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-on-primary rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="[&_.katex]:text-[0.95em]">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                    components={{
                      p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 my-1.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 my-1.5">{children}</ol>,
                      li: ({ children }) => <li className="my-0.5">{children}</li>,
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      h1: ({ children }) => <h3 className="font-heading font-bold my-2">{children}</h3>,
                      h2: ({ children }) => <h4 className="font-heading font-bold my-2">{children}</h4>,
                      h3: ({ children }) => <h5 className="font-heading font-bold my-2">{children}</h5>,
                      code: ({ children }) => (
                        <code className="bg-black/5 rounded px-1 py-0.5 text-[0.9em]">{children}</code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-black/5 rounded-lg p-3 my-2 overflow-x-auto text-[0.85em]">{children}</pre>
                      ),
                    }}
                  >
                    {msg.content || ""}
                  </ReactMarkdown>
                  {streaming && idx === messages.length - 1 && msg.content === "" && (
                    <span className="inline-flex gap-1 ml-1" aria-label="Tutor is typing">
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {error && (
          <div className="flex justify-center">
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg">
              {error}
            </p>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 shrink-0 bg-card">
        <div className="flex items-center gap-3 bg-muted/50 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this topic…"
            disabled={streaming}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 outline-none disabled:opacity-50 resize-none py-1.5"
            style={{ minHeight: '36px', maxHeight: '120px' }}
            aria-label="Ask the AI Tutor"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)" }}
            aria-label="Send"
          >
            <SendHorizonal className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-center text-xs text-foreground/30 mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
