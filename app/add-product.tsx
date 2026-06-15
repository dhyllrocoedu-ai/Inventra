import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { BrandColors, Fonts, NeutralColors } from '@/constants/theme';
import { BorderRadius, Shadow, Spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/useResponsive';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ImagePickerField } from '@/components/ImagePicker';

let idCounter = 0;
function generateId() {
  idCounter++;
  return `prod_${Date.now()}_${idCounter}`;
}

type StockAction = 'stock_in' | 'damaged' | 'lost' | 'correction';

const STOCK_LABELS: Record<StockAction, string> = {
  stock_in: 'Stock In',
  damaged: 'Damaged Goods',
  lost: 'Lost Inventory',
  correction: 'Manual Correction',
};

export default function AddProductScreen() {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const isEditing = !!productId;
  const { header } = useResponsive();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stock, setStock] = useState('');
  const [barcode, setBarcode] = useState('');
  const [minStock, setMinStock] = useState('10');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAction, setStockAction] = useState<StockAction>('stock_in');
  const [stockQty, setStockQty] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        const { listProducts } = await import('@/lib/db/products');
        const all = await listProducts();
        const p = all.find((x: any) => x.id === productId);
        if (p) {
          setName(p.name);
          setCategory(p.category ?? '');
          setCostPrice(String(p.costPrice));
          setSellPrice(String(p.sellPrice));
          setStock(String(p.stock));
          setBarcode(p.barcode ?? '');
          setMinStock(String(p.minStock ?? 10));
          setImageUri(p.imageUri ?? null);
        }
      } catch {}
    })();
  }, [productId]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Validation', 'Product name is required.');
      return;
    }
    const cost = parseInt(costPrice, 10);
    const sell = parseInt(sellPrice, 10);
    const stk = parseInt(stock, 10);
    if (isNaN(cost) || isNaN(sell) || isNaN(stk)) {
      Alert.alert('Validation', 'Price and stock fields must be valid numbers.');
      return;
    }

    setSaving(true);
    try {
      const { upsertProduct } = await import('@/lib/db/products');
      await upsertProduct({
        id: productId ?? generateId(),
        name: name.trim(),
        category: category.trim() || null,
        costPrice: cost,
        sellPrice: sell,
        stock: stk,
        minStock: parseInt(minStock, 10) || 10,
        barcode: barcode.trim() || null,
        imageUri: imageUri,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!productId) return;
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { deleteProduct } = await import('@/lib/db/products');
            await deleteProduct(productId);
            router.back();
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to delete.');
          }
        },
      },
    ]);
  }

  function openStockModal(action: StockAction) {
    setStockAction(action);
    setStockQty('');
    setShowStockModal(true);
  }

  async function applyStockAdjustment() {
    if (!productId) return;
    const qty = parseInt(stockQty, 10);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Invalid', 'Please enter a valid non-negative number.');
      return;
    }

    setShowStockModal(false);
    try {
      const { logMovement, upsertProduct, listProducts } = await import('@/lib/db/products');
      const all = await listProducts();
      const p = all.find((x: any) => x.id === productId);
      if (!p) return;

      const prevStock = p.stock;
      let newStock = p.stock;
      switch (stockAction) {
        case 'stock_in':
          newStock = p.stock + qty;
          break;
        case 'damaged':
        case 'lost':
          newStock = Math.max(0, p.stock - qty);
          break;
        case 'correction':
          newStock = qty;
          break;
      }

      await upsertProduct({ ...p, stock: newStock });
      logMovement(productId, newStock - prevStock, prevStock, stockAction, productId);
      setStock(String(newStock));
      Alert.alert('Done', `${STOCK_LABELS[stockAction]}: Stock updated to ${newStock}.`);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Adjustment failed.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={NeutralColors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { fontSize: header.titleSize }]}>{isEditing ? 'Edit Product' : 'Add Product'}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          <View style={styles.imageSection}>
          <ImagePickerField imageUri={imageUri} onImagePicked={setImageUri} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Product Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter product name"
            placeholderTextColor={NeutralColors.textDisabled}
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            value={category}
            onChangeText={setCategory}
            placeholder="e.g. Beverages, Snacks"
            placeholderTextColor={NeutralColors.textDisabled}
            style={styles.input}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Cost Price (₱)</Text>
            <TextInput
              value={costPrice}
              onChangeText={setCostPrice}
              placeholder="0"
              placeholderTextColor={NeutralColors.textDisabled}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Selling Price (₱)</Text>
            <TextInput
              value={sellPrice}
              onChangeText={setSellPrice}
              placeholder="0"
              placeholderTextColor={NeutralColors.textDisabled}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Current Stock</Text>
          <TextInput
            value={stock}
            onChangeText={setStock}
            placeholder="0"
            placeholderTextColor={NeutralColors.textDisabled}
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Min Stock Alert</Text>
          <TextInput
            value={minStock}
            onChangeText={setMinStock}
            placeholder="10"
            placeholderTextColor={NeutralColors.textDisabled}
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Barcode (Optional)</Text>
          <TextInput
            value={barcode}
            onChangeText={setBarcode}
            placeholder="Scan or type barcode"
            placeholderTextColor={NeutralColors.textDisabled}
            style={styles.input}
          />
          <Pressable
            style={styles.scanBtn}
            onPress={() => {
              setScanned(false);
              setShowCamera(true);
            }}
          >
            <Ionicons name="camera-outline" size={18} color={BrandColors.primary} />
            <Text style={styles.scanBtnText}>Scan Barcode</Text>
          </Pressable>
        </View>

        {isEditing && (
          <View style={styles.stockActions}>
            <Text style={styles.sectionLabel}>Stock Management</Text>
            <Pressable style={styles.stockBtn} onPress={() => openStockModal('stock_in')}>
              <Ionicons name="add-circle-outline" size={20} color={BrandColors.teal} />
              <Text style={styles.stockBtnText}>Stock In</Text>
            </Pressable>
            <View style={styles.stockSubRow}>
              <Pressable
                style={[styles.stockBtnSmall, { backgroundColor: '#FEF3C7' }]}
                onPress={() => openStockModal('damaged')}
              >
<Text style={{ color: BrandColors.warning, fontFamily: Fonts.sansBold, fontWeight: '700', fontSize: 13 }}>
  Damaged Goods
</Text>
              </Pressable>
              <Pressable
                style={[styles.stockBtnSmall, { backgroundColor: '#FEE2E2' }]}
                onPress={() => openStockModal('lost')}
              >
<Text style={{ color: BrandColors.danger, fontFamily: Fonts.sansBold, fontWeight: '700', fontSize: 13 }}>
  Lost Inventory
</Text>
              </Pressable>
              <Pressable
                style={[styles.stockBtnSmall, { backgroundColor: '#DBEAFE' }]}
                onPress={() => openStockModal('correction')}
              >
<Text style={{ color: BrandColors.primary, fontFamily: Fonts.sansBold, fontWeight: '700', fontSize: 13 }}>
  Manual Correction
</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <PrimaryButton
            title={saving ? 'Saving...' : 'Save Product'}
            onPress={handleSave}
            disabled={saving}
            color={BrandColors.primary}
          />
          {isEditing && (
            <View style={{ marginTop: Spacing.sm }}>
              <PrimaryButton
                title="Delete Product"
                onPress={handleDelete}
                color={BrandColors.danger}
              />
            </View>
          )}
        </View>
        </View>
      </ScrollView>

      <Modal visible={showStockModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowStockModal(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>{STOCK_LABELS[stockAction]}</Text>
            <Text style={styles.modalSubtitle}>
              {stockAction === 'stock_in'
                ? 'Add quantity to stock'
                : stockAction === 'correction'
                  ? 'Set stock to exact value'
                  : 'Subtract quantity from stock'}
            </Text>
            <TextInput
              value={stockQty}
              onChangeText={setStockQty}
              placeholder="Enter quantity"
              placeholderTextColor={NeutralColors.textDisabled}
              keyboardType="number-pad"
              autoFocus
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setShowStockModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalConfirm} onPress={applyStockAdjustment}>
                <Text style={styles.modalConfirmText}>Apply</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showCamera} transparent animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['aztec', 'code128', 'code39', 'code93', 'codabar', 'datamatrix', 'ean13', 'ean8', 'itf14', 'pdf417', 'upc_a', 'upc_e', 'qr'] }}
            onBarcodeScanned={scanned ? undefined : (result) => {
              setScanned(true);
              Vibration.vibrate(100);
              setBarcode(result.data);
              setShowCamera(false);
            }}
          />
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraHint}>Point camera at a barcode</Text>
            <Pressable style={styles.cameraCancel} onPress={() => setShowCamera(false)}>
              <Text style={styles.cameraCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NeutralColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingTop: Spacing.xl,
    backgroundColor: NeutralColors.card,
    borderBottomWidth: 1,
    borderBottomColor: NeutralColors.border,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontFamily: Fonts.sansExtraBold, fontWeight: '800', color: BrandColors.navy },
  content: { padding: Spacing.md, paddingBottom: 60 },
  formContainer: { width: '100%', maxWidth: 600, alignSelf: 'center' },
  imageSection: { alignItems: 'center', marginBottom: Spacing.lg },
  fieldGroup: { marginBottom: Spacing.md },
  label: {
    fontSize: 13,
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    color: NeutralColors.textSecondary,
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    fontSize: 15,
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    color: NeutralColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  input: {
    height: 44,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: NeutralColors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: NeutralColors.textPrimary,
    backgroundColor: NeutralColors.card,
  },
  row: { flexDirection: 'row', gap: 12 },
  stockActions: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: NeutralColors.card,
    borderRadius: BorderRadius.card,
    ...Shadow.card,
  },
  stockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: BorderRadius.button,
    marginBottom: Spacing.sm,
  },
  stockBtnText: {
    color: BrandColors.teal,
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    fontSize: 14,
  },
  stockSubRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  stockBtnSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.button,
  },
  actions: { marginTop: Spacing.lg },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: NeutralColors.card,
    borderRadius: BorderRadius.sheet,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.sansBlack,
    fontWeight: '900',
    color: NeutralColors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: NeutralColors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  modalInput: {
    height: 48,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: NeutralColors.border,
    paddingHorizontal: 12,
    fontSize: 18,
    color: NeutralColors.textPrimary,
    backgroundColor: NeutralColors.background,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.lg,
  },
  modalCancel: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.button,
    backgroundColor: NeutralColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    color: NeutralColors.textPrimary,
  },
  modalConfirm: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.button,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    color: '#fff',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: BrandColors.primary,
    backgroundColor: '#EFF6FF',
  },
  scanBtnText: {
    fontSize: 13,
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: Spacing.md,
  },
  cameraHint: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cameraCancel: {
    backgroundColor: NeutralColors.card,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: BorderRadius.button,
  },
  cameraCancelText: {
    fontSize: 15,
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    color: NeutralColors.textPrimary,
  },
});
