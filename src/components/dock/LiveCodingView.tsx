import React, { useState } from 'react';
import { Play, Copy, Check, FileCode, SplitSquareVertical } from 'lucide-react';

interface CodeFile {
  name: string;
  path: string;
  language: string;
  content: string;
}

const SAMPLE_FILES: CodeFile[] = [
  {
    name: 'index.tsx',
    path: 'src/index.tsx',
    language: 'typescript',
    content: `import React, { useState } from 'react';
import { OfficeMap } from '@/components/OfficeMap';

export default function TenebirisOffice() {
  const [agents, setAgents] = useState(8);
  const [hermesBound, setHermesBound] = useState(true);

  return (
    <main className="w-screen h-screen bg-[#09090F] text-[#E8E4E9]">
      <OfficeMap activeZone="supreme_command" />
    </main>
  );
}`,
  },
  {
    name: 'agent_orchestrator.ts',
    path: 'src/hermes/orchestrator.ts',
    language: 'typescript',
    content: `export class HermesOrchestrator {
  private primaryAgent = 'Mr Sunan';
  private runtimeUrl = 'http://localhost:8000';

  async dispatchTask(taskId: string, payload: unknown) {
    console.log(\`[HERMES] Dispatching task \${taskId} to \${this.primaryAgent}\`);
    return { status: 'EXECUTION_BOUND', timestamp: Date.now() };
  }
}`,
  },
  {
    name: 'hermes_adapter.py',
    path: 'services/api/hermes_adapter.py',
    language: 'python',
    content: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Hermes Adapter Gateway")

class TaskRequest(BaseModel):
    task_id: str
    assigned_agent: str
    skills: list[str]

@app.post("/api/hermes/execute")
async def execute_task(req: TaskRequest):
    return {"status": "SUCCESS", "execution_id": f"exec_{req.task_id}"}
`,
  },
];

export const LiveCodingView: React.FC = () => {
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runOutput, setRunOutput] = useState<string | null>(null);

  const currentFile = SAMPLE_FILES[activeFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    setIsRunning(true);
    setRunOutput('Compiling module via tsx...');
    setTimeout(() => {
      setIsRunning(false);
      setRunOutput('✓ Module executed with 0 errors. Hermes hot-reload verified.');
    }, 800);
  };

  const lines = currentFile.content.split('\n');

  return (
    <div className="h-full w-full flex flex-col bg-[#09090F] font-mono text-xs overflow-hidden">
      {/* File Tabs Header */}
      <div className="flex items-center justify-between border-b border-[#9E172C]/40 bg-[#0E0C16] px-2 py-1 select-none shrink-0 gap-1">
        <div className="flex space-x-1 overflow-x-auto min-w-0 flex-1">
          {SAMPLE_FILES.map((file, idx) => (
            <button
              key={file.name}
              onClick={() => {
                setActiveFileIndex(idx);
                setRunOutput(null);
              }}
              className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-t text-[10.5px] transition-all shrink-0 ${
                activeFileIndex === idx
                  ? 'bg-[#14121C] text-[#39C5CF] border-t-2 border-[#39C5CF] font-semibold'
                  : 'text-[#A69EA9] hover:text-[#E8E4E9] hover:bg-[#14121C]/60'
              }`}
            >
              <FileCode className="w-3 h-3 text-[#39C5CF]" />
              <span className="truncate">{file.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={handleCopy}
            className="p-1 rounded bg-[#14121C] hover:bg-[#490D1B] text-[#A69EA9] hover:text-[#E8E4E9] transition-all"
            title="Copy Code"
          >
            {copied ? <Check className="w-3 h-3 text-[#39C5CF]" /> : <Copy className="w-3 h-3" />}
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#490D1B] hover:bg-[#9E172C] text-[#E8E4E9] font-sans text-[10px] font-semibold transition-all disabled:opacity-50"
          >
            <Play className="w-2.5 h-2.5 fill-current text-[#39C5CF]" />
            <span>{isRunning ? 'Run...' : 'Run'}</span>
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="flex-1 overflow-y-auto p-3 flex text-[11px] leading-relaxed">
        {/* Line Numbers */}
        <div className="text-[#4F4A5E] select-none text-right pr-4 border-r border-[#9E172C]/20 shrink-0 font-mono">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code Content */}
        <div className="pl-4 flex-1 text-[#E8E4E9] font-mono overflow-x-auto select-text">
          {lines.map((line, i) => (
            <div key={i} className="whitespace-pre">
              {line.startsWith('import ') || line.startsWith('export ') ? (
                <span>
                  <span className="text-[#D7263D] font-bold">
                    {line.split(' ')[0]}
                  </span>{' '}
                  <span className="text-[#A69EA9]">{line.substring(line.indexOf(' ') + 1)}</span>
                </span>
              ) : line.includes('function ') || line.includes('class ') ? (
                <span>
                  <span className="text-[#D7263D] font-bold">
                    {line.includes('function') ? 'function ' : 'class '}
                  </span>
                  <span className="text-[#39C5CF]">
                    {line.replace(/(function|class)/, '')}
                  </span>
                </span>
              ) : line.includes('const ') || line.includes('return ') ? (
                <span>
                  <span className="text-[#D7263D] font-bold">
                    {line.trim().startsWith('const') ? 'const ' : 'return '}
                  </span>
                  <span className="text-[#E8E4E9]">
                    {line.replace(/(const|return)/, '')}
                  </span>
                </span>
              ) : line.includes('//') ? (
                <span className="text-[#7A7280] italic">{line}</span>
              ) : (
                <span className="text-[#E8E4E9]">{line}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Test Execution Output Banner */}
      {runOutput && (
        <div className="border-t border-[#9E172C]/40 bg-[#14121C] px-3 py-1.5 text-[10.5px] text-[#39C5CF] flex items-center justify-between">
          <span>{runOutput}</span>
          <button onClick={() => setRunOutput(null)} className="text-[#A69EA9] hover:text-[#E8E4E9]">
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
