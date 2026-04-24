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
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  
  // New detail controllers
  final TextEditingController _feedTypeController = TextEditingController();
  final TextEditingController _scheduleController = TextEditingController();
  final TextEditingController _nutritionController = TextEditingController();
  final TextEditingController _bestPracticesController = TextEditingController();
  final TextEditingController _supplementsController = TextEditingController();

  String _selectedCategory = 'Baktin';
  final List<String> _categories = ['Baktin', 'Anayon', 'Lapaon', 'Letchonon'];

  @override
  void initState() {
    super.initState();
    if (widget.feedingToEdit != null) {
      _nameController.text = widget.feedingToEdit!['text'] ?? '';
      _descriptionController.text = widget.feedingToEdit!['description'] ?? '';
      _selectedCategory = widget.feedingToEdit!['category'] ?? 
                         widget.feedingToEdit!['barangay'] ?? 'Baktin';
      
      _feedTypeController.text = widget.feedingToEdit!['feed_type'] ?? '';
      _scheduleController.text = widget.feedingToEdit!['feeding_schedule'] ?? '';
      _nutritionController.text = widget.feedingToEdit!['nutritional_requirement'] ?? '';
      _bestPracticesController.text = widget.feedingToEdit!['feeding_best_practices'] ?? '';
      _supplementsController.text = widget.feedingToEdit!['supplements_additives'] ?? '';
    }
  }

  Future<void> _submitFeeding() async {
    if (!_formKey.currentState!.validate()) return;

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Please log in to submit feeding info.')),
      );
      return;
    }

    try {
      final data = {
        'text': _nameController.text.trim(),
        'category': _selectedCategory,
        'barangay': _selectedCategory, // Keep for backward compatibility
        'description': _descriptionController.text.trim(),
        'feed_type': _feedTypeController.text.trim(),
        'feeding_schedule': _scheduleController.text.trim(),
        'nutritional_requirement': _nutritionController.text.trim(),
        'feeding_best_practices': _bestPracticesController.text.trim(),
        'supplements_additives': _supplementsController.text.trim(),
        'postedBy': user.uid,
        'createdAt': widget.feedingToEdit != null
            ? widget.feedingToEdit!['createdAt']
            : FieldValue.serverTimestamp(),
      };

      if (widget.feedingToEdit != null) {
        await FirebaseFirestore.instance
            .collection('feeding_info')
            .doc(widget.feedingToEdit!['id'])
            .update(data);
        
        await NotificationService.notifyFeedingInfoUpdate(
          widget.feedingToEdit!['id'],
          _nameController.text.trim(),
        );
        
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('✅ Feeding info updated!')));
      } else {
        final docRef = await FirebaseFirestore.instance.collection('feeding_info').add(data);
        
        await NotificationService.notifyFeedingInfoUpdate(
          docRef.id,
          _nameController.text.trim(),
        );
        
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('✅ Feeding info added!')));
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
        title: Text(widget.feedingToEdit != null ? 'Edit Feeding Info' : 'Add Feeding Info'),
        backgroundColor: Colors.green,
        elevation: 0,
      ),
      backgroundColor: const Color(0xFFF0F2F5),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildFormSection(
                  title: 'Basic Information',
                  children: [
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Feed Name (e.g. Grower, Piglet)',
                        prefixIcon: Icon(Icons.title),
                      ),
                      validator: (value) => value!.isEmpty ? 'Enter a name' : null,
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _selectedCategory,
                      items: _categories
                          .map((cat) => DropdownMenuItem(value: cat, child: Text(cat)))
                          .toList(),
                      onChanged: (value) => setState(() => _selectedCategory = value!),
                      decoration: const InputDecoration(
                        labelText: 'Category',
                        prefixIcon: Icon(Icons.category),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _descriptionController,
                      decoration: const InputDecoration(
                        labelText: 'General Description',
                        prefixIcon: Icon(Icons.description),
                      ),
                      maxLines: 2,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildFormSection(
                  title: 'Feeding Details',
                  children: [
                    _buildDetailField(_feedTypeController, 'Feed Type', Icons.pest_control_rodent),
                    _buildDetailField(_scheduleController, 'Feeding Schedule', Icons.schedule),
                    _buildDetailField(_nutritionController, 'Nutritional Requirements', Icons.analytics),
                    _buildDetailField(_bestPracticesController, 'Feeding Best Practices', Icons.check_circle),
                    _buildDetailField(_supplementsController, 'Supplements & Additives', Icons.add_moderator),
                  ],
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: _submitFeeding,
                  child: Text(
                    widget.feedingToEdit != null ? 'UPDATE GUIDELINE' : 'SUBMIT GUIDELINE',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFormSection({required String title, required List<Widget> children}) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green),
            ),
            const Divider(height: 24),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildDetailField(TextEditingController controller, String label, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon),
          alignLabelWithHint: true,
        ),
        maxLines: 3,
      ),
    );
  }
}