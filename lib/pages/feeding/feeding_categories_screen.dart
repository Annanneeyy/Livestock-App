import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import 'feeding_list_screen.dart';

class FeedingCategoriesScreen extends StatelessWidget {
  final bool isAdmin;

  const FeedingCategoriesScreen({super.key, this.isAdmin = false});

  @override
  Widget build(BuildContext context) {
    final List<Map<String, dynamic>> categories = [
      {
        'name': 'Baktin',
        'icon': Icons.child_care,
        'color': const Color(0xFF6A11CB),
        'secondColor': const Color(0xFF2575FC),
        'desc': 'Piglet feeding guidelines'
      },
      {
        'name': 'Anayon',
        'icon': Icons.female,
        'color': const Color(0xFFFD6585),
        'secondColor': const Color(0xFF0D25B9),
        'desc': 'Sow/Breeder feeding'
      },
      {
        'name': 'Lapaon',
        'icon': Icons.fitness_center,
        'color': const Color(0xFFF2D50F),
        'secondColor': const Color(0xFFDA0641),
        'desc': 'Fattening feeding'
      },
      {
        'name': 'Letchonon',
        'icon': Icons.restaurant,
        'color': const Color(0xFF00B09B),
        'secondColor': const Color(0xFF96C93D),
        'desc': 'Letchon/Market size'
      },
    ];

    return Scaffold(
      body: Column(
        children: [
          _buildHeader(context),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(20),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.85,
                crossAxisSpacing: 20,
                mainAxisSpacing: 20,
              ),
              itemCount: categories.length,
              itemBuilder: (context, index) {
                final cat = categories[index];
                return _buildCategoryCard(context, cat);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.only(top: 60, left: 24, right: 24, bottom: 24),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Feeding Guidelines",
            style: TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "Select a category to view specific feed requirements",
            style: TextStyle(
              color: Colors.white.withOpacity(0.8),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryCard(BuildContext context, Map<String, dynamic> cat) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => FeedingListScreen(
                category: cat['name'],
                isAdmin: isAdmin,
              ),
            ),
          );
        },
        borderRadius: BorderRadius.circular(24),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [cat['color'], cat['secondColor']],
            ),
            boxShadow: [
              BoxShadow(
                color: cat['color'].withOpacity(0.4),
                blurRadius: 12,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Stack(
            children: [
              Positioned(
                right: -20,
                top: -20,
                child: Icon(
                  cat['icon'],
                  size: 100,
                  color: Colors.white.withOpacity(0.15),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(cat['icon'], color: Colors.white, size: 24),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      cat['name'],
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      cat['desc'],
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
