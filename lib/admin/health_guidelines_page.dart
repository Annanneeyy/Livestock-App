import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../widgets/admin_app_drawer.dart';
import 'add_health_page.dart';

class AdminHealthGuidelinesPage extends StatefulWidget {
  const AdminHealthGuidelinesPage({super.key});

  @override
  State<AdminHealthGuidelinesPage> createState() =>
      _AdminHealthGuidelinesPageState();
}

class _AdminHealthGuidelinesPageState extends State<AdminHealthGuidelinesPage> {
  final CollectionReference _healthCollection =
      FirebaseFirestore.instance.collection('health_guidelines');

  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Health Guidelines"),
        backgroundColor: Theme.of(context).colorScheme.primary,
      ),
      drawer: const AdminAppDrawer(),
      body: Column(
        children: [
          // ===== Scrollable Content =====
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            enabled: false,
                            decoration: const InputDecoration(
                              hintText: "Add new health guideline...",
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor:
                                Theme.of(context).colorScheme.primary,
                          ),
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const AddHealthPage(),
                              ),
                            );
                          },
                          child: const Text("Add"),
                        ),
                      ],
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: TextField(
                      onChanged: (value) =>
                          setState(() => _searchQuery = value),
                      decoration: const InputDecoration(
                        hintText: "Search disease...",
                        prefixIcon: Icon(Icons.search),
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  StreamBuilder<QuerySnapshot>(
                    stream: _healthCollection
                        .orderBy('createdAt', descending: true)
                        .snapshots(),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(child: CircularProgressIndicator());
                      }

                      if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                        return const Padding(
                          padding: EdgeInsets.all(16),
                          child: Text("No health guidelines found."),
                        );
                      }

                      final docs = snapshot.data!.docs.where((doc) {
                        final disease =
                            (doc['disease'] ?? '').toString().toLowerCase();
                        return disease.contains(_searchQuery.toLowerCase());
                      }).toList();

                      return Column(
                        children: docs.map((doc) {
                          final disease = doc['disease'] ?? '';
                          final symptoms = doc['symptoms'] ?? '';
                          final treatment = doc['treatment'] ?? '';
                          final medicine = doc['medicine'] ?? '';

                          final timestamp = doc['createdAt'] != null
                              ? (doc['createdAt'] as Timestamp).toDate()
                              : DateTime.now();

                          return Card(
                            elevation: 4,
                            margin: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            child: ExpansionTile(
                              leading: Icon(
                                Icons.health_and_safety,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                              title: Text(disease),
                              subtitle: Text(
                                "Posted on: ${timestamp.toLocal()}"
                                    .split(".")[0],
                                style: const TextStyle(
                                    fontSize: 12, color: Colors.grey),
                              ),
                              trailing: IconButton(
                                icon:
                                    const Icon(Icons.delete, color: Colors.red),
                                onPressed: () =>
                                    _healthCollection.doc(doc.id).delete(),
                              ),
                              children: [
                                Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      if (symptoms.isNotEmpty) ...[
                                        const Text(
                                          "Symptoms:",
                                          style: TextStyle(
                                              fontWeight: FontWeight.bold),
                                        ),
                                        Text(symptoms),
                                        const SizedBox(height: 8),
                                      ],
                                      if (treatment.isNotEmpty) ...[
                                        const Text(
                                          "Treatment:",
                                          style: TextStyle(
                                              fontWeight: FontWeight.bold),
                                        ),
                                        Text(treatment),
                                        const SizedBox(height: 8),
                                      ],
                                      if (medicine.isNotEmpty) ...[
                                        const Text(
                                          "Recommended Medicine:",
                                          style: TextStyle(
                                              fontWeight: FontWeight.bold),
                                        ),
                                        Text(medicine),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      );
                    },
                  ),

                  const SizedBox(height: 100), // space for footer
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
