import 'package:flutter/material.dart';

import '../main.dart' show settingsProvider;
import '../providers/settings_provider.dart';
import '../widgets/admin_app_drawer.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: settingsProvider,
      builder: (context, child) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Settings'),
            backgroundColor: Theme.of(context).colorScheme.primary,
          ),
          drawer: const AdminAppDrawer(),
          body: ListView(
            children: [
              // Section Header - Appearance
              _buildSectionHeader('Appearance'),

              // Theme Toggle
              SwitchListTile(
                secondary: Icon(
                  settingsProvider.isDarkMode
                      ? Icons.dark_mode
                      : Icons.light_mode,
                  color: Theme.of(context).colorScheme.primary,
                ),
                title: const Text('Dark Mode'),
                subtitle: Text(
                  settingsProvider.isDarkMode
                      ? 'Currently using dark theme'
                      : 'Currently using light theme',
                ),
                value: settingsProvider.isDarkMode,
                onChanged: (value) async {
                  await settingsProvider.setDarkMode(value);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                            'Theme switched to ${value ? 'Dark' : 'Light'} mode'),
                        behavior: SnackBarBehavior.floating,
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  }
                },
              ),

              // Color Theme Selection
              ListTile(
                leading: Icon(Icons.palette,
                    color: Theme.of(context).colorScheme.primary),
                title: const Text('Color Theme'),
                subtitle: Text('Current: ${settingsProvider.colorTheme.name}'),
                trailing: Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: settingsProvider.colorTheme.primary,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                ),
                onTap: () => _showColorThemeDialog(context),
              ),

              // Language Selection
              ListTile(
                leading: Icon(Icons.language,
                    color: Theme.of(context).colorScheme.primary),
                title: const Text('Language'),
                subtitle: Text('Current: ${settingsProvider.language}'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showLanguageDialog(context),
              ),

              const Divider(),

              // Section Header - Notifications
              _buildSectionHeader('Notifications'),

              // Notifications Toggle
              SwitchListTile(
                secondary: Icon(
                  settingsProvider.notificationsEnabled
                      ? Icons.notifications_active
                      : Icons.notifications_off,
                  color: Theme.of(context).colorScheme.primary,
                ),
                title: const Text('Push Notifications'),
                subtitle: Text(
                  settingsProvider.notificationsEnabled
                      ? 'Notifications are enabled'
                      : 'Notifications are disabled',
                ),
                value: settingsProvider.notificationsEnabled,
                onChanged: (value) async {
                  await settingsProvider.setNotificationsEnabled(value);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(value
                            ? 'Notifications enabled'
                            : 'Notifications disabled'),
                        behavior: SnackBarBehavior.floating,
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  }
                },
              ),

              const Divider(),

              // Section Header - About
              _buildSectionHeader('About & Support'),

              // About the App
              ListTile(
                leading: Icon(Icons.info,
                    color: Theme.of(context).colorScheme.primary),
                title: const Text('About the App'),
                subtitle: const Text('Version and app details'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showAboutDialog(context),
              ),

              // Help & Support
              ListTile(
                leading: Icon(Icons.help,
                    color: Theme.of(context).colorScheme.primary),
                title: const Text('Help & Support'),
                subtitle: const Text('FAQs and contact information'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showHelpDialog(context),
              ),

              // Feedback
              ListTile(
                leading: Icon(Icons.feedback,
                    color: Theme.of(context).colorScheme.primary),
                title: const Text('Feedback'),
                subtitle: const Text('Share your suggestions'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showFeedbackDialog(context),
              ),

              // Privacy Policy
              ListTile(
                leading: Icon(Icons.privacy_tip,
                    color: Theme.of(context).colorScheme.primary),
                title: const Text('Privacy Policy'),
                subtitle: const Text('Read our privacy terms'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showPrivacyDialog(context),
              ),

              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Theme.of(context).colorScheme.primary,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  void _showColorThemeDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Select Color Theme'),
        content: SizedBox(
          width: double.maxFinite,
          child: GridView.builder(
            shrinkWrap: true,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.8,
            ),
            itemCount: AppColorTheme.values.length,
            itemBuilder: (context, index) {
              final theme = AppColorTheme.values[index];
              final isSelected = settingsProvider.colorTheme == theme;

              return GestureDetector(
                onTap: () async {
                  await settingsProvider.setColorTheme(theme);
                  if (dialogContext.mounted) {
                    Navigator.pop(dialogContext);
                  }
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Color theme changed to ${theme.name}'),
                        behavior: SnackBarBehavior.floating,
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  }
                },
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: theme.primary,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isSelected ? Colors.white : Colors.transparent,
                          width: 3,
                        ),
                        boxShadow: isSelected
                            ? [
                                BoxShadow(
                                  color: theme.primary.withOpacity(0.5),
                                  blurRadius: 8,
                                  spreadRadius: 2,
                                ),
                              ]
                            : null,
                      ),
                      child: isSelected
                          ? const Icon(Icons.check,
                              color: Colors.white, size: 24)
                          : null,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      theme.name,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight:
                            isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('About PigLivestock'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Mission', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text(
                'To empower backyard livestock farmers by providing a user-friendly mobile application that simplifies livestock management, marketplace transactions, and access to feeding information. We aim to enhance productivity, connectivity, and informed decision-making for small-scale farmers in Quezon, Bukidnon.'),
            SizedBox(height: 16),
            Text('Vision', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text(
                'To become the leading digital platform that transforms backyard livestock farming into a more efficient, connected, and sustainable livelihood for small-scale farmers.'),
            SizedBox(height: 16),
            Text('Version: 1.0.0', style: TextStyle(color: Colors.grey)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Language'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: SettingsProvider.availableLanguages.map((lang) {
            return RadioListTile<String>(
              title: Text(lang),
              value: lang,
              groupValue: settingsProvider.language,
              onChanged: (value) async {
                await settingsProvider.setLanguage(value!);
                if (context.mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Language changed to $value'),
                      behavior: SnackBarBehavior.floating,
                      duration: const Duration(seconds: 2),
                    ),
                  );
                }
              },
            );
          }).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  void _showHelpDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Help & Support'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('FAQs:', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text(
                '• How to add a post? Go to Marketplace and tap the + button.'),
            SizedBox(height: 4),
            Text('• Contact us: livestockfarming123@gmail.com'),
            SizedBox(height: 12),
            Text('For more help, contact us thru our email support.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showFeedbackDialog(BuildContext context) {
    final TextEditingController feedbackController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Share Your Feedback'),
        content: TextFormField(
          controller: feedbackController,
          decoration: const InputDecoration(
            hintText: 'Enter your suggestions...',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (feedbackController.text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Please enter feedback'),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
                return;
              }
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Thank you for your feedback!'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
              Navigator.pop(context);
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  void _showPrivacyDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Privacy Policy'),
        content: const SingleChildScrollView(
          child: Text(
            'We respect your privacy. This app collects minimal data for authentication and marketplace functionality. '
            'Data is stored securely and not shared without consent. For full details, visit this link https://privacy.gov.ph/data-privacy-act/.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}
