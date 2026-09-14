// ============================================================
// Electron promise IPC (sibnerian/electron-promise-ipc)
// For desktop counselor app wrapping the web CRM (Electron)
// Renderer ↔ Main with promise, instead of callback `ipcRenderer.on`
// ============================================================

export async function setupMainIpc(mainWindow?: any){
  try {
    // @ts-ignore - electron is optional, only available in desktop app
    const { ipcMain } = await import('electron');
    // expose `alo:crm-call` that renderer can `await ipcRenderer.invoke('alo:crm-call', { to })`
    ipcMain.handle('alo:crm-call', async (_e:any, args:{ to:string })=>{
      const { clickToCall } = await import('@/lib/softphone-engine');
      return clickToCall('desktop', args.to);
    });
    ipcMain.handle('alo:sms-send', async (_e:any, args:{ to:string; message:string })=>{
      const { sendSms } = await import('@/lib/sms-gateway');
      return sendSms({ to: args.to, message: args.message, provider:'httpsms' });
    });
  } catch { /* not in Electron — no-op for web */ }
}

export async function invokeMain<T>(channel: string, args:any): Promise<T>{
  try {
    // @ts-ignore - electron is optional, only available in desktop app
    const { ipcRenderer } = await import('electron');
    return await ipcRenderer.invoke(channel, args);
  } catch {
    throw new Error(`Electron IPC not available in browser (channel ${channel}) — fallback to HTTP API`);
  }
}
