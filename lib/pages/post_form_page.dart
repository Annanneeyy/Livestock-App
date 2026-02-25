import 'dart:convert';
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';
import 'package:location/location.dart';

import 'pick_location_page.dart';
import '../services/notification_service.dart';

class PostFormPage extends StatefulWidget {
  final Map<String, dynamic>? productToEdit;

  const PostFormPage({super.key, this.productToEdit});

  @override
  State<PostFormPage> createState() => _PostFormPageState();
}

class _PostFormPageState extends State<PostFormPage> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _priceController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  final _contactController = TextEditingController();

  double? _latitude;
  double? _longitude;

  final ImagePicker _picker = ImagePicker();
  final List<File> _imageFiles = [];
  final List<String> _base64Images = [];

  // Category and availability variables
  String _selectedCategory = 'Baktin';
  final List<String> _categories = ['Baktin', 'Lechonon', 'Lapaon'];
  bool _isAvailable = true;
  bool _isSubmitting = false; // Prevent double submission

  @override
  void initState() {
    super.initState();
    if (widget.productToEdit != null) {
      debugPrint(
          'DEBUG: Initializing edit mode with product: ${widget.productToEdit}');
      debugPrint(
          'DEBUG: Product ID in initState: ${widget.productToEdit!['id']}');

      _nameController.text = widget.productToEdit!['name'] ?? '';
      _priceController.text = widget.productToEdit!['price'] ?? '';
      _descriptionController.text = widget.productToEdit!['description'] ?? '';
      _locationController.text = widget.productToEdit!['location'] ??
          widget.productToEdit!['locationText'] ??
          '';
      _contactController.text = widget.productToEdit!['contact'] ?? '';
      _latitude = widget.productToEdit!['latitude'];
      _longitude = widget.productToEdit!['longitude'];
      _selectedCategory = widget.productToEdit!['category'] ?? 'Baktin';
      _isAvailable = widget.productToEdit!['isAvailable'] ?? true;

      // Load existing images if they exist
      if (widget.productToEdit!['imageBase64List'] != null) {
        final list = widget.productToEdit!['imageBase64List'] as List<dynamic>;
        _base64Images.addAll(list.map((e) => e.toString()));
      } else if (widget.productToEdit!['imageBase64'] != null) {
        // Fallback for single image legacy posts
        _base64Images.add(widget.productToEdit!['imageBase64'].toString());
      }

      // Verify we have an ID
      if (widget.productToEdit!['id'] == null ||
          widget.productToEdit!['id'].toString().isEmpty) {
        debugPrint('ERROR: Product to edit has no ID!');
      }
    } else {
      debugPrint('DEBUG: Initializing create mode (no productToEdit)');
    }
  }

  // Pick image from gallery or camera and convert to base64
  Future<void> _pickImage(ImageSource source) async {
    if (_base64Images.length >= 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 10 images allowed')),
      );
      return;
    }

    // AGGRESSIVE COMPRESSION to prevent Firestore 1MB limit error
    final pickedFile = await _picker.pickImage(
      source: source,
      imageQuality: 35, // Low quality for small base64 strings
      maxWidth: 600, // Resize to 600px width
      maxHeight: 600, // Resize to 600px height
    );

    if (pickedFile != null) {
      final bytes = await pickedFile.readAsBytes();
      final base64String = base64Encode(bytes);

      // Check if this single image is too big (Firestore field limit is ~1MB)
      if (base64String.length > 800000) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content:
                    Text('❌ Image too large. Please select a smaller one.')),
          );
        }
        return;
      }

      setState(() {
        _imageFiles.add(File(pickedFile.path));
        _base64Images.add(base64String);
      });
    }
  }

  void _removeImage(int index) {
    setState(() {
      if (index < _imageFiles.length) {
        _imageFiles.removeAt(index);
      }
      _base64Images.removeAt(index);
    });
  }

  Future<void> _useCurrentLocation() async {
    final location = Location();

    bool serviceEnabled = await location.serviceEnabled();
    if (!serviceEnabled) {
      serviceEnabled = await location.requestService();
      if (!serviceEnabled) return;
    }

    PermissionStatus permission = await location.hasPermission();
    if (permission == PermissionStatus.denied) {
      permission = await location.requestPermission();
      if (permission != PermissionStatus.granted) return;
    }

    final loc = await location.getLocation();

    setState(() {
      _latitude = loc.latitude;
      _longitude = loc.longitude;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('📍 Current location set')),
    );
  }

  Future<void> _pickOnMap() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const PickLocationPage()),
    );

    if (result != null && result is LatLng) {
      setState(() {
        _latitude = result.latitude;
        _longitude = result.longitude;
      });
    }
  }

  Future<void> _submit() async {
    // Prevent double submission
    if (_isSubmitting) {
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    if (_latitude == null || _longitude == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('❌ Please use Current Location or Pick on Map'),
        ),
      );
      return;
    }

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    // Set submitting flag
    setState(() {
      _isSubmitting = true;
    });

    // Fetch user details to save with the post
    String sellerName = 'Unknown';
    String sellerEmail = user.email ?? 'Unknown';

    try {
      final userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .get();

      if (userDoc.exists) {
        final userData = userDoc.data()!;
        final firstName = userData['firstName'] ?? '';
        final lastName = userData['lastName'] ?? '';
        if (firstName.isNotEmpty || lastName.isNotEmpty) {
          sellerName = '$firstName $lastName'.trim();
        }
      }
    } catch (e) {
      debugPrint('Error fetching user data: $e');
    }

    final isEditMode = widget.productToEdit != null &&
        widget.productToEdit!['id'] != null &&
        widget.productToEdit!['id'].toString().isNotEmpty;

    try {
      if (isEditMode) {
        // Editing existing post
        final productId = widget.productToEdit!['id'].toString();
        final docRef = FirebaseFirestore.instance
            .collection('livestock')
            .doc(productId.toString());

        final docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
          throw Exception('Post not found');
        }

        final existingData = docSnapshot.data()!;
        if (existingData['sellerId'] != user.uid) {
          throw Exception('Unauthorized');
        }

        // Build update data
        final Map<String, dynamic> updateData = {
          'name': _nameController.text.trim(),
          'category': _selectedCategory,
          'price': _priceController.text.trim(),
          'description': _descriptionController.text.trim(),
          'location': _locationController.text.trim(),
          'locationText': _locationController.text.trim(),
          'latitude': _latitude,
          'longitude': _longitude,
          'contact': _contactController.text.trim(),
          'isAvailable': _isAvailable,
          'sellerName': sellerName,
          'sellerEmail': sellerEmail,
          'imageBase64List': _base64Images,
          'imageBase64': _base64Images.isNotEmpty ? _base64Images.first : null,
        };

        await docRef.update(updateData);

        if (mounted) {
          _onSuccess('✅ Post updated successfully!');
        }
      } else {
        // Creating new post
        final Map<String, dynamic> postData = {
          'name': _nameController.text.trim(),
          'category': _selectedCategory,
          'price': _priceController.text.trim(),
          'description': _descriptionController.text.trim(),
          'location': _locationController.text.trim(),
          'locationText': _locationController.text.trim(),
          'latitude': _latitude,
          'longitude': _longitude,
          'contact': _contactController.text.trim(),
          'sellerId': user.uid,
          'sellerName': sellerName,
          'sellerEmail': sellerEmail,
          'isAvailable': _isAvailable,
          'createdAt': FieldValue.serverTimestamp(),
          'imageBase64List': _base64Images,
          'imageBase64': _base64Images.isNotEmpty ? _base64Images.first : null,
        };

        final docRef = await FirebaseFirestore.instance.collection('livestock').add(postData);
        
        // Create notifications for all users
        await NotificationService.notifyNewPost(
          docRef.id,
          sellerName,
          _nameController.text.trim(),
        );

        if (mounted) {
          _onSuccess('✅ Post created successfully!');
        }
      }
    } catch (e) {
      debugPrint('ERROR: Error saving post: $e');
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _onSuccess(String message) {
    setState(() => _isSubmitting = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
      ),
    );
    Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Post'),
        backgroundColor: Colors.green,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Image Picker
              const Text('Photo'),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_base64Images.isEmpty)
                          Container(
                            height: 100,
                            width: double.infinity,
                            color: Colors.grey.shade200,
                            child: const Icon(Icons.image, size: 50),
                          )
                        else
                          SizedBox(
                            height: 120,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: _base64Images.length,
                              itemBuilder: (context, index) {
                                return Stack(
                                  children: [
                                    Container(
                                      margin: const EdgeInsets.only(right: 8),
                                      width: 100,
                                      height: 100,
                                      decoration: BoxDecoration(
                                        border: Border.all(color: Colors.grey),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(8),
                                        child: Image.memory(
                                          base64Decode(_base64Images[index]),
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      top: 0,
                                      right: 8,
                                      child: GestureDetector(
                                        onTap: () => _removeImage(index),
                                        child: Container(
                                          padding: const EdgeInsets.all(2),
                                          decoration: const BoxDecoration(
                                            color: Colors.red,
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(
                                            Icons.close,
                                            size: 16,
                                            color: Colors.white,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                );
                              },
                            ),
                          ),
                        Text(
                          '${_base64Images.length} / 10 images',
                          style: TextStyle(color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Column(
                    children: [
                      ElevatedButton.icon(
                        onPressed: _isSubmitting
                            ? null
                            : () => _pickImage(ImageSource.gallery),
                        icon: const Icon(Icons.photo_library),
                        label: const Text('Gallery'),
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton.icon(
                        onPressed: _isSubmitting
                            ? null
                            : () => _pickImage(ImageSource.camera),
                        icon: const Icon(Icons.camera_alt),
                        label: const Text('Camera'),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Name
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Product Name'),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              // Category
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                items: _categories
                    .map(
                        (cat) => DropdownMenuItem(value: cat, child: Text(cat)))
                    .toList(),
                onChanged: (value) =>
                    setState(() => _selectedCategory = value!),
                decoration: const InputDecoration(labelText: 'Category'),
              ),
              const SizedBox(height: 12),
              // Price
              TextFormField(
                controller: _priceController,
                decoration: const InputDecoration(labelText: 'Price'),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              // Location
              TextFormField(
                controller: _locationController,
                decoration: const InputDecoration(
                  labelText: 'Specify Your Location (Optional)',
                  hintText: 'Specify the place so your buyers will know',
                ),
              ),
              Row(
                children: [
                  Expanded(
                    child: TextButton.icon(
                      icon: const Icon(Icons.my_location),
                      label: const Text('Use Current'),
                      onPressed: _useCurrentLocation,
                    ),
                  ),
                  Expanded(
                    child: TextButton.icon(
                      icon: const Icon(Icons.map),
                      label: const Text('Pick on Map'),
                      onPressed: _pickOnMap,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Contact Number
              TextFormField(
                controller: _contactController,
                decoration: const InputDecoration(labelText: 'Contact Number'),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              // Description
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(labelText: 'Description'),
                maxLines: 3,
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              // Availability Toggle
              SwitchListTile(
                title: const Text('Available for Sale'),
                value: _isAvailable,
                onChanged: (value) => setState(() => _isAvailable = value),
              ),
              const SizedBox(height: 16),
              // Submit Button
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                ),
                onPressed: _isSubmitting ? null : _submit,
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text('Submit'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
