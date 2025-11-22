import React, {
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
  useEffect,
} from "react";
import type { Word } from "../types";
import { WordStatus } from "../types";

interface PoemDisplayProps {
  words: Word[];
  sentenceState: "memorizing" | "recalling" | "completed";

  // For recall state
  currentSentenceIndex?: number;
  userInputs?: Record<number, string>;
  wordValidation?: Record<
    number,
    "correct" | "incorrect" | "unvalidated" | "hinted"
  >;
  activeInputIndex?: number | null;
  wordChoices?: Record<number, string[]>;
  onWordInputChange?: (wordIndex: number, value: string) => void;
  onInputFocus?: (wordIndex: number) => void;
  availableSentences?: {
    index: number;
    status: "locked" | "available" | "completed";
  }[];
  onSelectSentence?: (sentenceIndex: number) => void;
  onIncorrectChoice?: (sentenceIndex: number, wordIndex: number) => void;
  onHasMoreContent?: (hasMore: boolean) => void;
}

// New, more vibrant heatmap color scale
const getHeatmapColor = (strength: number): string => {
  switch (strength) {
    case 0:
      return "bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-200";
    case 1:
      return "bg-orange-200 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200";
    case 2:
      return "bg-yellow-200 dark:bg-yellow-900/60 text-yellow-900 dark:text-yellow-200";
    case 3:
      return "bg-lime-200 dark:bg-lime-900/60 text-lime-900 dark:text-lime-200";
    case 4:
      return "bg-green-300 dark:bg-green-800/70 text-green-900 dark:text-green-100";
    default:
      return "bg-green-400 dark:bg-green-700/80 text-green-900 dark:text-green-50";
  }
};

export const PoemDisplay: React.FC<PoemDisplayProps> = ({
  words,
  sentenceState,
  currentSentenceIndex,
  userInputs = {},
  wordValidation = {},
  activeInputIndex,
  wordChoices = {},
  onWordInputChange,
  onInputFocus,
  availableSentences = [],
  onSelectSentence,
  onIncorrectChoice,
  onHasMoreContent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);
  const [choiceWordIndex, setChoiceWordIndex] = useState<number | null>(null);
  const [choiceError, setChoiceError] = useState<string | null>(null);

  // Mobile detection - must be at top of component before any returns
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const lines = useMemo(() => {
    const result: Word[][] = [];
    let currentLine: Word[] = [];
    words.forEach((word) => {
      currentLine.push(word);
      if (word.isEndOfLine) {
        result.push(currentLine);
        currentLine = [];
      }
    });
    if (currentLine.length > 0) {
      result.push(currentLine);
    }
    return result;
  }, [words]);

  useLayoutEffect(() => {
    if (sentenceState === "recalling") return;
    const calculateLayout = () => {
      if (!containerRef.current || lines.length === 0) return;
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      if (containerWidth <= 0 || containerHeight <= 0) return;

      // Account for container padding (responsive: px-0 py-2 md:p-6) + extra margin for safety
      const availableWidth = containerWidth - 12; // Mobile: minimal padding + safety margin
      const availableHeight = containerHeight - 24;

      const measurer = document.createElement("div");
      measurer.style.fontFamily = "monospace";
      measurer.style.position = "absolute";
      measurer.style.whiteSpace = "nowrap";
      measurer.style.visibility = "hidden";
      measurer.style.lineHeight = "1.75"; // Match leading-loose
      document.body.appendChild(measurer);

      // Find the longest line and simulate word pills with padding
      const textLines = lines.map((line) => line.map((w) => w.text).join(" "));
      const longestLine = textLines.reduce(
        (a, b) => (a.length > b.length ? a : b),
        "",
      );

      let bestFontSize = 1;
      let min = 1,
        max = 300;

      for (let i = 0; i < 12; i++) {
        // More iterations for accuracy
        let mid = (min + max) / 2;
        measurer.style.fontSize = `${mid}px`;
        measurer.innerHTML = "";

        // Simulate actual rendering with word pills
        longestLine.split(" ").forEach((word, idx) => {
          const wordSpan = document.createElement("span");
          // Add padding to match the actual word pills (px-2 py-1 my-1 = 8px horizontal, 4px vertical + 4px margin)
          wordSpan.style.padding = "4px 8px";
          wordSpan.style.margin = "4px";
          wordSpan.style.display = "inline-block";
          wordSpan.style.borderRadius = "6px";
          wordSpan.textContent = word;
          measurer.appendChild(wordSpan);

          // Add space between words (matches the actual spacing)
          if (idx < longestLine.split(" ").length - 1) {
            measurer.appendChild(document.createTextNode(" "));
          }
        });

        const totalWidth = measurer.scrollWidth;
        // Be more conservative - if we're close to the edge, consider it too wide
        if (totalWidth > availableWidth * 0.98) max = mid;
        else {
          min = mid;
          bestFontSize = mid;
        }
      }

      measurer.style.fontSize = `${bestFontSize}px`;
      const lineHeight = measurer.offsetHeight * 1.75; // Match leading-loose
      document.body.removeChild(measurer);
      if (lineHeight <= 0) return;

      setFontSize(bestFontSize);
    };

    const timeoutId = setTimeout(calculateLayout, 50);
    window.addEventListener("resize", calculateLayout);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", calculateLayout);
    };
  }, [lines, sentenceState]);

  useEffect(() => {
    if (sentenceState !== "recalling") {
      setChoiceWordIndex(null);
      setChoiceError(null);
      return;
    }

    const targetIndex =
      activeInputIndex ??
      (() => {
        const firstHidden = words.find(
          (w) =>
            w.sentenceIndex === currentSentenceIndex &&
            w.status === WordStatus.Hidden,
        );
        return firstHidden ? firstHidden.originalIndex : null;
      })();

    if (targetIndex !== null) {
      const selectedValue = userInputs[targetIndex];
      if (!selectedValue || selectedValue.trim().length === 0) {
        setChoiceWordIndex(targetIndex);
        setChoiceError(null);
        return;
      }
    }

    setChoiceWordIndex(null);
    setChoiceError(null);
  }, [
    sentenceState,
    activeInputIndex,
    userInputs,
    words,
    currentSentenceIndex,
  ]);

  const normalizeChoice = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[,;:.?'"""']/g, "");

  const handleSelectWord = (wordIndex: number) => {
    if (sentenceState !== "recalling") return;
    setChoiceWordIndex(wordIndex);
    setChoiceError(null);
    onInputFocus?.(wordIndex);
  };

  const handleChoiceSelect = (choice: string) => {
    if (choiceWordIndex === null) return;
    const targetWord = words.find((w) => w.originalIndex === choiceWordIndex);
    if (!targetWord) return;

    if (normalizeChoice(choice) === normalizeChoice(targetWord.text)) {
      onWordInputChange?.(choiceWordIndex, choice);
      if (import.meta.env.DEV) {
        console.debug("[ChoiceSelect]", "correct", {
          word: targetWord.text,
          choice,
          sentenceIndex: targetWord.sentenceIndex,
          index: choiceWordIndex,
        });
      }
      setChoiceError(null);
      setChoiceWordIndex(null);
    } else {
      if (import.meta.env.DEV) {
        console.debug("[ChoiceSelect]", "incorrect", {
          word: targetWord.text,
          choice,
          sentenceIndex: targetWord.sentenceIndex,
          index: choiceWordIndex,
        });
      }
      onIncorrectChoice?.(targetWord.sentenceIndex, targetWord.originalIndex);
      setChoiceError("Not quite. Try again.");
    }
  };

  // Filter lines: show only 10 sentences at a time on mobile (memorizing and completed states)
  const { displayLines, hasMoreBelow } = useMemo(() => {
    if (
      isMobile &&
      (sentenceState === "memorizing" || sentenceState === "completed")
    ) {
      // Show 10 sentences at a time, centered around current sentence
      // Get unique sentence indices
      const sentenceIndices = new Set<number>();
      lines.forEach((line) => {
        const sentenceIndex = line[0]?.sentenceIndex ?? -1;
        if (sentenceIndex >= 0) sentenceIndices.add(sentenceIndex);
      });

      const sortedIndices = Array.from(sentenceIndices).sort((a, b) => a - b);
      const currentIdx = sortedIndices.indexOf(currentSentenceIndex ?? -1);

      // Show 10 sentences: 5 before, current, 4 after (or adjust to start/end)
      const startIdx = Math.max(0, currentIdx - 5);
      const endIdx = Math.min(sortedIndices.length, startIdx + 10);
      const visibleSentences = new Set(sortedIndices.slice(startIdx, endIdx));

      // Check if there are more sentences below
      const hasMore = endIdx < sortedIndices.length;

      // Filter lines to only show those sentences
      const filtered = lines.filter((line) => {
        const sentenceIndex = line[0]?.sentenceIndex ?? -1;
        return visibleSentences.has(sentenceIndex);
      });

      return { displayLines: filtered, hasMoreBelow: hasMore };
    }
    return { displayLines: lines, hasMoreBelow: false };
  }, [lines, isMobile, sentenceState, currentSentenceIndex]);

  if (sentenceState === "recalling") {
    const currentSentenceWords = words.filter(
      (word) => word.sentenceIndex === currentSentenceIndex,
    );
    if (!currentSentenceWords.length) return null;

    const renderWordOrChoice = (word: Word) => {
      if (word.status === WordStatus.Hidden) {
        const selectedValue = userInputs[word.originalIndex] || "";
        const validationStatus = wordValidation[word.originalIndex];
        const isActive =
          activeInputIndex === word.originalIndex ||
          choiceWordIndex === word.originalIndex;

        let style =
          "inline-flex items-center justify-center px-2 md:px-3 py-1 min-w-[3rem] md:min-w-[4rem] text-4xl md:text-5xl font-mono border-2 rounded-lg transition-all duration-200 outline-none";

        if (validationStatus === "correct") {
          style +=
            " border-green-500 bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-100";
        } else if (validationStatus === "incorrect") {
          style +=
            " border-red-500 bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100";
        } else if (validationStatus === "hinted") {
          style +=
            " border-yellow-400 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
        } else if (selectedValue) {
          style +=
            " border-black dark:border-white bg-white dark:bg-gray-800 text-black dark:text-white";
        } else {
          style +=
            " border-dashed border-black/60 dark:border-white/60 bg-white/10 dark:bg-gray-800/40 text-gray-500 dark:text-gray-300";
        }

        if (isActive && validationStatus !== "correct") {
          style += " ring-4 ring-yellow-400 ring-offset-2";
        }

        const label = selectedValue || "\u00A0\u00A0\u00A0\u00A0";

        return (
          <button
            type="button"
            onClick={() => handleSelectWord(word.originalIndex)}
            className={style}
            aria-label={
              selectedValue
                ? `Selected word ${selectedValue}`
                : "Select missing word"
            }
          >
            <span aria-hidden="true">{label}</span>
          </button>
        );
      }

      let style =
        "transition-all duration-300 inline-block px-2 py-1 rounded-md text-4xl md:text-5xl";
      switch (word.status) {
        case WordStatus.Correct:
          style +=
            " bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200";
          break;
        case WordStatus.Incorrect:
          style += " bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-200";
          break;
        default:
          style += " bg-transparent";
          break;
      }
      return <span className={style}>{word.text}</span>;
    };

    const activeChoices =
      choiceWordIndex !== null ? (wordChoices[choiceWordIndex] ?? []) : [];
    const activeWord =
      choiceWordIndex !== null
        ? words.find((w) => w.originalIndex === choiceWordIndex)
        : null;
    const activeValidation =
      choiceWordIndex !== null ? wordValidation[choiceWordIndex] : undefined;

    return (
      <div className="w-full h-full flex flex-col justify-center items-center text-black dark:text-white">
        <p className="text-center leading-relaxed font-mono">
          {currentSentenceWords.map((word) => (
            <React.Fragment key={word.originalIndex}>
              {renderWordOrChoice(word)}{" "}
            </React.Fragment>
          ))}
        </p>

        {choiceWordIndex !== null && activeChoices.length > 0 && (
          <div className="mt-6 md:mt-8 w-full max-w-2xl border-2 md:border-4 border-black dark:border-white rounded-xl md:rounded-2xl bg-yellow-50 dark:bg-gray-900 p-3 md:p-4 shadow-[4px_4px_0px_#000] md:shadow-[6px_6px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] dark:md:shadow-[6px_6px_0px_#FFF]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base md:text-lg font-bold text-black dark:text-white">
                Select the missing word
              </h3>
              {activeWord && (
                <span className="text-xs font-mono uppercase tracking-wide text-gray-600 dark:text-gray-400">
                  {activeWord.text.length} letters
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
              {activeChoices.map((option) => {
                const isCorrectOption = activeWord
                  ? normalizeChoice(option) === normalizeChoice(activeWord.text)
                  : false;
                const hinted = activeValidation === "hinted" && isCorrectOption;

                const baseClass =
                  "border-2 border-black dark:border-white bg-white dark:bg-gray-700 text-black dark:text-white font-bold py-3 md:py-2 px-3 rounded-lg transition-all text-base md:text-sm";
                const hoverClass =
                  " hover:bg-black hover:text-yellow-300 dark:hover:bg-yellow-400 dark:hover:text-black";
                const hintClass = hinted
                  ? " ring-4 ring-yellow-400 ring-offset-2 bg-yellow-200 text-black"
                  : "";

                return (
                  <button
                    key={`${choiceWordIndex}-${option}`}
                    type="button"
                    onClick={() => handleChoiceSelect(option)}
                    className={`${baseClass}${hoverClass}${hintClass}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {choiceError && (
              <p className="mt-3 text-sm font-mono text-red-600 dark:text-red-400">
                {choiceError}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col min-h-0">
      <div
        ref={containerRef}
        className="w-full flex-grow font-mono bg-white dark:bg-gray-800 px-4 py-2 md:p-6 border-0 md:border-4 border-black dark:border-white shadow-none md:shadow-[8px_8px_0px_#9CA3AF] dark:md:shadow-[8px_8px_0px_#4A5568] rounded-none md:rounded-2xl flex flex-col justify-center md:justify-start text-black dark:text-white overflow-x-hidden overflow-y-auto"
        style={{
          fontSize: fontSize ? `${fontSize}px` : "16px",
          visibility: fontSize ? "visible" : "hidden",
          minHeight: isMobile ? "auto" : "48vh",
        }}
      >
        {displayLines.map((line, lineIndex) => {
          const sentenceIndex = line[0]?.sentenceIndex ?? lineIndex;
          const sentenceMeta = availableSentences.find(
            (meta) => meta.index === sentenceIndex,
          );
          const isLocked = sentenceMeta?.status === "locked";
          const isCurrent = sentenceIndex === currentSentenceIndex;
          const isClickable =
            sentenceState === "memorizing" && onSelectSentence && !isLocked;

          const content = (
            <div className="leading-loose flex flex-row items-center gap-1 w-full">
              {line.map((word) => {
                const heatmapClass = getHeatmapColor(word.strength);
                const isHighlighted =
                  (sentenceState === "completed" &&
                    word.sentenceIndex === currentSentenceIndex) ||
                  (sentenceState === "memorizing" &&
                    word.sentenceIndex === currentSentenceIndex);
                const baseStyle = `transition-all duration-300 px-2 py-1 my-1 rounded-md ${heatmapClass}`;
                const highlightStyle = isHighlighted
                  ? " ring-2 ring-offset-2 ring-yellow-400"
                  : "";
                const lockStyle = isLocked ? " opacity-40" : "";
                return (
                  <span
                    key={word.originalIndex}
                    className={`${baseStyle}${highlightStyle}${lockStyle}`}
                  >
                    {word.text}
                  </span>
                );
              })}
            </div>
          );

          if (isClickable) {
            return (
              <button
                key={lineIndex}
                type="button"
                onClick={() => onSelectSentence?.(sentenceIndex)}
                className={`group text-left w-full rounded-lg cursor-pointer ${isCurrent ? "scale-[1.01] bg-yellow-50 dark:bg-gray-900" : "hover:bg-yellow-100 dark:hover:bg-gray-800"} transition-all`}
              >
                {content}
              </button>
            );
          }

          return (
            <div
              key={lineIndex}
              className={`w-full ${isLocked ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
};
