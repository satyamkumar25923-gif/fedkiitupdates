"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
// @ts-ignore
import Lottie from "lottie-react";

import { sendMessageToBot, ConversationTurn } from "@/lib/chatbot/api";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import styles from "./ChatWidget.module.scss";
import foxAnimation from "@/public/lottie/fox_head_tilt.json";

/** Shared reusable fox Lottie avatar — used in header, bot bubbles, and the FAB launcher. */
function FoxAvatar({ size, className }: { size: number; className?: string }) {
  return (
    <div
      className={`${styles.foxAvatarWrapper}${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Lottie animationData={foxAnimation} loop={true} />
    </div>
  );
}

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  "What is FED?",
  "Who is the President of FED?",
  "Show me the Upcoming Events",
  "Show me FED Insights",
];

export default function ChatWidget() {
  // NEXT_PUBLIC_CHATBOT_NAME is set to "FEDRick" in .env.local; fallback matches.
  const chatbotName = process.env.NEXT_PUBLIC_CHATBOT_NAME || "FEDRick";

  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: `Hello! I'm **${chatbotName}**, your personal assistant for FED KIIT. 🚀 Ask me anything about FED, our flagship events, or how to join us! 👋`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  // Auto scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus on input field when panel opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setShowNotification(false);
    }
  }, [isOpen]);

  // Keyboard navigation & Accessibility handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setIsMaximized(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const toggleChat = () => {
    if (isOpen) {
      setIsMaximized(false);
    }
    setIsOpen((prev) => !prev);
  };

  const toggleMaximize = () => {
    setIsMaximized((prev) => !prev);
  };

  const handleSend = async (messageText?: string) => {
    const text = (messageText ?? inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    // Snapshot current messages for building history before state update
    const currentMessages = messages;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Build conversation history, excluding the static welcome message
      const history: ConversationTurn[] = currentMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role === "user" ? "user" : "model",
          text: m.content,
        }));

      const responseText = await sendMessageToBot(text, history);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: "bot",
          content: responseText,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "bot",
          content: "Sorry, I had trouble connecting to my servers. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  // Compute panel class names based on state
  const panelClassNames = [
    styles.panel,
    isMaximized ? styles.maximized : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.widgetContainer} aria-live="polite">
      {/* Chat Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className={panelClassNames}
          role="dialog"
          aria-label={`${chatbotName} Chat Panel`}
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitleInfo}>
              {/* Fox Lottie avatar — sits directly in the flex row, no extra wrapper */}
              <FoxAvatar size={36} className={styles.headerAvatar} />
              <div className={styles.titleContainer}>
                <h3>{chatbotName}</h3>
                <span className={styles.status}>AI Assistant</span>
                </div>
              </div>
              <div className={styles.headerActions}>
                <button
                  onClick={toggleMaximize}
                  className={styles.maximizeBtn}
                  aria-label={isMaximized ? "Minimize Chatbot Panel" : "Maximize Chatbot Panel"}
                >
                  {isMaximized ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 14h6v6" />
                      <path d="M20 10h-6V4" />
                      <path d="M14 10l7-7" />
                      <path d="M10 14l-7 7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h6v6" />
                      <path d="M9 21H3v-6" />
                      <path d="M21 3l-7 7" />
                      <path d="M3 21l7-7" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={toggleChat}
                  className={styles.closeBtn}
                  aria-label="Close Chatbot Panel"
                >
                  <X />
                </button>
              </div>
            </div>

          {/* Messages Area */}
          <div className={styles.messageList} role="log">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.messageRow} ${
                  msg.role === "user" ? styles.userRow : styles.botRow
                }`}
              >
                {/* Fox Lottie avatar next to every bot message */}
                {msg.role === "bot" && (
                  <FoxAvatar size={32} className={styles.botAvatar} />
                )}
                <div
                  className={`${styles.bubble} ${
                    msg.role === "user" ? styles.userBubble : styles.botBubble
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      a: ({ href, children }) => {
                        const hrefStr = typeof href === "string" ? href : "";
                        const childText = Array.isArray(children)
                          ? children.map((c) => (typeof c === "string" ? c : "")).join("")
                          : typeof children === "string"
                          ? children
                          : "";

                        const isGithub = /github\.com/i.test(hrefStr) || /^github$/i.test(childText.trim());
                        const isLinkedin = /linkedin\.com/i.test(hrefStr) || /^linkedin$/i.test(childText.trim());

                        if (isGithub) {
                          const label = !childText || childText.startsWith("http") || /github\.com/i.test(childText) ? "GitHub" : children;
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${styles.socialBadge} ${styles.githubBadge}`}
                              title="Open GitHub Profile"
                            >
                              <FaGithub className={styles.socialBadgeIcon} />
                              <span>{label}</span>
                            </a>
                          );
                        }

                        if (isLinkedin) {
                          const label = !childText || childText.startsWith("http") || /linkedin\.com/i.test(childText) ? "LinkedIn" : children;
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${styles.socialBadge} ${styles.linkedinBadge}`}
                              title="Open LinkedIn Profile"
                            >
                              <FaLinkedin className={styles.socialBadgeIcon} />
                              <span>{label}</span>
                            </a>
                          );
                        }

                        return (
                          <a href={href} target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        );
                      },
                    }}
                  >
                    {(() => {
                      const cleanUrl = (u: string) => (u ? u.trim().replace(/[.,;)]+$/, "") : "");
                      return msg.content
                        .replace(/\[\s*LinkedIn:\s*(https?:\/\/[^\s,\]]+),\s*GitHub:\s*(https?:\/\/[^\s,\]]+)\s*\]/gi, (_, u1, u2) => `([LinkedIn](${cleanUrl(u1)}) [GitHub](${cleanUrl(u2)}))`)
                        .replace(/\[\s*GitHub:\s*(https?:\/\/[^\s,\]]+),\s*LinkedIn:\s*(https?:\/\/[^\s,\]]+)\s*\]/gi, (_, u1, u2) => `([GitHub](${cleanUrl(u1)}) [LinkedIn](${cleanUrl(u2)}))`)
                        .replace(/\[\s*LinkedIn:\s*(https?:\/\/[^\s,\]]+)\s*\]/gi, (_, u) => `[LinkedIn](${cleanUrl(u)})`)
                        .replace(/\[\s*GitHub:\s*(https?:\/\/[^\s,\]]+)\s*\]/gi, (_, u) => `[GitHub](${cleanUrl(u)})`)
                        .replace(/(?:LinkedIn|Linkedin):\s*(https?:\/\/(?:www\.)?linkedin\.com\/[^\s,\]\)<]+)/gi, (_, u) => `[LinkedIn](${cleanUrl(u)})`)
                        .replace(/(?:GitHub|Github):\s*(https?:\/\/(?:www\.)?github\.com\/[^\s,\]\)<]+)/gi, (_, u) => `[GitHub](${cleanUrl(u)})`)
                        .replace(/(?<!\]\(|href=["'])(https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s,\]\)<]+)(?!\))/gi, (_, u) => `[LinkedIn](${cleanUrl(u)})`)
                        .replace(/(?<!\]\(|href=["'])(https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*\/?)(?!\))/gi, (_, u) => `[GitHub](${cleanUrl(u)})`);
                    })()}
                  </ReactMarkdown>
                  <span className={styles.timestamp}>
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className={`${styles.messageRow} ${styles.botRow}`}>
                <FoxAvatar size={32} className={styles.botAvatar} />
                <div className={styles.typingIndicator} aria-label="Typing indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            {/* Quick-action buttons — shown only before the first user message */}
            {messages.length === 1 && !isLoading && (
              <div className={styles.quickActions}>
                <p className={styles.quickActionsLabel}>Quick actions:</p>
                <div className={styles.quickActionsGrid}>
                  {QUICK_ACTIONS.map((prompt) => (
                    <button
                      key={prompt}
                      className={styles.quickActionBtn}
                      onClick={() => handleSend(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleFormSubmit} className={styles.inputForm}>
            <input
              ref={inputRef}
              type="text"
              className={styles.inputField}
              placeholder="Ask me anything about FED KIIT..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              aria-label="Message Input"
              disabled={isLoading}
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send Message"
            >
              <Send />
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button (FAB) Launcher — hidden entirely while chat is open */}
      {!isOpen && (
        <button
          ref={launcherRef}
          onClick={toggleChat}
          className={styles.launcher}
          aria-label="Open chatbot"
          aria-haspopup="dialog"
          aria-expanded={false}
        >
          <div className={styles.lottieWrapper}>
            <Lottie animationData={foxAnimation} loop={true} />
          </div>
          {showNotification && <span className={styles.notificationDot} />}
        </button>
      )}
    </div>
  );
}


