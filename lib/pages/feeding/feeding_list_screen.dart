import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../../admin/feeding_post_form.dart';
import '../../theme/app_theme.dart';
import 'feeding_detail_screen.dart';

class FeedingListScreen extends StatelessWidget {
  final String category;
  final bool isAdmin;

  const FeedingListScreen({
    super.key,
    required this.category,
    required this.isAdmin,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("$category Feeding"),
        actions: [
          if (isAdmin)
            IconButton(
              icon: const Icon(Icons.add_circle_outline),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const FeedingInfoFormPage()),
                );
              },
            ),
        ],
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('feeding_info')
            .where('category', isEqualTo: category)
            .snapshots(),
        builder: (context, snapshot) {
          // Fallback for older data that might use 'barangay' field
          if (snapshot.hasData && snapshot.data!.docs.isEmpty) {
             return _buildStreamWithFallback(context);
          }

          return _buildList(context, snapshot);
        },
      ),
    );
  }

  Widget _buildStreamWithFallback(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('feeding_info')
          .where('barangay', isEqualTo: category)
          .snapshots(),
      builder: (context, snapshot) {
        return _buildList(context, snapshot);
      },
    );
  }

  Widget _buildList(BuildContext context, AsyncSnapshot<QuerySnapshot> snapshot) {
    if (snapshot.connectionState == ConnectionState.waiting) {
      return const Center(child: CircularProgressIndicator());
    }

    if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.restaurant_menu, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              "No feeding guidelines for $category",
              style: const TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    final docs = snapshot.data!.docs;

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: docs.length,
      itemBuilder: (context, index) {
        final data = docs[index].data() as Map<String, dynamic>;
        data['id'] = docs[index].id;

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          elevation: 4,
          shadowColor: Colors.black12,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            title: Text(
              data['text'] ?? 'Untitled',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            subtitle: Text(
              data['feed_type'] ?? data['description'] ?? 'No details',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            trailing: isAdmin 
              ? Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.edit, color: Colors.blue),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => FeedingInfoFormPage(feedingToEdit: data),
                          ),
                        );
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete, color: Colors.red),
                      onPressed: () => _confirmDelete(context, docs[index].id),
                    ),
                  ],
                )
              : const Icon(Icons.chevron_right),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => FeedingDetailScreen(feeding: data),
                ),
              );
            },
          ),
        );
      },
    );
  }

  void _confirmDelete(BuildContext context, String docId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Delete Guideline?"),
        content: const Text("Are you sure you want to delete this feeding guideline?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancel")),
          TextButton(
            onPressed: () async {
              await FirebaseFirestore.instance.collection('feeding_info').doc(docId).delete();
              Navigator.pop(context);
            },
            child: const Text("Delete", style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
