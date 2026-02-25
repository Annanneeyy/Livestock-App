import 'dart:convert';
import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import 'private_message_page.dart';

class MarketplacePostDetailPage extends StatefulWidget {
  final String postId;

  const MarketplacePostDetailPage({super.key, required this.postId});

  @override
  State<MarketplacePostDetailPage> createState() =>
      _MarketplacePostDetailPageState();
}

class _MarketplacePostDetailPageState extends State<MarketplacePostDetailPage> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  late Future<DocumentSnapshot> _postFuture;

  // Cache decoded images to prevent flickering on swipe
  List<Uint8List>? _decodedImages;

  @override
  void initState() {
    super.initState();
    _postFuture = FirebaseFirestore.instance
        .collection('livestock')
        .doc(widget.postId)
        .get();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Post Details"),
        backgroundColor: Colors.green,
        actions: [
          FutureBuilder<DocumentSnapshot>(
            future: _postFuture,
            builder: (context, snapshot) {
              if (!snapshot.hasData || !snapshot.data!.exists)
                return const SizedBox.shrink();
              final data = snapshot.data!.data() as Map<String, dynamic>;
              final sellerId = data['sellerId'];
              final currentUser = FirebaseAuth.instance.currentUser;

              if (sellerId == null || sellerId == currentUser?.uid) {
                return const SizedBox.shrink();
              }

              return IconButton(
                icon: const Icon(Icons.chat_bubble_outline),
                tooltip: 'Chat with Seller',
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => PrivateMessagePage(
                        receiverId: sellerId,
                        receiverName: data['sellerName'] ??
                            data['sellerEmail'] ??
                            'Unknown Seller',
                        postId: widget.postId,
                        postName: data['name'],
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
      body: FutureBuilder<DocumentSnapshot>(
        future: _postFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || !snapshot.data!.exists) {
            return const Center(child: Text("Post not found"));
          }

          final data = snapshot.data!.data() as Map<String, dynamic>;
          final bool isAvailable = data['isAvailable'] ?? true;

          // Process images once
          if (_decodedImages == null) {
            _decodedImages = [];
            final imageList = data['imageBase64List'] as List<dynamic>?;
            if (imageList != null && imageList.isNotEmpty) {
              for (var base64 in imageList) {
                try {
                  _decodedImages!.add(base64Decode(base64.toString()));
                } catch (_) {}
              }
            } else if (data['imageBase64'] != null) {
              try {
                _decodedImages!
                    .add(base64Decode(data['imageBase64'].toString()));
              } catch (_) {}
            }
          }

          // Build list of widgets
          final List<Widget> imageWidgets = [];

          if (_decodedImages != null && _decodedImages!.isNotEmpty) {
            for (var bytes in _decodedImages!) {
              imageWidgets.add(Image.memory(
                bytes,
                width: double.infinity,
                height: 300,
                fit: BoxFit.cover,
                gaplessPlayback: true, // Prevents white flash
                errorBuilder: (_, __, ___) => _buildPlaceholder(),
              ));
            }
          } else if (data['imageUrl'] != null &&
              data['imageUrl'].toString().isNotEmpty) {
            imageWidgets.add(Image.network(
              data['imageUrl'],
              width: double.infinity,
              height: 300,
              gaplessPlayback: true,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _buildPlaceholder(),
            ));
          } else {
            imageWidgets.add(_buildPlaceholder());
          }

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Swipable Image Section
                Stack(
                  alignment: Alignment.bottomCenter,
                  children: [
                    SizedBox(
                      height: 300,
                      child: PageView.builder(
                        controller: _pageController,
                        itemCount: imageWidgets.length,
                        onPageChanged: (index) {
                          setState(() {
                            _currentPage = index;
                          });
                        },
                        itemBuilder: (context, index) => imageWidgets[index],
                      ),
                    ),
                    if (imageWidgets.length > 1)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(
                            imageWidgets.length,
                            (index) => Container(
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: _currentPage == index
                                    ? Colors.green
                                    : Colors.grey.withOpacity(0.5),
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),

                // POST INFO
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title
                      Text(
                        data['name'] ?? 'No Name',
                        style: const TextStyle(
                            fontSize: 22, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),

                      // Status Badge
                      _StatusBadge(isAvailable: isAvailable),
                      const SizedBox(height: 8),

                      // Description
                      Text(
                        data['description'] ?? 'No Description',
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(height: 8),

                      // Category
                      Text(
                        'Category: ${data['category'] ?? 'Unknown'}',
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(height: 8),

                      // Price
                      Text(
                        'Price: ₱${data['price'] ?? 'N/A'}',
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),

                      // Seller
                      Text(
                        'Seller: ${data['sellerName'] ?? data['sellerEmail'] ?? 'Unknown'}',
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(height: 8),

                      // Location
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Location: ${data['location'] ?? data['locationText'] ?? 'Unknown'}',
                            style: const TextStyle(fontSize: 16),
                          ),
                          if (data['latitude'] != null &&
                              data['longitude'] != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 4.0),
                              child: Text(
                                'Coordinates: ${data['latitude']}, ${data['longitude']}',
                                style: const TextStyle(
                                    fontSize: 14, color: Colors.grey),
                              ),
                            ),
                          const SizedBox(height: 8),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // Contact
                      Text(
                        'Contact: ${data['contactNumber'] ?? data['contact'] ?? 'N/A'}',
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

Widget _buildPlaceholder() {
  return Container(
    width: double.infinity,
    height: 250,
    color: Colors.grey[300],
    child: const Icon(Icons.image_not_supported, size: 100, color: Colors.grey),
  );
}

class _StatusBadge extends StatelessWidget {
  final bool isAvailable;
  const _StatusBadge({required this.isAvailable});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isAvailable ? Colors.green : Colors.red,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        isAvailable ? 'AVAILABLE' : 'SOLD',
        style: const TextStyle(color: Colors.white, fontSize: 12),
      ),
    );
  }
}
