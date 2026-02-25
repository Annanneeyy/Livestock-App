class User {
  final String id;
  final String firstName;
  final String lastName;
  final String location;  // e.g., "Purok 2 Delapa, Quezon, Bukidnon"
  final Map<String, dynamic>? address;  // Map with barangay, municipality, etc.
  final String role;  // e.g., "farmer"
  // Add other fields if needed, like email, birthday

  User({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.location,
    this.address,
    required this.role,
  });

  factory User.fromFirestore(Map<String, dynamic> data, String id) {
    return User(
      id: id,
      firstName: data['firstName'] ?? '',
      lastName: data['lastName'] ?? '',
      location: data['location'] ?? '',
      address: data['address'] as Map<String, dynamic>?,
      role: data['role'] ?? '',
    );
  }

  // Helper to build a full address string from the address map (for geocoding fallback)
  String get fullAddress {
    if (address == null) return location;
    final barangay = address!['barangay'] ?? '';
    final municipality = address!['municipality'] ?? '';
    final purok = address!['purok'] ?? '';
    final zipCode = address!['zipCode'] ?? '';
    return '$purok $barangay, $municipality, $zipCode'.trim();
  }
}