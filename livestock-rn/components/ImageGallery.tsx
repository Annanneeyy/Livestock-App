import { useState } from 'react';
import { View, Image, FlatList, Dimensions, Text } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  images: { id: string; image_url: string }[];
}

export default function ImageGallery({ images }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <View className="w-full h-64 bg-gray-200 items-center justify-center">
        <Text className="text-gray-400 text-5xl">🐷</Text>
        <Text className="text-gray-400 mt-2">No images</Text>
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.image_url }}
            style={{ width: SCREEN_WIDTH, height: 256 }}
            resizeMode="cover"
          />
        )}
      />
      {images.length > 1 && (
        <View className="absolute bottom-3 left-0 right-0 flex-row justify-center">
          {images.map((_, i) => (
            <View
              key={i}
              className={`w-2 h-2 rounded-full mx-1 ${
                i === activeIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
