declare global {
  namespace Express {
    interface Request {
      user: { id: string; firebaseUid: string; email: string; name: string; level: string; studyTime: number };
      validated: { body?: any; query?: any; params?: any };
    }
  }
}
export {};
