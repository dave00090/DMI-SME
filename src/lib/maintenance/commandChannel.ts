/**
 * Real Command Channel Engine for Remote POS Terminals
 *
 * Implements the remote maintenance command bridge:
 * - Inserts maintenance commands into the server database (`maintenance_commands`)
 * - Subscribes and polls for queued commands scoped to tenant_id
 * - Dispatches strictly allowlisted handlers (never arbitrary code or eval)
 * - Updates status (`queued` -> `running` -> `completed` / `failed` / `expired`)
 * - Persists an authentic audit trail of real execution rows
 */

import { repairHandlers, RepairExecutionContext, RepairResult } from './repairHandlers';

export type MaintenanceCommandType =
  | 'lag_fix'
  | 'vacuum_db'
  | 'release_sync_lock'
  | 'restore_snapshot'
  | 'safe_reboot'
  | 'reindex_ledgers'
  | 'repair_license_keys'
  | 'full_diagnostic_repair';

export type MaintenanceCommandStatus = 'queued' | 'running' | 'completed' | 'failed' | 'expired';

export interface MaintenanceCommand {
  id: string;
  tenant_id: string;
  type: MaintenanceCommandType;
  status: MaintenanceCommandStatus;
  payload?: any;
  result?: any;
  issued_by: string;
  created_at: string;
  expires_at: string;
  completed_at?: string;
}

export type CommandChannelListener = (commands: MaintenanceCommand[]) => void;

class CommandChannelService {
  private activeTenantId: string = 'BUS-MASTER';
  private pollTimer: any = null;
  private isProcessing: boolean = false;
  private listeners: CommandChannelListener[] = [];
  private contextProvider: (() => RepairExecutionContext) | null = null;

  constructor() {
    this.startCommandPoller();
  }

  public setTenantId(tenantId: string) {
    this.activeTenantId = tenantId;
  }

  public setContextProvider(provider: () => RepairExecutionContext) {
    this.contextProvider = provider;
  }

  public subscribe(listener: CommandChannelListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(commands: MaintenanceCommand[]) {
    this.listeners.forEach((l) => l(commands));
  }

  /**
   * Post a new command from the Control Center
   */
  public async dispatchCommand(
    tenantId: string,
    type: MaintenanceCommandType,
    issuedBy: string = 'Dave Migichi (SuperAdmin NOC)',
    payload: any = {}
  ): Promise<MaintenanceCommand> {
    const res = await fetch('/api/maintenance/commands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenantId,
        type,
        issued_by: issuedBy,
        payload,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Failed to dispatch command ${type}`);
    }

    const { command } = await res.json();

    // Trigger immediate local processing check
    setTimeout(() => this.processPendingCommands(), 100);

    return command;
  }

  /**
   * Fetch historical audit trail from database
   */
  public async fetchHistory(tenantId?: string): Promise<MaintenanceCommand[]> {
    const targetTenant = tenantId || this.activeTenantId;
    try {
      const res = await fetch(`/api/maintenance/commands/${targetTenant}/history`);
      if (res.ok) {
        const { history } = await res.json();
        return history || [];
      }
    } catch (e) {
      console.warn('[CommandChannel] History fetch error', e);
    }
    return [];
  }

  /**
   * Update status of command in database
   */
  public async setCommandStatus(
    commandId: string,
    status: MaintenanceCommandStatus,
    result?: any
  ): Promise<MaintenanceCommand | null> {
    try {
      const res = await fetch(`/api/maintenance/commands/${commandId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, result }),
      });
      if (res.ok) {
        const { command } = await res.json();
        return command;
      }
    } catch (e) {
      console.warn(`[CommandChannel] Failed to update status for ${commandId}`, e);
    }
    return null;
  }

  /**
   * Poll and execute pending queued commands for this terminal
   */
  public async processPendingCommands(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const res = await fetch(
        `/api/maintenance/commands?tenant_id=${encodeURIComponent(this.activeTenantId)}&status=queued`
      );
      if (!res.ok) return;

      const { commands } = (await res.json()) as { commands: MaintenanceCommand[] };
      if (!Array.isArray(commands) || commands.length === 0) return;

      this.notifyListeners(commands);

      const context: RepairExecutionContext = this.contextProvider
        ? this.contextProvider()
        : { tenantId: this.activeTenantId };

      for (const cmd of commands) {
        await this.run(cmd, context);
      }
    } catch (err) {
      console.warn('[CommandChannel] Execution loop error', err);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Allowlisted handler dispatcher
   */
  private async run(cmd: MaintenanceCommand, context: RepairExecutionContext): Promise<void> {
    // 1. Expiry check (stale commands older than expires_at are rejected)
    if (new Date(cmd.expires_at) < new Date()) {
      await this.setCommandStatus(cmd.id, 'expired', {
        reason: 'Command expired before terminal execution (10 minute TTL exceeded)',
      });
      return;
    }

    // 2. Strict Allowlist mapping (no arbitrary eval)
    const handlers: Record<MaintenanceCommandType, (ctx: RepairExecutionContext) => Promise<RepairResult>> = {
      lag_fix: (ctx) => repairHandlers.handleFixLag(ctx),
      vacuum_db: (ctx) => repairHandlers.handleVacuumDb(ctx),
      release_sync_lock: (ctx) => repairHandlers.handleReleaseSyncLock(ctx),
      restore_snapshot: (ctx) => repairHandlers.handleRestoreSnapshot(ctx),
      safe_reboot: (ctx) => repairHandlers.handleSafeReboot(ctx),
      reindex_ledgers: (ctx) => repairHandlers.handleReindexLedgers(ctx),
      repair_license_keys: (ctx) => repairHandlers.handleRepairLicenseKeys(ctx),
      full_diagnostic_repair: (ctx) => repairHandlers.handleFullSelfHealingPass(ctx),
    };

    const handler = handlers[cmd.type];
    if (!handler) {
      await this.setCommandStatus(cmd.id, 'failed', {
        error: `Unallowlisted command type: ${cmd.type}`,
      });
      return;
    }

    // 3. Mark running
    await this.setCommandStatus(cmd.id, 'running');

    // 4. Execute concrete repair
    try {
      const result = await handler(context);
      if (result.success) {
        await this.setCommandStatus(cmd.id, 'completed', result);
      } else {
        await this.setCommandStatus(cmd.id, 'failed', result);
      }
    } catch (e: any) {
      await this.setCommandStatus(cmd.id, 'failed', {
        error: e.message || String(e),
      });
    }
  }

  private startCommandPoller() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    // Poll every 3 seconds for fast responsiveness
    this.pollTimer = setInterval(() => {
      this.processPendingCommands();
    }, 3000);
  }

  public cleanup() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}

export const commandChannel = new CommandChannelService();
