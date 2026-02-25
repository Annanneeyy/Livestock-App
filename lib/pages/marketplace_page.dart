import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '/admin/map_page.dart'; // Ensure this import is correct
import '../theme/app_theme.dart';
import '../widgets/app_drawer.dart';
import '../widgets/notification_bell.dart';
import 'home_page.dart';
import 'marketplace_post_detail_page.dart';
import 'post_form_page.dart';
import 'private_message_page.dart';

class MarketplacePage extends StatefulWidget {
  const MarketplacePage({super.key});

  @override
  State<MarketplacePage> createState() => _MarketplacePageState();
}

class _MarketplacePageState extends State<MarketplacePage> {
  String _searchQuery = '';
  String _selectedCategory = 'All';
  final List<String> _categories = ['All', 'Baktin', 'Lechonon', 'Lapaon'];
  bool _showMyPostsOnly = false;

  final currentUser = FirebaseAuth.instance.currentUser;

  Future<List<Map<String, dynamic>>> _fetchProducts() async {
    final snapshot =
        await FirebaseFirestore.instance.collection('livestock').get();
    return snapshot.docs.map((doc) {
      return {...doc.data() as Map<String, dynamic>, 'id': doc.id};
    }).toList();
  }

  List<Map<String, dynamic>> _filterProducts(
      List<Map<String, dynamic>> products) {
    return products.where((product) {
      final matchesSearch = _searchQuery.isEmpty ||
          (product['description'] ?? '')
              .toString()
              .toLowerCase()
              .contains(_searchQuery.toLowerCase());
      final matchesCategory = _selectedCategory == 'All' ||
          product['category'] == _selectedCategory;
      final matchesMyPosts = !_showMyPostsOnly || 
          product['sellerId'] == currentUser?.uid;
      return matchesSearch && matchesCategory && matchesMyPosts;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Marketplace"),
        actions: [
          const NotificationBell(),
        ],
      ),
      drawer: const AppDrawer(),
      body: Column(
        children: [
          // SEARCH BAR
          Container(
            padding: const EdgeInsets.all(16),
            color: Theme.of(context).scaffoldBackgroundColor,
            child: TextField(
              onChanged: (value) => setState(() => _searchQuery = value),
              decoration: InputDecoration(
                hintText: 'Search products...',
                prefixIcon: Icon(Icons.search,
                    color: Theme.of(context).colorScheme.primary),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () => setState(() => _searchQuery = ''),
                      )
                    : null,
                filled: true,
                fillColor: Theme.of(context).cardColor,
              ),
            ),
          ),

          // FILTERS (Category + My Posts)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            color: Theme.of(context).scaffoldBackgroundColor,
            child: Column(
              children: [
                // My Posts Filter
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: Row(
                    children: [
                      FilterChip(
                        avatar: Icon(
                          Icons.person,
                          size: 18,
                          color: _showMyPostsOnly
                              ? Theme.of(context).colorScheme.primary
                              : null,
                        ),
                        label: const Text('My Posts'),
                        selected: _showMyPostsOnly,
                        onSelected: (selected) =>
                            setState(() => _showMyPostsOnly = selected),
                        selectedColor:
                            Theme.of(context).colorScheme.primary.withOpacity(0.3),
                        checkmarkColor: Theme.of(context).colorScheme.primary,
                        labelStyle: TextStyle(
                          color: _showMyPostsOnly
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).textTheme.bodyMedium?.color,
                          fontWeight:
                              _showMyPostsOnly ? FontWeight.w600 : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
                // Category Filter
                SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _categories.length,
                    itemBuilder: (_, index) {
                      final category = _categories[index];
                      final isSelected = _selectedCategory == category;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(category),
                          selected: isSelected,
                          onSelected: (_) =>
                              setState(() => _selectedCategory = category),
                          selectedColor:
                              Theme.of(context).colorScheme.primary.withOpacity(0.3),
                          checkmarkColor: Theme.of(context).colorScheme.primary,
                          labelStyle: TextStyle(
                            color: isSelected
                                ? Theme.of(context).colorScheme.primary
                                : Theme.of(context).textTheme.bodyMedium?.color,
                            fontWeight:
                                isSelected ? FontWeight.w600 : FontWeight.normal,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          // POSTS
          Expanded(
            child: FutureBuilder<List<Map<String, dynamic>>>(
              future: _fetchProducts(),
              builder: (_, snapshot) {
                if (!snapshot.hasData)
                  return const Center(child: CircularProgressIndicator());
                final products = _filterProducts(snapshot.data!);

                return ListView.builder(
                  itemCount: products.length,
                  itemBuilder: (_, index) => _buildPostCard(products[index]),
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text('New Post'),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const PostFormPage()),
          ).then((_) => setState(() {}));
        },
      ),
    );
  }

  Widget _buildPostCard(Map<String, dynamic> product) {
    final bool isAvailable = product['isAvailable'] ?? true;
    final bool isOwner = product['sellerId'] == currentUser?.uid;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusL),
      ),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => MarketplacePostDetailPage(postId: product['id']),
            ),
          );
        },
        borderRadius: BorderRadius.circular(AppTheme.radiusL),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Seller Info Header
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  _SellerProfileAvatar(sellerId: product['sellerId']),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product['sellerName'] ?? 'Unknown Seller',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    HomePage(focusPostId: product['id']),
                              ),
                            );
                          },
                          child: Row(
                            children: [
                              Icon(
                                Icons.location_on,
                                size: 14,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                product['location'] != null &&
                                        product['location']
                                            .toString()
                                            .isNotEmpty
                                    ? product['location']
                                    : 'Unknown location',
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.primary,
                                  fontSize: 12,
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isOwner)
                    PopupMenuButton<String>(
                      icon: const Icon(Icons.more_vert),
                      onSelected: (value) async {
                        if (value == 'edit') {
                          final productId = product['id'];
                          if (productId == null ||
                              productId.toString().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                    '❌ Error: Cannot edit post. Missing ID.'),
                                backgroundColor: AppTheme.errorColor,
                              ),
                            );
                            return;
                          }

                          final productCopy =
                              Map<String, dynamic>.from(product);

                          await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) =>
                                  PostFormPage(productToEdit: productCopy),
                            ),
                          );

                          if (mounted) {
                            setState(() {});
                          }
                        } else if (value == 'delete') {
                          _deletePost(product['id']);
                        }
                      },
                      itemBuilder: (_) => const [
                        PopupMenuItem(
                          value: 'edit',
                          child: Row(
                            children: [
                              Icon(Icons.edit, size: 20),
                              SizedBox(width: 8),
                              Text('Edit'),
                            ],
                          ),
                        ),
                        PopupMenuItem(
                          value: 'delete',
                          child: Row(
                            children: [
                              Icon(Icons.delete,
                                  size: 20, color: AppTheme.errorColor),
                              SizedBox(width: 8),
                              Text('Delete',
                                  style: TextStyle(color: AppTheme.errorColor)),
                            ],
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),

            // Product Image
            _buildProductImage(product),

            // Product Details
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (product['description'] != null &&
                      product['description'].toString().isNotEmpty) ...[
                    Text(
                      product['description'],
                      style: AppTheme.bodyMedium,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 12),
                  ],
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '₱${product['price']}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 20,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                      _StatusBadge(isAvailable: isAvailable),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (!isOwner)
                    Row(
                      children: [
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.chat_bubble_outline, size: 18),
                            label: const Text('Chat'),
                            onPressed: () {
                              final sellerId = product['sellerId'];
                              
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => PrivateMessagePage(
                                    receiverId: sellerId,
                                    receiverName: product['sellerName'] ??
                                        product['sellerEmail'] ??
                                        'Unknown Seller',
                                    postId: product['id'],
                                    postName: product['name'],
                                  ),
                                ),
                              );
                            },
                            style: OutlinedButton.styleFrom(
                              foregroundColor:
                                  Theme.of(context).colorScheme.primary,
                              side: BorderSide(
                                  color: Theme.of(context).colorScheme.primary),
                            ),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deletePost(String postId) async {
    await FirebaseFirestore.instance
        .collection('livestock')
        .doc(postId)
        .delete();
    setState(() {});
  }

  Widget _buildProductImage(Map<String, dynamic> product) {
    final base64Image = product['imageBase64'];

    if (base64Image != null && base64Image.isNotEmpty) {
      try {
        return Image.memory(
          base64Decode(base64Image),
          height: 220,
          width: double.infinity,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => Container(
            height: 220,
            width: double.infinity,
            color: Theme.of(context).brightness == Brightness.dark
                ? Colors.grey[800]
                : Colors.grey.shade200,
            child: const Icon(Icons.broken_image, size: 100),
          ),
        );
      } catch (e) {
        return Container(
          height: 220,
          width: double.infinity,
          color: Theme.of(context).brightness == Brightness.dark
              ? Colors.grey[800]
              : Colors.grey.shade200,
          child: const Icon(Icons.broken_image, size: 100),
        );
      }
    }

    // Fallback for old imageUrl field (backward compatibility)
    final imageUrl = product['imageUrl'];
    if (imageUrl != null &&
        imageUrl.isNotEmpty &&
        imageUrl != 'https://via.placeholder.com/150') {
      return Image.network(
        imageUrl,
        height: 220,
        width: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => Container(
          height: 220,
          width: double.infinity,
          color: Theme.of(context).brightness == Brightness.dark
              ? Colors.grey[800]
              : Colors.grey.shade200,
          child: const Icon(Icons.image, size: 100),
        ),
      );
    }

    // No image available
    return Container(
      height: 220,
      width: double.infinity,
      color: Theme.of(context).brightness == Brightness.dark
          ? Colors.grey[800]
          : Colors.grey.shade200,
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.image_not_supported, size: 100, color: Colors.grey),
          SizedBox(height: 8),
          Text('No image available', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final bool isAvailable;
  const _StatusBadge({required this.isAvailable});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isAvailable ? AppTheme.successColor : AppTheme.errorColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isAvailable ? Icons.check_circle : Icons.cancel,
            size: 14,
            color: Colors.white,
          ),
          const SizedBox(width: 4),
          Text(
            isAvailable ? 'AVAILABLE' : 'SOLD',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _SellerProfileAvatar extends StatelessWidget {
  final String? sellerId;

  const _SellerProfileAvatar({required this.sellerId});

  @override
  Widget build(BuildContext context) {
    if (sellerId?.isEmpty ?? true) {
      return CircleAvatar(
        backgroundColor: Theme.of(context).colorScheme.primary,
        radius: 20,
        child: const Icon(Icons.person, color: Colors.white, size: 20),
      );
    }

    return FutureBuilder<DocumentSnapshot>(
      future: FirebaseFirestore.instance
          .collection('users')
          .doc(sellerId)
          .get(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return CircleAvatar(
            backgroundColor: Theme.of(context).colorScheme.primary,
            radius: 20,
            child: const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            ),
          );
        }

        if (!snapshot.hasData || !snapshot.data!.exists) {
          return CircleAvatar(
            backgroundColor: Theme.of(context).colorScheme.primary,
            radius: 20,
            child: const Icon(Icons.person, color: Colors.white, size: 20),
          );
        }

        final userData = snapshot.data!.data() as Map<String, dynamic>?;
        final profileImage = userData?['profileImage'];

        return CircleAvatar(
          backgroundColor: Theme.of(context).colorScheme.primary,
          radius: 20,
          backgroundImage: (profileImage != null && profileImage.isNotEmpty)
              ? (profileImage.startsWith('http')
                  ? NetworkImage(profileImage) as ImageProvider
                  : MemoryImage(base64Decode(profileImage)) as ImageProvider)
              : null,
          child: (profileImage == null || profileImage.isEmpty)
              ? const Icon(Icons.person, color: Colors.white, size: 20)
              : null,
        );
      },
    );
  }
}
