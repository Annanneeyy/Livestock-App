import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useAdminStats } from '../../lib/hooks/useAdminStats';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const { stats, loading, error, refresh } = useAdminStats();
<<<<<<< Updated upstream
  const [activeTab, setActiveTab] = useState('overview');
=======
>>>>>>> Stashed changes

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text className="mt-4 text-gray-500 font-medium">Loading Analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Ionicons name="alert-circle" size={64} color="#DC2626" />
        <Text className="text-xl font-bold text-gray-900 mt-4">Failed to load statistics</Text>
        <Text className="text-gray-500 text-center mt-2">{error}</Text>
        <TouchableOpacity 
          className="mt-6 bg-green-700 px-6 py-3 rounded-xl"
          onPress={refresh}
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const roleColors: Record<string, string> = {
    farmer: '#2E7D32',
    buyer: '#1976D2',
    admin: '#FFA000'
  };

  const pieData = stats?.roleDistribution.map(item => ({
    value: item.value,
    color: roleColors[item.label] || '#9E9E9E',
    label: item.label.charAt(0).toUpperCase() + item.label.slice(1),
    text: `${item.value}`
  })) || [];

  const barData = stats?.barangayBreakdown.map(item => ({
    value: item.value,
    label: item.label.length > 5 ? item.label.substring(0, 4) + '..' : item.label,
    frontColor: '#4CAF50',
    topLabelComponent: () => (
      <Text style={{ color: '#2E7D32', fontSize: 12, marginBottom: 4 }}>{item.value}</Text>
    ),
  })) || [];

  const lineData = stats?.userGrowth.map(item => ({
    value: item.value,
    label: item.label
  })) || [];

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Header Stats */}
      <View className="flex-row flex-wrap p-4 justify-between">
        <StatCard 
          title="Total Users" 
          value={stats?.totalUsers || 0} 
          icon="people" 
          color="#1976D2"
          trend="+5%"
        />
        <StatCard 
          title="Livestock" 
          value={stats?.totalLivestock || 0} 
          icon="paw" 
          color="#2E7D32"
          trend="+12%"
        />
        <StatCard 
          title="Barangays" 
          value={stats?.barangayBreakdown.length || 0} 
          icon="map" 
          color="#E64A19"
        />
        <StatCard 
          title="Market Volume" 
          value="₱0" 
          icon="trending-up" 
          color="#FFA000"
        />
      </View>

      {/* Role Distribution (Pie Chart) */}
      <View className="m-4 bg-white p-6 rounded-3xl shadow-sm">
        <Text className="text-lg font-bold text-gray-900 mb-6">User Role Distribution</Text>
        <View className="items-center flex-row justify-between">
          <PieChart
            data={pieData}
            donut
            sectionAutoFocus
            radius={80}
            innerRadius={55}
            innerCircleColor={'white'}
            centerLabelComponent={() => (
              <View className="items-center">
                <Text className="text-xl font-bold text-gray-900">{stats?.totalUsers}</Text>
                <Text className="text-xs text-gray-400">Total</Text>
              </View>
            )}
          />
          <View className="flex-1 ml-6">
            {pieData.map((item, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color }} />
                <Text className="ml-2 text-sm text-gray-600 flex-1">{item.label}</Text>
                <Text className="text-sm font-bold text-gray-900">{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Barangay Breakdown (Bar Chart) */}
      <View className="m-4 bg-white p-6 rounded-3xl shadow-sm">
        <Text className="text-lg font-bold text-gray-900 mb-2">Livestock by Barangay</Text>
        <Text className="text-sm text-gray-400 mb-6">Distribution across Quezon, Bukidnon</Text>
        <BarChart
          data={barData}
          barWidth={45}
          noOfSections={4}
          barBorderRadius={8}
          frontColor="#4CAF50"
          yAxisThickness={0}
          xAxisThickness={0}
          hideRules
          yAxisTextStyle={{ color: '#9CA3AF' }}
          xAxisLabelTextStyle={{ color: '#4B5563', fontSize: 10 }}
          width={width - 100}
          height={200}
        />
      </View>

      {/* User Growth (Line Chart) */}
      <View className="m-4 bg-white p-6 rounded-3xl shadow-sm mb-10">
        <Text className="text-lg font-bold text-gray-900 mb-2">New User Analytics</Text>
        <Text className="text-sm text-gray-400 mb-6">Registration trend for the last 6 months</Text>
        <LineChart
          data={lineData}
          height={180}
          width={width - 100}
          initialSpacing={20}
          color="#1976D2"
          thickness={4}
          startFillColor="rgba(25, 118, 210, 0.3)"
          endFillColor="rgba(25, 118, 210, 0.01)"
          startOpacity={0.9}
          endOpacity={0.2}
          noOfSections={3}
          yAxisColor="white"
          yAxisThickness={0}
          rulesType="dotted"
          rulesColor="#E5E7EB"
          yAxisTextStyle={{ color: '#9CA3AF' }}
          pointerConfig={{
            pointerStripHeight: 160,
            pointerStripColor: '#1976D2',
            pointerColor: '#1976D2',
            radius: 6,
            pointerLabelComponent: (items: any) => (
              <View className="bg-white p-2 rounded-lg shadow-lg border border-gray-100">
                <Text className="text-gray-900 font-bold">{items[0].value} users</Text>
              </View>
            ),
          }}
        />
      </View>
    </ScrollView>
  );
}

function StatCard({ title, value, icon, color, trend }: any) {
  return (
    <View style={{ width: (width - 48) / 2 }} className="bg-white p-4 rounded-2xl mb-4 shadow-sm">
      <View className="flex-row justify-between items-center mb-2">
        <View style={{ backgroundColor: `${color}15` }} className="p-2 rounded-lg">
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {trend && (
          <View className="bg-green-50 px-1.5 py-0.5 rounded flex-row items-center">
            <Ionicons name="trending-up" size={12} color="#10B981" />
            <Text className="text-[10px] text-green-600 font-bold ml-0.5">{trend}</Text>
          </View>
        )}
      </View>
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-xs text-gray-400 font-medium">{title}</Text>
    </View>
  );
}
