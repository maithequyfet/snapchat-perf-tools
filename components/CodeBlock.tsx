import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  return (
    <div className="relative rounded-lg overflow-x-auto">
      <pre className="text-sm bg-slate-700 p-4 pt-14 overflow-x-auto">
        <code className="text-white">{code}</code>
      </pre>
      <div className="absolute top-0 left-0 w-full text-white flex justify-between items-center p-2 bg-slate-800	">
        <p>{language}</p>
        <button
          className={`btn btn-xs btn-ghost ${copied ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleCopyToClipboard}
        >
          <svg
            stroke="currentColor"
            fill="none"
            stroke-width="2"
            viewBox="0 0 24 24"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="h-4 w-4"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
          <span className="ml-2">{copied ? 'Copied' : 'Copy code'}</span>
        </button>
      </div>
    </div>
  );
};

export default CodeBlock;
