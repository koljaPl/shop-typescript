// Strukturierter Logger mit Konsolen-Ausgabe und Ringspeicher für das Backoffice
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'HTTP';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, any>;
}

const MAX_LOGS = 200;
const logBuffer: LogEntry[] = [];

// ANSI-Farben für das Terminal
const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function formatConsole(level: LogLevel, message: string, meta?: Record<string, any>): void {
  const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
  let color = COLORS.reset;
  if (level === 'INFO') color = COLORS.green;
  if (level === 'WARN') color = COLORS.yellow;
  if (level === 'ERROR') color = COLORS.red;
  if (level === 'HTTP') color = COLORS.cyan;

  const prefix = `${COLORS.dim}[${time}]${COLORS.reset} ${color}[${level.padEnd(5)}]${COLORS.reset}`;
  if (meta && Object.keys(meta).length > 0) {
    console.log(`${prefix} ${message}`, COLORS.dim, JSON.stringify(meta), COLORS.reset);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

function pushLog(level: LogLevel, message: string, meta?: Record<string, any>): void {
  const entry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    meta,
  };

  logBuffer.unshift(entry);
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.pop();
  }

  formatConsole(level, message, meta);
}

export const logger = {
  info: (message: string, meta?: Record<string, any>) => pushLog('INFO', message, meta),
  warn: (message: string, meta?: Record<string, any>) => pushLog('WARN', message, meta),
  error: (message: string, meta?: Record<string, any>) => pushLog('ERROR', message, meta),
  http: (message: string, meta?: Record<string, any>) => pushLog('HTTP', message, meta),
  getRecentLogs: (limit = 100): LogEntry[] => logBuffer.slice(0, limit),
  clearLogs: (): void => {
    logBuffer.length = 0;
  },
};
