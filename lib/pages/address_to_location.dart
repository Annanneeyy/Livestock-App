import 'package:geocoding/geocoding.dart';

Future<Map<String, double>?> addressToLatLng(String address) async {
  try {
    final results = await locationFromAddress(address);
    if (results.isNotEmpty) {
      return {
        'lat': results.first.latitude,
        'lng': results.first.longitude,
      };
    }
  } catch (e) {
    print('Geocoding error: $e');
  }
  return null;
}
