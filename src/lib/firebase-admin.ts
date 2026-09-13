export function customInitApp() {
  return null;
}

export const getAuth = () => ({
  verifyIdToken: async () => ({ uid: "admin_master", email: "admin@aloeducation.com", role: "SUPER_ADMIN" }),
  getUser: async (uid: string) => ({ uid, email: "admin@aloeducation.com" })
});

export const firebaseAdmin = { customInitApp, getAuth };
export default firebaseAdmin;
