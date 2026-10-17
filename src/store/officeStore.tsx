import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Agent,
  Workstation,
  Task,
  HermesState,
  SkillItem,
  A2AMessage,
  AuditLog,
  Workflow,
  NavigationTab,
  DockPanelTab,
  TaskPriority,
  TaskStatus,
} from '../types/office';
import {
  PRIMARY_AGENT_MR_SUNAN,
  DEMO_GUILD_AGENTS,
  INITIAL_WORKSTATIONS,
  INITIAL_HERMES_STATE,
  INITIAL_SKILLS,
  INITIAL_TASKS,
  INITIAL_MESSAGES,
  INITIAL_AUDIT_LOGS,
  INITIAL_WORKFLOWS,
} from '../data/initialState';

interface OfficeContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isDemoMode: boolean;
  toggleMode: (demo: boolean) => void;
  agents: Agent[];
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  selectedAgent: Agent;
  workstations: Workstation[];
  tasks: Task[];
  skills: SkillItem[];
  messages: A2AMessage[];
  auditLogs: AuditLog[];
  workflows: Workflow[];
  hermesState: HermesState;
  activeDockTab: DockPanelTab;
  setActiveDockTab: (tab: DockPanelTab) => void;
  isDockOpen: boolean;
  setIsDockOpen: (open: boolean) => void;
  isDockExpanded: boolean;
  setIsDockExpanded: (expanded: boolean) => void;
  cameraFocus: { col: number; row: number } | null;
  setCameraFocus: (focus: { col: number; row: number } | null) => void;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  targetFps: 30 | 60;
  setTargetFps: (fps: 30 | 60) => void;
  effectsEnabled: boolean;
  setEffectsEnabled: (enabled: boolean) => void;
  // Actions
  createTask: (title: string, description: string, priority: TaskPriority, agentId?: string, skills?: string[]) => void;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  retryTask: (taskId: string) => void;
  sendMessage: (content: string, receiverId?: string, mentions?: string[]) => void;
  summonAgent: (data: {
    name: string;
    role: string;
    department: string;
    skills: string[];
    workstationId?: string;
  }) => Agent;
  dismissAgent: (agentId: string) => void;
  assignSkillToAgent: (agentId: string, skillName: string) => void;
  removeSkillFromAgent: (agentId: string, skillName: string) => void;
  testHermesConnection: () => Promise<void>;
  syncHermesSkills: () => Promise<void>;
  updateHermesUrl: (url: string) => void;
  focusAgentWorkstation: (agentId: string) => void;
}

const OfficeContext = createContext<OfficeContextType | null>(null);

export const OfficeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('virtual_office');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true); // default demo mode enables full gothic visual showcase as seen in reference image
  const [agents, setAgents] = useState<Agent[]>(DEMO_GUILD_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent_ajoy'); // matches the reference screenshot inspector initial selection
  const [workstations, setWorkstations] = useState<Workstation[]>(INITIAL_WORKSTATIONS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [skills, setSkills] = useState<SkillItem[]>(INITIAL_SKILLS);
  const [messages, setMessages] = useState<A2AMessage[]>(INITIAL_MESSAGES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
  const [hermesState, setHermesState] = useState<HermesState>(INITIAL_HERMES_STATE);

  // Dock state
  const [activeDockTab, setActiveDockTab] = useState<DockPanelTab>('coding');
  const [isDockOpen, setIsDockOpen] = useState<boolean>(true);
  const [isDockExpanded, setIsDockExpanded] = useState<boolean>(false);

  // Camera & performance
  const [cameraFocus, setCameraFocus] = useState<{ col: number; row: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [targetFps, setTargetFps] = useState<30 | 60>(60);
  const [effectsEnabled, setEffectsEnabled] = useState<boolean>(true);

  // Mode switcher
  const toggleMode = (demo: boolean) => {
    setIsDemoMode(demo);
    if (!demo) {
      // Live Mode: Strict Greenfield mode with Mr Sunan as primary orchestrator
      setAgents([PRIMARY_AGENT_MR_SUNAN]);
      setSelectedAgentId(PRIMARY_AGENT_MR_SUNAN.id);
      addAuditLog('SYSTEM', 'MODE_SWITCH', 'Switched to LIVE MODE. Mr Sunan bound as sole Chief AI Orchestrator.', 'RITUAL');
    } else {
      // Demo Mode: Full guild for inspecting all chambers and workstations
      setAgents(DEMO_GUILD_AGENTS);
      setSelectedAgentId('agent_ajoy');
      addAuditLog('SYSTEM', 'MODE_SWITCH', 'Switched to DEMO MODE. Guild agents summoned across all gothic chambers.', 'INFO');
    }
  };

  const selectedAgent = useMemo(() => {
    const found = agents.find(a => a.id === selectedAgentId);
    return found || agents[0] || PRIMARY_AGENT_MR_SUNAN;
  }, [agents, selectedAgentId]);

  const addAuditLog = (actor: string, action: string, details: string, level: 'INFO' | 'WARN' | 'ERROR' | 'RITUAL' = 'INFO') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: timeStr,
      actor,
      action,
      details,
      level,
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  const createTask = (
    title: string,
    description: string,
    priority: TaskPriority,
    agentId?: string,
    reqSkills?: string[]
  ) => {
    const assignedAgent = agents.find(a => a.id === agentId);
    const nowStr = new Date().toTimeString().split(' ')[0];
    const newTask: Task = {
      id: `task_${Date.now()}`,
      title,
      description,
      priority,
      status: agentId ? 'ASSIGNED' : 'QUEUED',
      assignedAgentId: agentId,
      assignedAgentName: assignedAgent ? assignedAgent.name : 'Unassigned',
      requiredSkills: reqSkills || [],
      progressPercent: 0,
      createdAt: nowStr,
      logs: [
        `[${nowStr}] [INFO] Task created at Task Altar: ${title}`,
        assignedAgent ? `[${nowStr}] [INFO] Assigned to ${assignedAgent.name} (${assignedAgent.role})` : `[${nowStr}] [INFO] Awaiting agent assignment...`
      ],
      artifacts: [],
    };

    setTasks(prev => [newTask, ...prev]);
    addAuditLog(
      assignedAgent ? assignedAgent.name : 'HIGH PRIEST',
      'TASK_ALTAR_CREATE',
      `New task altar vow: "${title}" [${priority}]`,
      priority === 'CRITICAL' ? 'RITUAL' : 'INFO'
    );
  };

  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    const nowStr = new Date().toTimeString().split(' ')[0];
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const updatedLogs = [...t.logs, `[${nowStr}] [STATUS] State changed to ${newStatus}`];
          return {
            ...t,
            status: newStatus,
            progressPercent: newStatus === 'COMPLETED' ? 100 : t.progressPercent,
            completedAt: newStatus === 'COMPLETED' ? nowStr : t.completedAt,
            logs: updatedLogs,
          };
        }
        return t;
      })
    );
    addAuditLog('TASK_ORCHESTRATOR', 'STATE_TRANSITION', `Task ${taskId} moved to ${newStatus}`);
  };

  const retryTask = (taskId: string) => {
    updateTaskStatus(taskId, 'QUEUED');
    addAuditLog('TASK_ALTAR', 'RETRY_INITIATED', `Task ${taskId} requeued for execution attempt.`);
  };

  const sendMessage = (content: string, receiverId: string = 'all', mentions?: string[]) => {
    if (!content.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const targetAgent = agents.find(a => a.id === receiverId);

    const newMsg: A2AMessage = {
      id: `msg_${Date.now()}`,
      senderId: 'user_high_priest',
      senderName: 'High Priest (You)',
      receiverId,
      receiverName: targetAgent ? targetAgent.name : 'Council of Agents',
      timestamp: timeStr,
      content,
      status: 'sent',
      mentions,
    };

    setMessages(prev => [...prev, newMsg]);
    addAuditLog('HIGH PRIEST', 'A2A_COMMUNICATION', `Sent decree to ${newMsg.receiverName}: "${content.substring(0, 30)}..."`);

    // Simulated intelligent response in communication dock after short delay
    setTimeout(() => {
      const responder = targetAgent || agents.find(a => a.id === selectedAgentId) || PRIMARY_AGENT_MR_SUNAN;
      const replyTime = new Date().toTimeString().substring(0, 5);
      const replyMsg: A2AMessage = {
        id: `msg_reply_${Date.now()}`,
        senderId: responder.id,
        senderName: responder.name,
        receiverId: 'user_high_priest',
        receiverName: 'High Priest (You)',
        timestamp: replyTime,
        content: `Menerima instruksi. Sesuai ritual Hermes, saya segera memproses permintaan: "${content.substring(0, 40)}"`,
        status: 'delivered',
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 1200);
  };

  const summonAgent = (data: {
    name: string;
    role: string;
    department: string;
    skills: string[];
    workstationId?: string;
  }): Agent => {
    const nextNumber = String(agents.length + 1).padStart(3, '0');
    const newId = `agent_${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    
    // Pick an unoccupied workstation or generate coordinate
    const availableWs = workstations.find(ws => !agents.some(a => a.workstationId === ws.id));
    const targetWsId = data.workstationId || (availableWs ? availableWs.id : 'ws_council_01');
    const targetWs = workstations.find(ws => ws.id === targetWsId);

    const newAgent: Agent = {
      id: newId,
      agentNumber: nextNumber,
      name: data.name.toUpperCase(),
      title: data.role,
      department: data.department,
      role: data.role,
      model: 'Hermes-3-70B',
      status: 'AVAILABLE',
      currentAction: 'Stationed at assigned altar...',
      workstationId: targetWsId,
      isPrimary: false,
      avatarTheme: 'Occult Summoned Agent',
      skills: data.skills.map(s => ({ name: s, proficiency: 'Advanced' })),
      position: targetWs ? targetWs.position : { col: 6, row: 6 },
      spriteColor: '#9e172c',
      hermesBound: true,
    };

    setAgents(prev => [...prev, newAgent]);
    setSelectedAgentId(newId);
    addAuditLog('ROLE_FORGE', 'AGENT_SUMMONED', `Summoned agent ${newAgent.name} (#${nextNumber}) with role ${newAgent.role}`, 'RITUAL');
    return newAgent;
  };

  const dismissAgent = (agentId: string) => {
    if (agentId === PRIMARY_AGENT_MR_SUNAN.id) {
      addAuditLog('SYSTEM', 'ACTION_DENIED', 'Mr Sunan is the Chief AI Orchestrator and cannot be dismissed.', 'WARN');
      return;
    }
    const target = agents.find(a => a.id === agentId);
    setAgents(prev => prev.filter(a => a.id !== agentId));
    if (selectedAgentId === agentId) {
      setSelectedAgentId(PRIMARY_AGENT_MR_SUNAN.id);
    }
    addAuditLog('COUNCIL', 'AGENT_DISMISSED', `Agent ${target?.name || agentId} returned to the shadows.`, 'INFO');
  };

  const assignSkillToAgent = (agentId: string, skillName: string) => {
    setAgents(prev =>
      prev.map(a => {
        if (a.id === agentId) {
          if (a.skills.some(s => s.name === skillName)) return a;
          return {
            ...a,
            skills: [...a.skills, { name: skillName, proficiency: 'Advanced' }],
          };
        }
        return a;
      })
    );
    addAuditLog('SKILLS_ARCHIVE', 'SKILL_ASSIGNED', `Equipped skill "${skillName}" to agent ${agentId}`);
  };

  const removeSkillFromAgent = (agentId: string, skillName: string) => {
    setAgents(prev =>
      prev.map(a => {
        if (a.id === agentId) {
          return {
            ...a,
            skills: a.skills.filter(s => s.name !== skillName),
          };
        }
        return a;
      })
    );
    addAuditLog('SKILLS_ARCHIVE', 'SKILL_UNASSIGNED', `Removed skill "${skillName}" from agent ${agentId}`);
  };

  const testHermesConnection = async () => {
    addAuditLog('HERMES_GATE', 'DIAGNOSTIC_PING', `Pinging Hermes Gateway at ${hermesState.gatewayUrl}...`);
    try {
      // Simulate real roundtrip handshake
      await new Promise(r => setTimeout(r, 450));
      setHermesState(prev => ({
        ...prev,
        connected: true,
        latencyMs: Math.floor(12 + Math.random() * 8),
        lastPing: 'Just now',
        bindingStatus: 'BOUND',
      }));
      addAuditLog('HERMES_GATE', 'PING_SUCCESS', `Hermes Gateway responded in 14ms. Primary Orchestrator bound.`, 'INFO');
    } catch {
      setHermesState(prev => ({
        ...prev,
        connected: false,
        bindingStatus: 'DISCONNECTED',
      }));
      addAuditLog('HERMES_GATE', 'PING_FAILURE', `Failed to reach Hermes Gateway. Verify host/port.`, 'ERROR');
    }
  };

  const syncHermesSkills = async () => {
    addAuditLog('HERMES_GATE', 'SKILL_SYNC', 'Synchronizing Hermes Skill Registry across active chambers...', 'RITUAL');
    await new Promise(r => setTimeout(r, 600));
    addAuditLog('HERMES_GATE', 'SKILL_SYNC_COMPLETE', `Synchronized ${skills.length} skills with Hermes runtime. All bindings valid.`, 'INFO');
  };

  const updateHermesUrl = (url: string) => {
    setHermesState(prev => ({ ...prev, gatewayUrl: url }));
    addAuditLog('HERMES_GATE', 'CONFIG_UPDATE', `Hermes Gateway URL updated to: ${url}`);
  };

  const focusAgentWorkstation = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    setSelectedAgentId(agentId);
    setCameraFocus(agent.position);

    // Switch dock tab according to agent role/workstation type
    const ws = workstations.find(w => w.id === agent.workstationId);
    if (ws) {
      if (ws.type === 'CODING') setActiveDockTab('coding');
      else if (ws.type === 'CAD') setActiveDockTab('cad');
      else if (ws.type === 'COMMAND') setActiveDockTab('task_execution');
      else if (ws.type === 'RESEARCH') setActiveDockTab('communication');
      else if (ws.type === 'DEVOPS') setActiveDockTab('task_execution');
      else setActiveDockTab('communication');
    }
    setIsDockOpen(true);
  };

  return (
    <OfficeContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isDemoMode,
        toggleMode,
        agents,
        selectedAgentId,
        setSelectedAgentId,
        selectedAgent,
        workstations,
        tasks,
        skills,
        messages,
        auditLogs,
        workflows,
        hermesState,
        activeDockTab,
        setActiveDockTab,
        isDockOpen,
        setIsDockOpen,
        isDockExpanded,
        setIsDockExpanded,
        cameraFocus,
        setCameraFocus,
        zoomLevel,
        setZoomLevel,
        targetFps,
        setTargetFps,
        effectsEnabled,
        setEffectsEnabled,
        createTask,
        updateTaskStatus,
        retryTask,
        sendMessage,
        summonAgent,
        dismissAgent,
        assignSkillToAgent,
        removeSkillFromAgent,
        testHermesConnection,
        syncHermesSkills,
        updateHermesUrl,
        focusAgentWorkstation,
      }}
    >
      {children}
    </OfficeContext.Provider>
  );
};

export const useOffice = () => {
  const context = useContext(OfficeContext);
  if (!context) {
    throw new Error('useOffice must be used within an OfficeProvider');
  }
  return context;
};
