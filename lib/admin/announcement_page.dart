import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../widgets/admin_app_drawer.dart';
import 'announcement_post_form.dart';

class AdminAnnouncementPage extends StatefulWidget {
  const AdminAnnouncementPage({super.key});

  @override
  State<AdminAnnouncementPage> createState() => _AdminAnnouncementPageState();
}

class _AdminAnnouncementPageState extends State<AdminAnnouncementPage> {
  final CollectionReference _announcementCollection =
      FirebaseFirestore.instance.collection('announcements');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Announcements (Admin)"),
        backgroundColor: Theme.of(context).colorScheme.primary,
      ),
      drawer: const AdminAppDrawer(),
      body: Column(
        children: [
          // ================= SCROLLABLE CONTENT =================
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  // ===== Add Announcement =====
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            decoration: const InputDecoration(
                              hintText: "Write new announcement...",
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
                                    const AnnouncementFormPage(),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor:
                                Theme.of(context).colorScheme.primary,
                          ),
                          child: const Text("Add"),
                        ),
                      ],
                    ),
                  ),

                  // ===== Announcement List =====
                  StreamBuilder<QuerySnapshot>(
                    stream: _announcementCollection
                        .orderBy('createdAt', descending: true)
                        .snapshots(),
                    builder: (context, snapshot) {
                      if (!snapshot.hasData) {
                        return const Center(
                          child: CircularProgressIndicator(),
                        );
                      }

                      final docs = snapshot.data!.docs;

                      if (docs.isEmpty) {
                        return const Padding(
                          padding: EdgeInsets.all(16.0),
                          child: Center(
                            child: Text("No announcements found."),
                          ),
                        );
                      }

                      return Column(
                        children: docs.map((doc) {
                          final title = doc['title'] ?? '';
                          final description = doc['description'] ?? '';
                          final timestamp = doc['createdAt'] != null
                              ? (doc['createdAt'] as Timestamp).toDate()
                              : DateTime.now();

                          return Card(
                            elevation: 4,
                            margin: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            child: ListTile(
                              leading: Icon(
                                Icons.announcement,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                              title: Text(title),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(description),
                                  const SizedBox(height: 4),
                                  Text(
                                    "Posted on: ${timestamp.toLocal()}"
                                        .split(".")[0],
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey,
                                    ),
                                  ),
                                ],
                              ),
                              trailing: IconButton(
                                icon:
                                    const Icon(Icons.delete, color: Colors.red),
                                onPressed: () => _deleteAnnouncement(doc.id),
                              ),
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

  void _deleteAnnouncement(String id) async {
    await _announcementCollection.doc(id).delete();
  }
}
