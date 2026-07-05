import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/colors';

const VARIANTS = {
  default: {
    backgroundColor: 'transparent',
    borderColor: colors.borderSubtle,
    textColor: colors.textPrimary,
  },
  primary: {
    backgroundColor: colors.white,
    borderColor: colors.accentRedBorder,
    textColor: colors.black,
  },
  danger: {
    backgroundColor: 'transparent',
    borderColor: colors.accentRedBorder,
    textColor: colors.white,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    textColor: colors.textSecondary,
  },
};

export default function Button({ label, onPress, variant = 'default', disabled, style, small }) {
  const v = VARIANTS[variant] || VARIANTS.default;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        {
          backgroundColor: v.backgroundColor,
          borderColor: v.borderColor,
          opacity: disabled ? 0.35 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.label, small && styles.labelSmall, { color: v.textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontSize: 13,
  },
});
