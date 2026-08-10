import { useState } from "react";
import { motion } from "framer-motion";

interface MatchingUIProps {
  pairs: { left: string; right: string }[];
  disabled: boolean;
  onConfirm: (matches: Record<string, string>) => void;
  showFeedback: boolean;
  userMatches: Record<string, string> | null;
}

export function MatchingUI({
  pairs,
  disabled,
  onConfirm,
  showFeedback,
  userMatches
}: MatchingUIProps) {
  // Extract lists and scramble rights
  const lefts = pairs.map(p => p.left);
  const rights = pairs.map(p => p.right);
  
  // Scramble rights predictably on mount
  const [scrambledRights] = useState(() => {
    const arr = [...rights];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(i * 0.7); // Simple pseudo-random for UI only
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const displayMatches = userMatches || matches;

  const handleLeftClick = (left: string) => {
    if (disabled || showFeedback) return;
    setSelectedLeft(left === selectedLeft ? null : left);
  };

  const handleRightClick = (right: string) => {
    if (disabled || showFeedback || !selectedLeft) return;
    
    // Connect the selected left to this right
    setMatches(prev => ({
      ...prev,
      [selectedLeft]: right
    }));
    setSelectedLeft(null);
  };

  const isComplete = lefts.every(l => !!matches[l]);

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {/* Left Column */}
        <div className="flex-1 space-y-2">
          {lefts.map(left => {
            const matchedRight = displayMatches[left];
            const isSelected = selectedLeft === left;
            
            let statusClasses = "border-border bg-card text-foreground";
            
            if (showFeedback) {
              const correctRight = pairs.find(p => p.left === left)?.right;
              const isCorrect = matchedRight === correctRight;
              statusClasses = isCorrect ? "border-success bg-success/5" : "border-destructive bg-destructive/5";
            } else if (matchedRight) {
              statusClasses = "border-primary/50 bg-primary/5 text-foreground";
            } else if (isSelected) {
              statusClasses = "border-primary bg-primary/10 ring-2 ring-primary/20";
            }

            return (
              <motion.button
                key={left}
                onClick={() => handleLeftClick(left)}
                className={`w-full text-left p-3 rounded-lg border-2 font-medium transition-all ${statusClasses}`}
                whileTap={!disabled ? { scale: 0.98 } : undefined}
              >
                {left}
              </motion.button>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="flex-1 space-y-2">
          {scrambledRights.map(right => {
            // Find if any left is pointing to this right
            const matchedLeft = Object.keys(displayMatches).find(k => displayMatches[k] === right);
            
            let statusClasses = "border-border bg-card text-foreground";
            
            if (showFeedback && matchedLeft) {
               const correctRight = pairs.find(p => p.left === matchedLeft)?.right;
               const isCorrect = correctRight === right;
               statusClasses = isCorrect ? "border-success bg-success/5" : "border-destructive bg-destructive/5";
            } else if (matchedLeft) {
              statusClasses = "border-primary/50 bg-primary/5 text-foreground opacity-60";
            } else if (selectedLeft && !showFeedback && !disabled) {
              statusClasses = "border-primary/30 hover:border-primary/60 bg-card cursor-pointer";
            }

            return (
              <motion.button
                key={right}
                onClick={() => handleRightClick(right)}
                className={`w-full text-left p-3 rounded-lg border-2 font-medium transition-all ${statusClasses}`}
                whileTap={(!disabled && selectedLeft) ? { scale: 0.98 } : undefined}
              >
                {right}
              </motion.button>
            );
          })}
        </div>
      </div>

      {!showFeedback && (
        <button
          onClick={() => onConfirm(matches)}
          disabled={!isComplete}
          className={`btn-primary w-full ${!isComplete ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Submit Matches
        </button>
      )}

      {showFeedback && (
        <div className="mt-4 p-4 rounded-xl bg-muted text-sm">
          <p className="font-semibold mb-2">Correct Pairs:</p>
          <ul className="space-y-1">
            {pairs.map(p => (
              <li key={p.left} className="flex gap-2">
                <span className="font-medium text-foreground/80">{p.left}</span>
                <span className="text-foreground/40">→</span>
                <span className="text-foreground/80">{p.right}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
