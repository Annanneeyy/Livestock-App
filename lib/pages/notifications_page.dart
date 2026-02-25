import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../main.dart' show settingsProvider;
import '../theme/app_theme.dart';
import 'announcement_page.dart';
import 'chat_list_page.dart';
import 'guidelines_page.dart';
import 'home_page.dart';
import 'marketplace_page.dart';
import 'private_message_page.dart';
import 'settings_page.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final currentUser = FirebaseAuth.instance.currentUser;
    
    // Check if notifications are enabled
    if (!settingsProvider.notificationsEnabled) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Notifications'),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.notifications_off,
                size: 80,
                color: AppTheme.textSecondaryColor.withOpacity(0.5),
              ),
              const SizedBox(height: 16),
              Text(
                'Notifications Are Off',
                style: AppTheme.heading3,
              ),
              const SizedBox(height: 8),
              Text(
                'Go to Settings Page to turn it on',
                style: AppTheme.bodyMedium.copyWith(
                  color: AppTheme.textSecondaryColor,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const SettingsPage(),
                    ),
                  );
                },
                icon: const Icon(Icons.settings),
                label: const Text('Go to Settings'),
              ),
            ],
          ),
        ),
      );
    }

    if (currentUser == null) {
      return const Scaffold(
        body: Center(child: Text('Please log in to see notifications')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('notifications')
            .where('userId', isEqualTo: currentUser.uid)
            .orderBy('createdAt', descending: true)
            .limit(50)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 64,
                      color: AppTheme.errorColor,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Error: ${snapshot.error}',
                      style: AppTheme.bodyLarge,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Please check your Firestore security rules.',
                      style: AppTheme.bodySmall.copyWith(
                        color: AppTheme.textSecondaryColor,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.notifications_none,
                    size: 80,
                    color: AppTheme.textSecondaryColor.withOpacity(0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No notifications yet',
                    style: AppTheme.bodyLarge.copyWith(
                      color: AppTheme.textSecondaryColor,
                    ),
                  ),
                ],
              ),
            );
          }

          final notifications = snapshot.data!.docs;

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: notifications.length,
            itemBuilder: (context, index) {
              final notification = notifications[index];
              final data = notification.data() as Map<String, dynamic>;
              final type = data['type'] ?? 'unknown';
              final title = data['title'] ?? 'Notification';
              final message = data['message'] ?? '';
              final isRead = data['isRead'] ?? false;
              final createdAt = data['createdAt'] as Timestamp?;

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                elevation: isRead ? 1 : 3,
                color: isRead ? null : Theme.of(context).colorScheme.primary.withOpacity(0.05),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radiusL),
                ),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  leading: _getNotificationIcon(type),
                  title: Text(
                    title,
                    style: TextStyle(
                      fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text(message),
                      if (createdAt != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          _formatTimestamp(createdAt),
                          style: AppTheme.bodySmall.copyWith(
                            color: AppTheme.textSecondaryColor,
                          ),
                        ),
                      ],
                    ],
                  ),
                  trailing: !isRead
                      ? Container(
                          width: 12,
                          height: 12,
                          decoration: const BoxDecoration(
                            color: AppTheme.primaryColor,
                            shape: BoxShape.circle,
                          ),
                        )
                      : null,
                  onTap: () {
                    _handleNotificationTap(context, type, data);
                    // Mark as read
                    notification.reference.update({'isRead': true});
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _getNotificationIcon(String type) {
    IconData icon;
    Color color;

    switch (type) {
      case 'new_post':
        icon = Icons.store;
        color = AppTheme.primaryColor;
        break;
      case 'announcement':
        icon = Icons.announcement;
        color = Colors.orange;
        break;
      case 'health_guideline':
        icon = Icons.health_and_safety;
        color = AppTheme.errorColor;
        break;
      case 'feeding_info':
        icon = Icons.restaurant_menu;
        color = AppTheme.primaryColor;
        break;
      case 'chat':
        icon = Icons.chat_bubble;
        color = Colors.blue;
        break;
      default:
        icon = Icons.notifications;
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(icon, color: color, size: 24),
    );
  }

  void _handleNotificationTap(BuildContext context, String type, Map<String, dynamic> data) {
    switch (type) {
      case 'new_post':
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const MarketplacePage()),
        );
        break;
      case 'announcement':
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const AnnouncementPage()),
        );
        break;
      case 'health_guideline':
      case 'feeding_info':
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const GuidelinesPage()),
        );
        break;
      case 'chat':
        final receiverId = data['relatedUserId'];
        final receiverName = data['relatedUserName'] ?? 'User';
        if (receiverId != null) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => PrivateMessagePage(
                receiverId: receiverId,
                receiverName: receiverName,
              ),
            ),
          );
        } else {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const ChatListPage()),
          );
        }
        break;
      default:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const HomePage()),
        );
    }
  }

  String _formatTimestamp(Timestamp timestamp) {
    final now = DateTime.now();
    final date = timestamp.toDate();
    final diff = now.difference(date);

    if (diff.inDays > 7) {
      return "${date.day}/${date.month}/${date.year}";
    } else if (diff.inDays > 0) {
      return "${diff.inDays}d ago";
    } else if (diff.inHours > 0) {
      return "${diff.inHours}h ago";
    } else if (diff.inMinutes > 0) {
      return "${diff.inMinutes}m ago";
    } else {
      return "Just now";
    }
  }
}
