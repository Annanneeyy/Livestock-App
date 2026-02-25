import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/notification_service.dart';

class AnnouncementFormPage extends StatefulWidget {
  final Map<String, dynamic>? announcementToEdit;
  const AnnouncementFormPage({this.announcementToEdit, super.key});

  @override
  State<AnnouncementFormPage> createState() => _AnnouncementFormPageState();
}

class _AnnouncementFormPageState extends State<AnnouncementFormPage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.announcementToEdit != null) {
      _titleController.text = widget.announcementToEdit!['title'] ?? '';
      _descriptionController.text = widget.announcementToEdit!['description'] ?? '';
    }
  }

  Future<void> _submitAnnouncement() async {
    if (!_formKey.currentState!.validate()) return;

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Please log in to submit announcement.')),
      );
      return;
    }

    try {
      final data = {
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'postedBy': user.uid,
        'createdAt': widget.announcementToEdit != null
            ? widget.announcementToEdit!['createdAt']
            : FieldValue.serverTimestamp(),
      };

      if (widget.announcementToEdit != null) {
        await FirebaseFirestore.instance
            .collection('announcements')
            .doc(widget.announcementToEdit!['id'])
            .update(data);
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('✅ Announcement updated!')));
      } else {
        final docRef = await FirebaseFirestore.instance.collection('announcements').add(data);
        
        // Create notifications for all users
        await NotificationService.notifyAnnouncement(
          docRef.id,
          _titleController.text.trim(),
        );
        
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('✅ Announcement added!')));
      }

      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.announcementToEdit != null ? 'Edit Announcement' : 'Add Announcement'),
        backgroundColor: Colors.green,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      backgroundColor: const Color(0xFFF0F2F5),
      body: Center(
        child: SingleChildScrollView(
          child: Card(
            elevation: 4,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: 350,
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Center(
                        child: Column(
                          children: [
                            Text(
                              'Add/Edit Announcement',
                              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                            ),
                            SizedBox(height: 4),
                            Text('Provide announcement details.',
                                style: TextStyle(color: Colors.grey)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _titleController,
                        decoration: const InputDecoration(labelText: 'Title'),
                        validator: (value) => value!.isEmpty ? 'Enter a title' : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _descriptionController,
                        decoration: const InputDecoration(labelText: 'Description'),
                        maxLines: 4,
                        validator: (value) => value!.isEmpty ? 'Enter a description' : null,
                      ),
                      const SizedBox(height: 16),
                      Center(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 12),
                          ),
                          onPressed: _submitAnnouncement,
                          child: Text(widget.announcementToEdit != null ? 'Update' : 'Submit'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}