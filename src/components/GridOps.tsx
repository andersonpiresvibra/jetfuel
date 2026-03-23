
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FlightStatus, FlightData, FlightLog, LogType } from '../types';
import { MOCK_TEAM_PROFILES } from '../data/mockData'; // Importando perfis para designação

import { FlightDetailsModal } from './FlightDetailsModal';
import { StatusBadge } from '../SharedStats';
import { FlightChatWindow } from './management/FlightChatWindow';
import { OperatorCell } from './OperatorCell';
import { AirlineLogo } from './AirlineLogo';

import { 
  LayoutGrid, Clock, UserCheck, Droplet, CheckCircle, 
  ArrowUp, ArrowDown, ArrowUpDown, 
  MessageSquare, FileText, Plane, Pen, BusFront,
  PlaneLanding, ListOrdered, AlertTriangle, Play, Pause, XCircle, Plus, Anchor,
  MapPin, Eye, CheckCheck, X, Save, History, TimerOff, UserPlus, Building2, Bell, Zap,
  MessageCircle, MoreVertical, Search
} from 'lucide-react';

type Tab = 'GERAL' | 'CHEGADA' | 'FILA' | 'DESIGNADOS' | 'ABASTECENDO' | 'FINALIZADO';
type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  key: keyof FlightData | null;
  direction: SortDirection;
}

interface ToastNotification {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'info' | 'warning';
}

import { CreateFlightModal } from './CreateFlightModal';
import { DesigOpr } from './desigopr';
import { Vehicle } from '../types';

interface GridOpsProps {
    flights: FlightData[];
    onUpdateFlights: React.Dispatch<React.SetStateAction<FlightData[]>>;
    vehicles: Vehicle[];
    onNavigate?: (view: any) => void;
    initialTab?: Tab;
}

const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
};

// Função para calcular diferença em minutos entre uma hora (HH:MM) e o momento atual
const getMinutesDiff = (targetTimeStr: string) => {
    const target = parseTime(targetTimeStr);
    const current = new Date();
    return (target.getTime() - current.getTime()) / 60000;
};
const ICAO_CITIES: Record<string, string> = {
  'SBGL': 'GALEÃO',
  'SBGR': 'GUARULHOS',
  'SBSP': 'CONGONHAS',
  'SBRJ': 'ST. DUMONT',
  'SBKP': 'VIRACOPOS',
  'SBNT': 'NATAL',
  'SBSV': 'SALVADOR',
  'SBPA': 'PTO ALEGRE',
  'SBCT': 'CURITIBA',
  'LPPT': 'LISBOA',
  'EDDF': 'FRANKFURT',
  'LIRF': 'FIUMICINO',
  'KMIA': 'MIAMI',
  'KATL': 'ATLANTA',
  'MPTO': 'TOCUMEN',
  'SCEL': 'SANTIAGO',
  'SUMU': 'MONTEVIDÉU',
  'SAEZ': 'EZEIZA',
};

const DELAY_REASONS = [
    "Atraso Chegada Aeronave (Late Arrival)",
    "Solicitação Cia Aérea (Abastecimento Parcial)",
    "Manutenção Equipamento Abastecimento",
    "Manutenção Aeronave (Mecânica)",
    "Indisponibilidade de Posição/Balizamento",
    "Restrição Meteorológica (Raios)",
    "Atraso Operacional (Equipe)",
    "Fluxo Lento / Pressão Hidrante Baixa"
];

const calculateLandingETA = (blockTime: string) => {
    const date = parseTime(blockTime);
    date.setMinutes(date.getMinutes() - 15);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Verifica se houve atraso REAL (Hora Finalização > ETD)
const checkIsDelayed = (flight: FlightData) => {
    if (!flight.endTime || !flight.etd) return false;
    const [h, m] = flight.etd.split(':').map(Number);
    const etdDate = new Date(flight.endTime); 
    etdDate.setHours(h, m, 0, 0);
    // Se EndTime for maior que ETD, houve atraso
    return flight.endTime.getTime() > etdDate.getTime();
};

const calculateTAB = (flight: FlightData) => {
    if (!flight.designationTime || !flight.endTime) return "--:--";
    const diffMs = flight.endTime.getTime() - flight.designationTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const createNewLog = (type: LogType, message: string, author: string = 'GESTOR_MESA'): FlightLog => ({
    id: Date.now().toString(),
    timestamp: new Date(),
    type,
    message,
    author
});

export const GridOps: React.FC<GridOpsProps> = ({ flights, onUpdateFlights, vehicles, onNavigate, initialTab = 'GERAL' }) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  
  useEffect(() => {
      if (initialTab) {
          setActiveTab(initialTab);
      }
  }, [initialTab]);

  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [chatFlight, setChatFlight] = useState<FlightData | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  
  // Estado para controlar visualização de finalizados na aba GERAL
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  
  // Modals e Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [standbyModalFlightId, setStandbyModalFlightId] = useState<string | null>(null);
  const [standbyReason, setStandbyReason] = useState('');
  const [observationModalFlight, setObservationModalFlight] = useState<FlightData | null>(null);
  const [newObservation, setNewObservation] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Delay Justification Modal States
  const [delayModalFlightId, setDelayModalFlightId] = useState<string | null>(null);
  const [delayReasonCode, setDelayReasonCode] = useState('');
  const [delayReasonDetail, setDelayReasonDetail] = useState('');
  const [gridSearchTerm, setGridSearchTerm] = useState('');

  // Assign Operator Modal State
  const [assignModalFlight, setAssignModalFlight] = useState<FlightData | null>(null);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [cancelModalFlight, setCancelModalFlight] = useState<FlightData | null>(null);
  
  // New Confirmation Modals
  const [confirmStartModalFlight, setConfirmStartModalFlight] = useState<FlightData | null>(null);
  const [confirmRemoveOperatorFlight, setConfirmRemoveOperatorFlight] = useState<FlightData | null>(null);
  const [confirmFinishModalFlight, setConfirmFinishModalFlight] = useState<FlightData | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const handleCreateFlight = (newFlight: FlightData) => {
    onUpdateFlights(prev => [newFlight, ...prev]);
    addToast('VOO CRIADO', `Voo ${newFlight.flightNumber} criado com sucesso.`, 'success');
    setIsCreateModalOpen(false);
  };

  // Notifications Logic
  const allNotifications = useMemo(() => {
      const msgs = flights.flatMap(f => (f.messages || []).map(m => ({ ...m, flight: f })));
      // Filtra mensagens que não são do gestor (mensagens recebidas)
      return msgs.filter(m => !m.isManager).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [flights]);

  // Auto-Update Logic (Usando o state setter global)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
        onUpdateFlights(prevFlights => {
            return prevFlights.map(f => {
                const minutesToETD = getMinutesDiff(f.etd);
                // LÓGICA DE AUTOMATIZAÇÃO PARA FILA:
                // Só move para fila se NÃO tiver operador e estiver no prazo crítico
                if (f.status === FlightStatus.CHEGADA && minutesToETD < 60 && !f.operator) {
                    const newLog = createNewLog('SISTEMA', 'Voo movido para FILA automaticamente (ETD < 60min).', 'SISTEMA');
                    return { 
                        ...f, 
                        status: FlightStatus.FILA,
                        logs: [...(f.logs || []), newLog]
                    };
                }
                
                // Simulação de novas informações (ETA update, mensagens, etc)
                if (Math.random() < 0.05) { // 5% chance per flight per 5s
                    const randomChange = Math.random();
                    if (randomChange < 0.3) {
                        // Update ETA slightly
                        // Logic omitted for brevity, keeping simple
                    }
                }

                return f;
            });
        });
    }, 5000);
    return () => clearInterval(interval);
  }, [onUpdateFlights]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (observationModalFlight && newObservation.trim()) {
            handleSaveObservation();
        } else if (delayModalFlightId && delayReasonCode) {
            handleSubmitDelay();
        } else if (cancelModalFlight) {
            confirmCancelFlight();
        } else if (confirmStartModalFlight) {
            handleConfirmStart();
        } else if (confirmFinishModalFlight) {
            handleConfirmFinish();
        } else if (confirmRemoveOperatorFlight) {
            handleConfirmRemoveOperator();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
      observationModalFlight, newObservation, 
      delayModalFlightId, delayReasonCode, 
      cancelModalFlight, confirmStartModalFlight, 
      confirmFinishModalFlight, confirmRemoveOperatorFlight
  ]);

  const addToast = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'info') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, title, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
  };

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  const visibleFlights = useMemo(() => flights.filter(f => !f.isHiddenFromGrid), [flights]);

  const stats = useMemo(() => ({
    total: visibleFlights.length,
    chegada: visibleFlights.filter(f => {
        const minutesToEta = getMinutesDiff(f.eta);
        return f.status === FlightStatus.CHEGADA && !(f.isOnGround && f.positionId) && minutesToEta <= 120;
    }).length,
    // Correção: Fila conta apenas quem está no status FILA e SEM operador (segurança redundante)
    fila: visibleFlights.filter(f => f.status === FlightStatus.FILA && !f.operator).length,
    designados: visibleFlights.filter(f => f.status === FlightStatus.DESIGNADO).length,
    abastecendo: visibleFlights.filter(f => f.status === FlightStatus.ABASTECENDO).length,
    finalizados: visibleFlights.filter(f => f.status === FlightStatus.FINALIZADO || f.status === FlightStatus.CANCELADO).length,
  }), [visibleFlights]);

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'GERAL', label: 'VISÃO GERAL', icon: LayoutGrid, count: stats.total },
    { id: 'CHEGADA', label: 'CHEGADA', icon: PlaneLanding, count: stats.chegada },
    { id: 'FILA', label: 'FILA', icon: ListOrdered, count: stats.fila },
    { id: 'DESIGNADOS', label: 'DESIGNADOS', icon: UserCheck, count: stats.designados },
    { id: 'ABASTECENDO', label: 'ABASTECENDO', icon: Droplet, count: stats.abastecendo },
    { id: 'FINALIZADO', label: 'FINALIZADOS', icon: CheckCircle, count: stats.finalizados },
  ];

  const filteredData = useMemo(() => {
    let base = visibleFlights;
    
    switch (activeTab) {
      case 'CHEGADA': 
        base = visibleFlights.filter(f => {
            const minutesToEta = getMinutesDiff(f.eta);
            return f.status === FlightStatus.CHEGADA && 
                   !(f.isOnGround && f.positionId) && 
                   minutesToEta <= 120;
        });
        break;
      case 'FILA': 
        // REGRA DE OURO: ABA FILA NÃO PODE TER OPERADOR
        base = visibleFlights.filter(f => f.status === FlightStatus.FILA && !f.operator);
        break;
      case 'DESIGNADOS': base = visibleFlights.filter(f => f.status === FlightStatus.DESIGNADO); break;
      case 'ABASTECENDO': base = visibleFlights.filter(f => f.status === FlightStatus.ABASTECENDO); break;
      case 'FINALIZADO': base = visibleFlights.filter(f => f.status === FlightStatus.FINALIZADO || f.status === FlightStatus.CANCELADO); break;
      case 'GERAL': 
        base = visibleFlights.filter(f => {
            if (f.status === FlightStatus.FINALIZADO || f.status === FlightStatus.CANCELADO) {
                return !archivedIds.has(f.id);
            }
            return true;
        });
        break;
      default: base = visibleFlights;
    }

    if (!gridSearchTerm) return base;

    const lowerTerm = gridSearchTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
    return base.filter(f => {
        const flightNum = f.flightNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
        const reg = f.registration.toLowerCase().replace(/[^a-z0-9]/g, '');
        const pos = f.positionId.toLowerCase().replace(/[^a-z0-9]/g, '');
        const airline = f.airline.toLowerCase().replace(/[^a-z0-9]/g, '');
        const operator = (f.operator || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        
        return flightNum.includes(lowerTerm) || 
               reg.includes(lowerTerm) || 
               pos.includes(lowerTerm) || 
               airline.includes(lowerTerm) || 
               operator.includes(lowerTerm);
    });
  }, [activeTab, visibleFlights, archivedIds, gridSearchTerm]);

  const isStreamlinedView = ['FILA', 'DESIGNADOS', 'ABASTECENDO'].includes(activeTab);
  const isFinishedView = activeTab === 'FINALIZADO';

  const handleSort = (key: keyof FlightData) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
    setSortConfig({ key: direction ? key : null, direction });
  };

  const sortedData = useMemo(() => {
    let data = [...filteredData];
    
    // Default sort by isPinned
    if (!sortConfig.key || !sortConfig.direction) {
        return data.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
        });
    }
    
    return data.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      const aValue = (a[sortConfig.key!] ?? '').toString();
      const bValue = (b[sortConfig.key!] ?? '').toString();
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    });
  }, [filteredData, sortConfig]);

  // --- ACTIONS HANDLERS (ATUALIZANDO ESTADO GLOBAL) ---
  const handleMoveToQueue = (flight: FlightData, e: React.MouseEvent) => {
      e.stopPropagation();
      
      // TRAVA LÓGICA: Se tem operador, não pode ir para fila.
      if (flight.operator) {
          addToast('AÇÃO NEGADA', 'Voo com operador designado não pode ir para a fila.', 'warning');
          return;
      }

      const newLog = createNewLog('MANUAL', 'Voo movido para FILA manualmente.', 'GESTOR_MESA');
      onUpdateFlights(prev => prev.map(f => f.id === flight.id ? { 
          ...f, 
          status: FlightStatus.FILA,
          logs: [...(f.logs || []), newLog]
      } : f));
      addToast('VOO NA FILA', `Voo ${flight.flightNumber} adicionado à fila de prioridade.`, 'success');
  };

  const handleManualStart = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newLog = createNewLog('SISTEMA', 'Início de abastecimento confirmado.', 'GESTOR_MESA');
      onUpdateFlights(prev => prev.map(f => f.id === id ? { 
          ...f, 
          status: FlightStatus.ABASTECENDO, 
          startTime: new Date(),
          logs: [...(f.logs || []), newLog]
      } : f));
  };

  const handleManualFinish = (flight: FlightData, e: React.MouseEvent) => {
      e.stopPropagation();
      const minutesToETD = getMinutesDiff(flight.etd);
      if (minutesToETD < 0) {
          setDelayModalFlightId(flight.id);
          setDelayReasonCode('');
          setDelayReasonDetail('');
          return;
      }
      confirmFinish(flight.id, flight.flightNumber);
  };

  const handleCancelFlight = (flight: FlightData, e: React.MouseEvent) => {
      e.stopPropagation();
      setCancelModalFlight(flight);
      setOpenMenuId(null);
  };

  const confirmCancelFlight = () => {
      if (!cancelModalFlight) return;
      
      const newLog = createNewLog('MANUAL', 'Voo CANCELADO manualmente pelo gestor.', 'GESTOR_MESA');
      onUpdateFlights(prev => prev.map(f => f.id === cancelModalFlight.id ? { 
          ...f, 
          status: FlightStatus.CANCELADO,
          logs: [...(f.logs || []), newLog]
      } : f));
      
      addToast('VOO CANCELADO', `Voo ${cancelModalFlight.flightNumber} foi cancelado.`, 'info');
      setCancelModalFlight(null);
  };

  const handleReportCalco = (flight: FlightData, e: React.MouseEvent) => {
      e.stopPropagation();
      const newLog = createNewLog('MANUAL', 'Calço reportado manualmente pelo gestor.', 'GESTOR_MESA');
      onUpdateFlights(prev => prev.map(f => f.id === flight.id ? { 
          ...f, 
          isOnGround: true,
          logs: [...(f.logs || []), newLog]
      } : f));
      addToast('CALÇO REPORTADO', `Aeronave ${flight.registration} (Voo ${flight.flightNumber}) em calço.`, 'success');
      setOpenMenuId(null);
  };

  const confirmFinish = (id: string, flightNumber: string, delayJustification?: string) => {
      let newLog: FlightLog;
      if (delayJustification) {
          newLog = createNewLog('ATRASO', `Finalizado com ATRASO. Justificativa: ${delayJustification}`, 'GESTOR_MESA');
      } else {
          newLog = createNewLog('SISTEMA', 'Abastecimento finalizado no horário.', 'GESTOR_MESA');
      }
      onUpdateFlights(prev => prev.map(f => f.id === id ? { 
          ...f, 
          status: FlightStatus.FINALIZADO, 
          endTime: new Date(),
          delayJustification: delayJustification,
          logs: [...(f.logs || []), newLog]
      } : f));
      addToast(
          delayJustification ? 'ATRASO REGISTRADO' : 'OPERAÇÃO CONCLUÍDA', 
          `Voo ${flightNumber} finalizado${delayJustification ? ' com relatório de atraso' : ''}.`, 
          delayJustification ? 'warning' : 'success'
      );
      setDelayModalFlightId(null);
  };

  const handleSubmitDelay = () => {
      if (delayModalFlightId && delayReasonCode) {
          const flight = flights.find(f => f.id === delayModalFlightId);
          if (flight) {
              const justification = `${delayReasonCode}${delayReasonDetail ? ` - ${delayReasonDetail}` : ''}`;
              confirmFinish(delayModalFlightId, flight.flightNumber, justification);
          }
      }
  };
  
  const handleRemoveStandby = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newLog = createNewLog('MANUAL', 'Removido de Standby. Retomando prioridade.', 'GESTOR_MESA');
      onUpdateFlights(prev => prev.map(f => f.id === id ? { 
          ...f, 
          isStandby: false, 
          standbyReason: undefined,
          logs: [...(f.logs || []), newLog]
      } : f));
  };

  const handleConfirmVisual = (id: string, flightNumber: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setArchivedIds(prev => new Set(prev).add(id));
      
      const newLog = createNewLog('MANUAL', 'Voo arquivado da visão geral pelo gestor.', 'GESTOR_MESA');
      onUpdateFlights(prev => prev.map(f => f.id === id ? {
          ...f,
          isHiddenFromGrid: true,
          logs: [...(f.logs || []), newLog]
      } : f));
      
      addToast('ARQUIVADO', `Voo ${flightNumber} movido para histórico.`, 'info');
  };

  const handleClearFinished = () => {
      onUpdateFlights(prev => prev.map(f => 
          (f.status === FlightStatus.FINALIZADO || f.status === FlightStatus.CANCELADO) 
              ? { ...f, isHiddenFromGrid: true } 
              : f
      ));
      addToast('HISTÓRICO LIMPO', 'Voos finalizados e cancelados foram arquivados.', 'success');
  };

  const handlePinFlight = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onUpdateFlights(prev => prev.map(f => {
          if (f.id === id) {
              const newLog = createNewLog('MANUAL', f.isPinned ? 'Voo desfixado do topo pelo gestor.' : 'Voo fixado no topo pelo gestor.', 'GESTOR_MESA');
              return { ...f, isPinned: !f.isPinned, logs: [...(f.logs || []), newLog] };
          }
          return f;
      }));
      setOpenMenuId(null);
  };

  const handleTrackFlight = (flight: FlightData, e: React.MouseEvent) => {
      e.stopPropagation();
      
      const newLog = createNewLog('MANUAL', 'Rastreamento de voo (Radar) aberto pelo gestor.', 'GESTOR_MESA');
      onUpdateFlights(prev => prev.map(f => f.id === flight.id ? {
          ...f,
          logs: [...(f.logs || []), newLog]
      } : f));

      if (onNavigate) {
          onNavigate('RADAR');
      } else {
          addToast('RASTREAMENTO', `Redirecionando para o radar do voo ${flight.flightNumber}...`, 'info');
      }
      setOpenMenuId(null);
  };

  const handleReforco = (flight: FlightData, e: React.MouseEvent) => {
      e.stopPropagation();
      const newLog = createNewLog('MANUAL', 'Voo redirecionado para REFORÇO (Fila).', 'GESTOR_MESA');
      onUpdateFlights(prev => prev.map(f => f.id === flight.id ? { 
          ...f, 
          status: FlightStatus.FILA,
          operator: undefined,
          designationTime: undefined,
          logs: [...(f.logs || []), newLog]
      } : f));
      addToast('REFORÇO', `Voo ${flight.flightNumber} retornado para a fila.`, 'success');
      setOpenMenuId(null);
  };

  const handleConfirmStart = () => {
      if (!confirmStartModalFlight) return;
      handleManualStart(confirmStartModalFlight.id, { stopPropagation: () => {} } as React.MouseEvent);
      addToast('ABASTECIMENTO INICIADO', `Voo ${confirmStartModalFlight.flightNumber} em abastecimento.`, 'success');
      setConfirmStartModalFlight(null);
  };

  const handleConfirmRemoveOperator = () => {
      if (!confirmRemoveOperatorFlight) return;
      const newLog = createNewLog('MANUAL', 'Operador removido. Voo retornou para a fila.', 'GESTOR_MESA');
      onUpdateFlights(prev => prev.map(f => f.id === confirmRemoveOperatorFlight.id ? { 
          ...f, 
          status: FlightStatus.FILA,
          operator: undefined,
          designationTime: undefined,
          logs: [...(f.logs || []), newLog]
      } : f));
      addToast('OPERADOR REMOVIDO', `Operador removido do voo ${confirmRemoveOperatorFlight.flightNumber}.`, 'info');
      setConfirmRemoveOperatorFlight(null);
  };

  const handleConfirmFinish = () => {
      if (!confirmFinishModalFlight) return;
      handleManualFinish(confirmFinishModalFlight, { stopPropagation: () => {} } as React.MouseEvent);
      setConfirmFinishModalFlight(null);
  };

  // --- ASSIGNMENT LOGIC ---
  const openAssignModal = (flight: FlightData, e: React.MouseEvent) => {
      e.stopPropagation();
      setAssignModalFlight(flight);
      setSelectedOperatorId(null);
  };

  const confirmAssignment = (opId?: string) => {
      const idToUse = opId || selectedOperatorId;
      if (assignModalFlight && idToUse) {
          const operator = MOCK_TEAM_PROFILES.find(op => op.id === idToUse);
          if (!operator) return;

          const newLog = createNewLog('MANUAL', `Operador ${operator.warName} designado manualmente.`, 'GESTOR_MESA');
          
          // IMPORTANTE: Ao designar, o status vai para DESIGNADO, removendo automaticamente da FILA
          onUpdateFlights(prev => prev.map(f => f.id === assignModalFlight.id ? { 
              ...f, 
              status: FlightStatus.DESIGNADO, 
              operator: operator.warName,
              designationTime: new Date(),
              logs: [...(f.logs || []), newLog]
          } : f));

          addToast('DESIGNADO', `Operador ${operator.warName} assumiu voo ${assignModalFlight.flightNumber}.`, 'success');
          setAssignModalFlight(null);
          setSelectedOperatorId(null);
      }
  };

  // Filters operators based on Vehicle Compatibility (SRV vs CTA)
  const getEligibleOperators = (flight: FlightData) => {
      const isCtaRequired = flight.vehicleType === 'CTA';
      
      // Get all active missions to determine status
      const activeMissions = flights.filter(f => f.status !== 'FINALIZADO' && f.status !== 'CANCELADO');

      return MOCK_TEAM_PROFILES.filter(op => {
          const isCtaCapable = op.category === 'ILHA' || op.category === 'VIP';
          if (isCtaRequired) return isCtaCapable;
          return !isCtaCapable; // Para SRV (AERODROMO)
      }).map(op => {
          // Find if operator has an active mission
          const mission = activeMissions.find(m => m.operator?.toLowerCase() === op.warName.toLowerCase());
          
          let dynamicStatus = op.status;
          if (mission) {
              if (mission.status === 'ABASTECENDO') dynamicStatus = 'OCUPADO'; 
              else if (mission.status === 'DESIGNADO') dynamicStatus = 'DESIGNADO';
              else dynamicStatus = 'OCUPADO';
          }
          
          return { ...op, status: dynamicStatus };
      });
  };

  // OBSERVATION HANDLERS
  const handleOpenObservationModal = (flight: FlightData, e: React.MouseEvent) => {
    e.stopPropagation();
    setObservationModalFlight(flight);
    setNewObservation(''); 
    setOpenMenuId(null);
  };

  const handleSaveObservation = () => {
    if (observationModalFlight && newObservation.trim()) {
      const newLog = createNewLog('OBSERVACAO', newObservation.trim(), 'GESTOR_MESA');
      onUpdateFlights(prev => prev.map(f => 
        f.id === observationModalFlight.id 
          ? { ...f, logs: [...(f.logs || []), newLog] } 
          : f
      ));
      addToast('OBSERVAÇÃO REGISTRADA', `Nota adicionada ao voo ${observationModalFlight.flightNumber}.`, 'success');
      setObservationModalFlight(null);
      setNewObservation('');
    }
  };

  // --- HELPER RENDERS ---
  const getDynamicStatus = (f: FlightData) => {
    const minutesToETA = getMinutesDiff(f.eta);
    const minutesToETD = getMinutesDiff(f.etd);

    if (f.status === FlightStatus.FINALIZADO || f.status === FlightStatus.CANCELADO) {
        if (activeTab === 'FINALIZADO') {
            if (f.status === FlightStatus.CANCELADO) return { label: 'CANCELADO', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
            const hasSwap = f.logs.some(l => l.message.toLowerCase().includes('troca') || l.message.toLowerCase().includes('swap'));
            if (hasSwap) return { label: 'COM TROCA', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
            if (checkIsDelayed(f) || f.delayJustification) return { label: 'COM ATRASO', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
            return { label: 'COM SUCESSO', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
        }
        if (activeTab === 'GERAL' && f.status === FlightStatus.FINALIZADO) {
            return { label: 'FINALIZADO', color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500 animate-pulse' };
        }
    }

    if (f.status === FlightStatus.CHEGADA) {
        if (f.isOnGround && f.positionId) return { label: 'CALÇADA', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
        if (f.isOnGround) return { label: 'SOLO', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
        if (minutesToETA < 10) return { label: 'APROXIMAÇÃO', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
        const h = Math.floor(minutesToETA / 60);
        const m = Math.floor(minutesToETA % 60);
        return { label: `${h}H ${m}M`, color: 'text-slate-400 bg-slate-800/50 border-slate-700' };
    }

    if (f.status === FlightStatus.FILA) {
        if (f.isStandby) return { label: 'STAND-BY', color: 'text-slate-400 bg-slate-800 border-slate-600' };
        if (minutesToETD < 20) return { label: '-20M CRÍTICO', color: 'text-red-500 bg-red-500/20 border-red-500 animate-pulse' };
        if (minutesToETD < 25) return { label: '-25M ALERTA', color: 'text-amber-500 bg-amber-500/20 border-amber-500 animate-pulse' };
        if (minutesToETD < 30) return { label: '-30M', color: 'text-amber-400 bg-amber-500/10 border-amber-400/50' };
        if (minutesToETD < 45) return { label: '-45M', color: 'text-yellow-200 bg-yellow-500/10 border-yellow-200/30' };
        return { label: '-1H', color: 'text-slate-300 bg-slate-800 border-slate-600' };
    }

    if (f.status === FlightStatus.DESIGNADO) {
        const elapsed = f.designationTime ? (new Date().getTime() - f.designationTime.getTime()) / 60000 : 0;
        if (elapsed > 15) return { label: 'AGUARDANDO', color: 'text-amber-500 bg-amber-500/10 border-amber-500' };
        if (elapsed > 10) return { label: 'ACOPLANDO', color: 'text-blue-400 bg-blue-500/10 border-blue-400' };
        return { label: 'A CAMINHO', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-400' };
    }

    if (f.status === FlightStatus.ABASTECENDO) {
        const isDelayed = minutesToETD <= 0;
        const isPausado = (f.currentFlowRate ?? 0) === 0;
        // Finalizando se: faltam menos de 10 min OU se já passou de 90% do volume
        const isFinalizando = (minutesToETD < 10 && minutesToETD > 0) || (f.fuelStatus > 90);
        
        let label = 'ABASTECENDO';
        let color = 'text-blue-400 bg-blue-500/20 border-blue-500/30 animate-pulse';
        
        if (isPausado) {
            label = 'PAUSADO';
            color = 'text-amber-500 bg-amber-500/20 border-amber-500 animate-pulse';
        } else if (isFinalizando) {
            label = 'FINALIZANDO';
            color = 'text-blue-300 bg-blue-500/20 border-blue-300';
        }
        
        if (isDelayed) {
            color = 'text-white bg-red-600 border-red-500 animate-pulse';
        }
        
        return { label, color };
    }

    return null;
  };

  const SortableHeader = ({ label, columnKey, className = "" }: { label: string, columnKey: keyof FlightData, className?: string }) => {
    const isActive = sortConfig.key === columnKey;
    return (
      <th 
        className={`px-3 py-4 border-b border-r border-slate-700 bg-slate-900 sticky top-0 cursor-pointer select-none hover:bg-slate-800 transition-all group z-20 ${className}`}
        onClick={() => handleSort(columnKey)}
      >
        <div className={`flex items-center gap-1.5 ${className.includes('text-center') ? 'justify-center' : 'justify-start'}`}>
          <span className={`font-black text-[9px] uppercase tracking-wider transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'}`}>
            {label}
          </span>
          <div className="flex items-center justify-center transition-all">
            {isActive ? (
                sortConfig.direction === 'asc' ? <ArrowUp size={10} className="text-emerald-500" /> : <ArrowDown size={10} className="text-emerald-500" />
            ) : <ArrowUpDown size={8} className="text-slate-700 group-hover:text-slate-400" />}
          </div>
        </div>
      </th>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden selection:bg-emerald-500/30 font-sans relative">
      
      {/* HEADER E TABS */}
      <div className="px-6 h-16 shrink-0 flex items-center justify-between border-b border-slate-800 bg-slate-900 z-40">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 text-slate-950 flex items-center justify-center rounded-lg shadow-neon">
                    <Plane size={16} />
                </div>
                <div>
                  <h1 className="text-[8px] font-black text-slate-600 tracking-[0.3em] uppercase leading-none mb-1">JET OPS</h1>
                  <h2 className="text-sm font-black text-white tracking-tighter uppercase leading-none">Malha Operacional</h2>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            {/* SEARCH FIELD */}
            <div className="relative w-64 h-9">
                <div className="absolute inset-0 bg-slate-950 border border-slate-800 rounded-md flex items-center transition-all focus-within:border-emerald-500/50">
                    <Search size={14} className="shrink-0 text-slate-500 ml-3" />
                    <input 
                        type="text" 
                        placeholder="BUSCAR VOO..." 
                        className="bg-transparent border-none outline-none text-[10px] text-white font-mono uppercase w-full px-3 transition-all h-full"
                        value={gridSearchTerm}
                        onChange={(e) => setGridSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* NOTIFICATION CENTER */}
            <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 rounded-lg transition-all relative ${showNotifications ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                >
                    <Bell size={20} />
                    {allNotifications.length > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
                    )}
                </button>

                {showNotifications && (
                    <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notificações</span>
                            <button onClick={() => setShowNotifications(false)}><X size={14} className="text-slate-500 hover:text-white" /></button>
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                            {allNotifications.length > 0 ? allNotifications.map((msg, i) => (
                                <div key={i} className="p-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors flex gap-3">
                                    <div className="mt-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-white uppercase">{msg.sender}</span>
                                            <span className="text-[9px] font-mono text-slate-500">{msg.timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-tight line-clamp-2">{msg.text}</p>
                                        <span className="text-[9px] font-black text-emerald-500 uppercase mt-1 block tracking-wider">
                                            Voo {msg.flight.flightNumber}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-600 text-xs font-medium">Nenhuma notificação recente.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* BOTÃO CRIAR VOO SOMENTE EM GERAL */}
            {activeTab === 'GERAL' && (
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                    <Plus size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Criar Voo</span>
                </button>
            )}

            {/* BOTÃO LIMPAR FINALIZADOS SOMENTE EM FINALIZADO */}
            {activeTab === 'FINALIZADO' && (
                <button 
                    onClick={handleClearFinished}
                    className="flex items-center gap-2 bg-red-600/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg transition-all active:scale-95"
                >
                    <XCircle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Limpar Histórico</span>
                </button>
            )}
        </div>
      </div>

      <div className="h-12 shrink-0 flex border-b border-slate-800 z-30 overflow-hidden bg-slate-900">
        <nav className="flex w-full">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex-1 h-full px-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-r border-slate-950/20 last:border-r-0
                            ${isActive 
                                ? 'bg-slate-950 text-emerald-400 border-b-2 border-emerald-500' 
                                : 'text-slate-500 hover:bg-slate-800 hover:text-white'}
                        `}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={`flex items-center justify-center px-1.5 min-w-[18px] h-4 text-[9px] font-black rounded-sm ${isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </nav>
      </div>

      {/* GRID CONTAINER */}
      <div className="flex-1 overflow-hidden relative bg-slate-950">
        <div className="w-full h-full overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
              <thead className="z-40">
                  <tr className="h-10 bg-slate-900">
                    {/* LAYOUT CONDICIONAL DE COLUNAS */}
                    {isStreamlinedView ? (
                        <>
                            <SortableHeader label="COMP." columnKey="airlineCode" className="text-center w-24" />
                            <SortableHeader label="V.SAÍDA" columnKey="departureFlightNumber" className="text-center" />
                            <SortableHeader label="ICAO" columnKey="destination" className="text-center" />
                            <SortableHeader label="CID" columnKey="destination" className="text-center" />
                            <SortableHeader label="PREFIXO" columnKey="registration" className="text-center" />
                            <SortableHeader label="POS" columnKey="positionId" className="text-center" />
                            <SortableHeader label="CALÇO" columnKey="eta" className="text-center" />
                            <SortableHeader label="ETD" columnKey="etd" className="text-center" />
                            <SortableHeader label="OPERADOR" columnKey="operator" className="" />
                            <SortableHeader label="FROTA" columnKey="fleet" className="text-center" />
                            {activeTab === 'ABASTECENDO' && (
                                <th className="px-3 border-b border-r border-slate-700 bg-slate-900 sticky top-0 text-center z-20 text-[9px] text-slate-400 uppercase font-black tracking-wider">VAZÃO</th>
                            )}
                        </>
                    ) : isFinishedView ? (
                        <>
                            <SortableHeader label="COMP." columnKey="airlineCode" className="text-center w-24" />
                            <SortableHeader label="PREFIXO" columnKey="registration" className="text-center" />
                            <SortableHeader label="V.SAÍDA" columnKey="departureFlightNumber" className="text-center" />
                            <SortableHeader label="ICAO" columnKey="destination" className="text-center" />
                            <SortableHeader label="CID" columnKey="destination" className="text-center" />
                            <SortableHeader label="POS" columnKey="positionId" className="text-center" />
                            <SortableHeader label="CALÇO" columnKey="eta" className="text-center" />
                            <SortableHeader label="ETD" columnKey="etd" className="text-center" />
                            <SortableHeader label="OPERADOR" columnKey="operator" className="" />
                            <SortableHeader label="FROTA" columnKey="fleet" className="text-center" />
                            <th className="px-3 border-b border-r border-slate-700 bg-slate-900 sticky top-0 text-center z-20 text-[9px] text-slate-400 uppercase font-black tracking-wider">TAB</th>
                            <th className="px-3 border-b border-r border-slate-700 bg-slate-900 sticky top-0 text-center z-20 text-[9px] text-slate-400 uppercase font-black tracking-wider">VAZÃO</th>
                        </>
                    ) : (
                        <>
                            <SortableHeader label="COMP." columnKey="airlineCode" className="text-center w-24" />
                            <SortableHeader label="PREFIXO" columnKey="registration" className="text-center" />
                            <SortableHeader label="MODELO" columnKey="model" className="text-center" />
                            <SortableHeader label="V.CHEG" columnKey="flightNumber" className="text-center" />
                            <SortableHeader label="ETA" columnKey="eta" className="text-center" />
                            <SortableHeader label="V.SAÍDA" columnKey="departureFlightNumber" className="text-center" />
                            <SortableHeader label="ICAO" columnKey="destination" className="text-center" />
                            <SortableHeader label="CID" columnKey="destination" className="text-center" />
                            <SortableHeader label="POS" columnKey="positionId" className="text-center" />
                            <SortableHeader label="CALÇO" columnKey="eta" className="text-center" />
                            <SortableHeader label="ETD" columnKey="etd" className="text-center" />
                            <SortableHeader label="OPERADOR" columnKey="operator" className="" />
                            <SortableHeader label="FROTA" columnKey="fleet" className="text-center" />
                            {activeTab === 'GERAL' && (
                                <th className="px-3 border-b border-r border-slate-700 bg-slate-900 sticky top-0 text-center z-20 text-[9px] text-slate-400 uppercase font-black tracking-wider">VAZÃO</th>
                            )}
                        </>
                    )}
                      
                      <th className="px-3 border-b border-r border-slate-700 bg-slate-900 sticky top-0 text-center z-20 text-[9px] text-slate-400 uppercase font-black tracking-wider">
                          STATUS
                      </th>

                      <th className="px-3 border-b border-slate-700 bg-slate-900 sticky top-0 text-center z-20 text-[9px] text-slate-400 uppercase font-black tracking-wider">
                          AÇÕES
                      </th>
                  </tr>
              </thead>
              <tbody className="text-[11px] font-bold">
                  {sortedData.map((row) => {
                      const dynamicStatus = getDynamicStatus(row);
                      // Verifica se tem mensagens não lidas (não do gestor)
                      const hasUnreadMessages = row.messages?.some(m => !m.isManager) || false;
                      
                      return (
                      <tr 
                          key={row.id} 
                          onClick={() => setSelectedFlight(row)}
                          className={`h-10 border-b border-slate-800/30 cursor-pointer transition-colors hover:bg-slate-900 ${
                              activeTab === 'GERAL' && row.status === FlightStatus.FINALIZADO ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : ''
                          }`}
                      >
                          {/* AIRLINE */}
                          <td className="px-2 border-r border-slate-800/50 text-left">
                              <AirlineLogo airlineCode={row.airlineCode} />
                          </td>

                          {/* RENDERIZAÇÃO CONDICIONAL DAS CÉLULAS */}
                          {isStreamlinedView ? (
                            <>
                                {/* FLIGHT OUT */}
                                <td className="px-2 border-r border-slate-800/50 text-center text-white font-mono tracking-tighter">{row.departureFlightNumber || '--'}</td>

                                {/* ICAO */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-500 font-bold text-[10px]">
                                    {row.destination}
                                </td>

                                {/* CITY */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-black text-[9px] text-slate-400 uppercase tracking-tight">
                                    {ICAO_CITIES[row.destination] || 'EXTERIOR'}
                                </td>

                                {/* REGISTRATION */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-500 tracking-tighter uppercase">{row.registration}</td>

                                {/* POSITION */}
                                <td className="px-2 border-r border-slate-800/50 text-center">
                                    <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 font-mono text-[10px] rounded">{row.positionId}</span>
                                </td>

                                {/* CALÇO (REAL ETA) */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-white font-black bg-slate-900/50">
                                    {row.eta}
                                </td>

                                {/* ETD */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-400">{row.etd}</td>

                                {/* OPERATOR (WITH ASSIGN BUTTON & MESSAGE DOT) */}
                                <td className="px-3 border-r border-slate-800/50 truncate">
                                    {row.operator ? (
                                        <div className="flex items-center justify-between">
                                            <OperatorCell operatorName={row.operator} />
                                            {hasUnreadMessages && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Nova mensagem do operador"></div>
                                            )}
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={(e) => openAssignModal(row, e)}
                                            className="w-full bg-slate-800/50 hover:bg-indigo-500 hover:text-white border border-slate-700 hover:border-indigo-400 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95 text-slate-400 rounded py-1 px-2 text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <UserPlus size={10} /> Designar
                                        </button>
                                    )}
                                </td>

                                {/* FLEET */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-[10px] text-slate-500">
                                    {row.fleet || '--'}
                                </td>

                                {/* VAZÃO (Apenas ABASTECENDO) */}
                                {activeTab === 'ABASTECENDO' && (
                                    <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-400 tracking-tight">
                                        {row.maxFlowRate?.toLocaleString('pt-BR') || '--'}
                                    </td>
                                )}
                            </>
                          ) : isFinishedView ? (
                            <>
                                {/* REGISTRATION */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-500 tracking-tighter uppercase">{row.registration}</td>

                                {/* FLIGHT OUT */}
                                <td className="px-2 border-r border-slate-800/50 text-center text-white font-mono tracking-tighter">{row.departureFlightNumber || '--'}</td>

                                {/* ICAO */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-500 font-bold text-[10px]">
                                    {row.destination}
                                </td>

                                {/* CITY */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-black text-[9px] text-slate-400 uppercase tracking-tight">
                                    {ICAO_CITIES[row.destination] || 'EXTERIOR'}
                                </td>

                                {/* POSITION */}
                                <td className="px-2 border-r border-slate-800/50 text-center">
                                    <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 font-mono text-[10px] rounded">{row.positionId}</span>
                                </td>

                                {/* CALÇO (REAL ETA) */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-white font-black bg-slate-900/50">
                                    {row.eta}
                                </td>

                                {/* ETD */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-400">{row.etd}</td>

                                <td className="px-3 border-r border-slate-800/50 truncate">
                                    {row.operator ? (
                                        <OperatorCell operatorName={row.operator} />
                                    ) : <span className="text-slate-700 italic uppercase text-[9px] pl-2">--</span>}
                                </td>

                                {/* FLEET */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-[10px] text-slate-500">
                                    {row.fleet || '--'}
                                </td>

                                {/* TAB (Exclusivo Finalizados) */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-slate-300">
                                    {calculateTAB(row)}
                                </td>

                                {/* VAZÃO (Exclusivo Finalizados) */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-400 tracking-tight">
                                    {row.maxFlowRate?.toLocaleString('pt-BR') || '--'}
                                </td>
                            </>
                          ) : (
                            <>
                                {/* REGISTRATION */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-500 tracking-tighter uppercase">{row.registration}</td>

                                {/* MODEL */}
                                <td className="px-2 border-r border-slate-800/50 text-center text-slate-400 font-mono text-[10px] font-bold">
                                    {row.model.split('-')[0]}
                                </td>

                                {/* FLIGHT IN */}
                                <td className="px-2 border-r border-slate-800/50 text-center text-white font-mono tracking-tighter">{row.flightNumber}</td>

                                {/* ETA (POUSO ESTIMADO) */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-slate-500">
                                    {calculateLandingETA(row.eta)}
                                </td>

                                {/* FLIGHT OUT */}
                                <td className="px-2 border-r border-slate-800/50 text-center text-white font-mono tracking-tighter">{row.departureFlightNumber || '--'}</td>

                                {/* ICAO */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-500 font-bold text-[10px]">
                                    {row.destination}
                                </td>

                                {/* CITY */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-black text-[9px] text-slate-400 uppercase tracking-tight">
                                    {ICAO_CITIES[row.destination] || 'EXTERIOR'}
                                </td>

                                {/* POSITION */}
                                <td className="px-2 border-r border-slate-800/50 text-center">
                                    <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 font-mono text-[10px] rounded">{row.positionId}</span>
                                </td>

                                {/* CALÇO (REAL ETA) */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-white font-black bg-slate-900/50">
                                    {row.eta}
                                </td>

                                {/* ETD */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-400">{row.etd}</td>

                                {/* OPERATOR (WITH ASSIGN BUTTON & MESSAGE DOT) */}
                                <td className="px-3 border-r border-slate-800/50 truncate">
                                    {row.operator ? (
                                        <div className="flex items-center justify-between">
                                            <OperatorCell operatorName={row.operator} />
                                            {hasUnreadMessages && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Nova mensagem do operador"></div>
                                            )}
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={(e) => openAssignModal(row, e)}
                                            className="w-full bg-slate-800/50 hover:bg-indigo-500 hover:text-white border border-slate-700 hover:border-indigo-400 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95 text-slate-400 rounded py-1 px-2 text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <UserPlus size={10} /> Designar
                                        </button>
                                    )}
                                </td>

                                {/* FLEET */}
                                <td className="px-2 border-r border-slate-800/50 text-center font-mono text-[10px] text-slate-500">
                                    {row.fleet || '--'}
                                </td>

                                {/* VAZÃO (Apenas GERAL) */}
                                {activeTab === 'GERAL' && (
                                    <td className="px-2 border-r border-slate-800/50 text-center font-mono text-emerald-400 tracking-tight">
                                        {row.maxFlowRate?.toLocaleString('pt-BR') || '--'}
                                    </td>
                                )}
                            </>
                          )}
                          
                          {/* STATUS (PILL DESIGN RESTORED) */}
                          <td className="border-r border-slate-800/50 px-3 text-center">
                              {dynamicStatus ? (
                                  <div className={`flex items-center justify-center w-full h-[28px] px-2 rounded text-[9px] font-black uppercase tracking-[0.1em] border ${dynamicStatus.color}`}>
                                      {dynamicStatus.label}
                                  </div>
                              ) : (
                                  <StatusBadge status={row.status} />
                              )}
                              {row.isStandby && (
                                  <span className="block text-[7px] text-amber-500 uppercase mt-1 text-center font-bold tracking-widest">{row.standbyReason}</span>
                              )}
                          </td>
                          
                          <td className="px-2 border-r border-slate-800/50 text-center">
                              <div className="relative">
                                  <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === row.id ? null : row.id); }} className="p-2 rounded-md hover:bg-slate-800 transition-colors text-slate-500 hover:text-white">
                                      <MoreVertical size={16} />
                                  </button>

                                  {openMenuId === row.id && (
                                      <div ref={actionMenuRef} className="absolute right-4 top-10 mt-1 w-56 bg-slate-900 border border-slate-800 rounded-md shadow-2xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                          <div className="p-2 border-b border-slate-800 bg-slate-950/50">
                                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ações - Voo {row.flightNumber}</p>
                                          </div>
                                          <div className="flex flex-col text-xs p-1">
                                              {(() => {
                                                  const btnClass = "w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white rounded flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
                                                  const cancelBtnClass = "w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
                                                  const separator = <div className="h-px bg-slate-800 my-1" />;
                                                  
                                                  const chatBtn = (
                                                      <button 
                                                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} 
                                                          className={btnClass} 
                                                          disabled={!row.operator}
                                                      >
                                                          <MessageSquare size={14} /> Chat do Voo
                                                      </button>
                                                  );

                                                  const obsBtn = (
                                                      <button onClick={(e) => handleOpenObservationModal(row, e)} className={btnClass}>
                                                          <Pen size={14} /> Observações
                                                      </button>
                                                  );

                                                  const cancelBtn = (
                                                      <button onClick={(e) => handleCancelFlight(row, e)} className={cancelBtnClass}>
                                                          <XCircle size={14} /> Cancelar Voo
                                                      </button>
                                                  );

                                                  const pinBtn = (
                                                      <button onClick={(e) => handlePinFlight(row.id, e)} className={btnClass}>
                                                          <Anchor size={14} /> {row.isPinned ? 'Desfixar do topo' : 'Fixar no topo'}
                                                      </button>
                                                  );

                                                  const moveToQueueBtn = (
                                                      <button onClick={(e) => handleMoveToQueue(row, e)} className={btnClass} disabled={!!row.operator}>
                                                          <ListOrdered size={14} /> Mover para Fila
                                                      </button>
                                                  );

                                                  const trackBtn = (disabled: boolean = false) => (
                                                      <button onClick={(e) => handleTrackFlight(row, e)} className={btnClass} disabled={disabled}>
                                                          <MapPin size={14} /> Rastrear Voo
                                                      </button>
                                                  );

                                                  if (activeTab === 'GERAL') {
                                                      return (
                                                          <>
                                                              {moveToQueueBtn}
                                                              {pinBtn}
                                                              <button 
                                                                  onClick={(e) => { handleConfirmVisual(row.id, row.flightNumber, e); setOpenMenuId(null); }} 
                                                                  className={btnClass} 
                                                                  disabled={row.status !== FlightStatus.FINALIZADO && row.status !== FlightStatus.CANCELADO}
                                                              >
                                                                  <CheckCheck size={14} /> Limpar da Lista
                                                              </button>
                                                              {cancelBtn}
                                                              {obsBtn}
                                                              {separator}
                                                              {chatBtn}
                                                          </>
                                                      );
                                                  }

                                                  if (activeTab === 'CHEGADA') {
                                                      return (
                                                          <>
                                                              {trackBtn()}
                                                              {moveToQueueBtn}
                                                              {pinBtn}
                                                              {cancelBtn}
                                                              {obsBtn}
                                                              {separator}
                                                              {chatBtn}
                                                          </>
                                                      );
                                                  }

                                                  if (activeTab === 'FILA') {
                                                      return (
                                                          <>
                                                              {trackBtn(row.isOnGround)}
                                                              {pinBtn}
                                                              {cancelBtn}
                                                              {obsBtn}
                                                              {separator}
                                                              {chatBtn}
                                                          </>
                                                      );
                                                  }

                                                  if (activeTab === 'DESIGNADOS') {
                                                      return (
                                                          <>
                                                              <button onClick={(e) => { e.stopPropagation(); setConfirmStartModalFlight(row); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-slate-300 hover:bg-blue-600 hover:text-white hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] hover:scale-105 active:scale-95 rounded flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                                                  <Play size={14} /> Abastecendo
                                                              </button>
                                                              <button onClick={(e) => { e.stopPropagation(); setConfirmRemoveOperatorFlight(row); setOpenMenuId(null); }} className={btnClass}>
                                                                  <UserCheck size={14} /> Cancelar Designação
                                                              </button>
                                                              {obsBtn}
                                                              {cancelBtn}
                                                              {separator}
                                                              {chatBtn}
                                                          </>
                                                      );
                                                  }

                                                  if (activeTab === 'ABASTECENDO') {
                                                      return (
                                                          <>
                                                              {pinBtn}
                                                              <button onClick={(e) => { e.stopPropagation(); setConfirmFinishModalFlight(row); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-slate-300 hover:bg-emerald-600 hover:text-white hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 rounded flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                                                  <CheckCircle size={14} /> Finalizar
                                                              </button>
                                                              {obsBtn}
                                                              {separator}
                                                              {chatBtn}
                                                          </>
                                                      );
                                                  }

                                                  if (activeTab === 'FINALIZADO') {
                                                      return (
                                                          <>
                                                              <button onClick={(e) => handleReforco(row, e)} className={btnClass}>
                                                                  <History size={14} /> Reforço
                                                              </button>
                                                              {obsBtn}
                                                          </>
                                                      );
                                                  }

                                                  return null;
                                              })()}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </td>
                      </tr>
                  )})}
              </tbody>
          </table>
        </div>
      </div>

      {/* TOAST NOTIFICATION CONTAINER */}
      <div className="absolute bottom-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
              <div 
                  key={toast.id}
                  className={`pointer-events-auto min-w-[300px] bg-slate-900 border-l-4 p-4 rounded-md shadow-2xl animate-in slide-in-from-right duration-300 flex items-start gap-3 ${
                      toast.type === 'success' ? 'border-emerald-500' :
                      toast.type === 'info' ? 'border-blue-500' :
                      'border-amber-500'
                  }`}
              >
                  <div className={`p-1.5 rounded-full shrink-0 ${
                      toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
                      toast.type === 'info' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-amber-500/20 text-amber-500'
                  }`}>
                      {toast.type === 'success' ? <CheckCircle size={16} /> : <Eye size={16} />}
                  </div>
                  <div className="flex-1">
                      <h4 className={`text-xs font-black uppercase tracking-widest mb-1 ${
                          toast.type === 'success' ? 'text-emerald-500' :
                          toast.type === 'info' ? 'text-blue-500' :
                          'text-amber-500'
                      }`}>
                          {toast.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-tight">{toast.message}</p>
                  </div>
                  <button onClick={() => removeToast(toast.id)} className="text-slate-500 hover:text-white transition-colors">
                      <X size={14} />
                  </button>
              </div>
          ))}
      </div>

      {selectedFlight && (
        <FlightDetailsModal 
          flight={selectedFlight} 
          onClose={() => setSelectedFlight(null)} 
          onUpdate={(updatedFlight) => onUpdateFlights(prev => prev.map(f => f.id === updatedFlight.id ? updatedFlight : f))}
          vehicles={vehicles}
          onOpenChat={() => {
              setChatFlight(selectedFlight);
              setSelectedFlight(null); // Fecha o modal de detalhes
          }}
        />
      )}

      {/* CHAT LATERAL */}
      {chatFlight && (
          <FlightChatWindow 
              flight={chatFlight}
              onClose={() => setChatFlight(null)}
              isOpen={true}
          />
      )}


      {/* Observation Modal */}
      {observationModalFlight && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-md shadow-2xl w-full max-w-lg relative p-6 m-4">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tighter">Registrar Observação</h3>
                <p className="text-xs text-slate-400">Voo <span className="font-bold text-emerald-400">{observationModalFlight.flightNumber}</span> / Prefixo <span className="font-bold text-emerald-400">{observationModalFlight.registration}</span></p>
              </div>
              <button onClick={() => setObservationModalFlight(null)} className="p-1 rounded-full hover:bg-slate-800 transition-colors">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            
            <textarea
              value={newObservation}
              onChange={(e) => setNewObservation(e.target.value)}
              placeholder="Digite a observação para a caixa preta do voo..."
              className="w-full h-32 bg-slate-950 border border-slate-700 rounded-md p-3 text-sm text-slate-300 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all custom-scrollbar"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setObservationModalFlight(null)}
                className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveObservation}
                disabled={!newObservation.trim()}
                className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                Salvar Registro
              </button>
            </div>
          </div>
        </div>
      )}



      {/* MODAL DE DESIGNAÇÃO DE OPERADOR */}
      <DesigOpr 
          isOpen={!!assignModalFlight}
          onClose={() => { setAssignModalFlight(null); setSelectedOperatorId(null); }}
          flight={assignModalFlight}
          operators={assignModalFlight ? getEligibleOperators(assignModalFlight) : []}
          onConfirm={(operatorId) => {
              confirmAssignment(operatorId);
          }}
      />

      {/* MODAL DE JUSTIFICATIVA DE ATRASO (SLA COMPLIANCE) */}
      {delayModalFlightId && (
          <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
              <div className="bg-slate-900 border-2 border-amber-500/50 p-8 rounded-md w-[500px] shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-in zoom-in-95">
                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-md bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-amber-500">
                          <TimerOff size={24} />
                      </div>
                      <div>
                          <h3 className="text-lg font-black text-white uppercase tracking-wider">Atraso Detectado</h3>
                          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Justificativa Obrigatória para SLA</p>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Causa Primária</label>
                          <select 
                              className="w-full bg-slate-950 border border-slate-700 rounded-md px-4 py-3 text-sm text-white outline-none focus:border-amber-500"
                              value={delayReasonCode}
                              onChange={(e) => setDelayReasonCode(e.target.value)}
                          >
                              <option value="">-- SELECIONE O MOTIVO --</option>
                              {DELAY_REASONS.map(r => (
                                  <option key={r} value={r}>{r}</option>
                              ))}
                          </select>
                      </div>
                      
                      <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Notas Operacionais (Opcional)</label>
                          <textarea 
                              className="w-full bg-slate-950 border border-slate-700 rounded-md px-4 py-3 text-sm text-white outline-none focus:border-amber-500 resize-none h-24"
                              placeholder="Detalhes adicionais sobre o ocorrido..."
                              value={delayReasonDetail}
                              onChange={(e) => setDelayReasonDetail(e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-8">
                      <button 
                          onClick={() => setDelayModalFlightId(null)}
                          className="py-3 rounded-md border border-slate-700 text-slate-400 font-bold uppercase text-xs hover:bg-slate-800 transition-all"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={handleSubmitDelay}
                          disabled={!delayReasonCode}
                          className="py-3 rounded-md bg-amber-500 text-slate-950 font-black uppercase text-xs hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                      >
                          Confirmar e Finalizar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CREATE FLIGHT MODAL */}
      {isCreateModalOpen && (
        <CreateFlightModal 
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateFlight}
        />
      )}
      {/* CANCEL FLIGHT CONFIRMATION MODAL */}
      {cancelModalFlight && (
          <div className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-md w-[450px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                          <AlertTriangle size={32} className="text-red-500" />
                      </div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Confirmar Cancelamento</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                          Você optou por <span className="text-red-400 font-bold">CANCELAR</span> o voo <span className="text-white font-mono font-bold">{cancelModalFlight.flightNumber}</span> {cancelModalFlight.registration}. Deseja seguir com a ação?
                      </p>
                  </div>
                  
                  <div className="flex gap-4">
                      <button 
                          onClick={confirmCancelFlight}
                          className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-md uppercase tracking-widest text-xs transition-all shadow-lg shadow-red-600/20"
                      >
                          Sim, Cancelar
                      </button>
                      <button 
                          onClick={() => setCancelModalFlight(null)}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-md uppercase tracking-widest text-xs transition-all"
                      >
                          Não, Voltar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CONFIRM START MODAL */}
      {confirmStartModalFlight && (
          <div className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-md w-[450px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                          <Play size={32} className="text-blue-500" />
                      </div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Iniciar Abastecimento</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                          Registrar início do abastecimento para o voo <span className="text-white font-mono font-bold">{confirmStartModalFlight.flightNumber}</span>?
                      </p>
                  </div>
                  
                  <div className="flex gap-4">
                      <button 
                          onClick={handleConfirmStart}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-md uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/20"
                      >
                          Sim, Iniciar
                      </button>
                      <button 
                          onClick={() => setConfirmStartModalFlight(null)}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-md uppercase tracking-widest text-xs transition-all"
                      >
                          Não, Voltar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CONFIRM REMOVE OPERATOR MODAL */}
      {confirmRemoveOperatorFlight && (
          <div className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-md w-[450px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/20">
                          <UserCheck size={32} className="text-amber-500" />
                      </div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Cancelar Designação</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                          Deseja remover o operador deste voo?
                      </p>
                  </div>
                  
                  <div className="flex gap-4">
                      <button 
                          onClick={handleConfirmRemoveOperator}
                          className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-black py-4 rounded-md uppercase tracking-widest text-xs transition-all shadow-lg shadow-amber-600/20"
                      >
                          Sim, Remover
                      </button>
                      <button 
                          onClick={() => setConfirmRemoveOperatorFlight(null)}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-md uppercase tracking-widest text-xs transition-all"
                      >
                          Não, Voltar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CONFIRM FINISH MODAL */}
      {confirmFinishModalFlight && (
          <div className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-md w-[450px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                          <CheckCircle size={32} className="text-emerald-500" />
                      </div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Finalizar Abastecimento</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                          Deseja Finalizar o abastecimento deste voo?
                      </p>
                  </div>
                  
                  <div className="flex gap-4">
                      <button 
                          onClick={handleConfirmFinish}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-md uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-600/20"
                      >
                          Sim, Finalizar
                      </button>
                      <button 
                          onClick={() => setConfirmFinishModalFlight(null)}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-md uppercase tracking-widest text-xs transition-all"
                      >
                          Não, Voltar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
