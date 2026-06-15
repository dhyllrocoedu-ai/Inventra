import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';

import { NeutralColors, Fonts } from '@/constants/theme';
import { BorderRadius, Spacing } from '@/constants/spacing';

type Props = {
  imageUri: string | null;
  onImagePicked: (uri: string) => void;
};

export function ImagePickerField({ imageUri, onImagePicked }: Props) {
  async function pickImage() {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to add a product image.');
      return;
    }
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onImagePicked(result.assets[0].uri);
    }
  }

  return (
    <Pressable onPress={pickImage} style={styles.container}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="camera-outline" size={32} color={NeutralColors.textDisabled} />
          <Text style={styles.placeholderText}>Add Photo</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: NeutralColors.border,
    borderStyle: 'dashed',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NeutralColors.secondaryBg,
  },
  placeholderText: {
    fontSize: 11,
    color: NeutralColors.textDisabled,
    marginTop: Spacing.xs,
    fontWeight: '600',
    fontFamily: Fonts.sansSemiBold,
  },
});
