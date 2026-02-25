import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../widgets/admin_app_drawer.dart';
import 'feeding_post_form.dart'; // Import your form page

class FeedingInfoPage extends StatefulWidget {
  const FeedingInfoPage({super.key});

  @override
  State<FeedingInfoPage> createState() => _FeedingInfoPageState();
}

class _FeedingInfoPageState extends State<FeedingInfoPage> {
  final CollectionReference _feedingCollection =
      FirebaseFirestore.instance.collection('feeding_info');

  String _selectedBarangay = 'All';
  String _searchQuery = '';

  final List<String> _barangays = ['All', 'Baktin', 'Lapaon', 'Anayon'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Feeding Information"),
        backgroundColor: Theme.of(context).colorScheme.primary,
      ),
      drawer: const AdminAppDrawer(),
      body: Column(
        children: [
          // Scrollable content: search, filters, and list
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            decoration: const InputDecoration(
                              hintText: "Write new feeding info...",
                              border: OutlineInputBorder(),
                            ),
                            enabled: false,
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    const FeedingInfoFormPage(),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                              backgroundColor:
                                  Theme.of(context).colorScheme.primary),
                          child: const Text("Add"),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        DropdownButton<String>(
                          value: _selectedBarangay,
                          items: _barangays
                              .map((b) =>
                                  DropdownMenuItem(value: b, child: Text(b)))
                              .toList(),
                          onChanged: (value) {
                            if (value != null) {
                              setState(() => _selectedBarangay = value);
                            }
                          },
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextField(
                            onChanged: (value) =>
                                setState(() => _searchQuery = value),
                            decoration: const InputDecoration(
                              hintText: "Search...",
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.search),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Feeding Info List
                  StreamBuilder<QuerySnapshot>(
                    stream: _feedingCollection
                        .orderBy('createdAt', descending: true)
                        .snapshots(),
                    builder: (context, snapshot) {
                      if (!snapshot.hasData) {
                        return const Center(child: CircularProgressIndicator());
                      }

                      final docs = snapshot.data!.docs.where((doc) {
                        final text =
                            (doc['text'] ?? '').toString().toLowerCase();
                        final barangay =
                            (doc['barangay'] ?? 'Unknown').toString();
                        final matchesSearch =
                            text.contains(_searchQuery.toLowerCase());
                        final matchesBarangay = _selectedBarangay == 'All' ||
                            barangay.toLowerCase() ==
                                _selectedBarangay.toLowerCase();
                        return matchesSearch && matchesBarangay;
                      }).toList();

                      if (docs.isEmpty) {
                        return const Center(
                            child: Padding(
                          padding: EdgeInsets.all(16.0),
                          child: Text("No feeding info found."),
                        ));
                      }

                      return Column(
                        children: docs.map((doc) {
                          final text = doc['text'] ?? '';
                          final barangay = doc['barangay'] ?? 'Unknown';
                          final description = doc['description'] ?? '';
                          final instructions = doc['instructions'] ?? '';
                          final timestamp = doc['createdAt'] != null
                              ? (doc['createdAt'] as Timestamp).toDate()
                              : DateTime.now();

                          return Card(
                            elevation: 4,
                            margin: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            child: ExpansionTile(
                              leading: Icon(Icons.pets,
                                  color: Theme.of(context).colorScheme.primary),
                              title: Text(text),
                              subtitle: Text(
                                "$barangay - Posted on: ${timestamp.toLocal()}"
                                    .split(".")[0],
                                style: const TextStyle(
                                    fontSize: 12, color: Colors.grey),
                              ),
                              children: [
                                Padding(
                                  padding: const EdgeInsets.all(16.0),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      if (description.isNotEmpty) ...[
                                        const Text('Description:',
                                            style: TextStyle(
                                                fontWeight: FontWeight.bold)),
                                        Text(description),
                                        const SizedBox(height: 8),
                                      ],
                                      if (instructions.isNotEmpty) ...[
                                        const Text('Instructions:',
                                            style: TextStyle(
                                                fontWeight: FontWeight.bold)),
                                        Text(instructions),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                              trailing: IconButton(
                                icon:
                                    const Icon(Icons.delete, color: Colors.red),
                                onPressed: () => _deleteFeedingInfo(doc.id),
                              ),
                            ),
                          );
                        }).toList(),
                      );
                    },
                  ),

                  const SizedBox(height: 100), // Space for footer
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _deleteFeedingInfo(String id) async {
    await _feedingCollection.doc(id).delete();
  }
}
