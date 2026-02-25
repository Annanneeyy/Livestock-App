import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../services/notification_service.dart';

class AddHealthPage extends StatefulWidget {
  const AddHealthPage({super.key});

  @override
  State<AddHealthPage> createState() => _AddHealthPageState();
}

class _AddHealthPageState extends State<AddHealthPage> {
  final _formKey = GlobalKey<FormState>();

  final TextEditingController _diseaseController = TextEditingController();
  final TextEditingController _symptomsController = TextEditingController();
  final TextEditingController _treatmentController = TextEditingController();
  final TextEditingController _medicineController = TextEditingController();

  Future<void> _saveHealthGuideline() async {
    final docRef = await FirebaseFirestore.instance
        .collection('health_guidelines')
        .add({
      'disease': _diseaseController.text.trim(),
      'symptoms': _symptomsController.text.trim(),
      'treatment': _treatmentController.text.trim(),
      'medicine': _medicineController.text.trim(),
      'createdAt': Timestamp.now(),
    });

    // Create notifications for all users
    await NotificationService.notifyHealthGuidelineUpdate(
      docRef.id,
      _diseaseController.text.trim(),
    );

    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Add Health Guideline"),
        backgroundColor: Colors.green,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              TextFormField(
                controller: _diseaseController,
                decoration: const InputDecoration(
                  labelText: "Disease Name",
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                v == null || v.isEmpty ? "Required" : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _symptomsController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: "Symptoms",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _treatmentController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: "Treatment / Control Measures",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _medicineController,
                decoration: const InputDecoration(
                  labelText: "Recommended Medicine",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                ),
                onPressed: () {
                  if (_formKey.currentState!.validate()) {
                    _saveHealthGuideline();
                  }
                },
                child: const Text("Save"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}