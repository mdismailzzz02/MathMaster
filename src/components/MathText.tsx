import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

interface MathTextProps {
  text: string;
  className?: string;
}

export default function MathText({ text, className = "" }: MathTextProps) {
  // Convert LaTeX delimiters \( ... \) and \[ ... \] to $ ... $ and $$ ... $$
  const formattedText = text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => `$$${m}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => `$${m}$`);

  return (
    <div className={`prose max-w-none [&_.katex-display]:my-3 [&_.katex]:text-base ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
      >
        {formattedText}
      </ReactMarkdown>
    </div>
  );
}
