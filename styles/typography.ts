
export type FontFamily = 'primary' | 'secondary'
export type FontWeight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'extralight' | 'extrabold'









export const typography = {
  fontFamily: {
       primary: 'MonaSans-Regular',
       secondary: 'Manrope-Regular', 
       tertiary: 'Inter-Regular',
    
  },
  fontWeight: {
        regular: '400',
        medium: '500',
        semiBold: '600',
        bold: '700',
  },
  heading: {
    h1: { fontSize: 56, lineHeight: 68 },
    h2: { fontSize: 48, lineHeight: 48 },
    h3: { fontSize: 40, lineHeight: 48 },
    h4: { fontSize: 32, lineHeight: 39 },
    h5: { fontSize: 28, lineHeight: 34 },
    h6: { fontSize: 24, lineHeight: 29 },
    h7: { fontSize: 20, lineHeight: 25 },
    h8: { fontSize: 18, lineHeight: 29 },
  },
  body: {
    b1: { fontSize: 16, lineHeight: 19.2 },
    b2: { fontSize: 14, lineHeight: 17 },
    b3: { fontSize: 12, lineHeight: 16, },
  },
};