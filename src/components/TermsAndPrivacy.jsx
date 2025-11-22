import React from 'react';
import { ArrowLeft } from 'lucide-react';

const TermsAndPrivacy = ({ onBack }) => {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <button
                onClick={onBack}
                className="mb-8 flex items-center gap-2 px-4 py-2 border-2 border-black dark:border-white font-bold rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all"
            >
                <ArrowLeft size={20} />
                Back to Home
            </button>

            <div className="bg-white dark:bg-gray-800 p-8 border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] rounded-lg mb-8">
                <h1 className="text-4xl font-black mb-8 font-display">Terms of Service & Privacy Policy</h1>

                {/* Privacy Policy Section */}
                <section className="mb-12">
                    <h2 className="text-3xl font-black mb-4 font-display">Privacy Policy</h2>
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                        Last updated: January 2025
                    </p>

                    <h3 className="text-xl font-bold mb-2">Information We Collect</h3>
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                        TIMELINE.MD is a client-side application. We do not collect, store, or transmit any personal information.
                        All timeline generation happens locally in your browser.
                    </p>

                    <h3 className="text-xl font-bold mb-2">Cookies</h3>
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                        We do not use cookies or any tracking technologies. Your privacy is our priority.
                    </p>

                    <h3 className="text-xl font-bold mb-2">Data Storage</h3>
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                        Your Markdown files and generated timelines are processed entirely in your browser.
                        We do not have access to your data.
                    </p>

                    <h3 className="text-xl font-bold mb-2">Third-Party Services</h3>
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                        This application does not integrate with any third-party services or analytics platforms.
                    </p>
                </section>

                {/* Terms of Service Section */}
                <section>
                    <h2 className="text-3xl font-black mb-4 font-display">Terms of Service</h2>
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                        Last updated: January 2025
                    </p>

                    <h3 className="text-xl font-bold mb-2">Acceptance of Terms</h3>
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                        By using TIMELINE.MD, you agree to these terms. If you do not agree, please do not use this service.
                    </p>

                    <h3 className="text-xl font-bold mb-2">Use License</h3>
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                        You are granted a personal, non-exclusive license to use TIMELINE.MD for creating timelines.
                        You retain all rights to your content and generated timelines.
                    </p>

                    <h3 className="text-xl font-bold mb-2">Disclaimer</h3>
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                        TIMELINE.MD is provided "as is" without any warranties. We are not liable for any damages
                        arising from your use of this service.
                    </p>

                    <h3 className="text-xl font-bold mb-2">Modifications</h3>
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                        We reserve the right to modify these terms at any time. Continued use of the service
                        constitutes acceptance of any changes.
                    </p>

                    <h3 className="text-xl font-bold mb-2">Contact</h3>
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                        For questions about these terms or privacy policy, please contact us at legal@timeline.md
                    </p>
                </section>
            </div>
        </div>
    );
};

export default TermsAndPrivacy;
