import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class NotificationService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Create notification for all users when a new post is created
  static Future<void> notifyNewPost(String postId, String sellerName, String postName) async {
    try {
      // Get all users except the post creator
      final currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser == null) return;

      final usersSnapshot = await _firestore.collection('users').get();
      
      for (var userDoc in usersSnapshot.docs) {
        if (userDoc.id != currentUser.uid) {
          await _firestore.collection('notifications').add({
            'userId': userDoc.id,
            'type': 'new_post',
            'title': 'New Post Available',
            'message': '$sellerName posted: $postName',
            'isRead': false,
            'createdAt': FieldValue.serverTimestamp(),
            'relatedPostId': postId,
          });
        }
      }
    } catch (e) {
      print('Error creating post notifications: $e');
    }
  }

  /// Create notification for all users when admin makes an announcement
  static Future<void> notifyAnnouncement(String announcementId, String title) async {
    try {
      final usersSnapshot = await _firestore.collection('users').get();
      
      for (var userDoc in usersSnapshot.docs) {
        await _firestore.collection('notifications').add({
          'userId': userDoc.id,
          'type': 'announcement',
          'title': 'New Announcement',
          'message': title,
          'isRead': false,
          'createdAt': FieldValue.serverTimestamp(),
          'relatedAnnouncementId': announcementId,
        });
      }
    } catch (e) {
      print('Error creating announcement notifications: $e');
    }
  }

  /// Create notification for all users when health guideline is updated
  static Future<void> notifyHealthGuidelineUpdate(String guidelineId, String disease) async {
    try {
      final usersSnapshot = await _firestore.collection('users').get();
      
      for (var userDoc in usersSnapshot.docs) {
        await _firestore.collection('notifications').add({
          'userId': userDoc.id,
          'type': 'health_guideline',
          'title': 'Health Guideline Updated',
          'message': 'New information about: $disease',
          'isRead': false,
          'createdAt': FieldValue.serverTimestamp(),
          'relatedGuidelineId': guidelineId,
        });
      }
    } catch (e) {
      print('Error creating health guideline notifications: $e');
    }
  }

  /// Create notification for all users when feeding info is updated
  static Future<void> notifyFeedingInfoUpdate(String feedingId, String name) async {
    try {
      final usersSnapshot = await _firestore.collection('users').get();
      
      for (var userDoc in usersSnapshot.docs) {
        await _firestore.collection('notifications').add({
          'userId': userDoc.id,
          'type': 'feeding_info',
          'title': 'Feeding Info Updated',
          'message': 'New feeding information: $name',
          'isRead': false,
          'createdAt': FieldValue.serverTimestamp(),
          'relatedFeedingId': feedingId,
        });
      }
    } catch (e) {
      print('Error creating feeding info notifications: $e');
    }
  }

  /// Create notification when someone sends a chat message
  static Future<void> notifyChatMessage(
    String receiverId,
    String senderId,
    String senderName,
    String message,
  ) async {
    try {
      // Get sender's full name if available
      String finalSenderName = senderName;
      try {
        final senderDoc = await _firestore.collection('users').doc(senderId).get();
        if (senderDoc.exists) {
          final senderData = senderDoc.data() as Map<String, dynamic>?;
          final firstName = senderData?['firstName'] ?? '';
          final lastName = senderData?['lastName'] ?? '';
          if (firstName.isNotEmpty || lastName.isNotEmpty) {
            finalSenderName = '$firstName $lastName'.trim();
          } else {
            finalSenderName = senderData?['email']?.split('@')[0] ?? senderName;
          }
        }
      } catch (e) {
        print('Error fetching sender name: $e');
      }

      await _firestore.collection('notifications').add({
        'userId': receiverId,
        'type': 'chat',
        'title': 'New Message',
        'message': '$finalSenderName: ${message.length > 50 ? message.substring(0, 50) + "..." : message}',
        'isRead': false,
        'createdAt': FieldValue.serverTimestamp(),
        'relatedUserId': senderId,
        'relatedUserName': finalSenderName,
      });
    } catch (e) {
      print('Error creating chat notification: $e');
    }
  }
}
