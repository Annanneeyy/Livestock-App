import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'dart:io'; // For File handling (if needed later, but not used here)
import '../services/notification_service.dart';

class FeedingInfoFormPage extends StatefulWidget {
  final Map<String, dynamic>? feedingToEdit;
  const FeedingInfoFormPage({this.feedingToEdit, super.key});

  @override
  State<FeedingInfoFormPage> createState() => _FeedingInfoFormPageState();
}

class _FeedingInfoFormPageState extends State<FeedingInfoFormPage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController(); // Maps to 'text'
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _instructionsController = TextEditingController();
  String _selectedCategory = 'Baktin'; // Maps to 'barangay'
  final List<String> _categories = ['Baktin', 'Lapaon', 'Anayon'];

  @override
  void initState() {
    super.initState();
    if (widget.feedingToEdit != null) {
      _nameController.text = widget.feedingToEdit!['text'] ?? ''; // Changed from 'title'
      _descriptionController.text = widget.feedingToEdit!['description'] ?? '';
      _instructionsController.text = widget.feedingToEdit!['instructions'] ?? '';
      _selectedCategory = widget.feedingToEdit!['barangay'] ?? 'Baktin'; // Changed from 'category'
    }
  }

  Future<void> _submitFeeding() async {
    if (!_formKey.currentState!.validate()) return;

    // Check if user is authenticated
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Please log in to submit feeding info.')),
      );
      return; // Stop submission
    }

    try {
      final data = {
        'text': _nameController.text.trim(), // Changed from 'title'
        'barangay': _selectedCategory, // Changed from 'category'
        'description': _descriptionController.text.trim(),
        'instructions': _instructionsController.text.trim(),
        'postedBy': user.uid, // NEW: Add this to track the poster (required for Firestore rules)
        'createdAt': widget.feedingToEdit != null
            ? widget.feedingToEdit!['createdAt']
            : FieldValue.serverTimestamp(),
      };

      if (widget.feedingToEdit != null) {
        await FirebaseFirestore.instance
            .collection('feeding_info')
            .doc(widget.feedingToEdit!['id'])
            .update(data);
        
        // Create notifications for all users when feeding info is updated
        await NotificationService.notifyFeedingInfoUpdate(
          widget.feedingToEdit!['id'],
          _nameController.text.trim(),
        );
        
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('✅ Feeding info updated!')));
      } else {
        final docRef = await FirebaseFirestore.instance.collection('feeding_info').add(data);
        
        // Create notifications for all users
        await NotificationService.notifyFeedingInfoUpdate(
          docRef.id,
          _nameController.text.trim(),
        );
        
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('✅ Feeding info added!')));
      }

      Navigator.pop(context); // This returns to the display page, triggering a refresh
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
        title: Text(widget.feedingToEdit != null ? 'Edit Feeding Info' : 'Add Feeding Info'),
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
                              'Add/Edit Feeding Info',
                              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                            ),
                            SizedBox(height: 4),
                            Text('Provide feeding details for each barangay.',
                                style: TextStyle(color: Colors.grey)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Name (now maps to 'text')
                      TextFormField(
                        controller: _nameController,
                        decoration: const InputDecoration(labelText: 'Feeding Name'),
                        validator: (value) => value!.isEmpty ? 'Enter a name' : null,
                      ),
                      const SizedBox(height: 12),
                      // Category / Barangay (now maps to 'barangay')
                      DropdownButtonFormField<String>(
                        value: _selectedCategory,
                        items: _categories
                            .map((cat) => DropdownMenuItem(value: cat, child: Text(cat)))
                            .toList(),
                        onChanged: (value) => setState(() => _selectedCategory = value!),
                        decoration: const InputDecoration(labelText: 'Category / Barangay'),
                      ),
                      const SizedBox(height: 12),
                      // Description
                      TextFormField(
                        controller: _descriptionController,
                        decoration: const InputDecoration(labelText: 'Description'),
                        maxLines: 3,
                        validator: (value) => value!.isEmpty ? 'Enter a description' : null,
                      ),
                      const SizedBox(height: 12),
                      // Instructions
                      TextFormField(
                        controller: _instructionsController,
                        decoration: const InputDecoration(labelText: 'Instructions'),
                        maxLines: 3,
                      ),
                      const SizedBox(height: 16),
                      // Submit Button
                      Center(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 12),
                          ),
                          onPressed: _submitFeeding,
                          child: Text(widget.feedingToEdit != null ? 'Update Info' : 'Submit Info'),
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