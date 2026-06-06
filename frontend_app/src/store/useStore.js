import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      admin: null,
      token: null,
      setAdmin: (admin, token) => set({ admin, token }),
      logout: () => set({ admin: null, token: null }),
      
      staffList: [],
      setStaffList: (staffList) => set({ staffList }),
      
      dashboardStats: { present: 0, absent: 0, onLunch: 0, departed: 0, total: 0, late: 0 },
      setDashboardStats: (stats) => set({ dashboardStats: stats }),
    }),
    {
      name: 'stafftrack-storage', // name of item in the storage (must be unique)
      partialize: (state) => ({ admin: state.admin, token: state.token }), // only save auth state
    }
  )
);

export default useStore;
