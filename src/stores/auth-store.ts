/* eslint-disable react-func/max-lines-per-function */

import { create } from "zustand"
import { combine, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

export interface User {
  id: string
  name: string
  email: string
}

export const useAuthStore = create(
  persist(
    immer(
      combine(
        {
          user: null as User | null,
          isAuthenticated: false,
          isLoading: true,
        },
        (set) => ({
          setUser(user: User | null) {
            set((store) => {
              store.user = user
              store.isAuthenticated = !!user
            })
          },

          setLoading(isLoading: boolean) {
            set((store) => {
              store.isLoading = isLoading
            })
          },

          logout() {
            set((store) => {
              store.user = null
              store.isAuthenticated = false
            })
          },
        })
      )
    ),
    {
      name: "quran-auth-state",
    }
  )
)
