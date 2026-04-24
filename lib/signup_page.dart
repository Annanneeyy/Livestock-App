import 'package:capstoneproject/main.dart'; // For settingsProvider
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class SignUpPage extends StatefulWidget {
  const SignUpPage({super.key});

  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  // Controllers
  final TextEditingController firstNameController = TextEditingController();
  final TextEditingController lastNameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  // Address controllers
  final TextEditingController purokController = TextEditingController();
  final TextEditingController barangayController = TextEditingController();
  final TextEditingController municipalityController =
      TextEditingController(text: 'Quezon');
  final TextEditingController zipCodeController =
      TextEditingController(text: '8715');

  String selectedGender = 'Female';
  String selectedMonth = 'Jul';
  String selectedDay = '20';
  String selectedYear = '2017';

  final months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];
  final days = List.generate(31, (i) => '${i + 1}');
  final years = List.generate(100, (i) => '${2025 - i}');

  Future<void> signUp() async {
    if (firstNameController.text.isEmpty ||
        lastNameController.text.isEmpty ||
        emailController.text.isEmpty ||
        passwordController.text.isEmpty ||
        purokController.text.isEmpty ||
        barangayController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.red,
          content: Text("❌ Please fill all required fields"),
        ),
      );
      return;
    }

    try {
      // Create Auth account
      settingsProvider.setIsSigningUp(true); // Flag: User is in signup flow

      UserCredential userCredential =
          await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: emailController.text.trim(),
        password: passwordController.text.trim(),
      );

      // Save user profile to Firestore
      await FirebaseFirestore.instance
          .collection('users')
          .doc(userCredential.user!.uid)
          .set({
        'firstName': firstNameController.text.trim(),
        'lastName': lastNameController.text.trim(),
        'email': emailController.text.trim(),
        'gender': selectedGender,
        'birthday': '$selectedMonth $selectedDay, $selectedYear',
        'role': 'farmer',
        'address': {
          'purok': purokController.text.trim(),
          'barangay': barangayController.text.trim().toUpperCase(),
          'municipality': municipalityController.text.trim(),
          'zipCode': zipCodeController.text.trim(),
        },
        'createdAt': FieldValue.serverTimestamp(),
      });

      // Send verification email
      await userCredential.user!.sendEmailVerification();

      // SUCCESS POPUP
      // AuthGate will handle the transition, but since we are now holding them at VerifyEmailPage,
      // we can inform them here.
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content:
                Text("✅ Account created! Please check your email to verify."),
            duration: Duration(seconds: 4),
          ),
        );
      }
    } on FirebaseAuthException catch (e) {
      settingsProvider.setIsSigningUp(false); // Reset flag on error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.red,
          content: Text("❌ ${e.message}"),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F2F5),
      body: Center(
        child: SingleChildScrollView(
          child: Card(
            elevation: 4,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: 350,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Center(
                      child: Column(
                        children: [
                          Text(
                            'Create a new account',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'It’s quick and easy.',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _inputField(
                            controller: firstNameController,
                            hint: 'First name',
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _inputField(
                            controller: lastNameController,
                            hint: 'Last name',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text('Birthday'),
                    Row(
                      children: [
                        Expanded(
                            child: _dropdown(months, selectedMonth,
                                (v) => setState(() => selectedMonth = v))),
                        const SizedBox(width: 6),
                        Expanded(
                            child: _dropdown(days, selectedDay,
                                (v) => setState(() => selectedDay = v))),
                        const SizedBox(width: 6),
                        Expanded(
                            child: _dropdown(years, selectedYear,
                                (v) => setState(() => selectedYear = v))),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text('Gender'),
                    Row(
                      children: [
                        _genderOption('Female'),
                        _genderOption('Male'),
                        _genderOption('Custom'),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _inputField(controller: emailController, hint: 'Email'),
                    const SizedBox(height: 10),
                    _inputField(
                      controller: passwordController,
                      hint: 'New password',
                      obscure: true,
                    ),
                    const SizedBox(height: 16),
                    const Text("Address",
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    _inputField(controller: purokController, hint: 'Purok'),
                    const SizedBox(height: 8),
                    _inputField(
                        controller: barangayController, hint: 'Barangay'),
                    const SizedBox(height: 8),
                    _inputField(
                      controller: municipalityController,
                      hint: 'Municipality',
                      enabled: false,
                    ),
                    const SizedBox(height: 8),
                    _inputField(
                      controller: zipCodeController,
                      hint: 'Zip Code',
                      enabled: false,
                    ),
                    const SizedBox(height: 20),
                    Center(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 50, vertical: 12),
                        ),
                        onPressed: signUp,
                        child: const Text('Sign Up'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  static Widget _inputField({
    required TextEditingController controller,
    required String hint,
    bool obscure = false,
    bool enabled = true,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      enabled: enabled,
      decoration: InputDecoration(
        hintText: hint,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(6),
        ),
      ),
    );
  }

  static Widget _dropdown(
    List<String> items,
    String value,
    ValueChanged<String> onChanged,
  ) {
    return DropdownButtonFormField<String>(
      value: value,
      items:
          items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
      onChanged: (v) => onChanged(v!),
      decoration: const InputDecoration(
        border: OutlineInputBorder(),
        isDense: true,
      ),
    );
  }

  Widget _genderOption(String label) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.only(right: 6),
        padding: const EdgeInsets.symmetric(horizontal: 6),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          children: [
            Text(label),
            const Spacer(),
            Radio<String>(
              value: label,
              groupValue: selectedGender,
              onChanged: (v) => setState(() => selectedGender = v!),
            ),
          ],
        ),
      ),
    );
  }
}
