import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../widgets/animated_pig_marker.dart';

class PickLocationPage extends StatefulWidget {
  const PickLocationPage({super.key});

  @override
  State<PickLocationPage> createState() => _PickLocationPageState();
}

class _PickLocationPageState extends State<PickLocationPage> {
  // ✅ Quezon, Bukidnon
  LatLng _pickedLocation = const LatLng(7.7306, 125.0981);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pick Location on Map'),
        backgroundColor: Colors.green,
      ),
      body: FlutterMap(
        options: MapOptions(
          initialCenter: _pickedLocation,
          initialZoom: 14.0,
          onTap: (tapPosition, point) {
            setState(() => _pickedLocation = point);
          },
        ),
        children: [
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
          MarkerLayer(
            markers: [
              Marker(
                point: _pickedLocation,
                width: 40,
                height: 80, // Increased height
                alignment: Alignment.bottomCenter, // Anchor at the shadow
                child: const AnimatedPigMarker(size: 40),
              ),
            ],
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: Colors.green,
        icon: const Icon(Icons.check),
        label: const Text('Use This Location'),
        onPressed: () {
          // Return LatLng compatible with expected format (if distinct, checking consistency)
          // flutter_map LatLng is from latlong2, might match if previous code used LatLng from dependencies
          Navigator.pop(context, _pickedLocation);
        },
      ),
    );
  }
}
