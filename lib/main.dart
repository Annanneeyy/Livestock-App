import 'package:capstoneproject/firebase_options.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'admin/admin_dashboard.dart';
// import 'package:google_maps_flutter_android/google_maps_flutter_android.dart';
// import 'package:google_maps_flutter_platform_interface/google_maps_flutter_platform_interface.dart';

import 'admin_login_page.dart';
import 'auth_selection_page.dart';
import 'pages/home_page.dart';
import 'pages/verify_email_page.dart';
import 'providers/settings_provider.dart';
import 'theme/app_theme.dart';

// Global settings provider instance
final settingsProvider = SettingsProvider();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  debugPrint("DEBUG: APP STARTING - VERSION 2.0 (New Renderer Check)");

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Initialize settings before running the app
  await settingsProvider.init();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: settingsProvider,
      builder: (context, child) {
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: AppTheme.buildLightTheme(settingsProvider.colorTheme),
          darkTheme: AppTheme.buildDarkTheme(settingsProvider.colorTheme),
          themeMode:
              settingsProvider.isDarkMode ? ThemeMode.dark : ThemeMode.light,
          home: const AuthGate(),
        );
      },
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.userChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
              body: Center(child: CircularProgressIndicator()));
        }

        final user = snapshot.data;

        // User is not logged in
        if (user == null) {
          return kIsWeb ? const AdminLoginPage() : const AuthSelectionPage();
        }

        // Only enforce verification flow during signup process
        if (settingsProvider.isSigningUp && !user.emailVerified) {
          return const VerifyEmailPage();
        }

        // User is logged in, listen to their profile doc
        return StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection('users')
              .doc(user.uid)
              .snapshots(),
          builder: (context, docSnapshot) {
            if (docSnapshot.connectionState == ConnectionState.waiting) {
              return const Scaffold(
                  body: Center(child: CircularProgressIndicator()));
            }

            if (!docSnapshot.hasData || !docSnapshot.data!.exists) {
              // User doc doesn't exist yet. This happens during signup.
              // We wait for it instead of signing out.
              return const Scaffold(
                body: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 16),
                      Text("Setting up your account..."),
                    ],
                  ),
                ),
              );
            }

            final data = docSnapshot.data!.data() as Map<String, dynamic>;
            final String role = data['role'] ?? 'farmer';

            if (role == 'admin') {
              return const AdminHome();
            } else {
              if (kIsWeb) {
                return Scaffold(
                  body: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                            "User accounts are only available on mobile."),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => FirebaseAuth.instance.signOut(),
                          child: const Text("Logout"),
                        ),
                      ],
                    ),
                  ),
                );
              }
              return const HomePage();
            }
          },
        );
      },
    );
  }
}
