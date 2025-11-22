import React from 'react';
import { ArrowRight, Check, Zap, Layout } from 'lucide-react';
import { NeoButton } from './poemlearning/ui/NeoButton';

const LandingPage = ({ onStart, onLogin, isLoggedIn, onShowLegal }) => {
    return (
        <div>
            {/* Hero */}
            <header className="py-24 text-center">
                <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight uppercase font-display">
                    Turn Markdown into <br />
                    <span className="bg-yellow-400 px-4 inline-block transform -rotate-1">Brutalist Timelines</span>
                </h1>
                <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-12 text-gray-600 text-gray-300 font-sans">
                    Stop fighting with design tools. Write simple markdown, get a stunning neo-brutalist timeline instantly.
                </p>
                <div className="flex justify-center gap-4">

                    <NeoButton onClick={onStart} className="bg-green-400 text-black !w-auto flex items-center gap-2 px-8">
                        {isLoggedIn ? 'Go to Timeline' : 'Get Started'} <ArrowRight size={20} />
                    </NeoButton>
                </div>
            </header>

            {/* Features */}
            <section className="py-16 text-black text-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="bg-white bg-gray-800 p-8 border-4 border-black border-white shadow-[8px_8px_0px_#000] shadow-[8px_8px_0px_#FFF] rounded-lg">
                        <Zap size={48} className="mb-4 text-yellow-500" />
                        <h3 className="text-xl font-bold mb-2 font-display">Lightning Fast</h3>
                        <p>Just drag and drop your markdown file. No configuration needed. It just works.</p>
                    </div>
                    {/* Feature 2 */}
                    <div className="bg-white bg-gray-800 p-8 border-4 border-black border-white shadow-[8px_8px_0px_#000] shadow-[8px_8px_0px_#FFF] rounded-lg">
                        <Layout size={48} className="mb-4 text-purple-500" />
                        <h3 className="text-xl font-bold mb-2 font-display">Neo-Brutalist</h3>
                        <p>Stand out with a bold, high-contrast design that demands attention.</p>
                    </div>
                    {/* Feature 3 */}
                    <div className="bg-white bg-gray-800 p-8 border-4 border-black border-white shadow-[8px_8px_0px_#000] shadow-[8px_8px_0px_#FFF] rounded-lg">
                        <Check size={48} className="mb-4 text-green-500" />
                        <h3 className="text-xl font-bold mb-2 font-display">Export Ready</h3>
                        <p>Download high-quality PNGs ready for your slide decks or social media.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t-4 border-black border-white mt-12 bg-white bg-gray-900">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-left">
                        <h2 className="text-2xl font-black font-display tracking-tighter mb-2">TIMELINE.MD</h2>
                        <p className="text-gray-600 text-gray-400 font-medium">&copy; 2025. All rights reserved.</p>
                    </div>
                    <button
                        onClick={onShowLegal}
                        className="font-bold underline decoration-2 underline-offset-4 hover:text-blue-600 hover:bg-blue-100 px-2 transition-colors"
                    >
                        Terms of Service
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
