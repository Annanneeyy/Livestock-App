import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export interface AdminStats {
  totalLivestock: number;
  totalUsers: number;
  marketVolume: number;
  categorySoldTotals: { label: string; value: number; count: number }[];
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
      
      // 1. Fetch Livestock Data
      const { data: livestockData, error: lError } = await supabase
        .from('livestock')
        .select('category, price, is_available');
      
      if (lError) throw lError;

      let totalVolume = 0;
      const soldCounts: Record<string, { amount: number; count: number }> = {
        'Baktin': { amount: 0, count: 0 },
        'Lechonon': { amount: 0, count: 0 },
        'Lapaon': { amount: 0, count: 0 },
      };

      livestockData.forEach(l => {
        const price = Number(l.price) || 0;
        totalVolume += price;
        
        if (!l.is_available) {
          if (soldCounts[l.category]) {
            soldCounts[l.category].amount += price;
            soldCounts[l.category].count += 1;
          }
        }
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

      // 3. User Growth (Last 6 months)
      const now = new Date();
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        return {
          month: d.toLocaleString('default', { month: 'short' }),
          year: d.getFullYear(),
          monthIdx: d.getMonth(),
          count: 0
        };
      }).reverse();

      profileData.forEach(p => {
        const createdDate = new Date(p.created_at);
        const monthMatch = last6Months.find(m => 
          m.monthIdx === createdDate.getMonth() && m.year === createdDate.getFullYear()
        );
        if (monthMatch) {
          monthMatch.count += 1;
        }
      });

      const userGrowth = last6Months.map(m => ({
        label: m.month,
        value: m.count
      }));

      setStats({
        totalLivestock: livestockData.length,
        totalUsers: profileData.length,
        marketVolume: totalVolume,
        categorySoldTotals: Object.entries(soldCounts).map(([label, stats]) => ({ 
          label, 
          value: stats.amount, 
          count: stats.count 
        })),
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
