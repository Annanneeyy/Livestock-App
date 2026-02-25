import 'dart:async';

import 'package:capstoneproject/main.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class VerifyEmailPage extends StatefulWidget {
  const VerifyEmailPage({super.key});

  @override
  State<VerifyEmailPage> createState() => _VerifyEmailPageState();
}

class _VerifyEmailPageState extends State<VerifyEmailPage> {
  bool isEmailVerified = false;
  bool canResendEmail = false;
  Timer? timer;

  @override
  void initState() {
    super.initState();

    // Check if email is already verified
    isEmailVerified = FirebaseAuth.instance.currentUser?.emailVerified ?? false;

    if (!isEmailVerified) {
      sendVerificationEmail();

      // Check periodically if the user has verified their email
      timer = Timer.periodic(
        const Duration(seconds: 3),
        (_) => checkEmailVerified(),
      );
    }
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  Future<void> checkEmailVerified() async {
    // Need to reload user to get the latest emailVerified status
    await FirebaseAuth.instance.currentUser?.reload();

    setState(() {
      isEmailVerified =
          FirebaseAuth.instance.currentUser?.emailVerified ?? false;
    });

    if (isEmailVerified) {
      timer?.cancel();
      settingsProvider
          .setIsSigningUp(false); // Verified, so we can stop enforcing
      // Force token refresh to trigger userChanges() in AuthGate
      await FirebaseAuth.instance.currentUser?.getIdToken(true);
    }
  }

  Future<void> sendVerificationEmail() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      await user?.sendEmailVerification();

      setState(() => canResendEmail = false);
      await Future.delayed(const Duration(seconds: 5));
      if (mounted) setState(() => canResendEmail = true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error sending email: $e")),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // If verified, we can behave as if we are done.
    // Usually AuthGate checks this. If we are here, we are not verified (initially).
    // But if checkEmailVerified() sets isEmailVerified to true,
    // we want to trigger the parent AuthGate to re-evaluate.
    // The clean way is to send an auth state change or just let the user click "I've Verified"
    // which triggers a reload and hopefully the parent re-renders if we pass a callback.
    // simpler: If isEmailVerified is true, showing a transient "Verified!" then
    // effectively completing. But the parent AuthGate evaluates `snapshot.data`.
    // We might need to use a StreamController or just rely on the user refreshing the app?
    // Let's add a button "I've Verified".

    if (isEmailVerified) {
      // Return a simple scaffold that says verified, or redirect.
      // Since AuthGate is the parent, and it rebuilds on stream.
      // We can force a stream update?
      // FirebaseAuth.instance.currentUser?.reload();
      // Actually, the simplest trick is to just return a "Verified" screen
      // and maybe a button "Continue" that does Navigator.of(context).pushReplacement(...)
      // BUT AuthGate is at the root.
      // A common pattern is:
      // While !verified return VerifyEmailPage.
      // Inside VerifyEmailPage, when verified is detected, we can trigger a restart or
      // force the StreamBuilder to get a new value? No.

      // Actually, `checkEmailVerified` calls `reload()`.
      // The `user` object in `AuthGate` `StreamBuilder` IS the same instance usually,
      // OR updated.
      // If `AuthGate` uses `snapshot.data`, that data might be stale.
      // Changes: We need to pass a callback or handling this specifically.

      // Correction: I will trust that calling `reload` updates the `currentUser` singleton.
      // But `AuthGate` uses `snapshot.data`.
      // Let's rely on a manual "Check Again" or "Continue" which triggers a `setState` in a parent?
      // No, `AuthGate` is stateless.

      // Alternative: Provide a "Reload" button that does `setState`?
      // But I cannot set state of `AuthGate`.

      // Best approach: In `checkEmailVerified`, if true, we can do:
      // `FirebaseAuth.instance.idTokenChanges()` might emit?
      // `await FirebaseAuth.instance.currentUser!.getIdToken(true);` forces token refresh.
      // This fires `idTokenChanges`. If AuthGate uses `userChanges` or `idTokenChanges` instead of `authStateChanges`...
      // `authStateChanges` : Fires when sign-in or sign-out.
      // `userChanges` : Fires when sign-in, sign-out, or update (like email verification, password change).

      // SOLUTION: switch `AuthGate` to use `userChanges()` instead of `authStateChanges()`.
      // This way, `reload()` --> triggers update?
      // Actually `reload()` updates the in-memory user. It DOES NOT automatically fire the stream unless something changed like token.

      // Let's stick to the visual prompting.

      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.check_circle, color: Colors.green, size: 64),
              const SizedBox(height: 16),
              const Text("Email Verified!", style: TextStyle(fontSize: 20)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () async {
                  await FirebaseAuth.instance.currentUser?.getIdToken(true);
                  if (FirebaseAuth.instance.currentUser?.emailVerified ??
                      false) {
                    settingsProvider.setIsSigningUp(false); // Reset flag
                  }
                },
                child: const Text("Continue"),
              )
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("Verify Email"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              "A verification email has been sent to your email address.",
              style: TextStyle(fontSize: 20),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              icon: const Icon(Icons.email),
              label: const Text("Resend Email"),
              onPressed: canResendEmail ? sendVerificationEmail : null,
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () async {
                settingsProvider
                    .setIsSigningUp(false); // Reset flag so they are not stuck
                await FirebaseAuth.instance.signOut();
              },
              child: const Text(
                "Cancel",
                style: TextStyle(fontSize: 24),
              ),
            )
          ],
        ),
      ),
    );
  }
}
