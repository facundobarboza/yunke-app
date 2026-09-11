import { yunke } from '@/constants/Colors';
import type { ThemePalette } from '@/constants/Colors';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Dimensions, FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

type GalleryImage = {
  id: string;
  url: string;
  caption?: string | null;
};

type ImageGalleryProps = {
  images: GalleryImage[];
};

export function ImageGallery({ images }: ImageGalleryProps) {
  const styles = useThemedStyles(createStyles);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (images.length === 0) return null;

  const openImage = (index: number) => setSelectedIdx(index);
  const closeViewer = () => setSelectedIdx(null);

  const goToPrev = () => {
    if (selectedIdx !== null && selectedIdx > 0) {
      setSelectedIdx(selectedIdx - 1);
    }
  };

  const goToNext = () => {
    if (selectedIdx !== null && selectedIdx < images.length - 1) {
      setSelectedIdx(selectedIdx + 1);
    }
  };

  return (
    <>
      {/* Thumbnail grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Galería</Text>
        <FlatList
          data={images}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <Pressable onPress={() => openImage(index)}>
              <Image source={{ uri: item.url }} style={styles.thumbnail} resizeMode="cover" />
            </Pressable>
          )}
        />
      </View>

      {/* Fullscreen viewer */}
      <Modal visible={selectedIdx !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          {/* Close button */}
          <Pressable style={styles.closeButton} onPress={closeViewer}>
            <Ionicons name="close" size={28} color={yunke.white} />
          </Pressable>

          {/* Counter */}
          {selectedIdx !== null && (
            <Text style={styles.counter}>
              {selectedIdx + 1} / {images.length}
            </Text>
          )}

          {/* Image + navigation */}
          <View style={styles.viewerContainer}>
            {selectedIdx !== null && selectedIdx > 0 && (
              <Pressable style={styles.navButton} onPress={goToPrev}>
                <Ionicons name="chevron-back" size={32} color={yunke.white} />
              </Pressable>
            )}

            {selectedIdx !== null && (
              <Image
                source={{ uri: images[selectedIdx].url }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}

            {selectedIdx !== null && selectedIdx < images.length - 1 && (
              <Pressable style={[styles.navButton, styles.navButtonRight]} onPress={goToNext}>
                <Ionicons name="chevron-forward" size={32} color={yunke.white} />
              </Pressable>
            )}
          </View>

          {/* Caption */}
          {selectedIdx !== null && images[selectedIdx].caption && (
            <Text style={styles.caption}>{images[selectedIdx].caption}</Text>
          )}
        </View>
      </Modal>
    </>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  listContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counter: {
    position: 'absolute',
    top: 68,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    zIndex: 10,
  },
  viewerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  fullImage: {
    flex: 1,
    height: '80%',
  },
  navButton: {
    position: 'absolute',
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  navButtonRight: {
    left: undefined,
    right: 12,
  },
  caption: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    color: yunke.white,
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
