import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../widgets/admin_app_drawer.dart';

class AdminHome extends StatefulWidget {
  const AdminHome({super.key});

  @override
  State<AdminHome> createState() => _AdminHomeState();
}

class _AdminHomeState extends State<AdminHome> {
  Map<String, int> _barangayUserCounts = {};
  Map<String, List<Map<String, dynamic>>> _barangayUsers = {};
  Map<String, int> _roleCounts = {};
  int _totalUsers = 0;
  int _recentSignups = 0;
  int _activeBarangays = 0;
  String? _selectedBarangay;
  bool _isLoading = true;
  StreamSubscription? _usersSubscription;

  @override
  void initState() {
    super.initState();
    _listenToUsers();
  }

  @override
  void dispose() {
    _usersSubscription?.cancel();
    super.dispose();
  }

  void _listenToUsers() {
    _usersSubscription?.cancel();
    _usersSubscription = FirebaseFirestore.instance
        .collection('users')
        .snapshots()
        .listen((snapshot) {
      if (snapshot.docs.isEmpty) {
        setState(() {
          _barangayUserCounts = {'Baktin': 3, 'Lapaon': 2};
          _barangayUsers = {
            'Baktin': [
              {
                'firstName': 'Juan',
                'lastName': 'Dela Cruz',
                'email': 'juan@example.com',
                'role': 'farmer'
              },
            ],
          };
          _roleCounts = {'farmer': 4, 'buyer': 2};
          _totalUsers = 6;
          _recentSignups = 2;
          _activeBarangays = 2;
          _isLoading = false;
        });
        return;
      }

      Map<String, int> barangayCounts = {};
      Map<String, List<Map<String, dynamic>>> barangayUsers = {};
      Map<String, int> roleCounts = {};
      int total = snapshot.docs.length;
      int recent = 0;
      Set<String> barangays = {};
      DateTime sevenDaysAgo = DateTime.now().subtract(const Duration(days: 7));

      for (var doc in snapshot.docs) {
        final data = doc.data();
        String role = data['role'] ?? 'Unknown';
        String barangay = data['address']?['barangay'] ?? 'Unknown';

        barangayCounts[barangay] = (barangayCounts[barangay] ?? 0) + 1;
        barangayUsers[barangay] ??= [];
        barangayUsers[barangay]!.add(data);
        barangays.add(barangay);

        roleCounts[role] = (roleCounts[role] ?? 0) + 1;

        Timestamp? createdAt = data['createdAt'];
        if (createdAt != null && createdAt.toDate().isAfter(sevenDaysAgo))
          recent++;
      }

      setState(() {
        _barangayUserCounts = barangayCounts;
        _barangayUsers = barangayUsers;
        _roleCounts = roleCounts;
        _totalUsers = total;
        _recentSignups = recent;
        _activeBarangays = barangays.length;
        _isLoading = false;
      });
    }, onError: (error) {
      debugPrint("DEBUG: Error listening to users: $error");
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AdminAppDrawer(),
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.primary,
        title: Row(
          children: [
            SizedBox(
                height: 40,
                child: Image.asset('assets/municipal_logo.png',
                    fit: BoxFit.contain)),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text("Municipal Agriculture Office",
                    style:
                        TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                Text("Municipality of Quezon", style: TextStyle(fontSize: 12)),
              ],
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Stack(
              children: [
                // Scrollable content
                Padding(
                  padding: const EdgeInsets.only(
                      bottom: 90), // reserve space for footer
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ====== Vertical Stats Cards ======
                        _verticalStatCard(
                            "Total Users", "$_totalUsers", Icons.people),
                        _verticalStatCard("Recent Signups", "$_recentSignups",
                            Icons.trending_up),
                        _verticalStatCard("Active Barangays",
                            "$_activeBarangays", Icons.location_on),
                        _verticalStatCard(
                            "Top Role", _getTopRole(), Icons.category),

                        const SizedBox(height: 20),

                        // ====== Barangay List ======
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 8.0),
                          child: Text("Users by Barangay",
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 16)),
                        ),
                        const SizedBox(height: 8),
                        ..._barangayUserCounts.entries.map((e) => Card(
                              child: ListTile(
                                title: Text(e.key),
                                trailing: Text(e.value.toString()),
                                onTap: () =>
                                    setState(() => _selectedBarangay = e.key),
                              ),
                            )),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _verticalStatCard(String title, String value, IconData icon) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(icon, size: 40, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 16),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
              Text(value,
                  style: TextStyle(
                      fontSize: 18,
                      color: Theme.of(context).colorScheme.primary)),
            ]),
          ],
        ),
      ),
    );
  }

  String _getTopRole() {
    if (_roleCounts.isEmpty) return "-";
    var sorted = _roleCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    return "${sorted.first.key} (${sorted.first.value})";
  }
}
