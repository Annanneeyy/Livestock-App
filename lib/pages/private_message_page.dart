import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../services/notification_service.dart';
import '../theme/app_theme.dart';

class PrivateMessagePage extends StatefulWidget {
  final String receiverId;
  final String receiverName;
  final String? postId;
  final String? postName;

  const PrivateMessagePage({
    super.key,
    required this.receiverId,
    required this.receiverName,
    this.postId,
    this.postName,
  });

  @override
  State<PrivateMessagePage> createState() => _PrivateMessagePageState();
}

class _PrivateMessagePageState extends State<PrivateMessagePage> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  User? currentUser;
  late String chatId;
  bool _chatInitialized = false;

  @override
  void initState() {
    super.initState();
    currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) return;

    // Generate a unique chatId between these two users
    List<String> ids = [currentUser!.uid, widget.receiverId];
    ids.sort();
    chatId = ids.join('_');
    
    // Initialize chat document if it doesn't exist
    _initializeChat();
  }

  Future<void> _initializeChat() async {
    if (currentUser == null) return;
    
    try {
      final chatDoc = await FirebaseFirestore.instance
          .collection('chats')
          .doc(chatId)
          .get();
      
      // Only create if it doesn't exist
      if (!chatDoc.exists) {
        await FirebaseFirestore.instance.collection('chats').doc(chatId).set({
          'participants': [currentUser!.uid, widget.receiverId],
          'lastMessage': '',
          'lastTimestamp': FieldValue.serverTimestamp(),
          'lastSenderId': currentUser!.uid,
          'receiverName': widget.receiverName,
        }, SetOptions(merge: true));
      }
      
      if (mounted) {
        setState(() {
          _chatInitialized = true;
        });
      }
    } catch (e) {
      // Silently handle errors - chat will be created when first message is sent
      debugPrint('Error initializing chat: $e');
      // Still mark as initialized so the UI can proceed
      if (mounted) {
        setState(() {
          _chatInitialized = true;
        });
      }
    }
  }

  void _sendMessage() async {
    if (_messageController.text.trim().isEmpty || currentUser == null) return;

    final String messageText = _messageController.text.trim();
    _messageController.clear();

    final timestamp = FieldValue.serverTimestamp();

    final messageData = {
      'senderId': currentUser!.uid,
      'receiverId': widget.receiverId,
      'text': messageText,
      'timestamp': timestamp,
      'postId': widget.postId,
      'postName': widget.postName,
    };

    try {
      // Update the main chat document
      await FirebaseFirestore.instance.collection('chats').doc(chatId).set({
        'participants': [currentUser!.uid, widget.receiverId],
        'lastMessage': messageText,
        'lastTimestamp': timestamp,
        'lastSenderId': currentUser!.uid,
        'receiverName': widget.receiverName,
      }, SetOptions(merge: true));

      // Add message to subcollection
      await FirebaseFirestore.instance
          .collection('chats')
          .doc(chatId)
          .collection('messages')
          .add(messageData);

      // Create notification for receiver (only if receiver is not the current user)
      if (widget.receiverId != currentUser!.uid) {
        await NotificationService.notifyChatMessage(
          widget.receiverId,
          currentUser!.uid,
          currentUser!.email?.split('@')[0] ?? 'User', // Service will fetch full name
          messageText,
        );
      }

      _scrollToBottom();
    } catch (e) {
      // Show error to user
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to send message: ${e.toString()}'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
      // Restore message text on error
      _messageController.text = messageText;
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(widget.receiverName),
            if (widget.postName != null)
              Text(
                'Inquiry: ${widget.postName}',
                style: const TextStyle(
                    fontSize: 12, fontWeight: FontWeight.normal),
              ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: !_chatInitialized
                ? const Center(child: CircularProgressIndicator())
                : StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('chats')
                  .doc(chatId)
                  .collection('messages')
                  .orderBy('timestamp', descending: false)
                  .snapshots(),
              builder: (context, snapshot) {
                // Handle errors
                if (snapshot.hasError) {
                  // If it's a permission error during logout, just show a loading indicator
                  // until the navigation completes and this widget is disposed.
                  if (snapshot.error.toString().contains('permission-denied')) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  
                  // For missing index or other errors, show empty state instead of error
                  final errorStr = snapshot.error.toString();
                  if (errorStr.contains('index') || errorStr.contains('not-found')) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.chat_bubble_outline,
                              size: 64, color: Colors.grey),
                          const SizedBox(height: 16),
                          Text(
                            'Start your interaction with ${widget.receiverName}',
                            textAlign: TextAlign.center,
                            style: AppTheme.bodyMedium,
                          ),
                        ],
                      ),
                    );
                  }
                  
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline,
                            size: 64, color: AppTheme.errorColor),
                        const SizedBox(height: 16),
                        Text(
                          'Something went wrong:\n${snapshot.error}\n\nChatId: $chatId',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: AppTheme.errorColor),
                        ),
                      ],
                    ),
                  );
                }

                // Show empty state immediately if no data, don't wait
                if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                  // Only show loading on initial connection
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.chat_bubble_outline,
                            size: 64, color: Colors.grey),
                        const SizedBox(height: 16),
                        Text(
                          'Start your interaction with ${widget.receiverName}',
                          textAlign: TextAlign.center,
                          style: AppTheme.bodyMedium,
                        ),
                      ],
                    ),
                  );
                }

                final messages = snapshot.data!.docs;
                WidgetsBinding.instance
                    .addPostFrameCallback((_) => _scrollToBottom());

                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final msg = messages[index].data() as Map<String, dynamic>;
                    final bool isMe = msg['senderId'] == currentUser?.uid;
                    final DateTime? time =
                        (msg['timestamp'] as Timestamp?)?.toDate();

                    return _MessageBubble(
                      text: msg['text'] ?? '',
                      isMe: isMe,
                      timestamp: time,
                    );
                  },
                );
              },
            ),
          ),
          _buildMessageInput(),
        ],
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: const Offset(0, -2),
            blurRadius: 10,
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _messageController,
                decoration: InputDecoration(
                  hintText: 'Type your message...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: Colors.grey[100],
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                ),
                maxLines: null,
                textCapitalization: TextCapitalization.sentences,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              decoration: const BoxDecoration(
                color: AppTheme.primaryColor,
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.send, color: Colors.white),
                onPressed: _sendMessage,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final String text;
  final bool isMe;
  final DateTime? timestamp;

  const _MessageBubble({
    required this.text,
    required this.isMe,
    this.timestamp,
  });

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        constraints:
            BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isMe ? AppTheme.primaryColor : Colors.grey[200],
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 0),
            bottomRight: Radius.circular(isMe ? 0 : 16),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              text,
              style: TextStyle(
                color: isMe ? Colors.white : AppTheme.textPrimaryColor,
                fontSize: 16,
              ),
            ),
            if (timestamp != null) ...[
              const SizedBox(height: 4),
              Text(
                _formatTime(timestamp!),
                style: TextStyle(
                  color: isMe
                      ? Colors.white.withOpacity(0.7)
                      : AppTheme.textSecondaryColor,
                  fontSize: 10,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final hour =
        time.hour > 12 ? time.hour - 12 : (time.hour == 0 ? 12 : time.hour);
    final ampm = time.hour >= 12 ? 'PM' : 'AM';
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute $ampm';
  }
}
