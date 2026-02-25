import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../widgets/app_drawer.dart';

class FeedingInfoPage extends StatefulWidget {
  const FeedingInfoPage({super.key});

  @override
  State<FeedingInfoPage> createState() => _FeedingInfoPageState();
}

class _FeedingInfoPageState extends State<FeedingInfoPage> {
  String _searchQuery = '';
  String _selectedBarangay = 'All';
  final List<String> _barangays = ['All', 'Baktin', 'Lapaon', 'Anayon'];

  Stream<QuerySnapshot> _feedingStream() {
    return FirebaseFirestore.instance
        .collection('feeding_info')
        .orderBy('createdAt', descending: true)
        .snapshots();
  }

  // Filter feedings by search and category
  List<Map<String, dynamic>> _filterFeedings(
      List<Map<String, dynamic>> feedings) {
    return feedings.where((feeding) {
      final feedName = (feeding['name'] ?? '').toString().toLowerCase();
      final category = (feeding['category'] ?? 'Unknown').toString();
      final matchesSearch =
          _searchQuery.isEmpty || feedName.contains(_searchQuery.toLowerCase());
      final matchesCategory =
          _selectedBarangay == 'All' || category == _selectedBarangay;
      return matchesSearch && matchesCategory;
    }).toList();
  }

  // Show detailed instructions
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
              _buildDetailRow(
                  Icons.category, 'Category', feeding['category'] ?? 'Unknown'),
              const SizedBox(height: 12),
              _buildDetailRow(Icons.description, 'Description',
                  feeding['description'] ?? 'No description'),
              if (feeding['instructions'] != null &&
                  feeding['instructions'].toString().isNotEmpty) ...[
                const SizedBox(height: 12),
                _buildDetailRow(Icons.list, 'Instructions',
                    feeding['instructions'].toString()),
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

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: AppTheme.textSecondaryColor),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: AppTheme.bodySmall.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: AppTheme.bodyMedium,
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Feeding Info"),
      ),
      drawer: const AppDrawer(),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.all(16),
            color: Theme.of(context).scaffoldBackgroundColor,
            child: TextField(
              onChanged: (value) => setState(() => _searchQuery = value),
              decoration: InputDecoration(
                hintText: 'Search feedings...',
                prefixIcon: Icon(Icons.search,
                    color: Theme.of(context).colorScheme.primary),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () => setState(() => _searchQuery = ''),
                      )
                    : null,
                filled: true,
                fillColor: Theme.of(context).cardColor,
              ),
            ),
          ),
          // Barangay filter chips
          Container(
            height: 60,
            padding: const EdgeInsets.symmetric(vertical: 8),
            color: Theme.of(context).scaffoldBackgroundColor,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _barangays.length,
              itemBuilder: (context, index) {
                final barangay = _barangays[index];
                final isSelected = _selectedBarangay == barangay;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(barangay),
                    selected: isSelected,
                    onSelected: (_) =>
                        setState(() => _selectedBarangay = barangay),
                    selectedColor:
                        Theme.of(context).colorScheme.primary.withOpacity(0.3),
                    checkmarkColor: Theme.of(context).colorScheme.primary,
                    labelStyle: TextStyle(
                      color: isSelected
                          ? Theme.of(context).colorScheme.primary
                          : Theme.of(context).textTheme.bodyMedium?.color,
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                );
              },
            ),
          ),

          // Feeding info cards
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: _feedingStream(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                  return const Center(child: Text('No feeding info available'));
                }

                final feedings = snapshot.data!.docs
                    .map((doc) =>
                        {'id': doc.id, ...doc.data() as Map<String, dynamic>})
                    .toList();

                final filteredFeedings = _filterFeedings(feedings);

                if (filteredFeedings.isEmpty) {
                  return const Center(child: Text('No feeding info found'));
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filteredFeedings.length,
                  itemBuilder: (context, index) {
                    final feeding = filteredFeedings[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppTheme.radiusL),
                      ),
                      child: InkWell(
                        onTap: () => _showFeedingDetails(feeding),
                        borderRadius: BorderRadius.circular(AppTheme.radiusL),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Theme.of(context)
                                          .colorScheme
                                          .primary
                                          .withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      feeding['category'] ?? 'Unknown',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 12,
                                        color: Theme.of(context)
                                            .colorScheme
                                            .primary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                feeding['name'] ?? 'No Feed Name',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                feeding['instructions'] ?? 'No instructions',
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                                style: AppTheme.bodyMedium,
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Icon(
                                    Icons.arrow_forward,
                                    size: 16,
                                    color:
                                        Theme.of(context).colorScheme.primary,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Tap to view details',
                                    style: AppTheme.bodySmall.copyWith(
                                      color:
                                          Theme.of(context).colorScheme.primary,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
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
}
