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
  INITIAL_WORKSTATIONS,
  INITIAL_HERMES_STATE,
  INITIAL_SKILLS,
  INITIAL_TASKS,
  INITIAL_MESSAGES,
  INITIAL_AUDIT_LOGS,
  INITIAL_WORKFLOWS,
} from '../data/initialState';
import { checkHermesLive, discoverHermesSkills, executeHermesTask, fetchLiveAgents, sendHermesMessage } from '../services/liveHermesService';

interface OfficeContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

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
  const [agents, setAgents] = useState<Agent[]>([PRIMARY_AGENT_MR_SUNAN]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(PRIMARY_AGENT_MR_SUNAN.id);
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
    const assignedAgent = agents.find(a => a.id === agentId) ?? PRIMARY_AGENT_MR_SUNAN;
    const taskId = `task_${Date.now()}`;
    const nowStr = new Date().toTimeString().split(' ')[0];
    const newTask: Task = {
      id: taskId,
      title,
      description,
      priority,
      status: 'RUNNING',
      assignedAgentId: assignedAgent.id,
      assignedAgentName: assignedAgent.name,
      requiredSkills: reqSkills || [],
      progressPercent: 5,
      createdAt: nowStr,
      startedAt: nowStr,
      logs: [`[${nowStr}] [LIVE] Task submitted to Hermes runtime: ${title}`],
      artifacts: [],
    };

    setTasks(prev => [newTask, ...prev]);
    addAuditLog('HERMES_GATE', 'TASK_SUBMITTED', `Live Hermes execution started for "${title}" [${priority}]`, priority === 'CRITICAL' ? 'RITUAL' : 'INFO');

    void executeHermesTask(title, description).then(result => {
      const finishedAt = new Date().toTimeString().split(' ')[0];
      setTasks(prev => prev.map(task => task.id === taskId ? {
        ...task,
        status: result.status === 'completed' ? 'COMPLETED' : 'FAILED',
        progressPercent: result.status === 'completed' ? 100 : task.progressPercent,
        completedAt: finishedAt,
        logs: [...task.logs, `[${finishedAt}] [LIVE] ${result.response ?? result.error ?? 'Hermes returned no report.'}`],
      } : task));
      addAuditLog('HERMES_GATE', result.status === 'completed' ? 'TASK_COMPLETED' : 'TASK_FAILED', result.response ?? result.error ?? 'Hermes returned no report.', result.status === 'completed' ? 'INFO' : 'ERROR');
    }).catch(error => {
      const finishedAt = new Date().toTimeString().split(' ')[0];
      setTasks(prev => prev.map(task => task.id === taskId ? {
        ...task,
        status: 'FAILED',
        completedAt: finishedAt,
        logs: [...task.logs, `[${finishedAt}] [ERROR] ${error instanceof Error ? error.message : String(error)}`],
      } : task));
      addAuditLog('HERMES_GATE', 'TASK_FAILED', error instanceof Error ? error.message : String(error), 'ERROR');
    });
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

    void sendHermesMessage(content).then(result => {
      const responder = targetAgent || agents.find(a => a.id === selectedAgentId) || PRIMARY_AGENT_MR_SUNAN;
      const replyMsg: A2AMessage = {
        id: `msg_reply_${Date.now()}`,
        senderId: responder.id,
        senderName: responder.name,
        receiverId: 'user_high_priest',
        receiverName: 'High Priest (You)',
        timestamp: new Date().toTimeString().substring(0, 5),
        content: result.response ?? 'Hermes returned no response.',
        status: 'delivered',
      };
      setMessages(prev => [...prev, replyMsg]);
      addAuditLog('HERMES_GATE', 'A2A_RESPONSE', 'Live Hermes response received.', 'INFO');
    }).catch(error => {
      addAuditLog('HERMES_GATE', 'A2A_FAILURE', error instanceof Error ? error.message : String(error), 'ERROR');
    });
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
      model: 'Hermes runtime (unverified)',
      status: 'SYNC_PENDING',
      currentAction: 'Awaiting live Hermes binding verification...',
      workstationId: targetWsId,
      isPrimary: false,
      avatarTheme: 'Occult Summoned Agent',
      skills: data.skills.map(s => ({ name: s, proficiency: 'Advanced' })),
      position: targetWs ? targetWs.position : { col: 6, row: 6 },
      spriteColor: '#9e172c',
      hermesBound: false,
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
    addAuditLog('HERMES_GATE', 'DIAGNOSTIC_PING', 'Executing live Hermes health probe...', 'RITUAL');
    try {
      const result = await checkHermesLive();
      setHermesState(prev => ({
        ...prev,
        connected: result.connected,
        latencyMs: result.latencyMs ?? 0,
        lastPing: result.verifiedAt,
        activeModel: result.activeModel ?? 'Hermes runtime',
        bindingStatus: result.connected ? 'BOUND' : 'DISCONNECTED',
      }));
      setAgents(prev => prev.map(agent => agent.id === PRIMARY_AGENT_MR_SUNAN.id ? {
        ...agent,
        status: result.connected ? 'AVAILABLE' : 'UNAVAILABLE',
        model: result.activeModel ?? 'Hermes runtime',
        hermesBound: result.connected,
        currentAction: result.connected ? 'Bound to live Hermes runtime.' : 'Hermes runtime unavailable.',
      } : agent));
      addAuditLog('HERMES_GATE', result.connected ? 'PING_SUCCESS' : 'PING_FAILURE', result.connected ? `Live Hermes responded in ${result.latencyMs ?? 0}ms.` : (result.error ?? 'Hermes unavailable.'), result.connected ? 'INFO' : 'ERROR');
    } catch (error) {
      setHermesState(prev => ({ ...prev, connected: false, bindingStatus: 'DISCONNECTED', lastPing: new Date().toISOString() }));
      addAuditLog('HERMES_GATE', 'PING_FAILURE', error instanceof Error ? error.message : String(error), 'ERROR');
    }
  };

  const syncHermesSkills = async () => {
    addAuditLog('HERMES_GATE', 'SKILL_SYNC', 'Querying live Hermes skill registry...', 'RITUAL');
    try {
      const result = await discoverHermesSkills();
      const discovered = result.skills.map((name, index): SkillItem => ({
        id: `hermes_skill_${index}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        name,
        category: 'Hermes runtime',
        description: 'Discovered from the live Hermes skill registry.',
        isHermesNative: true,
        isAvailable: true,
      }));
      setSkills(discovered);
      addAuditLog('HERMES_GATE', 'SKILL_SYNC_COMPLETE', `Discovered ${discovered.length} skills from the live Hermes registry.`, 'INFO');
    } catch (error) {
      addAuditLog('HERMES_GATE', 'SKILL_SYNC_FAILED', error instanceof Error ? error.message : String(error), 'ERROR');
    }
  };

  const updateHermesUrl = (url: string) => {
    setHermesState(prev => ({ ...prev, gatewayUrl: url }));
    addAuditLog('HERMES_GATE', 'CONFIG_UPDATE', `Hermes Gateway URL updated to: ${url}`);
  };

  useEffect(() => {
    void testHermesConnection();
    void syncHermesSkills();
    void fetchLiveAgents().then(result => {
      setAgents(current => current.map(agent => {
        const core = result.agents.find(item => item.id === agent.id);
        if (!core) return agent;
        return {
          ...agent,
          name: core.name,
          title: core.role.name,
          department: core.department,
          role: core.role.name,
          model: core.modelBinding.primaryModelId,
          status: core.status === 'READY' ? 'AVAILABLE' : core.status === 'ERROR' ? 'ERROR' : 'UNAVAILABLE',
          currentAction: core.status === 'READY' ? 'Agent Core ready.' : `Agent Core ${core.status.toLowerCase()}.`,
          hermesBound: core.status === 'READY',
          core,
        };
      }));
      addAuditLog('AGENT_CORE', 'SYNC_COMPLETE', `Loaded ${result.agents.length} persistent agent definition(s).`, 'INFO');
    }).catch(error => {
      addAuditLog('AGENT_CORE', 'SYNC_FAILED', error instanceof Error ? error.message : String(error), 'ERROR');
    });
  }, []);

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
