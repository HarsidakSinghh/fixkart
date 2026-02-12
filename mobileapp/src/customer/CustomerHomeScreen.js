import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Image, Modal, Alert, ScrollView, Dimensions } from 'react-native';
import { customerColors, customerSpacing } from './CustomerTheme';
import CustomerHeader from './CustomerHeader';
import CategoryDrawer from './CategoryDrawer';
import { getStoreCategories, getStoreTypes, recognizeProductFromImage } from './storeApi';
import { useAuth } from '../context/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';

const BANNER_SLIDES = [
  { id: '1', image: require('../../assets/photo1.png') },
  { id: '2', image: require('../../assets/photo2.png') },
  { id: '3', image: require('../../assets/photo3.png') },
  { id: '4', image: require('../../assets/photo4.png') },
];

const HeroCarousel = React.memo(function HeroCarousel() {
  const width = Dimensions.get('window').width;
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = React.useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % BANNER_SLIDES.length;
        scrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [width]);

  return (
    <View style={styles.hero}>
      <View style={styles.carouselWrap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setActiveSlide(index);
          }}
        >
          {BANNER_SLIDES.map((slide) => (
            <Image key={slide.id} source={slide.image} style={[styles.carouselImage, { width }]} />
          ))}
        </ScrollView>
        <View style={styles.dotRow}>
          {BANNER_SLIDES.map((slide, index) => (
            <View
              key={`dot-${slide.id}`}
              style={[styles.dot, index === activeSlide ? styles.dotActive : null]}
            />
          ))}
        </View>
      </View>
    </View>
  );
});

export default function CustomerHomeScreen({ onOpenProduct, onOpenLogin }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [types, setTypes] = useState([]);
  const [lensState, setLensState] = useState('idle');
  const [lensResult, setLensResult] = useState(null);
  const { isAuthenticated, clearSession } = useAuth();
  const { signOut } = useClerkAuth();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const [loadingTypes, setLoadingTypes] = useState(false);

  const loadTypes = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const data = await getStoreTypes(category === 'All' ? '' : category);
      setTypes(data.types || []);
    } catch (error) {
      console.error('Failed to load types', error);
    } finally {
      setLoadingTypes(false);
    }
  }, [category]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  useEffect(() => {
    let mounted = true;
    const fallback = [
      'Fastening & Joining',
      'Electrical & Lighting',
      'Tools & Hardware',
      'Abrasives',
      'Flow Control',
      'Heating & Cooling',
      'Fabricating',
      'Lubricating',
      'Material Handling',
    ];
    getStoreCategories()
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data?.categories) ? data.categories : [];
        setCategories(list.length ? list : fallback);
      })
      .catch(() => {
        if (!mounted) return;
        setCategories(fallback);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredTypes = useMemo(() => {
    if (!debouncedQuery) return types;
    const needle = debouncedQuery.toLowerCase();
    return types.filter((item) => item.label?.toLowerCase().includes(needle));
  }, [types, debouncedQuery]);

  const runImageRecognition = useCallback(async (asset) => {
    setLensResult(null);
    setLensState('processing');
    try {
      const data = await recognizeProductFromImage(asset);
      setLensResult(data);
    } catch (error) {
      setLensResult({
        productName: '',
        confidence: 0,
        error: 'Could not identify this product. Please try another image.',
      });
    } finally {
      setLensState('result');
    }
  }, []);

  const pickFromCamera = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Please allow camera access to search by image.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets?.length) return;
    runImageRecognition(result.assets[0]);
  }, [runImageRecognition]);

  const pickFromGallery = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Gallery permission needed', 'Please allow gallery access to search by image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;
    runImageRecognition(result.assets[0]);
  }, [runImageRecognition]);

  const onLensPress = useCallback(() => {
    Alert.alert('Search by photo', 'Choose image source', [
      { text: 'Camera', onPress: pickFromCamera },
      { text: 'Gallery', onPress: pickFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [pickFromCamera, pickFromGallery]);

  return (
    <View style={styles.container}>
      <CustomerHeader
        query={query}
        onQueryChange={setQuery}
        onLensPress={onLensPress}
        onLogin={onOpenLogin}
        onToggleMenu={() => setDrawerOpen(true)}
        isAuthenticated={isAuthenticated}
        onLogout={async () => {
          await signOut();
          await clearSession();
        }}
      />

      <FlatList
        data={filteredTypes}
        keyExtractor={(item) => item.label}
        numColumns={2}
        columnWrapperStyle={styles.typeRow}
        contentContainerStyle={styles.typesGrid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await loadTypes();
              } finally {
                setRefreshing(false);
              }
            }}
          />
        }
        ListEmptyComponent={
          !loadingTypes ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No types found.</Text>
              <Text style={styles.emptySubtext}>Try a different category or search.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingTypes ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={customerColors.primary} />
              <Text style={styles.footerText}>Loading types…</Text>
            </View>
          ) : null
        }
        ListHeaderComponent={() => (
          <>
            <HeroCarousel />

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{category === 'All' ? 'Browse Types' : category}</Text>
                <Text style={styles.sectionSubtitle}>
                  {loadingTypes ? 'Loading types…' : `${filteredTypes.length} types`}
                </Text>
              </View>
              <TouchableOpacity style={styles.filterButton} onPress={() => setDrawerOpen(true)}>
                <Text style={styles.filterText}>Filter</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.typeCard}
            onPress={() => onOpenProduct({ type: item.label, isType: true })}
          >
            <View style={styles.typeImage}>
              {item.image ? <Image source={{ uri: item.image }} style={styles.typeImage} /> : null}
              <View style={styles.typeOverlay} />
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{item.count}</Text>
              </View>
            </View>
            <Text style={styles.typeLabel} numberOfLines={2}>
              {item.label}
            </Text>
            <Text style={styles.typeMeta}>{item.count} listings</Text>
          </TouchableOpacity>
        )}
      />

      <CategoryDrawer
        visible={drawerOpen}
        active={category}
        onClose={() => setDrawerOpen(false)}
        onSelect={setCategory}
        categories={categories}
      />

      <Modal visible={lensState === 'processing'} transparent animationType="fade">
        <View style={styles.processingBackdrop}>
          <View style={styles.processingCard}>
            <ActivityIndicator color={customerColors.primary} size="large" />
            <Text style={styles.processingTitle}>Processing image...</Text>
            <Text style={styles.processingSub}>Please wait while we detect the product.</Text>
          </View>
        </View>
      </Modal>

      <Modal visible={lensState === 'result'} transparent animationType="slide">
        <View style={styles.processingBackdrop}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Image Search Result</Text>
            <Text style={styles.resultBody}>
              {lensResult?.productName
                ? `This looks like: ${lensResult.productName}`
                : lensResult?.error || 'Could not detect a product name.'}
            </Text>
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.resultSecondary}
                onPress={() => {
                  setLensState('idle');
                  setLensResult(null);
                  onLensPress();
                }}
              >
                <Text style={styles.resultSecondaryText}>Try Another</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.resultPrimary,
                  !lensResult?.productName ? { opacity: 0.5 } : null,
                ]}
                disabled={!lensResult?.productName}
                onPress={() => {
                  setQuery(lensResult.productName);
                  setLensState('idle');
                }}
              >
                <Text style={styles.resultPrimaryText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: customerColors.bg },
  hero: {
    marginHorizontal: -customerSpacing.lg,
    marginTop: customerSpacing.lg,
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  carouselWrap: {
    borderRadius: 0,
    overflow: 'hidden',
    height: 160,
    backgroundColor: customerColors.surface,
  },
  carouselImage: {
    height: 160,
    resizeMode: 'cover',
  },
  dotRow: {
    position: 'absolute',
    bottom: 8,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: '#FFFFFF99',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    paddingHorizontal: customerSpacing.lg,
    marginTop: customerSpacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { color: customerColors.text, fontSize: 16, fontWeight: '700' },
  sectionSubtitle: { color: customerColors.muted, fontSize: 12, marginTop: 4 },
  filterButton: {
    backgroundColor: customerColors.card,
    borderWidth: 1,
    borderColor: customerColors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  filterText: { color: customerColors.primary, fontWeight: '700', fontSize: 12 },
  typeSection: {
    paddingHorizontal: customerSpacing.lg,
    marginTop: customerSpacing.md,
  },
  typeTitle: { color: customerColors.text, fontWeight: '700', marginBottom: customerSpacing.sm },
  typeRow: { justifyContent: 'space-between', gap: 12 },
  typeCard: {
    width: '48%',
    backgroundColor: customerColors.card,
    borderRadius: 16,
    padding: customerSpacing.sm,
    borderWidth: 1,
    borderColor: customerColors.border,
    marginBottom: customerSpacing.sm,
  },
  typeImage: { width: '100%', height: 90, borderRadius: 12, backgroundColor: customerColors.surface },
  typeOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 12,
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700', color: customerColors.primary },
  typeLabel: { color: customerColors.text, fontWeight: '700', marginTop: 8, fontSize: 12 },
  typeMeta: { color: customerColors.muted, marginTop: 4, fontSize: 11 },
  typesGrid: { paddingHorizontal: customerSpacing.lg, paddingBottom: 160, paddingTop: customerSpacing.md },
  footerLoading: { alignItems: 'center', paddingVertical: customerSpacing.md },
  footerText: { color: customerColors.muted, marginTop: 6, fontSize: 12 },
  emptyWrap: { alignItems: 'center', paddingVertical: customerSpacing.xl },
  emptyText: { color: customerColors.text, fontWeight: '700' },
  emptySubtext: { color: customerColors.muted, marginTop: 6, textAlign: 'center' },
  processingBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: customerSpacing.lg,
  },
  processingCard: {
    width: '100%',
    backgroundColor: customerColors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: customerColors.border,
    padding: customerSpacing.lg,
    alignItems: 'center',
  },
  processingTitle: {
    marginTop: customerSpacing.md,
    color: customerColors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  processingSub: {
    marginTop: 6,
    color: customerColors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  resultCard: {
    width: '100%',
    backgroundColor: customerColors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: customerColors.border,
    padding: customerSpacing.lg,
  },
  resultTitle: { color: customerColors.text, fontSize: 18, fontWeight: '800' },
  resultBody: { color: customerColors.muted, marginTop: customerSpacing.sm, fontSize: 14 },
  resultActions: {
    marginTop: customerSpacing.md,
    flexDirection: 'row',
    gap: customerSpacing.sm,
  },
  resultPrimary: {
    flex: 1,
    backgroundColor: customerColors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resultPrimaryText: { color: '#FFFFFF', fontWeight: '700' },
  resultSecondary: {
    flex: 1,
    backgroundColor: customerColors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  resultSecondaryText: { color: customerColors.text, fontWeight: '700' },
});
