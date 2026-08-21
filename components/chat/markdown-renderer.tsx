'use client';

// ============================================================
// Safe Markdown Renderer
// ============================================================
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { CodeBlock } from './code-block';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

// Extend the default sanitize schema to allow code-related attributes
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), 'className'],
    span: [...(defaultSchema.attributes?.span || []), 'className', 'style'],
  },
};

const components: Components = {
  // Code blocks and inline code
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    // Block code: has a language class or is multi-line
    if (match || codeString.includes('\n')) {
      return <CodeBlock language={match?.[1] || ''} >{codeString}</CodeBlock>;
    }

    // Inline code
    return (
      <code className="inline-code" {...props}>
        {children}
      </code>
    );
  },

  // Make pre a simple wrapper (CodeBlock handles styling)
  pre({ children }) {
    return <>{children}</>;
  },

  // Safe link rendering
  a({ href, children, ...props }) {
    const isSafe = href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#') || href.startsWith('/'));

    if (!isSafe) {
      return <span>{children}</span>;
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="md-link"
        {...props}
      >
        {children}
      </a>
    );
  },

  // Tables
  table({ children, ...props }) {
    return (
      <div className="md-table-wrapper">
        <table className="md-table" {...props}>
          {children}
        </table>
      </div>
    );
  },
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
