/* =========================================================
   ATTENDIFY PRO — App Configuration
   ========================================================= */

const AppConfig = {
  // Backend على نفس الدومين (Vercel Serverless) — يُكتشف تلقائياً
  backend: {
    url: (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
      ? window.location.origin
      : '',
  },
};
