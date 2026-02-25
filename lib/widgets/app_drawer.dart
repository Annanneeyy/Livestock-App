import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../main.dart';
import '../pages/announcement_page.dart';
import '../pages/chat_list_page.dart';
import '../pages/guidelines_page.dart';
import '../pages/home_page.dart';
import '../pages/marketplace_page.dart';
import '../pages/profile_page.dart';
import '../pages/settings_page.dart';
import '../theme/app_theme.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final userName = user?.email?.split('@')[0] ?? 'User';

    // Use the current theme's primary color
    final primaryColor = Theme.of(context).colorScheme.primary;
    final primaryDark = HSLColor.fromColor(primaryColor)
        .withLightness(
            (HSLColor.fromColor(primaryColor).lightness - 0.1).clamp(0.0, 1.0))
        .toColor();

    final List<Map<String, dynamic>> menuOptions = [
      {"title": "Map", "icon": Icons.map, "color": primaryColor},
      {"title": "Marketplace", "icon": Icons.store, "color": primaryColor},
      {
        "title": "Announcement",
        "icon": Icons.announcement,
        "color": primaryColor
      },
      {
        "title": "Guidelines",
        "icon": Icons.menu_book,
        "color": primaryColor
      },
      {"title": "Profile", "icon": Icons.person, "color": primaryColor},
      {"title": "Chat", "icon": Icons.chat_bubble, "color": primaryColor},
      {"title": "Settings", "icon": Icons.settings, "color": primaryColor},
    ];

    return Drawer(
      child: Column(
        children: [
          // Header with modern gradient and premium abstract decor
          Container(
            width: double.infinity,
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  primaryColor,
                  primaryDark,
                ],
              ),
            ),
            child: Stack(
              children: [
                // Abstract background shapes
                Positioned(
                  top: -20,
                  right: -20,
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                Positioned(
                  bottom: -30,
                  left: -10,
                  child: Container(
                    width: 140,
                    height: 140,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 48, 24, 24),
                    child: StreamBuilder<DocumentSnapshot>(
                      stream: user != null
                          ? FirebaseFirestore.instance
                              .collection('users')
                              .doc(user.uid)
                              .snapshots()
                          : Stream<DocumentSnapshot>.empty(),
                      builder: (context, snapshot) {
                        final userData = snapshot.data?.data() as Map<String, dynamic>?;
                        final profileImage = userData?['profileImage'];
                        
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(3),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                    color: Colors.white.withOpacity(0.5), width: 1),
                              ),
                              child: CircleAvatar(
                                radius: 35,
                                backgroundColor: Colors.white.withOpacity(0.2),
                                backgroundImage: (profileImage != null && profileImage.isNotEmpty)
                                    ? (profileImage.startsWith('http')
                                        ? NetworkImage(profileImage)
                                        : MemoryImage(base64Decode(profileImage)))
                                        as ImageProvider<Object>?
                                    : null,
                                child: (profileImage == null || profileImage.isEmpty)
                                    ? const Icon(
                                        Icons.person,
                                        size: 40,
                                        color: Colors.white,
                                      )
                                    : null,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              userName,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              user?.email ?? '',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.8),
                                fontSize: 14,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Menu Items
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: menuOptions.map((option) {
                return Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  child: ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: (option["color"] as Color).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        option["icon"] as IconData,
                        color: option["color"] as Color,
                        size: 24,
                      ),
                    ),
                    title: Text(
                      option["title"] as String,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        color: option["color"] as Color,
                      ),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    onTap: () {
                      Navigator.pop(context);
                      _handleMenuOption(context, option["title"] as String);
                    },
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  void _handleMenuOption(BuildContext context, String option) {
    switch (option) {
      case "Map":
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const HomePage()),
        );
        break;

      case "Marketplace":
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const MarketplacePage()),
        );
        break;

      case "Announcement":
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const AnnouncementPage()),
        );
        break;

      case "Guidelines":
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const GuidelinesPage()),
        );
        break;

      case "Profile":
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const ProfilePage()),
        );
        break;

      case "Chat":
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const ChatListPage()),
        );
        break;

      case "Settings":
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const SettingsPage()),
        );
        break;
    }
  }
}
