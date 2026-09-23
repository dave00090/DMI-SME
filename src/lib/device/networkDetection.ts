/**
 * Multi-Platform Network & Connection Detection for DMi POS Clients
 * - Android: Capacitor Network Plugin (@capacitor/network)
 * - Windows Desktop (Electron): Native OS netsh wlan check via IPC
 * - Windows Desktop (Tauri): Native Rust command netsh wlan check via Tauri invoke
 * - Web/Fallback: Strict unambiguous online/offline detection (never assumes wifi)
 */

import { Network, ConnectionType as CapConnectionType } from '@capacitor/network';

export type DeviceConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'unknown' | 'offline';

export interface NetworkStatusResult {
  connected: boolean;
  connectionType: DeviceConnectionType;
  source: 'capacitor_android' | 'electron_windows' | 'tauri_windows' | 'browser_fallback';
  timestamp: string;
}

// Cached network status between ticks
let cachedNetworkStatus: NetworkStatusResult = {
  connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
  connectionType: 'unknown',
  source: 'browser_fallback',
  timestamp: new Date().toISOString(),
};

type NetworkChangeListener = (status: NetworkStatusResult) => void;
const listeners = new Set<NetworkChangeListener>();

/**
 * Android (Capacitor) network detection
 */
async function detectCapacitorNetwork(): Promise<NetworkStatusResult | null> {
  try {
    // Check if Capacitor is available and native
    const cap = (window as any).Capacitor;
    if (cap && (cap.isNativePlatform?.() || cap.getPlatform?.() === 'android')) {
      const status = await Network.getStatus();
      let connType: DeviceConnectionType = 'unknown';

      if (!status.connected || status.connectionType === 'none') {
        connType = 'offline';
      } else if (status.connectionType === 'wifi') {
        connType = 'wifi';
      } else if (status.connectionType === 'cellular') {
        connType = 'cellular';
      } else {
        connType = 'unknown';
      }

      return {
        connected: status.connected && connType !== 'offline',
        connectionType: connType,
        source: 'capacitor_android',
        timestamp: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('[NetworkDetection] Capacitor check error:', err);
  }
  return null;
}

/**
 * Windows Desktop (Electron) check via IPC
 */
async function detectElectronNetwork(): Promise<NetworkStatusResult | null> {
  try {
    const win = window as any;
    if (win.electronAPI?.getNetworkType || win.ipcRenderer?.invoke) {
      const connType: string = win.electronAPI?.getNetworkType
        ? await win.electronAPI.getNetworkType()
        : await win.ipcRenderer.invoke('get-network-type');

      const mapped: DeviceConnectionType =
        connType === 'wifi'
          ? 'wifi'
          : connType === 'ethernet'
          ? 'ethernet'
          : connType === 'offline'
          ? 'offline'
          : 'unknown';

      return {
        connected: mapped !== 'offline',
        connectionType: mapped,
        source: 'electron_windows',
        timestamp: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('[NetworkDetection] Electron check error:', err);
  }
  return null;
}

/**
 * Windows Desktop (Tauri) check via Rust command
 */
async function detectTauriNetwork(): Promise<NetworkStatusResult | null> {
  try {
    const win = window as any;
    if (win.__TAURI__?.invoke || win.__TAURI_INTERNALS__?.invoke) {
      const invoke = win.__TAURI__?.invoke || win.__TAURI_INTERNALS__?.invoke;
      const connType: string = await invoke('get_network_type');

      const mapped: DeviceConnectionType =
        connType === 'wifi'
          ? 'wifi'
          : connType === 'ethernet'
          ? 'ethernet'
          : connType === 'offline'
          ? 'offline'
          : 'unknown';

      return {
        connected: mapped !== 'offline',
        connectionType: mapped,
        source: 'tauri_windows',
        timestamp: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('[NetworkDetection] Tauri check error:', err);
  }
  return null;
}

/**
 * Core query function to detect current connection type across all platforms
 */
export async function getDeviceNetworkStatus(): Promise<NetworkStatusResult> {
  // 1. Android Capacitor check
  const capResult = await detectCapacitorNetwork();
  if (capResult) {
    cachedNetworkStatus = capResult;
    return capResult;
  }

  // 2. Electron Windows check
  const electronResult = await detectElectronNetwork();
  if (electronResult) {
    cachedNetworkStatus = electronResult;
    return electronResult;
  }

  // 3. Tauri Windows check
  const tauriResult = await detectTauriNetwork();
  if (tauriResult) {
    cachedNetworkStatus = tauriResult;
    return tauriResult;
  }

  // 4. Browser fallback: If offline, report offline. Otherwise, report unknown (NEVER guess wifi or ethernet).
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const fallbackResult: NetworkStatusResult = {
    connected: isOnline,
    connectionType: isOnline ? 'unknown' : 'offline',
    source: 'browser_fallback',
    timestamp: new Date().toISOString(),
  };
  cachedNetworkStatus = fallbackResult;
  return fallbackResult;
}

/**
 * Returns cached status between ticks without re-polling OS commands
 */
export function getCachedNetworkStatus(): NetworkStatusResult {
  return cachedNetworkStatus;
}

/**
 * Subscribe to live network changes (e.g. WiFi -> Cellular, or disconnect)
 */
export function subscribeToNetworkChanges(callback: NetworkChangeListener): () => void {
  listeners.add(callback);

  // Initialize listener on Android Capacitor
  let capListenerRemove: (() => void) | null = null;
  try {
    const handle = Network.addListener('networkStatusChange', (status) => {
      const connType: DeviceConnectionType = !status.connected || status.connectionType === 'none'
        ? 'offline'
        : status.connectionType === 'wifi'
        ? 'wifi'
        : status.connectionType === 'cellular'
        ? 'cellular'
        : 'unknown';

      const update: NetworkStatusResult = {
        connected: status.connected && connType !== 'offline',
        connectionType: connType,
        source: 'capacitor_android',
        timestamp: new Date().toISOString(),
      };
      cachedNetworkStatus = update;
      listeners.forEach((fn) => fn(update));
    });

    capListenerRemove = () => {
      handle.then((h) => h.remove()).catch(() => {});
    };
  } catch {}

  // Web online/offline listeners
  const handleOnline = async () => {
    const fresh = await getDeviceNetworkStatus();
    listeners.forEach((fn) => fn(fresh));
  };
  const handleOffline = () => {
    const off: NetworkStatusResult = {
      connected: false,
      connectionType: 'offline',
      source: 'browser_fallback',
      timestamp: new Date().toISOString(),
    };
    cachedNetworkStatus = off;
    listeners.forEach((fn) => fn(off));
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  return () => {
    listeners.delete(callback);
    if (capListenerRemove) capListenerRemove();
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  };
}

/**
 * REFERENCE DESKTOP OS DETECTION IMPLEMENTATIONS:
 * 
 * 1. ELECTRON (Windows Desktop main process - electron/main.js):
 * ```javascript
 * const { ipcMain } = require('electron');
 * const { exec } = require('child_process');
 * const dns = require('dns');
 * 
 * ipcMain.handle('get-network-type', async () => {
 *   return new Promise((resolve) => {
 *     exec('netsh wlan show interfaces', (err, stdout) => {
 *       if (!err && stdout && /State\s*:\s*connected/i.test(stdout)) {
 *         return resolve('wifi');
 *       }
 *       dns.lookup('google.com', (dnsErr) => {
 *         if (!dnsErr) return resolve('ethernet');
 *         resolve('offline');
 *       });
 *     });
 *   });
 * });
 * ```
 * 
 * 2. TAURI (Windows Desktop Rust backend - src-tauri/src/main.rs):
 * ```rust
 * use std::process::Command;
 * 
 * #[tauri::command]
 * fn get_network_type() -> String {
 *   let output = Command::new("netsh")
 *     .args(&["wlan", "show", "interfaces"])
 *     .output();
 *   if let Ok(out) = output {
 *     let stdout = String::from_utf8_lossy(&out.stdout);
 *     if stdout.contains("State") && stdout.contains("connected") {
 *       return "wifi".to_string();
 *     }
 *   }
 *   "unknown".to_string()
 * }
 * ```
 */
