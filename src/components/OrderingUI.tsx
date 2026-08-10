import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown } from "lucide-react";

interface OrderingUIProps {
  items: string[];
  disabled: boolean;
  onConfirm: (order: string[]) => void;
  showFeedback: boolean;
  correctOrder: string[];
  userOrder: string[] | null;
}

export function OrderingUI({
  items,
  disabled,
  onConfirm,
  showFeedback,
  correctOrder,
  userOrder
}: OrderingUIProps) {
  // If we haven't submitted yet, our current state is the initial items or what we've dragged
  // If we have submitted, we show the userOrder.
  const [currentOrder, setCurrentOrder] = useState<string[]>(items);

  const moveItem = (idx: number, direction: -1 | 1) => {
    if (disabled) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= currentOrder.length) return;
    
    const newOrder = [...currentOrder];
    [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
    setCurrentOrder(newOrder);
  };

  const displayOrder = userOrder || currentOrder;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <AnimatePresence>
          {displayOrder.map((item, idx) => {
            const isCorrect = showFeedback && item === correctOrder[idx];
            const isWrong = showFeedback && !isCorrect;

            let borderClass = "border-border";
            let bgClass = "bg-card";
            let textClass = "text-foreground";

            if (isCorrect) {
              borderClass = "border-success";
              bgClass = "bg-success/5";
            } else if (isWrong) {
              borderClass = "border-destructive";
              bgClass = "bg-destructive/5";
            }

            return (
              <motion.div
                key={item}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 ${borderClass} ${bgClass} transition-colors`}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${isCorrect ? 'bg-success text-white' : isWrong ? 'bg-destructive text-white' : 'bg-muted text-foreground/50'}`}>
                  {idx + 1}
                </div>
                
                <span className={`flex-1 font-medium ${textClass}`}>{item}</span>

                {!showFeedback && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0 || disabled}
                      className="p-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === currentOrder.length - 1 || disabled}
                      className="p-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {!showFeedback && (
        <button
          onClick={() => onConfirm(currentOrder)}
          className="btn-primary w-full mt-4"
        >
          Submit Order
        </button>
      )}

      {showFeedback && (
        <div className="mt-4 p-4 rounded-xl bg-muted text-sm">
          <p className="font-semibold mb-2">Correct Order:</p>
          <ol className="list-decimal pl-5 space-y-1">
            {correctOrder.map(item => (
              <li key={item} className="text-foreground/80">{item}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
