import 'package:flutter/material.dart';
import '../widgets/admin_app_drawer.dart';
import '../pages/feeding/feeding_categories_screen.dart';

class FeedingInfoPage extends StatelessWidget {
  const FeedingInfoPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Feeding Management"),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      drawer: const AdminAppDrawer(),
      body: const FeedingCategoriesScreen(isAdmin: true),
    );
  }
}

