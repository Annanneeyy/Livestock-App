import 'package:flutter/material.dart';

class AnimatedPigMarker extends StatefulWidget {
  final double size;
  final String imagePath;

  const AnimatedPigMarker({
    super.key,
    this.size = 50.0,
    this.imagePath = 'assets/cute_pig_icon.png',
  });

  @override
  State<AnimatedPigMarker> createState() => _AnimatedPigMarkerState();
}

class _AnimatedPigMarkerState extends State<AnimatedPigMarker>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  late Animation<double> _shadowSizeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat(reverse: true);

    _animation = Tween<double>(begin: 0, end: -15.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    _shadowSizeAnimation = Tween<double>(begin: 1.0, end: 0.6).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return SizedBox(
          width: widget.size,
          height: widget.size + 40,
          child: Stack(
            alignment: Alignment.bottomCenter,
            children: [
              // Shadow
              Transform.scale(
                scale: _shadowSizeAnimation.value,
                child: Container(
                  width: widget.size * 0.6,
                  height: widget.size * 0.15,
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.2),
                    borderRadius: BorderRadius.all(
                      Radius.elliptical(widget.size * 0.3, widget.size * 0.07),
                    ),
                  ),
                ),
              ),
              // Precision Pointer Arrow
              const Positioned(
                bottom: -8, // Point precisely at the location
                child: Icon(
                  Icons.arrow_drop_down_rounded,
                  color: Color.fromARGB(255, 105, 158, 255),
                  size: 35,
                ),
              ),
              // Pig Icon
              Positioned(
                bottom: 12 + _animation.value.abs(),
                child: Image.asset(
                  widget.imagePath,
                  width: widget.size,
                  height: widget.size,
                  fit: BoxFit.contain,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
