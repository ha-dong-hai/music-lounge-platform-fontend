export const MOCK_LOCATIONS = {
  provinces: [
    { id: 'hcm', name: 'TP. Hồ Chí Minh' },
    { id: 'hn', name: 'Hà Nội' },
    { id: 'dn', name: 'Đà Nẵng' },
    { id: 'nt', name: 'Nha Trang' }
  ],
  districts: {
    hcm: ['Q1', 'Q2', 'Q3', 'Phú Nhuận', 'Bình Thạnh', 'Gò Vấp'],
    hn: ['Hoàn Kiếm', 'Ba Đình', 'Hai Bà Trưng', 'Thanh Xuân'],
    dn: ['Hải Châu', 'Sơn Trà', 'Ngũ Hành Sơn']
  },
  wards: {
    q1: ['P1', 'P2', 'Bến Nghè', 'Tân Định'],
    phu_nhuan: ['P1', 'P15', 'P17'],
    binh_thanh: ['P11', 'P12', 'P13']
  }
}

export const MOCK_MUSIC_TYPES = [
  'Acoustic', 'EDM', 'Pop', 'Rock', 'Jazz', 
  'Classical', 'R&B', 'Indie', 'Folk', 'Lo-fi',
  'Vinyl', 'Electronic', 'Hip Hop', 'Soul'
]

export const MOCK_LOUNGE_SPACES = [
  { id: 'no_space', label: 'Không gian', type: 'space' },
  { id: 'cozy', label: 'Cozy', type: 'space' },
  { id: 'rooftop', label: 'Rooftop', type: 'space' },
  { id: 'garden', label: 'Garden', type: 'space' },
  { id: 'basement', label: 'Basement', type: 'space' }
]

export const MOCK_MOODS = [
  { id: 'chill', label: 'Cảm xúc', type: 'mood' },
  { id: 'romantic', label: 'Romantic', type: 'mood' },
  { id: 'energetic', label: 'Energetic', type: 'mood' },
  { id: 'melancholy', label: 'Melancholy', type: 'mood' },
  { id: 'focus', label: 'Focus', type: 'mood' },
  { id: 'chill2', label: 'Cảm xúc cv', type: 'mood' },
  { id: 'romantic3', label: 'Romantic df', type: 'mood' },
  { id: 'energetic4', label: 'Energetic cv', type: 'mood' },
  { id: 'melancholy5', label: 'Melancholy vv', type: 'mood' },
  { id: 'focus6', label: 'Focus ccv', type: 'mood' }
]