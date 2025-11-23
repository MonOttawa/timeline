import React from 'react';
import { ArrowRight, Check, Zap, Layout, Upload, Palette, Download } from 'lucide-react';


const LandingPage = ({ onStart, onLogin, isLoggedIn, onShowLegal }) => {
    return (
        <div>
            {/* Hero */}
            <header className="py-24 text-center">
                <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight uppercase font-display">
                    Turn Markdown into <br />
                    <span className="bg-yellow-400 px-4 inline-block transform -rotate-1">Beautiful Timelines</span>
                </h1>
                <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-8 text-gray-600 dark:text-gray-300 font-sans">
                    Stop fighting with design tools. Write simple markdown, get a stunning timeline instantly.
                </p>
                <p className="text-lg max-w-xl mx-auto mb-12 text-gray-500 dark:text-gray-400 font-sans">
                    Choose from 3 professional styles: Bauhaus, Neo-Brutalist, or Corporate
                </p>

                {isLoggedIn ? (
                    <div className="flex justify-center gap-4">
                        <button onClick={onStart} className="bg-green-400 text-black !w-auto flex items-center gap-2 px-8 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] border-2 border-black dark:border-white font-bold rounded-lg py-3 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all">
                            Go to Timeline <ArrowRight size={20} />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex flex-wrap justify-center gap-4">
                            <button onClick={onLogin} className="bg-blue-400 text-black !w-auto flex items-center gap-2 px-8 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] border-2 border-black dark:border-white font-bold rounded-lg py-3 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all">
                                Sign In / Create Account
                            </button>
                            <button onClick={onStart} className="bg-green-400 text-black !w-auto flex items-center gap-2 px-8 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] border-2 border-black dark:border-white font-bold rounded-lg py-3 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all">
                                Try Demo <ArrowRight size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No account needed to try • Test all features instantly
                        </p>
                    </div>
                )}
            </header>

            {/* How It Works */}
            <section className="py-16 bg-gray-50 dark:bg-gray-900 -mx-4 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-black text-center mb-16 font-display text-black dark:text-white">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-400 rounded-full mb-6 border-4 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]">
                                <Upload size={36} className="text-black" />
                            </div>
                            <h3 className="text-2xl font-black mb-3 font-display text-black dark:text-white">1. Upload</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Drop your markdown file with dates in <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">*YYYY-MM-DD*</code> format and content separated by <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">---</code>
                            </p>
                        </div>
                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-400 rounded-full mb-6 border-4 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]">
                                <Palette size={36} className="text-black" />
                            </div>
                            <h3 className="text-2xl font-black mb-3 font-display text-black dark:text-white">2. Choose Style</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Select from Bauhaus, Neo-Brutalist, or Corporate styles. Edit your content in real-time with live preview.
                            </p>
                        </div>
                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-400 rounded-full mb-6 border-4 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF]">
                                <Download size={36} className="text-black" />
                            </div>
                            <h3 className="text-2xl font-black mb-3 font-display text-black dark:text-white">3. Export</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Download your timeline as SVG or convert to PNG. Ready for presentations, docs, or social media.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 text-black dark:text-white">
                <h2 className="text-3xl md:text-4xl font-black text-center mb-12 font-display">Why Timeline.MD?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="bg-white dark:bg-gray-800 p-8 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-lg">
                        <Zap size={48} className="mb-4 text-yellow-500" />
                        <h3 className="text-xl font-bold mb-2 font-display">Lightning Fast</h3>
                        <p>Upload your markdown file and see your timeline instantly. Live editing with real-time preview. No configuration needed.</p>
                    </div>
                    {/* Feature 2 */}
                    <div className="bg-white dark:bg-gray-800 p-8 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-lg">
                        <Layout size={48} className="mb-4 text-purple-500" />
                        <h3 className="text-xl font-bold mb-2 font-display">3 Professional Styles</h3>
                        <p>Bauhaus minimalism, bold Neo-Brutalist cards, or elegant Corporate design. Switch between styles instantly.</p>
                    </div>
                    {/* Feature 3 */}
                    <div className="bg-white dark:bg-gray-800 p-8 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-lg">
                        <Check size={48} className="mb-4 text-green-500" />
                        <h3 className="text-xl font-bold mb-2 font-display">Export Ready</h3>
                        <p>Download as SVG or convert to PNG. Perfect for presentations, social media, or documentation. Dark mode supported.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 mt-16 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center gap-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                    <div>
                        <span className="font-semibold">Timeline.MD</span> &copy; 2025
                    </div>
                    <button
                        onClick={onShowLegal}
                        className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors underline decoration-1 underline-offset-2"
                    >
                        Terms of Service
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
