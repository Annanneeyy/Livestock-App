import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../widgets/app_drawer.dart';
import '../widgets/notification_bell.dart';
import 'feeding/feeding_categories_screen.dart';

class GuidelinesPage extends StatefulWidget {
  const GuidelinesPage({super.key});

  @override
  State<GuidelinesPage> createState() => _GuidelinesPageState();
}

class _GuidelinesPageState extends State<GuidelinesPage> {
  int _selectedIndex = 0; // 0 for Health, 1 for Feeding
  String _healthSearchQuery = "";
  String _feedingSearchQuery = '';
  String _selectedBarangay = 'All';
  final List<String> _barangays = ['All', 'Baktin', 'Lapaon', 'Anayon'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Guidelines"),
        actions: [
          const NotificationBell(),
        ],
      ),
      drawer: const AppDrawer(),
      body: Column(
        children: [
          // Selection Buttons
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: _buildSelectionButton(
                    icon: Icons.health_and_safety,
                    label: 'Health Guidelines',
                    isSelected: _selectedIndex == 0,
                    onTap: () => setState(() => _selectedIndex = 0),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildSelectionButton(
                    icon: Icons.restaurant_menu,
                    label: 'Feeding Info',
                    isSelected: _selectedIndex == 1,
                    onTap: () => setState(() => _selectedIndex = 1),
                  ),
                ),
              ],
            ),
          ),
          // Content based on selection
          Expanded(
            child: _selectedIndex == 0
                ? _buildHealthGuidelinesTab()
                : _buildFeedingInfoTab(),
          ),
        ],
      ),
    );
  }

  Widget _buildSelectionButton({
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final primaryColor = Theme.of(context).colorScheme.primary;
    
    return Material(
      elevation: isSelected ? 4 : 2,
      borderRadius: BorderRadius.circular(12),
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
          decoration: BoxDecoration(
            color: isSelected
                ? primaryColor.withOpacity(0.7)
                : primaryColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected
                  ? primaryColor
                  : primaryColor.withOpacity(0.3),
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: isSelected ? Colors.white : primaryColor,
                size: 24,
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  label,
                  style: TextStyle(
                    color: isSelected ? Colors.white : primaryColor,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHealthGuidelinesTab() {
    return Column(
      children: [
        // Search Bar
        Container(
          padding: const EdgeInsets.all(16),
          color: Theme.of(context).scaffoldBackgroundColor,
          child: TextField(
            decoration: InputDecoration(
              hintText: "Search disease or symptoms",
              prefixIcon: const Icon(Icons.search, color: AppTheme.primaryColor),
              suffixIcon: _healthSearchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () => setState(() => _healthSearchQuery = ''),
                    )
                  : null,
              filled: true,
              fillColor: AppTheme.backgroundColor,
            ),
            onChanged: (value) {
              setState(() {
                _healthSearchQuery = value.toLowerCase();
              });
            },
          ),
        ),
        // Health Guidelines List
        Expanded(
          child: StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('health_guidelines')
                .orderBy('createdAt', descending: true)
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.hasError) {
                return const Center(child: Text("Something went wrong."));
              }

              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }

              if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.health_and_safety_outlined,
                        size: 80,
                        color: AppTheme.textSecondaryColor.withOpacity(0.5),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        "No health guideline found.",
                        style: AppTheme.bodyLarge.copyWith(
                          color: AppTheme.textSecondaryColor,
                        ),
                      ),
                    ],
                  ),
                );
              }

              final guidelines = snapshot.data!.docs.where((doc) {
                final disease = (doc['disease'] ?? '').toString().toLowerCase();
                final symptoms = (doc['symptoms'] ?? '').toString().toLowerCase();
                return disease.contains(_healthSearchQuery) || symptoms.contains(_healthSearchQuery);
              }).toList();

              if (guidelines.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.health_and_safety_outlined,
                        size: 80,
                        color: AppTheme.textSecondaryColor.withOpacity(0.5),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        "No health guideline found.",
                        style: AppTheme.bodyLarge.copyWith(
                          color: AppTheme.textSecondaryColor,
                        ),
                      ),
                    ],
                  ),
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: guidelines.length,
                itemBuilder: (context, index) {
                  final data = guidelines[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppTheme.radiusL),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(16),
                      leading: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.errorColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.health_and_safety,
                          color: AppTheme.errorColor,
                          size: 24,
                        ),
                      ),
                      title: Text(
                        data['disease'] ?? '',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          data['symptoms'] ?? '',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppTheme.bodyMedium,
                        ),
                      ),
                      trailing: const Icon(
                        Icons.arrow_forward_ios,
                        size: 16,
                        color: AppTheme.textSecondaryColor,
                      ),
                      onTap: () => _showHealthDetails(context, data),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFeedingInfoTab() {
    return const FeedingCategoriesScreen(isAdmin: false);
  }


  void _showHealthDetails(BuildContext context, QueryDocumentSnapshot data) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusL),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.errorColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.health_and_safety,
                color: AppTheme.errorColor,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                data['disease'] ?? '',
                style: AppTheme.heading3,
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _infoSection(Icons.sick, "Symptoms", data['symptoms']),
              _infoSection(Icons.medical_services, "Recommended Treatment", data['treatment']),
              _infoSection(Icons.medication, "Recommended Medicine", data['medicine']),
            ],
          ),
        ),
        actions: [
          TextButton(
            child: const Text("Close"),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }

  void _showFeedingDetails(Map<String, dynamic> feeding) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusL),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.restaurant_menu,
                color: Theme.of(context).colorScheme.primary,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                feeding['name'] ?? 'Feeding Info',
                style: AppTheme.heading3,
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildDetailRow(Icons.category, 'Category', feeding['category'] ?? 'Unknown'),
              const SizedBox(height: 12),
              _buildDetailRow(
                  Icons.description, 'Description', feeding['description'] ?? 'No description'),
              if (feeding['instructions'] != null && feeding['instructions'].toString().isNotEmpty) ...[
                const SizedBox(height: 12),
                _buildDetailRow(Icons.list, 'Instructions', feeding['instructions'].toString()),
              ],
              const SizedBox(height: 12),
              _buildDetailRow(
                Icons.access_time,
                'Posted on',
                (feeding['createdAt'] as Timestamp?)
                        ?.toDate()
                        .toLocal()
                        .toString()
                        .split(".")[0] ??
                    'Unknown',
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _infoSection(IconData icon, String title, dynamic content) {
    if (content == null || content.toString().isEmpty) {
      return const SizedBox();
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: AppTheme.primaryColor),
              const SizedBox(width: 8),
              Text(
                title,
                style: AppTheme.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? Colors.grey.withOpacity(0.1)
                  : AppTheme.backgroundColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              content.toString(),
              style: AppTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.textSecondaryColor),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: AppTheme.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: AppTheme.bodyMedium,
          ),
        ),
      ],
    );
  }
}
