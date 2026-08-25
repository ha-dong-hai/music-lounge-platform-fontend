// src/constants/mockData.js
export const HOME_DATA = {
  featured: [
    // Thêm các thuộc tính lọc vào đây
    { id: 1, title: "Nhạc Acoustic Thư Giãn", price: "Miễn phí", priceValue: 0, thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQHZDgz0ZI0tnKSysnRO0o7KnPVtQ_hNlbaGi0AdEM3Q&s=10", start_date: '2026-07-20T20:00:00', genre: 'Acoustic', mood: 'Cảm xúc', space: 'Cozy', province: 'TP.HCM', subGenre: 'Ballad' },
    { id: 2, title: "EDM Night Party", price: "250.000đ", priceValue: 250000, thumbnail: null, start_date: '2026-07-21T21:00:00', genre: 'EDM', mood: 'Energetic', space: 'Basement', province: 'hcm', subGenre: 'Remix' },
    { id: 3, title: "Jazz & Wine Evening", price: "500.000đ",priceValue: 500000,  thumbnail: null, start_date: '2026-07-22T19:00:00', genre: 'Jazz', mood: 'Romantic', space: 'Rooftop', province: 'hcm' },
    { id: 4, title: "Indie Band Live Show", price: "150.000đ", priceValue: 150000, thumbnail: null, start_date: '2026-07-23T20:00:00', genre: 'Indie', mood: 'Cảm xúc', space: 'Garden', province: 'hn' },
    { id: 5, title: "Classical Piano Night", price: "800.000đ", thumbnail: null, start_date: '2026-07-24T20:00:00', genre: 'Classical', mood: 'Focus', space: 'Cozy', province: 'dn' },
    { id: 6, title: "Vinyl Listening Bar", price: "Incl. Drink", thumbnail: null, start_date: '2026-07-25T18:00:00', genre: 'Vinyl', mood: 'Cảm xúc', space: 'Cozy', province: 'hcm' },
    { id: 7, title: "R&B Soul Night", price: "200.000đ", thumbnail: null, start_date: '2026-07-26T21:00:00', genre: 'R&B', mood: 'Romantic', space: 'Rooftop', province: 'hcm' },
  ],
  
  genreSections: [
    {
      genreId: 'rock',
      genreName: 'Rock',
      slug: '/shows?genre=rock',
      events: [
        { id: 101, title: "Rock Festival Mini", price: "350.000đ", thumbnail: null, start_date: '2026-07-20T20:00:00', genre: 'Rock', mood: 'Energetic', space: 'Garden', province: 'hn' },
        { id: 102, title: "Hard Rock Night", price: "250.000đ", thumbnail: null, start_date: '2026-07-21T21:00:00', genre: 'Rock', mood: 'Energetic', space: 'Basement', province: 'hn' },
        { id: 103, title: "Indie Rock Vibes", price: "Miễn phí", thumbnail: null, start_date: '2026-07-22T18:00:00', genre: 'Rock', mood: 'Melancholy', space: 'Garden', province: 'hcm' },
        { id: 104, title: "Classic Rock Covers", price: "150.000đ", thumbnail: null, start_date: '2026-07-23T19:00:00', genre: 'Rock', mood: 'Cảm xúc', space: 'Cozy', province: 'dn' },
        { id: 105, title: "Metal Hammer", price: "400.000đ", thumbnail: null, start_date: '2026-07-24T22:00:00', genre: 'Rock', mood: 'Energetic', space: 'Basement', province: 'hcm' },
        { id: 106, title: "Punk Headbanger", price: "400.000đ", thumbnail: null, start_date: '2026-07-24T22:00:00', genre: 'Rock', mood: 'Energetic', space: 'Basement', province: 'hcm' },
        { id: 107, title: "Death-Metal Headbanger", price: "400.000đ", thumbnail: null, start_date: '2026-07-24T22:00:00', genre: 'Rock', mood: 'Energetic', space: 'Basement', province: 'hcm' },
      ]
    },
    {
      genreId: 'pop',
      genreName: 'Pop',
      slug: '/shows?genre=pop',
      events: [
        { id: 201, title: "Pop Hit Covers", price: "100.000đ", thumbnail: null, start_date: '2026-07-20T20:00:00', genre: 'Pop', mood: 'Cảm xúc', space: 'Cozy', province: 'hcm' },
        { id: 202, title: "K-Pop Dance Night", price: "200.000đ", thumbnail: null, start_date: '2026-07-21T21:00:00', genre: 'Pop', mood: 'Energetic', space: 'Basement', province: 'hcm' },
        { id: 203, title: "V-Pop Acoustic", price: "Miễn phí", thumbnail: null, start_date: '2026-07-22T18:00:00', genre: 'Pop', mood: 'Romantic', space: 'Garden', province: 'hn' },
        { id: 204, title: "Synthpop Retro", price: "150.000đ", thumbnail: null, start_date: '2026-07-23T19:00:00', genre: 'Pop', mood: 'Focus', space: 'Cozy', province: 'dn' },
        { id: 205, title: "Dance Pop Party", price: "250.000đ", thumbnail: null, start_date: '2026-07-24T22:00:00', genre: 'Pop', mood: 'Energetic', space: 'Rooftop', province: 'hcm' },
        { id: 206, title: "Karaoke Night", price: "150.000đ", thumbnail: null, start_date: '2024-07-21T20:00:00', genre: 'Pop', mood: 'Energetic', space: 'Cozy', province: 'hcm' },
      ]
    },
    {
      genreId: 'jazz',
      genreName: 'Jazz',
      slug: '/shows?genre=jazz',
      events: [
        { id: 301, title: "Jazz & Wine Evening", price: "500.000đ", thumbnail: null, start_date: '2026-07-20T19:00:00', genre: 'Jazz', mood: 'Romantic', space: 'Rooftop', province: 'hcm' },
        { id: 302, title: "Smooth Jazz Session", price: "300.000đ", thumbnail: null, start_date: '2026-07-21T20:00:00', genre: 'Jazz', mood: 'Cảm xúc', space: 'Cozy', province: 'hn' },
        { id: 303, title: "Swing Dance Jazz", price: "150.000đ", thumbnail: null, start_date: '2026-07-22T21:00:00', genre: 'Jazz', mood: 'Energetic', space: 'Garden', province: 'hcm' },
        { id: 304, title: "Saxophone Night", price: "450.000đ", thumbnail: null, start_date: '2026-07-23T20:00:00', genre: 'Jazz', mood: 'Romantic', space: 'Rooftop', province: 'dn' },
        { id: 305, title: "Jazz Trio Live", price: "200.000đ", thumbnail: null, start_date: '2026-07-24T19:00:00', genre: 'Jazz', mood: 'Focus', space: 'Cozy', province: 'hcm' },
      ]
    }
  ],

  moodSections: [
    {
      moodId: 'vui-ve',
      moodName: 'Vui vẻ',
      slug: '/shows?mood=vui-ve',
      events: [
        { id: 401, title: "Energetic Workout Beats", price: "Miễn phí", thumbnail: null, start_date: '2024-07-20T18:00:00', genre: 'EDM', mood: 'Energetic', space: 'Basement', province: 'tsn' },
        { id: 402, title: "Karaoke Night", price: "150.000đ", thumbnail: null, start_date: '2024-07-21T20:00:00', genre: 'Pop', mood: 'Energetic', space: 'Cozy', province: 'hcm' },
        { id: 403, title: "Latin Dance Party", price: "200.000đ", thumbnail: null, start_date: '2024-07-22T21:00:00', genre: 'Latin', mood: 'Energetic', space: 'Garden', province: 'hcm' },
        { id: 404, title: "Disco Funk Night", price: "250.000đ", thumbnail: null, start_date: '2024-07-23T21:00:00', genre: 'Funk', mood: 'Energetic', space: 'Basement', province: 'hn' },
        { id: 405, title: "Happy Indie Pop", price: "100.000đ", thumbnail: null, start_date: '2024-07-24T19:00:00', genre: 'Indie', mood: 'Cảm xúc', space: 'Garden', province: 'dn' },
      ]
    },
    {
      moodId: 'lang-man',
      moodName: 'Lãng mạn',
      slug: '/shows?mood=lang-man',
      events: [
        { id: 501, title: "Romantic Dinner Vibes", price: "600.000đ", thumbnail: null, start_date: '2024-07-20T19:00:00', genre: 'Jazz', mood: 'Romantic', space: 'Rooftop', province: 'hcm' },
        { id: 502, title: "Acoustic Love Songs", price: "150.000đ", thumbnail: null, start_date: '2024-07-21T20:00:00', genre: 'Acoustic', mood: 'Romantic', space: 'Cozy', province: 'hcm' },
        { id: 503, title: "Jazz Ballad Night", price: "300.000đ", thumbnail: null, start_date: '2024-07-22T20:00:00', genre: 'Jazz', mood: 'Romantic', space: 'Cozy', province: 'hn' },
        { id: 504, title: "Candlelight Concert", price: "500.000đ", thumbnail: null, start_date: '2024-07-23T19:30:00', genre: 'Classical', mood: 'Romantic', space: 'Garden', province: 'dn' },
        { id: 505, title: "Serenade Evening", price: "200.000đ", thumbnail: null, start_date: '2024-07-24T20:00:00', genre: 'R&B', mood: 'Romantic', space: 'Rooftop', province: 'hcm' },
      ]
    }
  ]
}

export const USER_DATA = {
  // Mảng ID các show mà user này đã mua vé
  // VD: 1, 2, 101 (2026 - Sắp diễn ra), 401, 402 (2024 - Đã kết thúc)
  ownedTicketIds: [1, 2, 6, 101, 401, 402, 501],
  
  // Mảng ID các show mà user này đã thêm vào Wishlist
  wishlistIds: [3, 4, 201, 301, 405]
}

// ⭐ DỮ LIỆU PHÒNG TRÀ
export const LOUNGES_DATA = [
  {
    id: '1',
    name: 'Music Lounge Jazz',
    tags: ['Acoustic', 'Jazz', 'Chill', 'Riêng tư'],
    images: [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2670&auto=format&fit=crop", // Ảnh 1
      "https://images.unsplash.com/photo-1540039155733-d74443653133?q=80&w=2667&auto=format&fit=crop", // Ảnh 2
      "https://images.unsplash.com/photo-1571266028243-d220c6a8a1d5?q=80&w=2667&auto=format&fit=crop"  // Ảnh 3
    ],
    description: `Music Lounge Jazz là không gian âm nhạc dành riêng cho những tâm hồn yêu thích sự mộc mạc và sâu lắng. 
  
Với thiết kế nội thất mang âm hưởng những quán bar Jazz cổ điển ở New Orleans, kết hợp cùng ánh sáng vàng ấm áp, chúng tôi mang đến một trải nghiệm nghe nhạc "đích thực" nhất. Phòng trà tự hào với hệ thống dàn loa vintage và sân khấu acoustic thiết kế sát khán giả, giúp bạn có thể cảm nhận từng nhịp thở của nghệ sĩ.`
  }
]

// ⭐ DATA CHO ADMIN HỆ THỐNG
export const ADMIN_ALL_SHOWS = [
  { id: 's1', title: 'Đêm Acoustic Mùa Thu', lounge: 'Music Lounge Jazz', date: '2024-11-15T20:00:00', status: 'approved', aiScore: 95, flagReason: null, eventType: 'offline', description: 'Đêm nhạc acoustic nhẹ nhàng với những ca khúc ballad quen thuộc. Phù hợp cho những ai muốn tìm một góc bình yên giữa lòng thành phố.\n\nĐồ uống đã bao gồm trong giá vé.', price: '200.000đ', address: '123 Lê Lợi, Q1, TP.HCM', poster: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2670&auto=format&fit=crop', genre: 'Acoustic', moodTags: ['Chill', 'Lãng mạn'] },
  { id: 's2', title: 'EDM Weekend Blast', lounge: 'Bass Drop Club', date: '2024-11-20T21:00:00', status: 'pending_manual', aiScore: 45, flagReason: 'Mô tả sự kiện quá ngắn, nghi ngờ thiếu thông tin', eventType: 'hybrid', description: 'Bùng nổ cuối tuần với các DJ hàng đầu. Đến để nhảy múa và giải tỏa căng thẳng.', price: '350.000đ', address: '45 Nguyễn Huệ, Q1, TP.HCM', poster: 'https://images.unsplash.com/photo-1571266028243-d220c6a76d23?q=80&w=2670&auto=format&fit=crop', genre: 'EDM', moodTags: ['Energetic', 'Party'] },
  { id: 's3', title: 'Saxophone Night', lounge: 'Sax & Wine', date: '2024-12-01T19:30:00', status: 'approved', aiScore: 88, flagReason: null, eventType: 'offline', description: 'Combo Rượu vang và Saxophone trữ tình. Một buổi tối lãng mạn dành cho các cặp đôi.', price: '500.000đ', address: '78 Tú Xương, Q3, TP.HCM', poster: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=2669&auto=format&fit=crop', genre: 'Jazz', moodTags: ['Romantic', 'Chill'] },
  { id: 's4', title: 'Indie Soul Session', lounge: 'Acoustic Corner', date: '2024-12-05T20:00:00', status: 'pending_manual', aiScore: 38, flagReason: 'Hình ảnh không rõ nét, thiếu thông tin giá vé', eventType: 'livestream', description: 'Trình diễn trực tiếp các ban nhạc Indie địa phương. Xem trực tiếp trên nền tảng Music Lounge.', price: '100.000đ', address: 'Livestream Online', poster: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?q=80&w=2674&auto=format&fit=crop', genre: 'Indie', moodTags: ['Soul', 'Chill'] },
  { id: 's5', title: 'Retro Pop Party', lounge: 'Neon Disco', date: '2024-12-10T21:00:00', status: 'rejected', aiScore: 15, flagReason: 'Phát hiện nội dung spam/tiêu đề không liên quan', eventType: 'offline', description: 'Quẩy hết mình với nhạc Pop thập niên 90.', price: '250.000đ', address: '12 Lý Tự Trọng, Q1, TP.HCM', poster: 'https://images.unsplash.com/photo-1571266028243-d220c6a76d23?q=80&w=2670&auto=format&fit=crop', genre: 'Pop', moodTags: ['Retro', 'Party'] },
  { id: 's6', title: 'Jazz Trio Live', lounge: 'Music Lounge Jazz', date: '2024-12-15T19:00:00', status: 'approved', aiScore: 92, flagReason: null, eventType: 'hybrid', description: 'Buổi biểu diễn của bộ ba Jazz tài năng. Bạn có thể đến trực tiếp hoặc xem qua livestream.', price: '300.000đ', address: '123 Lê Lợi, Q1, TP.HCM', poster: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2670&auto=format&fit=crop', genre: 'Jazz', moodTags: ['Melodic', 'Chill'] },
]

// ⭐ THÊM DATA QUẢN LÝ TÀI KHOẢN
export const ADMIN_ACCOUNTS = [
  { id: 'u1', name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', role: 'user', phone: '0909123456' },
  { id: 'u2', name: 'Quản lý Quỳnh Anh', email: 'qa.lounge@gmail.com', role: 'owner', phone: '0912345678' },
  { id: 'u3', name: 'System Admin', email: 'admin@musiclounge.vn', role: 'admin', phone: '0987654321' },
  { id: 'u4', name: 'Trần Thị B', email: 'tranb@gmail.com', role: 'user', phone: '0123456789' },
  { id: 'u5', name: 'Chủ Bass Drop', email: 'bass.drop@gmail.com', role: 'owner', phone: '0978123456' },
]

export const ADMIN_PACKAGES = [
  { 
    id: 'p1', name: 'Starter', price: '0đ', duration: 'Miễn phí', 
    features: ['Tối đa 5 shows/tháng', 'Hiển thị cơ bản trên nền tảng', 'Quản lý vé thủ công'] 
  },
  { 
    id: 'p2', name: 'Pro Lounge', price: '499.000đ', duration: 'Tháng', 
    features: ['Tối đa 20 shows/tháng', 'Đẩy lên top đề xuất', 'Thống kê doanh thu chi tiết', 'Tích hợp vé QR'] 
  },
  { 
    id: 'p3', name: 'VIP Partner', price: '1.299.000đ', duration: 'Tháng', 
    features: ['Unlimited shows', 'Banner quảng cáo trang chủ', 'Hỗ trợ CSKH 24/7', 'Tích hợp livestream'] 
  }
]

// ⭐ DATA SỔ CÁI (LEDGER)
export const ADMIN_LEDGER = [
  { id: 'FT2411150001', sender: 'Nguyễn Văn A', receiver: 'Music Lounge Jazz', bank: 'Vietcombank', date: '2024-11-15T20:05:00', purpose: 'Mua gói Package Pro Lounge', amount: 499000, fee: 5000, status: 'Thành công', note: 'Thanh toán gói tháng 11 cho phòng trà' },
  { id: 'TC241115A2B3', sender: 'Trần Thị B', receiver: 'Nghệ sĩ Lê Cường', bank: 'Techcombank', date: '2024-11-15T21:15:00', purpose: 'Donate cho nghệ sĩ yêu thích', amount: 50000, fee: 0, status: 'Thành công', note: 'Donate trong lúc xem livestream' },
  { id: 'MM241120X8Y9', sender: 'Lê Văn D', receiver: 'Bass Drop Club', bank: 'Momo', date: '2024-11-20T21:30:00', purpose: 'Mua vé show EDM Weekend Blast', amount: 350000, fee: 0, status: 'Thành công', note: 'Mua 1 vé VIP' },
  { id: 'VP241201Z5W6', sender: 'Phạm Thị E', receiver: 'Sax & Wine', bank: 'VPBank', date: '2024-12-01T19:45:00', purpose: 'Mua gói Package Starter', amount: 0, fee: 0, status: 'Thành công', note: 'Đăng ký gói miễn phí' },
  { id: 'AC241205M1N2', sender: 'Nguyễn Văn A', receiver: 'Nghệ sĩ Minh Tuyết', bank: 'ACB', date: '2024-12-05T20:30:00', purpose: 'Donate cho nghệ sĩ yêu thích', amount: 100000, fee: 0, status: 'Thành công', note: 'Donate kèm lời nhắn chúc mừng sinh nhật' },
]

export const LOUNGE_SEATING_AREAS = [
    {
        id: 1,
        name: "VIP Sofa Front Row",
        capacity: 20,
        image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=2669&auto=format&fit=crop",
        description: "Ghế sofa da êm ái, view sát sân khấu trực diện. Phục vụ nước uống riêng."
    },
    {
        id: 2,
        name: "Standard High Bar",
        capacity: 40,
        image: "https://images.unsplash.com/photo-1574096079513-d8259312b785?q=80&w=2574&auto=format&fit=crop",
        description: "Ghế bar cao, phù hợp cho nhóm bạn. View nhìn bao quát toàn bộ phòng trà."
    },
    {
        id: 3,
        name: "Balcony Chill Zone",
        capacity: 15,
        image: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=2670&auto=format&fit=crop",
        description: "Khu vực ban công riêng tư, ghế đệm thoải mái, không gian phù hợp tâm sự."
    }
]