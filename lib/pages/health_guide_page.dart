//farmer health guide page

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../widgets/app_drawer.dart';

class HealthGuidelinesPage extends StatefulWidget {
  const HealthGuidelinesPage({super.key});

  @override
  State<HealthGuidelinesPage> createState() => _HealthGuidelinesPageState();
}

class _HealthGuidelinesPageState extends State<HealthGuidelinesPage> {
  String searchQuery = "";

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Health Guidelines"),
      ),
      drawer: const AppDrawer(),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.all(16),
            color: Theme.of(context).scaffoldBackgroundColor,
            child: TextField(
              decoration: InputDecoration(
                hintText: "Search disease or symptoms",
                prefixIcon:
                    const Icon(Icons.search, color: AppTheme.primaryColor),
                suffixIcon: searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () => setState(() => searchQuery = ''),
                      )
                    : null,
                filled: true,
                fillColor: AppTheme.backgroundColor,
              ),
              onChanged: (value) {
                setState(() {
                  searchQuery = value.toLowerCase();
                });
              },
            ),
          ),

          // 📋 Health Guidelines List
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

                final guidelines = snapshot.data!.docs.where((doc) {
                  final disease =
                      (doc['disease'] ?? '').toString().toLowerCase();
                  final symptoms =
                      (doc['symptoms'] ?? '').toString().toLowerCase();

                  return disease.contains(searchQuery) ||
                      symptoms.contains(searchQuery);
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
                        onTap: () {
                          _showHealthDetails(context, data);
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // Read-only Details Dialog
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
              _infoSection(Icons.medical_services, "Recommended Treatment",
                  data['treatment']),
              _infoSection(
                  Icons.medication, "Recommended Medicine", data['medicine']),
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
}
