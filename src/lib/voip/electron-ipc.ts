/** The web deployment does not ship an Electron main/preload application.
 * Do not install unauthenticated IPC handlers that directly send paid SMS or
 * calls. A future desktop bridge must validate senderFrame/origin and call the
 * authenticated HTTP APIs with the user's session, not server transports.
 */
export async function setupMainIpc(_mainWindow?: unknown) {
  return { available: false, status: 'not_configured' as const,
    reason: 'No audited Electron preload/main bridge is installed. Use authenticated web APIs.' };
}
export async function invokeMain<T>(_channel: string, _args: unknown): Promise<T> {
  throw new Error('Electron IPC is unavailable. Use the authenticated web interface.');
}
