import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class FeedingDetailScreen extends StatelessWidget {
  final Map<String, dynamic> feeding;

  const FeedingDetailScreen({super.key, required this.feeding});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 180,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                feeding['text'] ?? 'Feed Detail',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  shadows: [Shadow(color: Colors.black45, blurRadius: 4)],
                ),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      colorScheme.primary,
                      colorScheme.primary.withBlue(150),
                    ],
                  ),
                ),
                child: Center(
                  child: Icon(
                    Icons.restaurant_menu,
                    size: 80,
                    color: Colors.white.withOpacity(0.3),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionCard(
                    context,
                    'Description',
                    feeding['description'] ?? 'No description provided.',
                    Icons.description,
                    Colors.blue,
                  ),
                  _buildSectionCard(
                    context,
                    'Feed Type',
                    feeding['feed_type'] ?? 'Not specified',
                    Icons.pest_control_rodent,
                    Colors.orange,
                  ),
                  _buildSectionCard(
                    context,
                    'Feeding Schedule',
                    feeding['feeding_schedule'] ?? 'Not specified',
                    Icons.schedule,
                    Colors.green,
                  ),
                  _buildSectionCard(
                    context,
                    'Nutritional Requirements',
                    feeding['nutritional_requirement'] ?? 'Not specified',
                    Icons.analytics,
                    Colors.purple,
                  ),
                  _buildSectionCard(
                    context,
                    'Feeding Best Practices',
                    feeding['feeding_best_practices'] ?? 'Not specified',
                    Icons.check_circle,
                    Colors.teal,
                  ),
                  _buildSectionCard(
                    context,
                    'Supplements & Additives',
                    feeding['supplements_additives'] ?? 'Not specified',
                    Icons.add_moderator,
                    Colors.redAccent,
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard(
    BuildContext context,
    String title,
    String content,
    IconData icon,
    Color color,
  ) {
    if (content.isEmpty) return const SizedBox.shrink();

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: color.withOpacity(0.1), width: 1),
      ),
      color: color.withOpacity(0.03),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: color.withBlue(100),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              content,
              style: AppTheme.bodyMedium.copyWith(
                height: 1.5,
                color: Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
