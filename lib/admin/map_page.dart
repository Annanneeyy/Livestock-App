import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '/pages/marketplace_post_detail_page.dart'; // Import the Post Detail Page
import '/widgets/admin_app_drawer.dart'; // Update the path as necessary
import '/widgets/animated_pig_marker.dart';
import '/widgets/app_drawer.dart'; // Import user drawer

class MapPage extends StatefulWidget {
  final double? userLat;
  final double? userLng;

  final bool isUser;

  // Add the required parameters in the constructor
  const MapPage(
      {super.key,
      this.userLat,
      this.userLng,
      this.isUser =
          false}); // Default to false so admin side works without changes

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final MapController _mapController = MapController();
  // Using a list for flutter_map markers
  List<Marker> _markers = [];
  bool _isSatellite = true;

  @override
  void initState() {
    super.initState();
    _loadMarkers();
  }

  // Fetch posts and create markers
  Future<void> _loadMarkers() async {
    // Force fetching from server to avoid stale cache issues
    final snapshot = await FirebaseFirestore.instance
        .collection('livestock')
        .get(const GetOptions(source: Source.serverAndCache));

    if (!mounted) return;
    setState(() {
      _markers.clear(); // Clear any existing markers

      for (var doc in snapshot.docs) {
        final data = doc.data() as Map<String, dynamic>;
        final lat = data['latitude'] ??
            7.7333; // Default to some coordinates if missing
        final lng = data['longitude'] ?? 125.0833;

        final category = (data['category'] ?? '').toString().toLowerCase();
        String markerImage = 'assets/cute_pig_icon.png';

        if (category.contains('baktin')) {
          markerImage = 'assets/baktin.png';
        } else if (category.contains('lapaon')) {
          markerImage = 'assets/lapaon2.png';
        } else if (category.contains('lechonon')) {
          markerImage = 'assets/lechnonon.png';
        }

        // Adding a marker for each post in the snapshot
        _markers.add(Marker(
          point: LatLng(lat, lng),
          width: 40,
          height: 80, // Increased height
          alignment: Alignment.bottomCenter, // Anchor at the shadow
          child: GestureDetector(
            onTap: () {
              _showMarkerInfo(doc.id, data);
            },
            child: AnimatedPigMarker(
              key: ValueKey("${doc.id}_$markerImage"),
              size: 40,
              imagePath: markerImage,
            ),
          ),
        ));
      }
    });
  }

  void _showMarkerInfo(String postId, Map<String, dynamic> data) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(data['name'] ?? 'No Name'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Seller: ${data['sellerName'] ?? 'Unknown'}'),
            Text('Category: ${data['category'] ?? 'Unknown'}'),
            // Debug info (can remove later)
            Text('Raw Cat: "${data['category']}"',
                style: const TextStyle(fontSize: 10, color: Colors.grey)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _showPostDetails(postId);
            },
            child: const Text('View Details'),
          ),
        ],
      ),
    );
  }

  void _zoomIn() {
    _mapController.move(
        _mapController.camera.center, _mapController.camera.zoom + 1);
  }

  void _zoomOut() {
    _mapController.move(
        _mapController.camera.center, _mapController.camera.zoom - 1);
  }

  // Navigate to post detail page
  void _showPostDetails(String postId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => MarketplacePostDetailPage(postId: postId),
      ),
    );
  }

  // Toggle between Map Types (Normal or Hybrid)
  void _toggleMapType() {
    setState(() {
      _isSatellite = !_isSatellite;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      drawer: widget.isUser
          ? const AppDrawer()
          : const AdminAppDrawer(), // Conditionally show drawer
      body: Stack(
        children: [
          // Flutter Map widget to display markers and handle map interactions
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: const LatLng(7.7333, 125.0833), // Default
              initialZoom: 12.0,
            ),
            children: [
              if (_isSatellite) ...[
                TileLayer(
                  urlTemplate:
                      'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                  userAgentPackageName: 'com.capstoneproject.swineapp',
                  maxNativeZoom: 18,
                ),
                TileLayer(
                  urlTemplate:
                      'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
                  userAgentPackageName: 'com.capstoneproject.swineapp',
                  maxNativeZoom: 18,
                ),
              ] else
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.capstoneproject.swineapp',
                  maxNativeZoom: 19,
                ),
              MarkerLayer(markers: _markers),
            ],
          ),

          // Map Controls & Menu (Left Aligned)
          Positioned(
            top: 40,
            left: 16,
            child: Column(
              children: [
                // Admin Menu Button
                _buildMapControlButton(
                  icon: Icons.menu,
                  onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                  heroTag: "menuBtn",
                ),
                const SizedBox(height: 12),

                // Toggle Map Type
                _buildMapControlButton(
                  icon: Icons.layers,
                  onPressed: _toggleMapType,
                  heroTag: "mapTypeBtn",
                ),
                const SizedBox(height: 12),

                // Refresh/Location Button
                _buildMapControlButton(
                  icon: Icons.refresh,
                  onPressed: _loadMarkers,
                  heroTag: "refreshBtn",
                ),
                const SizedBox(height: 12),

                // Zoom In
                _buildMapControlButton(
                  icon: Icons.add,
                  onPressed: _zoomIn,
                  heroTag: "zoomInBtn",
                ),
                const SizedBox(height: 12),

                // Zoom Out
                _buildMapControlButton(
                  icon: Icons.remove,
                  onPressed: _zoomOut,
                  heroTag: "zoomOutBtn",
                ),
              ],
            ),
          ),

          // Map Legend (Top Center)
          Positioned(
            top: 40,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.85),
                  borderRadius: BorderRadius.circular(15),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildLegendItem('assets/baktin.png', 'Baktin'),
                    const SizedBox(width: 12),
                    _buildLegendItem('assets/lapaon2.png', 'Lapaon'),
                    const SizedBox(width: 12),
                    _buildLegendItem('assets/lechnonon.png', 'Lechonon'),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMapControlButton({
    required IconData icon,
    required VoidCallback onPressed,
    required String heroTag,
  }) {
    return FloatingActionButton(
      heroTag: heroTag,
      mini: true, // Making them mini for a sleeker look in the column
      backgroundColor: Colors.white,
      foregroundColor:
          Theme.of(context).colorScheme.primary, // AppTheme primary color
      onPressed: onPressed,
      child: Icon(icon),
    );
  }

  Widget _buildLegendItem(String imagePath, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Image.asset(imagePath, width: 20, height: 20),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: Theme.of(context).colorScheme.primary,
          ),
        ),
      ],
    );
  }
}
