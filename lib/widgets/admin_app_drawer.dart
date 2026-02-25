// widgets/admin_app_drawer.dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

// Import admin pages
import '../admin/admin_dashboard.dart';
import '../admin/announcement_page.dart';
import '../admin/feeding_info_page.dart';
import '../admin/health_guidelines_page.dart';
import '../admin/map_page.dart';
import '../admin/settings_page.dart';
import '../main.dart';

class AdminAppDrawer extends StatelessWidget {
  const AdminAppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final List<String> menuOptions = [
      "Dashboard",
      "Map",
      "Feeding Info",
      "Health Guidelines",
      "Announcement",
      "Settings",
      "Logout",
    ];

    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration:
                BoxDecoration(color: Theme.of(context).colorScheme.primary),
            child: Text(
              "Admin Menu",
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
              ),
            ),
          ),
          ...menuOptions.map(
            (option) => ListTile(
              title: Text(option),
              onTap: () {
                Navigator.pop(context); // Close drawer
                _navigateToPage(context, option);
              },
            ),
          ),
        ],
      ),
    );
  }

  void _navigateToPage(BuildContext context, String option) async {
    Widget? page;

    switch (option) {
      case "Dashboard":
        page = const AdminHome();
        break;

      case "Map":
        page = const MapPage();
        break;

      case "Feeding Info":
        page = const FeedingInfoPage();
        break;

      case "Health Guidelines":
        page = const AdminHealthGuidelinesPage();
        break;

      case "Announcement":
        page = const AdminAnnouncementPage();
        break;

      case "Settings":
        page = const SettingsPage();
        break;

      case "Logout":
        // Navigate to the root before signing out to avoid Firestore permission errors
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const AuthGate()),
          (route) => false,
        );
        FirebaseAuth.instance.signOut();
        return;
    }

    if (page != null) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => page!),
      );
    }
  }
}
