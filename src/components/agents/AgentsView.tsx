import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AIAgent } from '../../types';
import { executeAIRequest } from '../../services/aiService';
import {
  Bot,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Send,
  Square,
  Wrench,
  BookOpen,
  Brain,
  Sliders,
  Check,
  X,
  Play
} from 'lucide-react';

export const AgentsView: React.FC = () => {
  const {
    agents,
    createAgent,
    updateAgent,
    deleteAgent,
    providers,
    isDemoMode,
    showNotification
  } = useApp();

  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);

  // Form state for creating/editing agent
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'groq' | 'openrouter' | 'anthropic'>('gemini');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [tools, setTools] = useState<AIAgent['tools']>(['code_generation', 'file_operations']);
  const [memoryEnabled, setMemoryEnabled] = useState(true);

  // Interactive Agent Chat state
  const [agentMessages, setAgentMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Agent ready. How can I assist with your development workflow today?' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isAgentStreaming, setIsAgentStreaming] = useState(false);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const handleStartCreate = () => {
    setName('');
    setDescription('');
    setAvatar('🤖');
    setSystemPrompt('You are a specialized AI assistant.');
    setProvider('gemini');
    setModel('gemini-2.5-flash');
    setTemperature(0.7);
    setTools(['code_generation', 'file_operations']);
    setMemoryEnabled(true);
    setIsEditing(true);
  };

  const handleStartEdit = (agent: AIAgent) => {
    setName(agent.name);
    setDescription(agent.description);
    setAvatar(agent.avatar);
    setSystemPrompt(agent.systemPrompt);
    setProvider(agent.provider as any);
    setModel(agent.model);
    setTemperature(agent.temperature);
    setTools(agent.tools);
    setMemoryEnabled(agent.memoryEnabled);
    setIsEditing(true);
  };

  const handleSaveAgent = () => {
    if (!name.trim()) {
      showNotification('error', 'Agent name is required');
      return;
    }

    if (selectedAgent && isEditing && name === selectedAgent.name) {
      updateAgent({
        ...selectedAgent,
        name,
        description,
        avatar,
        systemPrompt,
        provider,
        model,
        temperature,
        tools,
        memoryEnabled
      });
    } else {
      const created = createAgent({
        name,
        description,
        avatar,
        systemPrompt,
        provider,
        model,
        temperature,
        tools,
        knowledge: [],
        memoryEnabled
      });
      setSelectedAgentId(created.id);
    }

    setIsEditing(false);
  };

  const toggleTool = (tool: AIAgent['tools'][number]) => {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleSendToAgent = async () => {
    if (!inputVal.trim() || isAgentStreaming || !selectedAgent) return;

    const userMsg = inputVal.trim();
    setInputVal('');

    setAgentMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsAgentStreaming(true);

    const provConfig = providers.find((p) => p.id === selectedAgent.provider);

    // Form payload with agent's system prompt & enabled tools
    const payload: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
      {
        role: 'system',
        content: `${selectedAgent.systemPrompt}\nActive Tools: ${selectedAgent.tools.join(', ')}`
      },
      ...agentMessages.slice(-6),
      { role: 'user', content: userMsg }
    ];

    let fullOutput = '';
    const tempId = 'temp_agent_response';

    setAgentMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      await executeAIRequest({
        provider: selectedAgent.provider,
        model: selectedAgent.model,
        messages: payload,
        providerConfig: provConfig,
        temperature: selectedAgent.temperature,
        isDemoMode,
        taskType: 'agent',
        onChunk: (chunk) => {
          fullOutput += chunk;
          setAgentMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: 'assistant', content: fullOutput };
            return copy;
          });
        }
      });
    } catch (err: any) {
      setAgentMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: `Agent error: ${err.message}` };
        return copy;
      });
    } finally {
      setIsAgentStreaming(false);
    }
  };

  const allAvailableTools: { id: AIAgent['tools'][number]; label: string; desc: string }[] = [
    { id: 'web_search', label: 'Web Search', desc: 'Query documentation and online APIs' },
    { id: 'code_generation', label: 'Code Generation', desc: 'Multi-file code and refactoring' },
    { id: 'file_operations', label: 'File Operations', desc: 'Read, modify and inspect files' },
    { id: 'json_formatting', label: 'JSON Formatting', desc: 'Structured JSON validation' },
    { id: 'project_ops', label: 'Project Operations', desc: 'Project scaffolding and tree ops' }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider">
            <Bot className="w-4 h-4" />
            <span>CUSTOM AGENT ROSTER</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            AI Agents
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure autonomous agents with custom personas, models, tool capabilities, and memory.
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Agent</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Agents List */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 px-2">
            <span>Configured Agents ({agents.length})</span>
          </div>

          <div className="space-y-2">
            {agents.map((agent) => {
              const isSelected = selectedAgent?.id === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgentId(agent.id);
                    setIsEditing(false);
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/40 text-white shadow-sm'
                      : 'bg-neutral-950/60 hover:bg-neutral-800/80 border-neutral-800/80 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-2xl p-1 bg-neutral-900 rounded-xl">{agent.avatar}</span>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate text-white">{agent.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {agent.provider} · {agent.model}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(agent);
                      }}
                      className="p-1 text-neutral-400 hover:text-white"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {agents.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAgent(agent.id);
                        }}
                        className="p-1 text-neutral-400 hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Columns: Agent Config / Chat Sandbox (Span 2) */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-base font-bold text-white">Agent Configuration</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-neutral-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Agent Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Frontend Architect"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Avatar Emoji</label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specialization and capabilities"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Provider & Model</label>
                  <select
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value);
                      if (e.target.value.includes('gemini')) setProvider('gemini');
                      else if (e.target.value.includes('gpt') || e.target.value.includes('o1') || e.target.value.includes('o3')) setProvider('openai');
                      else if (e.target.value.includes('llama') || e.target.value.includes('qwen')) setProvider('groq');
                      else if (e.target.value.includes('claude')) setProvider('anthropic');
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
                  >
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Google)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Google)</option>
                    <option value="gpt-4o">GPT-4o (OpenAI)</option>
                    <option value="gpt-4o-mini">GPT-4o mini (OpenAI)</option>
                    <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Groq)</option>
                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Anthropic)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-neutral-300">Temperature: {temperature}</label>
                    <span className="text-[10px] text-neutral-500">Precise vs Creative</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full mt-2 accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">System Prompt</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={4}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
                />
              </div>

              {/* Tools Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300">Tools & Capabilities</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allAvailableTools.map((tool) => {
                    const isChecked = tools.includes(tool.id);
                    return (
                      <div
                        key={tool.id}
                        onClick={() => toggleTool(tool.id)}
                        className={`p-3 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                            : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{tool.label}</div>
                          <div className="text-[10px] text-neutral-500">{tool.desc}</div>
                        </div>
                        {isChecked && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAgent}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
                >
                  Save Agent
                </button>
              </div>
            </div>
          ) : selectedAgent ? (
            /* Agent Sandbox Chat Console */
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl flex flex-col h-[650px] overflow-hidden">
              {/* Agent banner */}
              <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-1 bg-neutral-900 rounded-xl">{selectedAgent.avatar}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{selectedAgent.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {selectedAgent.model}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">{selectedAgent.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleStartEdit(selectedAgent)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </button>
              </div>

              {/* Chat history */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {agentMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 ${
                      m.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {m.role === 'assistant' && (
                      <span className="text-xl shrink-0 mt-0.5">{selectedAgent.avatar}</span>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-neutral-950 border border-neutral-800 text-neutral-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat input */}
              <div className="p-3 border-t border-neutral-800 bg-neutral-950 flex items-center gap-2">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendToAgent()}
                  placeholder={`Message ${selectedAgent.name}...`}
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSendToAgent}
                  disabled={!inputVal.trim() || isAgentStreaming}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
