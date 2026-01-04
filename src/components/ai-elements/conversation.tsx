"use client";

import { Message, UseChatHelpers } from "ai/react";
import { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

interface ConversationProps {
    messages: Message[];
    input: string;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
    onCopyLatest?: () => void;
}

export function Conversation({
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    onCopyLatest,
}: ConversationProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, []);

    // Effect to scroll on new messages can be added if needed

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="font-semibold">AI Writer</h3>
                {messages.length > 0 && onCopyLatest && (
                    <button
                        onClick={onCopyLatest}
                        className="text-xs text-primary hover:underline hover:text-primary/80 transition-colors"
                    >
                        Use this Draft
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-4">
                        <p className="mb-2">Send a prompt to generate a blog post.</p>
                        <p className="text-xs">
                            Example: "Write a blog about sustainable fashion trends in 2024."
                        </p>
                    </div>
                )}

                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"
                            }`}
                    >
                        <div
                            className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${m.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted prose prose-sm dark:prose-invert max-w-none"
                                }`}
                        >
                            {m.role === "user" ? (
                                m.content
                            ) : (
                                <MessageContent content={m.content} />
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="rounded-lg bg-muted px-4 py-3 text-sm">
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            <form
                onSubmit={(e) => {
                    handleSubmit(e);
                    setTimeout(scrollToBottom, 100);
                }}
                className="border-t p-4"
            >
                <div className="relative">
                    <input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask AI to write something..."
                        className="w-full rounded-md border bg-transparent px-4 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-1.5 top-1.5 rounded-sm bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
}

// Helper to render markdown content properly
function MessageContent({ content }: { content: string }) {
    return (
        <ReactMarkdown
            components={{
                h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-4 mb-2" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-3 mb-1" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                li: ({ node, ...props }) => <li className="" {...props} />,
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
            }}
        >
            {content}
        </ReactMarkdown>
    );
}
