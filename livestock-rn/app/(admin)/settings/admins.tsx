import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

export default function ManageAdminsScreen() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      // Removed 'email' as it doesn't exist in the profiles table schema cache
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('role', 'admin')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setAdmins(data || []);
    } catch (err: any) {
      console.error('Error fetching admins:', err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    
    setInviting(true);
    try {
      // Simulation of invitation link being sent
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Invitation Sent', 
        `An administrative invitation has been sent to ${inviteEmail}. They will appear here once they accept.`
      );
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <TouchableOpacity 
        className="bg-green-700 p-4 rounded-2xl flex-row items-center justify-center mb-6 shadow-md"
        onPress={() => setShowInviteModal(true)}
      >
        <Ionicons name="person-add" size={22} color="white" />
        <Text className="ml-2 text-white font-bold text-base">Invite New Admin</Text>
      </TouchableOpacity>

      <Text className="text-sm font-semibold text-gray-400 mb-4 uppercase ml-2">Active Administrators</Text>
      
      <FlatList
        data={admins}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-2xl mb-3 shadow-sm flex-row items-center">
            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
              <Text className="text-green-700 font-bold text-lg">
                {item.first_name?.[0] || 'A'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-bold text-base">
                {item.first_name} {item.last_name}
              </Text>
              <Text className="text-gray-500 text-sm">System Administrator</Text>
            </View>
            <View className="bg-green-50 px-3 py-1 rounded-full">
              <Text className="text-green-700 text-xs font-bold uppercase">{item.role}</Text>
            </View>
          </View>
        )}
        onRefresh={fetchAdmins}
        refreshing={loading}
      />

      <Modal
        visible={showInviteModal}
        transparent
        animationType="fade"
      >
        <View className="flex-1 bg-black/50 justify-center p-6">
          <View className="bg-white rounded-3xl p-6 shadow-xl">
            <Text className="text-xl font-bold text-gray-900 mb-2">Invite Admin</Text>
            <Text className="text-gray-500 mb-6">Enter the email address of the person you want to grant administrative access to.</Text>
            
            <TextInput
              className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 text-gray-900"
              placeholder="admin@example.com"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity 
                className="flex-1 bg-gray-100 p-4 rounded-xl items-center"
                onPress={() => setShowInviteModal(false)}
              >
                <Text className="text-gray-600 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-2 bg-green-700 p-4 rounded-xl items-center"
                onPress={handleInvite}
                disabled={inviting}
              >
                {inviting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold px-4">Send Invite</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
