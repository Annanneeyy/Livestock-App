import 'package:flutter/material.dart';
import '../widgets/app_drawer.dart';
import 'feeding/feeding_categories_screen.dart';

class FeedingInfoPage extends StatelessWidget {
  const FeedingInfoPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Feeding Guidelines"),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      drawer: const AppDrawer(),
      body: const FeedingCategoriesScreen(isAdmin: false),
    );
  }
}

