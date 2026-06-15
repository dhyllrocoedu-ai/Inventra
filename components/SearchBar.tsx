import { StyleSheet, TextInput, View } from 'react-native';

import { NeutralColors } from '@/constants/theme';
import { BorderRadius } from '@/constants/spacing';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, placeholder = 'Search...' }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={NeutralColors.textDisabled}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: NeutralColors.background,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: NeutralColors.border,
  },
  input: {
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: NeutralColors.textPrimary,
  },
});
