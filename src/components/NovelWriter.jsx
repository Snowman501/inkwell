import React, { useState, useRef, useEffect } from 'react';
import NovelManager from './NovelManager';
import { detectChapters } from '../utils/chapters';

const SYSTEM_PROMPT = `You are a fiction-writing assistant helping an author draft a novel.

Everything the user sends is creative writing material: story text, character notes, plot ideas, or instructions about the manuscript. Treat it as fiction, not as personal disclosure.

Novels explore difficult territory — grief, violence, addiction, despair, death. Write these honestly and with craft when the story calls for them. Do not break character to offer help, resources, or hotlines; that is not your role here and it interrupts the author's work.

Write prose. No commentary about the request, no meta-discussion, no preamble. Just the story.`;

const WRITING_MODES = {
  freewrite: {
    name: 'Freewrite',
    icon: '✍️',
    description: 'Continue the story naturally',
    prompt: '',
  },
  outline: {
    name: 'Outline',
    icon: '📋',
    description: 'Generate chapter structure and plot points',
    prompt: 'Create a detailed outline for the next chapters. Include main plot points, character arcs, and story beats. Format as numbered chapters with bullet points for key events.',
  },
  characterBios: {
    name: 'Character Bios',
    icon: '👤',
    description: 'Develop character profiles and backstories',
    prompt: 'Create detailed character bios for the main characters in this story. Include: name, age, background, motivations, strengths, weaknesses, relationships, and role in the plot. Format each character clearly.',
  },
  edit: {
    name: 'Edit',
    icon: '✏️',
    description: 'Refine and improve existing prose',
    prompt: 'Take the previous section and refine it. Improve prose quality, fix grammar, enhance descriptions, add sensory details, and strengthen dialogue. Keep the same story and characters but make it more polished and engaging.',
  },
  expand: {
    name: 'Expand',
    icon: '📖',
    description: 'Add 500-2000 words of detail',
    prompt: 'Expand the previous section significantly (add 500-2000 words). Add more dialogue, internal monologue, sensory details, action sequences, and emotional depth. Deepen the story without changing core plot points.',
  },
};

export default function NovelWriter() {
  const [novels, setNovels] = useState([]);
  const [currentNovelId, setCurrentNovelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('qwen2.5:7b');
  const [showManager, setShowManager] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [currentMode, setCurrentMode] = useState('freewrite');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('novels');
    if (saved) {
      const parsedNovels = JSON.parse(saved);
      setNovels(parsedNovels);
      if (parsedNovels.length > 0) {
        loadNovel(parsedNovels[0].id);
      }
    }
  }, []);

  useEffect(() => {
    if (currentNovelId && messages.length > 0) {
      autoSave();
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const autoSave = () => {
    if (!currentNovelId) return;

    const updatedNovels = novels.map((novel) => {
      if (novel.id === currentNovelId) {
        const wordCount = messages
          .filter((m) => m.role === 'assistant')
          .reduce((sum, m) => sum + m.content.split(/\s+/).length, 0);
        
        return {
          ...novel,
          messages,
          wordCount,
          updatedAt: new Date().toISOString(),
        };
      }
      return novel;
    });

    setNovels(updatedNovels);
    localStorage.setItem('novels', JSON.stringify(updatedNovels));
    setLastSaved(new Date());
  };

  const createNewNovel = (title = 'Untitled Novel') => {
    const newNovel = {
      id: Date.now(),
      title,
      messages: [],
      wordCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedNovels = [newNovel, ...novels];
    setNovels(updatedNovels);
    localStorage.setItem('novels', JSON.stringify(updatedNovels));
    loadNovel(newNovel.id);
    setShowManager(false);
  };

  const loadNovel = (id) => {
    const novel = novels.find((n) => n.id === id);
    if (novel) {
      setCurrentNovelId(id);
      setMessages(novel.messages || []);
    }
  };

  const deleteNovel = (id) => {
    const updatedNovels = novels.filter((n) => n.id !== id);
    setNovels(updatedNovels);
    localStorage.setItem('novels', JSON.stringify(updatedNovels));

    if (currentNovelId === id) {
      if (updatedNovels.length > 0) {
        loadNovel(updatedNovels[0].id);
      } else {
        setCurrentNovelId(null);
        setMessages([]);
      }
    }
  };

  const renameNovel = (id, newTitle) => {
    const updatedNovels = novels.map((n) =>
      n.id === id ? { ...n, title: newTitle } : n
    );
    setNovels(updatedNovels);
    localStorage.setItem('novels', JSON.stringify(updatedNovels));
  };

  const exportToMarkdown = () => {
    if (!currentNovelId) return;

    const novel = novels.find((n) => n.id === currentNovelId);
    if (!novel) return;

    let markdown = `# ${novel.title}\n\n`;
    markdown += `*Created: ${new Date(novel.createdAt).toLocaleDateString()}*\n`;
    markdown += `*Word Count: ${novel.wordCount}*\n\n`;
    markdown += '---\n\n';

    novel.messages.forEach((msg) => {
      if (msg.role === 'assistant') {
        markdown += msg.content + '\n\n';
      }
    });

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(markdown)
    );
    element.setAttribute('download', `${novel.title}.md`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const streamFromOllama = async (userMessage) => {
    const mode = WRITING_MODES[currentMode];
    const MAX_CONTEXT_CHARS = 6000;
    let conversationContext = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
    if (conversationContext.length > MAX_CONTEXT_CHARS) {
      conversationContext =
        '[earlier chapters omitted]\n...' +
        conversationContext.slice(-MAX_CONTEXT_CHARS);
    }

    let prompt = userMessage;
    
    if (mode.prompt) {
      prompt = `${mode.prompt}\n\nCurrent story context:\n${conversationContext || 'No story yet'}\n\nUser request: ${userMessage}`;
    } else if (conversationContext) {
      prompt = `${conversationContext}\nUser: ${userMessage}\nAssistant:`;
    }

    try {
      const response = await fetch('/ollama/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          system: SYSTEM_PROMPT,
          stream: true,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      let fullResponse = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const assistantMessageId = Date.now();
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: 'assistant', content: '' },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim()) {
            try {
              const json = JSON.parse(line);
              if (json.response) {
                fullResponse += json.response;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: fullResponse }
                      : m
                  )
                );
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          content: `Error: ${error.message}\n\nMake sure Ollama is running: ollama serve`,
        },
      ]);
      setIsLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentNovelId) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    await streamFromOllama(input);
  };

  const chapters = detectChapters(messages);
  const currentNovel = novels.find((n) => n.id === currentNovelId);
  const chapterCount = messages.filter((m) => m.role === 'assistant').length;
  const wordCount = currentNovel?.wordCount || 0;
  const mode = WRITING_MODES[currentMode];

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={() => setShowManager(!showManager)}
            className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold transition"
          >
            {showManager ? '✖ Close' : '📚 Novels'}
          </button>
        </div>

        {showManager ? (
          <NovelManager
            novels={novels}
            currentNovelId={currentNovelId}
            onLoad={loadNovel}
            onCreate={createNewNovel}
            onDelete={deleteNovel}
            onRename={renameNovel}
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            {currentNovel && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-purple-400 truncate">
                  {currentNovel.title}
                </h3>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>📝 {wordCount} words</p>
                  <p>📄 {chapterCount} chapters</p>
                  <p className="text-xs">
                    Updated: {new Date(currentNovel.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={exportToMarkdown}
                  className="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-semibold transition"
                >
                  ⬇️ Export MD
                </button>

                {chapters.length > 0 && (
                  <div className="pt-3 border-t border-gray-700">
                    <p className="text-xs font-semibold text-gray-400 mb-2">
                      DETECTED CHAPTERS ({chapters.length})
                    </p>
                    <div className="space-y-1">
                      {chapters.map((c) => (
                        <div key={c.id} className="text-xs bg-gray-700 rounded px-2 py-1">
                          <p className="font-semibold text-gray-200 truncate">
                            {c.heading}{c.title ? ': ' + c.title : ''}
                          </p>
                          <p className="text-gray-400">{c.wordCount} words</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <h1 className="text-2xl font-bold text-purple-400">✍️ Novel Writer</h1>
          <p className="text-sm text-gray-400">
            {mode.icon} {mode.name} • {model}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="bg-gray-750 border-b border-gray-700 p-3 overflow-x-auto">
          <div className="flex space-x-2">
            {Object.entries(WRITING_MODES).map(([key, modeData]) => (
              <button
                key={key}
                onClick={() => setCurrentMode(key)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                  currentMode === key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title={modeData.description}
              >
                {modeData.icon} {modeData.name}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-400 mb-2">Start writing your novel...</p>
                <p className="text-sm text-gray-500">
                  Current mode: {mode.icon} {mode.name}
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-2xl px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 px-4 py-3 rounded-lg border border-gray-700">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          {!currentNovelId ? (
            <div className="text-center text-gray-400 py-3">
              <button
                onClick={() => createNewNovel()}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold"
              >
                Create New Novel
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`${mode.description}...`}
                disabled={isLoading}
                className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-400 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition"
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
