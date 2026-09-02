export default function Welcome({ onStart }) {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-900 text-gray-100">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-purple-400 mb-3">
          ✍️ Barnhart
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          From blank page to finished book.
        </p>

        <button
          onClick={onStart}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold text-lg transition mb-12"
        >
          Start Writing →
        </button>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">
              Draft with AI that stays out of the way
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Five writing modes — freewrite, outline, character bios, edit, and
              expand. The AI runs on your own machine through Ollama, so your
              manuscript never leaves your computer and there's no per-word
              billing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">
              Edit your actual book
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Everything you generate flows into a single manuscript you can
              edit directly. Chapters are detected automatically as you write.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">
              Export to anywhere
            </h2>
            <p className="text-gray-400 leading-relaxed">
              ePub for Kindle, Apple Books, and Kobo. Print-ready PDF at 6×9
              trade paperback size. HTML for the web. Markdown for everything
              else. One manuscript, every format.
            </p>
          </section>

          <section className="border border-gray-700 rounded-lg p-5 bg-gray-800/50">
            <h2 className="text-lg font-semibold text-gray-200 mb-2">
              Before you start
            </h2>
            <p className="text-gray-400 leading-relaxed mb-3">
              Barnhart needs Ollama running locally. It's free and open source.
            </p>
            <ol className="text-gray-400 leading-relaxed list-decimal list-inside space-y-1">
              <li>
                Install it from{' '}
                <a
                  href="https://ollama.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline"
                >
                  ollama.com
                </a>
              </li>
              <li>
                Pull a model:{' '}
                <code className="bg-gray-900 px-1.5 py-0.5 rounded text-sm">
                  ollama pull qwen2.5:3b
                </code>
              </li>
              <li>Come back and start writing.</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
