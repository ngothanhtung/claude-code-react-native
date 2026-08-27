/**
 * Shared typography presets.
 *
 * - Inter is used for UI labels, body copy, inputs and captions.
 * - Be Vietnam Pro is kept for brand/marketing headings and large CTAs.
 *
 * Use these objects as the base of a StyleSheet text style and override only
 * the `color` (and occasionally `textAlign`) in the consuming component.
 */

export const Inter = {
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    lineHeight: 16,
  },
  input: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 20,
  },
  link: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 18,
  },
};

export const BeVietnamPro = {
  heading: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 32,
    lineHeight: 38,
  },
  subheading: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  brand: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 19,
    lineHeight: 24,
  },
};
