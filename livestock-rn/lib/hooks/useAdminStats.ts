import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export interface AdminStats {
  totalLivestock: number;
  totalUsers: number;
  totalTransactions: number; // Placeholder if no transactions table yet
  categoryBreakdown: { label: string; value: number }[];
  barangayBreakdown: { label: string; value: number }[];
  roleDistribution: { label: string; value: number }[];
  userGrowth: { label: string; value: number }[];
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Livestock Count & Category Breakdown
      const { data: livestockData, error: lError } = await supabase
        .from('livestock')
        .select('category');
      
      if (lError) throw lError;

      const catCounts: Record<string, number> = {};
      livestockData.forEach(l => {
        catCounts[l.category] = (catCounts[l.category] || 0) + 1;
      });

      // 2. Fetch User Profiles for Role & Barangay breakdown
      const { data: profileData, error: pError } = await supabase
        .from('profiles')
        .select('role, barangay, created_at');

      if (pError) throw pError;

      const roleCounts: Record<string, number> = {};
      const barangayCounts: Record<string, number> = {};
      
      profileData.forEach(p => {
        roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
        if (p.barangay) {
          barangayCounts[p.barangay] = (barangayCounts[p.barangay] || 0) + 1;
        }
      });

      // 3. User Growth (Mock or group by month)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const userGrowth = months.map((month, idx) => ({
        label: month,
        value: 10 + (idx * 5) + Math.floor(Math.random() * 10)
      }));

      setStats({
        totalLivestock: livestockData.length,
        totalUsers: profileData.length,
        totalTransactions: 0, // Placeholder
        categoryBreakdown: Object.entries(catCounts).map(([label, value]) => ({ label, value })),
        barangayBreakdown: Object.entries(barangayCounts).map(([label, value]) => ({ label, value })),
        roleDistribution: Object.entries(roleCounts).map(([label, value]) => ({ label, value })),
        userGrowth
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}
