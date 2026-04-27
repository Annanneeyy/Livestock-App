export const COLORS = {
  green: {
    primary: '#2E7D32',
    light: '#4CAF50',
    dark: '#1B5E20',
    bg: '#E8F5E9',
  },
  blue: {
    primary: '#1565C0',
    light: '#42A5F5',
    dark: '#0D47A1',
    bg: '#E3F2FD',
  },
  orange: {
    primary: '#E65100',
    light: '#FF9800',
    dark: '#BF360C',
    bg: '#FFF3E0',
  },
  purple: {
    primary: '#6A1B9A',
    light: '#AB47BC',
    dark: '#4A148C',
    bg: '#F3E5F5',
  },
  red: {
    primary: '#C62828',
    light: '#EF5350',
    dark: '#B71C1C',
    bg: '#FFEBEE',
  },
  teal: {
    primary: '#00695C',
    light: '#26A69A',
    dark: '#004D40',
    bg: '#E0F2F1',
  },
  pink: {
    primary: '#AD1457',
    light: '#EC407A',
    dark: '#880E4F',
    bg: '#FCE4EC',
  },
  indigo: {
    primary: '#283593',
    light: '#5C6BC0',
    dark: '#1A237E',
    bg: '#E8EAF6',
  },
} as const;

export type ThemeColor = keyof typeof COLORS;

export const DEFAULT_THEME: ThemeColor = 'green';

export const LIVESTOCK_CATEGORIES = ['Baktin', 'Lechonon', 'Lapaon'] as const;

export const FEEDING_CATEGORIES = ['Baktin', 'Anayon', 'Lapaon', 'Lechonon'] as const;

export const BARANGAYS = [
  'Apyao', 'Butong', 'Cawayan', 'Cebule', 'Dalurong', 'Delapa',
  'Kiburiao', 'Libertad', 'Lumitao', 'Merangeran', 'Minbantang',
  'Minongan', 'Palacapao', 'Puntian', 'Salawagan', 'San Jose',
  'San Roque', 'Sta. Cruz', 'Tugas',
] as const;
