import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:location/location.dart';

import '../theme/app_theme.dart';
import '../widgets/animated_pig_marker.dart';
import '../widgets/app_drawer.dart';
import 'marketplace_post_detail_page.dart';
import 'notifications_page.dart';

class HomePage extends StatefulWidget {
  final String? focusPostId;
  const HomePage({super.key, this.focusPostId});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final MapController _mapController = MapController();
  final Location _location = Location();
  LocationData? _currentLocation;

  // MapType logic is less relevant with single tile layer, but we can toggle layers if we wanted.
  // For now, adhering to user request for "Esri Satellite".
  // Keeping the button for future expansion or resetting.
  bool _isSatellite = true;

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    bool serviceEnabled = await _location.serviceEnabled();
    if (!serviceEnabled) serviceEnabled = await _location.requestService();
    if (!serviceEnabled) return;

    PermissionStatus permissionGranted = await _location.hasPermission();
    if (permissionGranted == PermissionStatus.denied) {
      permissionGranted = await _location.requestPermission();
    }
    if (permissionGranted != PermissionStatus.granted) return;

    final loc = await _location.getLocation();
    if (!mounted) return;
    setState(() => _currentLocation = loc);
  }

  void _toggleMapType() {
    // Only have one type for now as requested, but keeping UI hook
    setState(() => _isSatellite = !_isSatellite);
  }

  void _centerOnUser() {
    if (_currentLocation != null) {
      _mapController.move(
        LatLng(_currentLocation!.latitude!, _currentLocation!.longitude!),
        15.0,
      );
    }
  }

  void _zoomIn() {
    _mapController.move(
        _mapController.camera.center, _mapController.camera.zoom + 1);
  }

  void _zoomOut() {
    _mapController.move(
        _mapController.camera.center, _mapController.camera.zoom - 1);
  }

  double parseDouble(dynamic val, double fallback) {
    if (val is double) return val;
    if (val is int) return val.toDouble();
    if (val is String) return double.tryParse(val) ?? fallback;
    return fallback;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      drawer: const AppDrawer(),
      body: Stack(
        children: [
          // Map Section
          StreamBuilder<QuerySnapshot>(
            stream:
                FirebaseFirestore.instance.collection('livestock').snapshots(),
            builder: (context, snapshot) {
              if (!snapshot.hasData) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                debugPrint("DEBUG: FS Error: ${snapshot.error}");
                return Center(
                    child: Text("Error loading data: ${snapshot.error}"));
              }

              List<Marker> markers = [];
              for (var doc in snapshot.data!.docs) {
                final data = doc.data() as Map<String, dynamic>;
                final lat = parseDouble(data['latitude'], 7.7333);
                final lng = parseDouble(data['longitude'], 125.0833);

                final category =
                    (data['category'] ?? '').toString().toLowerCase();
                String markerImage = 'assets/cute_pig_icon.png';

                if (category.contains('baktin')) {
                  markerImage = 'assets/baktin.png';
                } else if (category.contains('lapaon')) {
                  markerImage = 'assets/lapaon2.png';
                } else if (category.contains('lechonon')) {
                  markerImage = 'assets/lechnonon.png';
                }

                markers.add(Marker(
                  point: LatLng(lat, lng),
                  width: 40,
                  height: 80,
                  alignment: Alignment.bottomCenter,
                  child: GestureDetector(
                    onTap: () {
                      _showMarkerInfo(doc.id, data);
                    },
                    child: AnimatedPigMarker(
                      size: 40,
                      imagePath: markerImage,
                    ),
                  ),
                ));
              }

              // Focus on a specific post
              if (widget.focusPostId != null) {
                final postDoc = snapshot.data!.docs
                    .where((d) => d.id == widget.focusPostId)
                    .firstOrNull;
                if (postDoc != null) {
                  final data = postDoc.data() as Map<String, dynamic>;
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    _mapController.move(
                      LatLng(parseDouble(data['latitude'], 7.7333),
                          parseDouble(data['longitude'], 125.0833)),
                      15.0,
                    );
                  });
                }
              }

              return FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: _currentLocation != null
                      ? LatLng(_currentLocation!.latitude!,
                          _currentLocation!.longitude!)
                      : const LatLng(7.7333, 125.0833),
                  initialZoom: 14.0,
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
                      urlTemplate:
                          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.capstoneproject.swineapp',
                      maxNativeZoom: 19,
                    ),
                  MarkerLayer(markers: markers),
                ],
              );
            },
          ),
          // Map Controls (Left Side)
          Positioned(
            top: 50,
            left: 16,
            child: Column(
              children: [
                _buildMapControlButton(
                  icon: Icons.menu,
                  onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                  tooltip: 'Menu',
                ),
                const SizedBox(height: 12),
                _buildMapControlButton(
                  icon: Icons.layers,
                  onPressed: _toggleMapType,
                  tooltip:
                      _isSatellite ? 'Switch to Map' : 'Switch to Satellite',
                ),
                const SizedBox(height: 12),
                _buildMapControlButton(
                  icon: Icons.my_location,
                  onPressed: _centerOnUser,
                  tooltip: 'My Location',
                ),
                const SizedBox(height: 12),
                _buildMapControlButton(
                  icon: Icons.add,
                  onPressed: _zoomIn,
                  tooltip: 'Zoom In',
                ),
                const SizedBox(height: 12),
                _buildMapControlButton(
                  icon: Icons.remove,
                  onPressed: _zoomOut,
                  tooltip: 'Zoom Out',
                ),
              ],
            ),
          ),
          // Notification Bell (Top Right)
          Positioned(
            top: 50,
            right: 16,
            child: _buildNotificationBellButton(),
          ),
          // Map Legend (Top Center)
          Positioned(
            top: 54,
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

  Widget _buildMapControlButton({
    required IconData icon,
    required VoidCallback onPressed,
    required String tooltip,
  }) {
    return Material(
      elevation: 4,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Tooltip(
          message: tooltip,
          child: Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationBellButton() {
    final currentUser = FirebaseAuth.instance.currentUser;

    if (currentUser == null) {
      return _buildMapControlButton(
        icon: Icons.notifications,
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const NotificationsPage()),
          );
        },
        tooltip: 'Notifications',
      );
    }

    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('notifications')
          .where('userId', isEqualTo: currentUser.uid)
          .where('isRead', isEqualTo: false)
          .snapshots(),
      builder: (context, snapshot) {
        // Count unread notifications
        int unreadCount = 0;
        if (snapshot.hasData && snapshot.data != null) {
          unreadCount = snapshot.data!.docs.length;
        }

        return Stack(
          clipBehavior: Clip.none,
          children: [
            _buildMapControlButton(
              icon: Icons.notifications,
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const NotificationsPage()),
                );
              },
              tooltip: 'Notifications',
            ),
            if (unreadCount > 0)
              Positioned(
                right: 0,
                top: 0,
                child: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  void _showMarkerInfo(String postId, Map<String, dynamic> data) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusL),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.pets,
                color: Theme.of(context).colorScheme.primary,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                data['name'] ?? 'Livestock',
                style: AppTheme.heading3,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildInfoRow(
                Icons.attach_money, 'Price', '₱${data['price'] ?? '?'}'),
            const SizedBox(height: 12),
            _buildInfoRow(
                Icons.category, 'Category', data['category'] ?? 'N/A'),
            if (data['description'] != null &&
                data['description'].toString().isNotEmpty) ...[
              const SizedBox(height: 12),
              _buildInfoRow(Icons.description, 'Description',
                  data['description'].toString()),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => MarketplacePostDetailPage(postId: postId),
                ),
              );
            },
            icon: const Icon(Icons.visibility),
            label: const Text('View Details'),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.textSecondaryColor),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: AppTheme.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: AppTheme.bodyMedium,
          ),
        ),
      ],
    );
  }
}
