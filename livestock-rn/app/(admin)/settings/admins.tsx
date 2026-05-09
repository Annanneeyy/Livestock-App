import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView, Platform } from 'react-native';
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
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AdminUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  // Debounced search logic using useEffect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .ilike('role', 'admin')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setAdmins(data || []);
    } catch (err: any) {
      console.error('Error fetching admins:', err.message);
      if (Platform.OS === 'web') alert('Error: ' + err.message);
      else Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .not('role', 'ilike', 'admin')
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err: any) {
      console.error('Search error:', err.message);
    } finally {
      setSearching(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      console.log(`Attempting to update user ${userId} role to: ${newRole} via RPC`);
      
      const { error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) {
        console.error('RPC update error:', error);
        throw error;
      }

      const successMsg = `User has been successfully updated to ${newRole}.`;
      if (Platform.OS === 'web') alert(successMsg);
      else Alert.alert('Success', successMsg);
      
      await fetchAdmins();
      
      if (newRole === 'admin') {
        setSearchResults(prev => prev.filter(u => u.id !== userId));
      }
    } catch (err: any) {
      console.error('Detailed update error:', err);
      const msg = err.message.includes('function') 
        ? 'Database update failed. Please ensure the "update_user_role" function has been added to your Supabase SQL Editor.'
        : err.message;
      
      if (Platform.OS === 'web') alert('Update Failed: ' + msg);
      else Alert.alert('Update Failed', msg);
    } finally {
      setUpdating(null);
    }
  };

  const confirmDemote = (user: AdminUser) => {
    if (user.id === currentUserId) {
      const msg = "For security reasons, you cannot revoke your own administrative access while logged in. This prevents accidental lockout.";
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Security Protection', msg);
      return;
    }

    const title = 'Revoke Admin Access';
    const message = `Are you sure you want to remove administrative privileges from ${user.first_name} ${user.last_name}?`;

    if (Platform.OS === 'web') {
      if (confirm(message)) {
        updateUserRole(user.id, 'farmer');
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Revoke', 
          style: 'destructive',
          onPress: () => updateUserRole(user.id, 'farmer')
        }
      ]);
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
        onPress={() => {
          setSearchQuery('');
          setSearchResults([]);
          setShowSearchModal(true);
        }}
      >
        <Ionicons name="person-add" size={22} color="white" />
        <Text className="ml-2 text-white font-bold text-base">Add Admin User</Text>
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
                {item.first_name} {item.last_name} {item.id === currentUserId && <Text className="text-green-600 text-xs font-normal">(You)</Text>}
              </Text>
              <Text className="text-gray-500 text-sm">System Administrator</Text>
            </View>
            {item.id !== currentUserId && (
              <TouchableOpacity 
                onPress={() => confirmDemote(item)}
                disabled={updating === item.id}
                className="p-2"
              >
                {updating === item.id ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
        onRefresh={fetchAdmins}
        refreshing={loading}
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-gray-400 italic">No administrators found.</Text>
          </View>
        }
      />

      <Modal
        visible={showSearchModal}
        transparent
        animationType="slide"
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 shadow-xl h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">Add New Admin</Text>
              <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 mb-6">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 p-4 text-gray-900"
                placeholder="Search by name (min 2 chars)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searching && <ActivityIndicator size="small" color="#1B5E20" />}
            </View>

            <ScrollView className="flex-1">
              {searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <View key={user.id} className="flex-row items-center justify-between p-4 border-b border-gray-50">
                    <View>
                      <Text className="text-gray-900 font-semibold">{user.first_name} {user.last_name}</Text>
                      <Text className="text-gray-400 text-xs uppercase">{user.role}</Text>
                    </View>
                    <TouchableOpacity 
                      className="bg-green-700 px-4 py-2 rounded-lg"
                      onPress={() => updateUserRole(user.id, 'admin')}
                      disabled={updating === user.id}
                    >
                      {updating === user.id ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white font-bold text-xs">Make Admin</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View className="items-center py-10">
                  <Text className="text-gray-400">
                    {searchQuery.length < 2 ? 'Type at least 2 characters to search' : 'No users found matching your search.'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}


