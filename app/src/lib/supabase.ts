import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ujtsoawkedgsfkjkpfzj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqdHNvYXdrZWRnc2ZramtwZnpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4Njg4NDUsImV4cCI6MjA5NjQ0NDg0NX0.DyOA20BE-U4_OdXTTtMGhOzlmLYae3ivVuLbLxBMDUg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
