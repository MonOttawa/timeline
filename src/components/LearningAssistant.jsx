import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, BookOpen, Brain, List, HelpCircle, Layers, ArrowRight, AlertTriangle, Settings, Key, X, Save, ChevronDown, Search, Edit2, Eye, FolderPlus, History, Trash2, Calendar, GraduationCap } from 'lucide-react';
import { marked } from 'marked';
import { generateContent } from '../lib/providers';
import { sanitizeMarkdownHtml } from '../lib/sanitizeMarkdown';
import { listTimelinesByUser, deleteTimeline, updateTimeline, createTimeline, findTimelineByTitle } from '../lib/api/timelines';
import { getDueFlashcardsCount, getDueFlashcards, createFlashcardReview, updateFlashcardReview, snoozeDueReviewsForCard, getLastReview, checkLearningCache, saveLearningCache } from '../lib/api/learning';
import { useAuth } from '../hooks/useAuth';

// Utilities to safely detect and parse structured learning content
const cleanAndParseJson = (raw) => {
    if (!raw) return null;
    try {
        const clean = raw.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(clean);
    } catch {
        return null;
    }
};

const extractFlashcards = (raw) => {
    const parsed = cleanAndParseJson(raw);
    if (parsed && Array.isArray(parsed.flashcards)) {
        return parsed.flashcards;
    }
    return null;
};

const detectContentMode = (raw) => {
    const parsed = cleanAndParseJson(raw);
    if (!parsed) return null;
    if (Array.isArray(parsed.flashcards)) return 'flashcards';
    if (Array.isArray(parsed.quiz)) return 'quiz';

    const deepDiveKeys = ['eli5', 'keyConcepts', 'buzzwords', 'misconceptions', 'pathToMastery'];
    if (deepDiveKeys.every(k => parsed[k])) return 'deepDive';

    return null;
};

export const LearningAssistant = ({ initialItem = null }) => {
    const { user } = useAuth();
    const [topic, setTopic] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeMode, setActiveMode] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [saveSuccess, setSaveSuccess] = useState(false);
const [deleteConfirmId, setDeleteConfirmId] = useState(null);
const [nextReviewHint, setNextReviewHint] = useState(null);

    // History State
    const [showHistory, setShowHistory] = useState(false);
    const [historyItems, setHistoryItems] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const isCompact = true;
    const [deckLooped, setDeckLooped] = useState(false);

    // Interactive Mode State
    const [flashcardIndex, setFlashcardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [quizState, setQuizState] = useState({
        answers: {}, // questionIndex -> selectedOptionIndex
        showResults: false
    });
    const [dueCardsCount, setDueCardsCount] = useState(0);

    const fetchDueCardsCount = useCallback(async () => {
        if (!user) return 0;

        try {
            const count = await getDueFlashcardsCount(user.id);
            setDueCardsCount(count);
            return count;
        } catch (e) {
            console.warn('Failed to fetch due cards count', e);
            return 0;
        }
    }, [user]);

    // Fetch due cards count
    useEffect(() => {
        if (user) {
            fetchDueCardsCount();
        }
    }, [user, fetchDueCardsCount]);

    const fetchHistory = useCallback(async () => {
        setIsLoadingHistory(true);
        try {
            const result = await listTimelinesByUser(user.id);
            setHistoryItems(result.items);
        } catch (err) {
            console.error('Error fetching history:', err);
            setError('Failed to load history.');
        } finally {
            setIsLoadingHistory(false);
        }
    }, [user]);

    useEffect(() => {
        if (showHistory && user) {
            fetchHistory();
        }
    }, [showHistory, user, fetchHistory]);

    // Load initial item if provided (from Dashboard)
    useEffect(() => {
        if (initialItem) {
            handleLoadHistory(initialItem);
        }
    }, [initialItem]);



    const handleLoadHistory = (item) => {
        setResult(item.content);
        // Try to extract topic from title "Topic - Mode"
        const detectedMode = detectContentMode(item.content);
        if (item.title && item.title.includes(' - ')) {
            const [extractedTopic, extractedMode] = item.title.split(' - ');
            setTopic(extractedTopic);
            // Map mode string back to key if possible, or just leave activeMode null/custom
            const modeMap = {
                'Explain': 'explain',
                'Key Points': 'summary',
                'Study Cards': 'flashcards',
                'Knowledge Check': 'quiz',
                'Blind Spots': 'missing',
                'Action Plan': 'stepByStep'
            };
            // Reverse lookup or simple lowercase check
            const matchedKey = Object.keys(modeMap).find(key => extractedMode.includes(key));
            const modeKey = matchedKey ? modeMap[matchedKey] : detectedMode || 'custom';
            setActiveMode(modeKey);
        } else {
            setTopic(item.title);
            setActiveMode(detectedMode || 'custom');
        }
        setShowHistory(false);
        setIsEditing(false);
    };

    const handleDeleteHistory = async (id) => {
        try {
            await deleteTimeline(id);
            setHistoryItems(historyItems.filter(item => item.id !== id));
            setDeleteConfirmId(null);
        } catch (err) {
            console.error('Error deleting item:', err);
            setError('Failed to delete item.');
        }
    };

    const handleReviewMode = async () => {
        if (!user) {
            setError('You must be logged in to review cards.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Fetch due cards
            const items = await getDueFlashcards(user.id);

            if (items.length === 0) {
                setError('No cards due for review! 🎉');
                setDueCardsCount(0);
                setLoading(false);
                return;
            }

            // Transform reviews into flashcard format
            const flashcards = items.map(review => ({
                question: review.question || `Card from: ${review.topic}`,
                answer: review.answer || `Review this card (ID: ${review.card_id})`,
                reviewId: review.id,
                cardId: review.card_id,
                topic: review.topic
            }));

            // Set result as JSON flashcards
            const flashcardData = { flashcards };
            setResult(JSON.stringify(flashcardData));
            setActiveMode('flashcards');
            setFlashcardIndex(0);
            setIsFlipped(false);
            setDeckLooped(false);
            setDueCardsCount(flashcards.length);
            setNextReviewHint(null);
        } catch (err) {
            console.error('Error fetching due cards:', err);
            setError('Failed to load due cards.');
        } finally {
            setLoading(false);
        }
    };

    const checkCache = async (mode, topic) => {
        try {
            const content = await checkLearningCache(topic, mode);
            if (content) {
                console.log('Cache hit!');
                return content;
            }
        } catch (err) {
            console.warn('Cache lookup failed:', err);
        }
        return null;
    };

    const saveToCache = async (mode, topic, content) => {
        try {
            await saveLearningCache(topic, mode, content);
            console.log('Saved to cache');
        } catch (err) {
            console.warn('Failed to save to cache:', err);
        }
    };

    const handleAction = async (mode) => {
        if (!topic.trim()) return;

        setLoading(true);
        setError('');
        setActiveMode(mode);
        setResult('');
        setIsEditing(false);
        setSaveSuccess(false);
        setDeckLooped(false);
        setNextReviewHint(null);

        // Reset interactive states
        setFlashcardIndex(0);
        setIsFlipped(false);
        setQuizState({ answers: {}, showResults: false });

        // Try cache first
        try {
            const cachedContent = await checkCache(mode, topic);
            if (cachedContent) {
                setResult(cachedContent);
                setLoading(false);
                return;
            }
        } catch (e) {
            console.warn('Cache check error', e);
        }

        try {
            const PROMPTS = {
                explain: (t) => `Explain "${t}" to me like I'm 12 years old. Use simple analogies and clear language. Keep it under 200 words.`,
                summary: (t) => `Provide a 5-point summary of "${t}". Format the output as a bulleted list. Keep each point concise.`,
                flashcards: (t) => `Create 5 study flashcards for "${t}". You MUST respond with a valid JSON object with this structure:
{
  "flashcards": [
    {"question": "Question text", "answer": "Answer text"}
  ]
}`,
                quiz: (t) => `Create a short 3-question multiple choice quiz about "${t}". You MUST respond with a valid JSON object with this structure:
{
  "quiz": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The full text of the correct option"
    }
  ]
}`,
                missing: (t) => `What are some key concepts or nuances about "${t}" that people often miss or misunderstand? Provide 3 distinct points.`,
                stepByStep: (t) => `Provide a step-by-step guide to learning or mastering "${t}". Break it down into 5 actionable steps.`,
                deepDive: (t) => `Provide a comprehensive deep dive on "${t}". You MUST respond with a valid JSON object with the following structure:

{
  "eli5": "Simple explanation using analogies (2-3 sentences)",
  "keyConcepts": [
    {"concept": "Concept name", "explanation": "Brief explanation"}
  ],
  "buzzwords": [
    {"term": "Term", "definition": "Definition"}
  ],
  "misconceptions": [
    {"misconception": "Common misconception", "reality": "The actual truth"}
  ],
  "pathToMastery": [
    {"step": "Step description", "focus": "What to focus on"}
  ],
  "books": [
    {"title": "Book Title", "author": "Author Name", "description": "Brief description of why this book is essential"}
  ],
  "experts": [
    {"name": "Expert Name", "expertise": "What they're known for"}
  ]
}

IMPORTANT: 
- Include 5-7 books in the "books" array
- Ensure all JSON is valid and properly escaped
- Do not include any text outside the JSON object
- Make sure to close all brackets and braces properly`
            };

            const messages = [
                {
                    role: 'system',
                    content: 'You are a helpful AI tutor. Provide clear, accurate, and educational content.'
                },
                {
                    role: 'user',
                    content: PROMPTS[mode](topic)
                }
            ];

            const content = await generateContent(messages);
            setResult(content);

            // Save to cache in background
            saveToCache(mode, topic, content);
        } catch (err) {
            console.error('AI Generation error:', err);
            let userMessage = err.message;

            if (err.message.includes('API key not configured') || err.message.includes('No model selected')) {
                userMessage = 'Please configure your AI provider and model in Settings (⚙️ icon in header).';
            }

            setError(userMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleNextCard = (total) => {
        if (flashcardIndex < total - 1) {
            setFlashcardIndex(flashcardIndex + 1);
            setIsFlipped(false);
            setDeckLooped(false);
        } else {
            // At end: wrap to first card and note completion
            setFlashcardIndex(0);
            setIsFlipped(false);
            setDeckLooped(true);
        }
    };

    const handlePrevCard = () => {
        if (flashcardIndex > 0) {
            setFlashcardIndex(flashcardIndex - 1);
            setIsFlipped(false);
        }
    };

    const handleQuizAnswer = (questionIndex, optionIndex) => {
        setQuizState(prev => ({
            ...prev,
            answers: {
                ...prev.answers,
                [questionIndex]: optionIndex
            }
        }));
    };

    // SuperMemo-2 Algorithm for calculating next review
    const calculateNextReview = (rating, previousReview = null) => {
        // Default values for new cards
        let interval = 1; // days
        let repetitions = 0;
        let easeFactor = 2.5;

        if (previousReview) {
            interval = previousReview.interval || 1;
            repetitions = previousReview.repetitions || 0;
            easeFactor = previousReview.ease_factor || 2.5;
        }

        // Rating: 1=Again, 2=Hard, 3=Good, 4=Easy
        if (rating < 3) {
            // Failed - reset
            interval = 1;
            repetitions = 0;
        } else {
            // Passed
            repetitions += 1;

            if (repetitions === 1) {
                interval = 1;
            } else if (repetitions === 2) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }
        }

        // Update ease factor based on rating
        easeFactor = easeFactor + (0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02));

        // Ensure ease factor doesn't go below 1.3
        if (easeFactor < 1.3) {
            easeFactor = 1.3;
        }

        // Calculate next review date
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + interval);

        return {
            interval,
            repetitions,
            ease_factor: easeFactor,
            next_review: nextReview.toISOString(),
            rating
        };
    };

    const handleRateCard = async (rating) => {
        if (!user) return;

        const cards = extractFlashcards(result) || [];
        const total = cards.length;
        const isLast = total > 0 ? flashcardIndex === total - 1 : false;
        if (!total) return;

        try {
            const card = cards[flashcardIndex];

            // Simple deterministic ID
            const cardId = btoa(unescape(encodeURIComponent(`${topic}-${card.question}`))).substring(0, 15);

            // Try to fetch previous review for this card
            let previousReview = null;
            try {
                previousReview = await getLastReview(user.id, cardId);
            } catch (e) {
                console.warn('Could not fetch previous review', e);
            }

            // Calculate next review using SM-2
            const srsData = calculateNextReview(rating, previousReview);

            // Save review with SRS data. If a previous review exists for this card, update it instead of creating duplicates.
            if (previousReview?.id) {
                await updateFlashcardReview(previousReview.id, {
                    user: user.id,
                    topic: topic,
                    card_id: cardId,
                    question: card.question,
                    answer: card.answer,
                    rating: rating,
                    interval: srsData.interval,
                    repetitions: srsData.repetitions,
                    ease_factor: srsData.ease_factor,
                    next_review: srsData.next_review
                });
            } else {
                await createFlashcardReview({
                    user: user.id,
                    topic: topic,
                    card_id: cardId,
                    question: card.question,
                    answer: card.answer,
                    rating: rating,
                    interval: srsData.interval,
                    repetitions: srsData.repetitions,
                    ease_factor: srsData.ease_factor,
                    next_review: srsData.next_review
                });
            }

            // Make sure any older due entries for this card are pushed to the new schedule
            await snoozeDueReviewsForCard(user.id, cardId, srsData);
            setNextReviewHint({
                interval: srsData.interval,
                date: srsData.next_review
            });
            console.log('Review saved with next review:', srsData.next_review);
        } catch (e) {
            console.warn('Failed to save review', e);
        }

        // Refresh due cards count directly from server so badge stays honest
        const refreshedCount = await fetchDueCardsCount();
        setDueCardsCount(refreshedCount);

        // Move to next card (wrap to start if at end)
        if (total > 0 && !isLast) {
            handleNextCard(total);
        } else if (total > 0 && isLast) {
            // End the review session silently and clear the current content
            setResult('');
            setActiveMode(null);
            setFlashcardIndex(0);
            setIsFlipped(false);
            setDeckLooped(false);
            setDueCardsCount(0);
        }
    };

    const handleToggleEdit = () => {
        if (!isEditing && activeMode === 'deepDive') {
            try {
                // Clean markdown code blocks if present
                const cleanResult = result.replace(/```json\n?|```/g, '').trim();
                const json = JSON.parse(cleanResult);

                // Convert JSON to Markdown for editing
                let md = `# Deep Dive: ${topic}\n\n`;
                md += `## ELI5\n${json.eli5}\n\n`;

                md += `## Key Concepts\n`;
                json.keyConcepts.forEach(item => {
                    md += `### ${item.concept}\n${item.explanation}\n\n`;
                });

                md += `## Buzzwords\n`;
                json.buzzwords.forEach(item => {
                    md += `**${item.term}**: ${item.definition}\n\n`;
                });

                md += `## Common Misconceptions\n`;
                json.misconceptions.forEach(item => {
                    md += `**Misconception**: ${item.misconception}\n`;
                    md += `**Reality**: ${item.reality}\n\n`;
                });

                md += `## Path to Mastery\n`;
                json.pathToMastery.forEach((item, i) => {
                    md += `${i + 1}. **${item.step}**: ${item.focus}\n`;
                });
                md += `\n`;

                md += `## Recommended Books\n`;
                json.books.forEach((book, i) => {
                    md += `${i + 1}. **${book.title}** by *${book.author}*\n${book.description}\n\n`;
                });

                md += `## Known Experts\n`;
                json.experts.forEach(expert => {
                    md += `- **${expert.name}**: ${expert.expertise}\n`;
                });

                setResult(md);
            } catch (e) {
                console.error('Failed to convert JSON to Markdown for editing', e);
                // Fallback: just leave it as is (JSON string)
            }
        }
        setIsEditing(!isEditing);
    };

    const handleSaveToFiles = async () => {
        if (!user) {
            setError('You must be logged in to save files.');
            return;
        }
        if (!result) return;

        setIsSaving(true);
        try {
            const modeLabel = activeMode === 'explain' ? 'Explain' :
                activeMode === 'summary' ? 'Key Points' :
                    activeMode === 'flashcards' ? 'Study Cards' :
                        activeMode === 'quiz' ? 'Knowledge Check' :
                            activeMode === 'missing' ? 'Blind Spots' :
                                activeMode === 'stepByStep' ? 'Action Plan' :
                                    activeMode === 'deepDive' ? 'Deep Dive' : 'Custom';

            // Truncate topic if too long to prevent 400 errors (max 255 usually)
            const safeTopic = topic.length > 150 ? topic.substring(0, 150) + '...' : topic;
            const title = `${safeTopic} - ${modeLabel}`;

            // Check for existing record to prevent duplicates
            const existingRecord = await findTimelineByTitle(user.id, title);

            if (existingRecord) {
                // Update existing record
                await updateTimeline(existingRecord.id, {
                    content: result,
                    updated: new Date().toISOString()
                });
            } else {
                // Create new record
                await createTimeline({
                    user: user.id,
                    title: title,
                    content: result,
                    style: 'bauhaus' // Default style
                });
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error('Save failed:', err);
            const validationErrors = err.data?.data ? Object.entries(err.data.data).map(([key, val]) => `${key}: ${val.message}`).join(', ') : '';
            setError(`Failed to save: ${err.message} ${validationErrors ? `(${validationErrors})` : ''}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Render content based on mode
    const renderContent = () => {
        if (!result) return null;

        const flashcardData = extractFlashcards(result);
        const shouldRenderFlashcards = (activeMode === 'flashcards' || activeMode === 'custom' || !activeMode) && flashcardData && flashcardData.length > 0;

        // Interactive Flashcards
        if (shouldRenderFlashcards) {
            try {
                const cards = flashcardData;

                if (cards.length === 0) return <p>No flashcards found.</p>;

                const card = cards[flashcardIndex];
                const isLast = flashcardIndex === cards.length - 1;

                return (
                    <div className="flex flex-col items-center space-y-6">
                        <div
                            className="w-full max-w-xl h-80 perspective-1000 cursor-pointer group"
                            onClick={() => setIsFlipped(!isFlipped)}
                        >
                            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                                {/* Front */}
                                <div className="absolute w-full h-full backface-hidden bg-white dark:bg-gray-800 border-4 border-black dark:border-white rounded-xl flex flex-col items-center justify-center p-8 text-center shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF]">
                                    <h3 className="text-xl font-bold text-gray-500 mb-4">Question {flashcardIndex + 1}/{cards.length}</h3>
                                    <p className="text-2xl font-bold">{card.question}</p>
                                    <p className="mt-8 text-sm text-gray-400 animate-pulse">(Click to flip)</p>
                                </div>

                                {/* Back */}
                                <div className="absolute w-full h-full backface-hidden bg-purple-100 dark:bg-purple-900/30 border-4 border-purple-500 rounded-xl flex flex-col items-center justify-center p-8 text-center shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rotate-y-180">
                                    <h3 className="text-xl font-bold text-purple-500 mb-4">Answer</h3>
                                    <p className="text-2xl font-bold">{card.answer}</p>
                                </div>
                            </div>
                        </div>

                        {isFlipped && (
                            <div className="grid grid-cols-4 gap-2 w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <button onClick={(e) => { e.stopPropagation(); handleRateCard(1); }} className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-bold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 border-2 border-red-200 dark:border-red-800">Again</button>
                                <button onClick={(e) => { e.stopPropagation(); handleRateCard(2); }} className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-bold rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 border-2 border-orange-200 dark:border-orange-800">Hard</button>
                                <button onClick={(e) => { e.stopPropagation(); handleRateCard(3); }} className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 border-2 border-blue-200 dark:border-blue-800">Good</button>
                                <button onClick={(e) => { e.stopPropagation(); handleRateCard(4); }} className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 border-2 border-green-200 dark:border-green-800">Easy</button>
                            </div>
                        )}

                        {deckLooped && (
                            <div className="text-sm text-green-600 dark:text-green-300 font-bold">
                                Deck complete! Restarted at card 1.
                            </div>
                        )}

                        {nextReviewHint && (
                            <div className="text-xs text-gray-600 dark:text-gray-300 font-semibold">
                                Next review in {nextReviewHint.interval} day{nextReviewHint.interval === 1 ? '' : 's'} • {new Date(nextReviewHint.date).toLocaleDateString()}
                            </div>
                        )}

                        <div className="flex gap-4 items-center">
                            <button
                                onClick={() => handlePrevCard()}
                                disabled={flashcardIndex === 0}
                                className="px-6 py-2 font-bold border-2 border-black dark:border-white rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handleNextCard(cards.length)}
                                className="px-6 py-2 font-bold bg-gray-900 text-white dark:bg-white dark:text-black border-2 border-black dark:border-white rounded-lg hover:translate-y-[-2px] transition-transform"
                            >
                                {isLast ? 'Restart' : 'Next'}
                            </button>
                        </div>
                    </div>
                );
            } catch (e) {
                console.error('Flashcard parsing error', e);
                return <div dangerouslySetInnerHTML={{ __html: sanitizeMarkdownHtml(marked.parse(result)) }} />;
            }
        }

        // Interactive Quiz
        if (activeMode === 'quiz') {
            try {
                const cleanResult = result.replace(/```json\n?|```/g, '').trim();
                const json = JSON.parse(cleanResult);
                const questions = json.quiz || [];

                return (
                    <div className="space-y-8">
                        {questions.map((q, qIdx) => {
                            const selected = quizState.answers[qIdx];

                            return (
                                <div key={qIdx} className="bg-white dark:bg-gray-800 border-4 border-black dark:border-white rounded-xl p-6 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]">
                                    <h3 className="text-xl font-bold mb-4">{qIdx + 1}. {q.question}</h3>
                                    <div className="space-y-3">
                                        {q.options.map((opt, optIdx) => {
                                            let btnClass = "w-full text-left p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium";

                                            if (selected !== undefined) {
                                                if (opt === q.correctAnswer) {
                                                    btnClass = "w-full text-left p-4 border-2 border-green-500 bg-green-100 dark:bg-green-900/30 rounded-lg font-bold text-green-700 dark:text-green-300";
                                                } else if (selected === optIdx) {
                                                    btnClass = "w-full text-left p-4 border-2 border-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg font-bold text-red-700 dark:text-red-300";
                                                } else {
                                                    btnClass += " opacity-50";
                                                }
                                            }

                                            return (
                                                <button
                                                    key={optIdx}
                                                    onClick={() => handleQuizAnswer(qIdx, optIdx)}
                                                    disabled={selected !== undefined}
                                                    className={btnClass}
                                                >
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selected !== undefined && (
                                        <div className={`mt-4 p-3 rounded-lg font-bold ${q.options[selected] === q.correctAnswer ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {q.options[selected] === q.correctAnswer ? '✅ Correct!' : `❌ Incorrect. The answer is: ${q.correctAnswer}`}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            } catch (e) {
                console.error('Quiz parsing error', e);
                return <div dangerouslySetInnerHTML={{ __html: sanitizeMarkdownHtml(marked.parse(result)) }} />;
            }
        }

        // Check if this is a Deep Dive mode with JSON response
        if (activeMode === 'deepDive') {
            try {
                // Clean the result of markdown code blocks if present
                const cleanResult = result.replace(/```json\n?|```/g, '').trim();

                // Try to parse as JSON
                const jsonData = JSON.parse(cleanResult);

                // Render structured Deep Dive content
                return (
                    <div className="space-y-6">
                        <section>
                            <h2 className="text-2xl font-bold mb-3 border-b-2 border-black dark:border-white pb-2">🧒 ELI5 (Explain Like I'm 5)</h2>
                            <p className="text-lg">{jsonData.eli5}</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-3 border-b-2 border-black dark:border-white pb-2">🔑 Key Concepts</h2>
                            <div className="space-y-3">
                                {jsonData.keyConcepts.map((item, index) => (
                                    <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                                        <h3 className="font-bold text-lg mb-1">{item.concept}</h3>
                                        <p>{item.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-3 border-b-2 border-black dark:border-white pb-2">💬 Buzzwords & Definitions</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {jsonData.buzzwords.map((item, index) => (
                                    <div key={index} className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                                        <h3 className="font-bold">{item.term}</h3>
                                        <p className="text-sm">{item.definition}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-3 border-b-2 border-black dark:border-white pb-2">❌ Common Misconceptions</h2>
                            <div className="space-y-3">
                                {jsonData.misconceptions.map((item, index) => (
                                    <div key={index} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-2 border-red-200 dark:border-red-800">
                                        <h3 className="font-bold text-red-700 dark:text-red-300 mb-1">Misconception: {item.misconception}</h3>
                                        <p className="text-green-700 dark:text-green-300"><strong>Reality:</strong> {item.reality}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-3 border-b-2 border-black dark:border-white pb-2">🎯 Path to Mastery</h2>
                            <div className="space-y-3">
                                {jsonData.pathToMastery.map((item, idx) => (
                                    <div key={idx} className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-2 border-green-200 dark:border-green-800">
                                        <h3 className="font-bold text-lg mb-1">Step {idx + 1}: {item.step}</h3>
                                        <p className="text-sm"><strong>Focus:</strong> {item.focus}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-3 border-b-2 border-black dark:border-white pb-2">📚 Recommended Books</h2>
                            <div className="space-y-4">
                                {jsonData.books.map((book, idx) => (
                                    <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
                                        <h3 className="font-bold text-lg mb-1">{idx + 1}. {book.title}</h3>
                                        <p className="text-sm italic mb-2">by {book.author}</p>
                                        <p>{book.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-3 border-b-2 border-black dark:border-white pb-2">👤 Known Experts</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {jsonData.experts.map((expert, index) => (
                                    <div key={index} className="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-lg border-2 border-cyan-200 dark:border-cyan-800">
                                        <h3 className="font-bold">{expert.name}</h3>
                                        <p className="text-sm">{expert.expertise}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                );
            } catch (e) {
                // If JSON parsing fails, fall back to markdown
                console.error('Failed to parse Deep Dive JSON:', e);
                const html = marked.parse(result);
                return <div dangerouslySetInnerHTML={{ __html: sanitizeMarkdownHtml(html) }} />;
            }
        }

        // For all other modes, use markdown
        const html = marked.parse(result);
        return <div dangerouslySetInnerHTML={{ __html: sanitizeMarkdownHtml(html) }} />;
    };

    const hasFlashcardsContent = (extractFlashcards(result) || []).length > 0;
    const modeForTitle = (activeMode === 'flashcards' || ((activeMode === 'custom' || !activeMode) && hasFlashcardsContent))
        ? 'flashcards'
        : activeMode;

    return (
        <div className="max-w-6xl mx-auto p-4 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
                <div>
                    <h1 className="text-2xl font-black font-display text-black dark:text-white mb-1">Learning Workspace</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user ? `${dueCardsCount} cards due • AI-powered learning` : 'Log in to save and review'}
                    </p>
                </div>
                <div className="flex gap-2 md:gap-3 items-center">
                    {user && (
                        <button
                            onClick={handleReviewMode}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-bold border-2 border-purple-500 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000] dark:hover:shadow-[3px_3px_0px_#FFF]"
                            title="Review Due Cards"
                        >
                            <GraduationCap size={18} />
                            <span className="hidden md:inline">Review</span>
                            {dueCardsCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {dueCardsCount}
                                </span>
                            )}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (!user) {
                                setError('Please log in to view your history.');
                                return;
                            }
                            setShowHistory(true);
                        }}
                        className={`p-2 rounded-full border-2 border-black dark:border-white transition-colors ${user ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : 'opacity-50 hover:bg-red-100 dark:hover:bg-red-900/30'}`}
                        title={user ? "My History" : "Log in to view history"}
                    >
                        <History size={22} className={user ? "text-gray-600 dark:text-gray-400" : "text-gray-400 dark:text-gray-600"} />
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => {
                            setTopic(e.target.value);
                            // Reset prior results so action buttons surface immediately for new topics
                            setResult('');
                            setActiveMode(null);
                            setIsEditing(false);
                            setDeckLooped(false);
                        }}
                        placeholder="What do you want to learn? (e.g., Quantum Physics, Baking, History of Rome)"
                        className="w-full pl-10 pr-3 py-3 text-base border-2 border-black dark:border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]"
                    />
                    {topic && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-green-600 dark:text-green-400 animate-pulse">
                            Ready to learn!
                        </div>
                    )}
                </div>
            </div>

            {
                error && (
                    <div className="mb-8 p-4 border-4 border-red-500 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-3 font-bold">
                        <AlertTriangle size={24} />
                        <span>{error}</span>
                    </div>
                )
            }

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {/* Action buttons hidden while showing results/review to keep focus */}
                {topic.trim() && !loading && !result && activeMode !== 'flashcards' && (
                    <>
                        <ActionButton
                            icon={<Brain size={16} />}
                            label="Explain like I'm 12"
                            onClick={() => handleAction('explain')}
                            disabled={!topic || loading}
                            color="bg-pink-300"
                            fullWidth
                        />
                        <ActionButton
                            icon={<List size={16} />}
                            label="Summary"
                            onClick={() => handleAction('summary')}
                            disabled={!topic || loading}
                            color="bg-blue-300"
                            fullWidth
                        />
                        <ActionButton
                            icon={<Layers size={16} />}
                            label="Flashcards"
                            onClick={() => handleAction('flashcards')}
                            disabled={!topic || loading}
                            color="bg-green-300"
                            fullWidth
                        />
                        <ActionButton
                            icon={<HelpCircle size={16} />}
                            label="Quiz"
                            onClick={() => handleAction('quiz')}
                            disabled={!topic || loading}
                            color="bg-yellow-300"
                            fullWidth
                        />
                        <ActionButton
                            icon={<BookOpen size={16} />}
                            label="Blind Spots"
                            onClick={() => handleAction('missing')}
                            disabled={!topic || loading}
                            color="bg-purple-300"
                            fullWidth
                        />
                        <ActionButton
                            icon={<ArrowRight size={16} />}
                            label="Action Plan"
                            onClick={() => handleAction('stepByStep')}
                            disabled={!topic || loading}
                            color="bg-orange-300"
                            fullWidth
                        />
                        <div className="col-span-1 md:col-span-2">
                            <ActionButton
                                icon={<GraduationCap size={16} />}
                                label="Deep Dive"
                                onClick={() => handleAction('deepDive')}
                                disabled={!topic || loading}
                                color="bg-cyan-300"
                                fullWidth
                            />
                        </div>
                    </>
                )}
            </div>

            {
                loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-black dark:border-white mb-4"></div>
                        <p className="text-xl font-bold animate-pulse">Consulting the AI brain...</p>
                    </div>
                )
            }

            {
                result && !loading && (
                    <div className="border-4 border-black dark:border-white rounded-xl p-8 bg-white dark:bg-gray-800 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
                        <div className="flex justify-between items-start mb-6 border-b-4 border-black dark:border-white pb-2">
                            <h3 className="text-2xl font-bold">
                                {modeForTitle === 'explain' && "Simple Explanation"}
                                {modeForTitle === 'summary' && "Key Points"}
                                {modeForTitle === 'flashcards' && "Study Cards"}
                                {modeForTitle === 'quiz' && "Knowledge Check"}
                                {modeForTitle === 'missing' && "Blind Spots"}
                                {modeForTitle === 'stepByStep' && "Action Plan"}
                                {modeForTitle === 'deepDive' && "Deep Dive"}
                            </h3>
                            <div className="flex gap-2">
                                {user && (
                                    <button
                                        onClick={handleSaveToFiles}
                                        disabled={isSaving || saveSuccess}
                                        className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold ${saveSuccess ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    >
                                        {saveSuccess ? (
                                            <>Saved! <Sparkles size={18} /></>
                                        ) : (
                                            <>{isSaving ? 'Saving...' : 'Save to Files'} <FolderPlus size={18} /></>
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={handleToggleEdit}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
                                >
                                    {isEditing ? <><Eye size={18} /> View</> : <><Edit2 size={18} /> Edit</>}
                                </button>
                            </div>
                        </div>

                        {isEditing ? (
                            <textarea
                                value={result}
                                onChange={(e) => setResult(e.target.value)}
                                className="w-full h-96 p-4 font-mono text-sm border-2 border-black dark:border-white rounded-lg bg-gray-50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-4 focus:ring-purple-400"
                            />
                        ) : (
                            <div className="prose dark:prose-invert max-w-none text-lg font-medium">
                                {renderContent()}
                            </div>
                        )}
                    </div>
                )
            }

            {/* History Modal - Portal */}
            {
                showHistory && createPortal(
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] max-w-2xl w-full p-6 max-h-[80vh] flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black flex items-center gap-2">
                                    <History className="text-purple-500" />
                                    My History
                                </h2>
                                <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 pr-2">
                                {isLoadingHistory ? (
                                    <div className="text-center py-12">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-4 border-black dark:border-white mb-2"></div>
                                        <p>Loading history...</p>
                                    </div>
                                ) : historyItems.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <History size={48} className="mx-auto mb-4 opacity-30" />
                                        <p className="text-xl font-bold">No history yet</p>
                                        <p>Saved learning sessions will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {historyItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="border-2 border-black dark:border-white rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex justify-between items-center group cursor-pointer"
                                                onClick={() => handleLoadHistory(item)}
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <h3 className={`font-bold truncate ${isCompact ? 'text-sm' : 'text-base'}`}>{item.title || 'Untitled'}</h3>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 shrink-0">
                                                        <Calendar size={12} />
                                                        {new Date(item.updated).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (deleteConfirmId === item.id) {
                                                            handleDeleteHistory(item.id);
                                                        } else {
                                                            setDeleteConfirmId(item.id);
                                                            // Auto-reset after 3 seconds
                                                            setTimeout(() => setDeleteConfirmId(null), 3000);
                                                        }
                                                    }}
                                                    className={`p-2 rounded transition-all z-10 flex items-center gap-1 ${deleteConfirmId === item.id
                                                        ? 'bg-red-500 text-white w-auto px-3'
                                                        : 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900'
                                                        }`}
                                                    title="Delete"
                                                >
                                                    {deleteConfirmId === item.id ? (
                                                        <span className="text-xs font-bold whitespace-nowrap">Sure?</span>
                                                    ) : (
                                                        <Trash2 size={18} />
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div >
    );
};

const ActionButton = ({ icon, label, onClick, disabled, color, fullWidth = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`
      flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold border-2 border-black dark:border-white rounded-lg
      shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFF] transition-all
      ${fullWidth ? 'w-full' : ''}
      ${disabled
                ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-700'
                : `${color} hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:bg-black active:text-white`
            }
    `}
    >
        {icon}
        {label}
    </button>
);
