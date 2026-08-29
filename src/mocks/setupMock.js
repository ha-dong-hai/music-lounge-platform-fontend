// ─── Axios Mock Adapter Setup ───
// Intercepts all API requests and returns mock data.
// Activated only when ENABLE_MOCK is true.

import MockAdapter from 'axios-mock-adapter';
import {
  MOCK_USERS,
  MOCK_LOUNGES,
  MOCK_SHOWS,
  MOCK_TICKETS,
  MOCK_PACKAGES,
  MOCK_MY_SUBSCRIPTION,
  MOCK_REFUNDS,
  MOCK_LIVESTREAMS,
  MOCK_CREDENTIALS,
  MOCK_CHAT_MESSAGES,
  MOCK_ZONES,
  MOCK_STAFF,
  MOCK_WISHLIST_ITEMS,
  MOCK_FILTER_OPTIONS,
  MOCK_GENRES,
} from './mockData';

// Generate a fake JWT (not real, just for the auth store)
function fakeToken(user) {
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    btoa(JSON.stringify({ sub: user.id, role: user.role, email: user.email })) +
    '.mock-signature';
}

function ok(data) {
  return [200, { success: true, data, message: null }];
}

function ok204() {
  return [200, { success: true, data: null, message: null }];
}

function paginated(items, page = 1, pageSize = 10) {
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return [200, {
    success: true,
    data: {
      items: paged,
      page,
      pageSize,
      totalCount: items.length,
    },
    message: null,
  }];
}

function notFound(entity, id) {
  return [404, { success: false, data: null, message: `${entity} with id '${id}' was not found.` }];
}

// Mutable state for interactive demo
let mutableRefunds = [...MOCK_REFUNDS];
let mutableUsers = MOCK_USERS.map(u => ({ ...u }));
let mutableTickets = [...MOCK_TICKETS];
let mutableShows = MOCK_SHOWS.map(s => ({ ...s }));
let mutableLivestreams = MOCK_LIVESTREAMS.map(l => ({ ...l }));
let wishlistedShowIds = new Set(MOCK_WISHLIST_ITEMS.map(s => s.id));
let holdCounter = 1000;

export default function setupMock(axiosInstance) {
  const mock = new MockAdapter(axiosInstance, { delayResponse: 300, onNoMatch: 'passthrough' });

  // ╔═══════════════════════════════════════╗
  // ║             AUTH ENDPOINTS            ║
  // ╚═══════════════════════════════════════╝

  // POST /api/v1/auth/login
  mock.onPost('/api/v1/auth/login').reply((config) => {
    const { email, password } = JSON.parse(config.data);
    const user = MOCK_USERS.find(u => u.email === email);
    if (!user || password !== 'Demo@123') {
      return [401, { success: false, data: null, message: 'Email hoặc mật khẩu không đúng.' }];
    }
    return ok({
      id: user.id,
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      loungeId: user.loungeId,
      avatarUrl: user.avatarUrl,
      accessToken: fakeToken(user),
      expiresAtUtc: new Date(Date.now() + 86400000).toISOString(), // +24h
    });
  });

  // POST /api/v1/auth/register
  mock.onPost('/api/v1/auth/register').reply(() => {
    return ok({ message: 'Registration successful. Check your email for verification code.' });
  });

  // POST /api/v1/auth/verify-email
  mock.onPost('/api/v1/auth/verify-email').reply(() => ok204());

  // POST /api/v1/auth/resend-verification-code
  mock.onPost('/api/v1/auth/resend-verification-code').reply(() => ok204());

  // POST /api/v1/auth/google
  mock.onPost('/api/v1/auth/google').reply(() => {
    const user = MOCK_USERS[0]; // default to audience
    return ok({
      id: user.id, userId: user.id, email: user.email, fullName: user.fullName,
      role: user.role, loungeId: user.loungeId, avatarUrl: user.avatarUrl,
      accessToken: fakeToken(user),
      expiresAtUtc: new Date(Date.now() + 86400000).toISOString(),
    });
  });

  // GET /api/v1/me
  mock.onGet('/api/v1/me').reply((config) => {
    // Try to figure out the user from token
    const authHeader = config.headers?.Authorization || '';
    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user = MOCK_USERS.find(u => u.id === payload.sub);
      if (user) return ok(user);
    } catch { /* ignore */ }
    return ok(MOCK_USERS[0]);
  });

  // PUT /api/v1/me/profile
  mock.onPut('/api/v1/me/profile').reply(() => ok204());

  // PUT /api/v1/me/preferences
  mock.onPut('/api/v1/me/preferences').reply(() => ok204());

  // DELETE /api/v1/me
  mock.onDelete('/api/v1/me').reply(() => ok204());

  // POST /api/v1/auth/forgot-password
  mock.onPost('/api/v1/auth/forgot-password').reply(() => ok204());

  // POST /api/v1/auth/reset-password
  mock.onPost('/api/v1/auth/reset-password').reply(() => ok204());

  // ╔═══════════════════════════════════════╗
  // ║            SHOWS ENDPOINTS            ║
  // ╚═══════════════════════════════════════╝

  // GET /api/v1/lounge-shows (published)
  mock.onGet('/api/v1/lounge-shows').reply((config) => {
    const params = config.params || {};
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 10;
    const publishedShows = mutableShows.filter(s => s.status === 'Published');
    return paginated(publishedShows, page, pageSize);
  });

  // GET /api/v1/lounge-shows/trending
  mock.onGet('/api/v1/lounge-shows/trending').reply((config) => {
    const limit = Number(config.params?.limit) || 8;
    const publishedShows = mutableShows.filter(s => s.status === 'Published');
    return ok(publishedShows.slice(0, limit));
  });

  // GET /api/v1/lounge-shows/search
  mock.onGet('/api/v1/lounge-shows/search').reply((config) => {
    const params = config.params || {};
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 10;
    let results = mutableShows.filter(s => s.status === 'Published');

    if (params.q) {
      const q = params.q.toLowerCase();
      results = results.filter(s => s.name.toLowerCase().includes(q) || s.loungeName?.toLowerCase().includes(q));
    }
    if (params.genreId) {
      results = results.filter(s => s.genres.some(g => g.id === Number(params.genreId)));
    }
    if (params.city) {
      results = results.filter(s => s.loungeCity === params.city);
    }
    if (params.format) {
      results = results.filter(s => s.format === params.format);
    }

    return paginated(results, page, pageSize);
  });

  // GET /api/v1/lounge-shows/suggestions
  mock.onGet('/api/v1/lounge-shows/suggestions').reply((config) => {
    const q = (config.params?.q || '').toLowerCase();
    const publishedShows = mutableShows.filter(s => s.status === 'Published');
    const matches = publishedShows
      .filter(s => s.name.toLowerCase().includes(q))
      .slice(0, config.params?.limit || 8)
      .map(s => ({ id: s.id, name: s.name, loungeName: s.loungeName }));
    return ok(matches);
  });

  // GET /api/v1/lounge-shows/filter-options
  mock.onGet('/api/v1/lounge-shows/filter-options').reply(() => ok(MOCK_FILTER_OPTIONS));

  // GET /api/v1/lounge-shows/by-lounge/:loungeId
  mock.onGet(/\/api\/v1\/lounge-shows\/by-lounge\/\d+/).reply((config) => {
    const loungeId = Number(config.url.split('/by-lounge/')[1].split('?')[0]);
    const params = config.params || {};
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 10;
    const loungeShows = mutableShows.filter(s => s.loungeId === loungeId);
    return paginated(loungeShows, page, pageSize);
  });

  // GET /api/v1/lounge-shows/:id (detail)
  mock.onGet(/\/api\/v1\/lounge-shows\/\d+$/).reply((config) => {
    const id = Number(config.url.split('/lounge-shows/')[1]);
    const show = mutableShows.find(s => s.id === id);
    if (!show) return notFound('LoungeShow', id);
    return ok(show);
  });

  // GET /api/v1/lounge-shows/:id/seating-map
  mock.onGet(/\/api\/v1\/lounge-shows\/\d+\/seating-map/).reply(() => {
    return ok({ zones: MOCK_ZONES, seats: [] });
  });

  // GET /api/v1/lounge-shows/:id/orders
  mock.onGet(/\/api\/v1\/lounge-shows\/\d+\/orders/).reply((config) => {
    const params = config.params || {};
    const page = Number(params.page) || 1;
    return paginated([], page, 10); // empty orders for demo
  });

  // POST /api/v1/lounge-shows (create)
  mock.onPost('/api/v1/lounge-shows').reply((config) => {
    const data = JSON.parse(config.data);
    const newId = Math.max(...mutableShows.map(s => s.id)) + 1;
    const lounge = MOCK_LOUNGES.find(l => l.id === data.loungeId) || MOCK_LOUNGES[0];
    const newShow = {
      id: newId,
      name: data.name || 'New Show',
      description: data.description || '',
      coverImageUrl: null,
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      format: data.format || 'Offline',
      status: 'Draft',
      isOngoing: false,
      livestreamId: null,
      loungeId: lounge.id,
      lounge: { id: lounge.id, name: lounge.name, primaryImageUrl: lounge.primaryImageUrl, street: lounge.street, ward: lounge.ward, district: lounge.district, city: lounge.city, fullAddress: lounge.fullAddress },
      loungeName: lounge.name,
      loungeCity: lounge.city,
      performers: [],
      ticketTiers: [],
      genres: [],
      ratings: { averageScore: 0, totalCount: 0 },
      isWishlisted: false, userHasTicket: false, userHasRated: false,
      legalApprovalReference: null, legalApprovalConfirmed: false, vcpmcRoyaltyReference: null,
      playbackMode: 'Live',
      minPrice: null, maxPrice: null, offlineQuota: data.offlineQuota || 100, ticketsSold: 0,
    };
    mutableShows.push(newShow);
    return [201, { success: true, data: newShow, message: null }];
  });

  // PUT /api/v1/lounge-shows/:id
  mock.onPut(/\/api\/v1\/lounge-shows\/\d+$/).reply((config) => {
    const id = Number(config.url.split('/lounge-shows/')[1]);
    const data = JSON.parse(config.data);
    const show = mutableShows.find(s => s.id === id);
    if (!show) return notFound('LoungeShow', id);
    Object.assign(show, data);
    return ok(show);
  });

  // POST /api/v1/lounge-shows/:id/publish
  mock.onPost(/\/api\/v1\/lounge-shows\/\d+\/publish/).reply((config) => {
    const id = Number(config.url.split('/lounge-shows/')[1].split('/')[0]);
    const show = mutableShows.find(s => s.id === id);
    if (show) show.status = 'Published';
    return ok204();
  });

  // POST /api/v1/lounge-shows/:id/cancel
  mock.onPost(/\/api\/v1\/lounge-shows\/\d+\/cancel/).reply((config) => {
    const id = Number(config.url.split('/lounge-shows/')[1].split('/')[0]);
    const show = mutableShows.find(s => s.id === id);
    if (show) show.status = 'Cancelled';
    return ok204();
  });

  // POST /api/v1/lounge-shows/:id/start
  mock.onPost(/\/api\/v1\/lounge-shows\/\d+\/start/).reply((config) => {
    const id = Number(config.url.split('/lounge-shows/')[1].split('/')[0]);
    const show = mutableShows.find(s => s.id === id);
    if (show) { show.status = 'Ongoing'; show.isOngoing = true; }
    return ok204();
  });

  // POST /api/v1/lounge-shows/:id/end
  mock.onPost(/\/api\/v1\/lounge-shows\/\d+\/end/).reply((config) => {
    const id = Number(config.url.split('/lounge-shows/')[1].split('/')[0]);
    const show = mutableShows.find(s => s.id === id);
    if (show) { show.status = 'Ended'; show.isOngoing = false; }
    return ok204();
  });

  // PUT /api/v1/lounge-shows/:id/cover-image
  mock.onPut(/\/api\/v1\/lounge-shows\/\d+\/cover-image/).reply(() => ok204());

  // POST /api/v1/lounge-shows/:id/reschedule
  mock.onPost(/\/api\/v1\/lounge-shows\/\d+\/reschedule/).reply(() => ok204());

  // POST /api/v1/lounge-shows/:id/change-format
  mock.onPost(/\/api\/v1\/lounge-shows\/\d+\/change-format/).reply(() => ok204());

  // PUT /api/v1/lounge-shows/:id/playback-mode
  mock.onPut(/\/api\/v1\/lounge-shows\/\d+\/playback-mode/).reply(() => ok204());

  // PUT /api/v1/lounge-shows/:id/legal-approval
  mock.onPut(/\/api\/v1\/lounge-shows\/\d+\/legal-approval/).reply(() => ok204());

  // PUT /api/v1/lounge-shows/:id/vcpmc-royalty
  mock.onPut(/\/api\/v1\/lounge-shows\/\d+\/vcpmc-royalty/).reply(() => ok204());

  // POST /api/v1/lounge-shows/:id/rate
  mock.onPost(/\/api\/v1\/lounge-shows\/\d+\/rate/).reply(() => ok204());

  // ╔═══════════════════════════════════════╗
  // ║           LOUNGES ENDPOINTS           ║
  // ╚═══════════════════════════════════════╝

  // GET /api/v1/lounges
  mock.onGet('/api/v1/lounges').reply((config) => {
    const params = config.params || {};
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 10;

    let lounges = MOCK_LOUNGES;
    if (params.mine === true || params.mine === 'true') {
      // Filter by current user's owner lounges — for demo, return owner-001's lounges
      lounges = MOCK_LOUNGES.filter(l => l.ownerId === 'u-owner-001');
    }

    return paginated(lounges, page, pageSize);
  });

  // GET /api/v1/lounges/:id
  mock.onGet(/\/api\/v1\/lounges\/\d+$/).reply((config) => {
    const id = Number(config.url.split('/lounges/')[1]);
    const lounge = MOCK_LOUNGES.find(l => l.id === id);
    if (!lounge) return notFound('Lounge', id);
    return ok(lounge);
  });

  // POST /api/v1/lounges (create)
  mock.onPost('/api/v1/lounges').reply((config) => {
    const data = JSON.parse(config.data);
    const newLounge = { id: MOCK_LOUNGES.length + 1, ...data, ownerId: 'u-owner-001', isActive: true, totalShows: 0 };
    return [201, { success: true, data: newLounge, message: null }];
  });

  // PUT /api/v1/lounges/:id
  mock.onPut(/\/api\/v1\/lounges\/\d+$/).reply(() => ok204());

  // PUT /api/v1/lounges/:id/image
  mock.onPut(/\/api\/v1\/lounges\/\d+\/image/).reply(() => ok204());

  // PUT /api/v1/lounges/:id/business-license
  mock.onPut(/\/api\/v1\/lounges\/\d+\/business-license/).reply(() => ok204());

  // PUT /api/v1/lounges/:id/model-3d
  mock.onPut(/\/api\/v1\/lounges\/\d+\/model-3d/).reply(() => ok204());

  // PUT /api/v1/lounges/:id/area-layout-image
  mock.onPut(/\/api\/v1\/lounges\/\d+\/area-layout-image/).reply(() => ok204());

  // GET /api/v1/lounges/:id/zones
  mock.onGet(/\/api\/v1\/lounges\/\d+\/zones/).reply(() => {
    return paginated(MOCK_ZONES, 1, 50);
  });

  // POST /api/v1/lounges/:id/zones
  mock.onPost(/\/api\/v1\/lounges\/\d+\/zones/).reply((config) => {
    const data = JSON.parse(config.data);
    return [201, { success: true, data: { id: Date.now(), ...data, isActive: true }, message: null }];
  });

  // PUT /api/v1/lounges/:id/zones/:zoneId
  mock.onPut(/\/api\/v1\/lounges\/\d+\/zones\/\d+/).reply(() => ok204());

  // DELETE /api/v1/lounges/:id/zones/:zoneId
  mock.onDelete(/\/api\/v1\/lounges\/\d+\/zones\/\d+/).reply(() => ok204());

  // PUT /api/v1/lounges/:id/zones/:zoneId/layout-2d
  mock.onPut(/\/api\/v1\/lounges\/\d+\/zones\/\d+\/layout-2d/).reply(() => ok204());

  // PUT /api/v1/lounges/:id/zones/:zoneId/layout-3d
  mock.onPut(/\/api\/v1\/lounges\/\d+\/zones\/\d+\/layout-3d/).reply(() => ok204());

  // GET /api/v1/lounges/:id/staff
  mock.onGet(/\/api\/v1\/lounges\/\d+\/staff/).reply(() => ok(MOCK_STAFF));

  // GET /api/v1/lounges/staff/lookup
  mock.onGet('/api/v1/lounges/staff/lookup').reply(() => ok({ id: 'u-staff-001', fullName: 'Võ Minh Tuấn', email: 'staff@demo.com' }));

  // POST /api/v1/lounges/:id/staff
  mock.onPost(/\/api\/v1\/lounges\/\d+\/staff/).reply(() => ok204());

  // DELETE /api/v1/lounges/:id/staff/:staffId
  mock.onDelete(/\/api\/v1\/lounges\/\d+\/staff\//).reply(() => ok204());

  // ╔═══════════════════════════════════════╗
  // ║          TICKET ENDPOINTS             ║
  // ╚═══════════════════════════════════════╝

  // POST /api/v1/tickets/holds
  mock.onPost('/api/v1/tickets/holds').reply((config) => {
    const { priceId, quantity } = JSON.parse(config.data);
    holdCounter++;
    return ok({
      holdId: `hold-${holdCounter}`,
      priceId,
      quantity,
      expiresAt: new Date(Date.now() + 600000).toISOString(), // 10 min
      unitPrice: 350000,
      totalAmount: 350000 * quantity,
    });
  });

  // POST /api/v1/tickets/purchase
  mock.onPost('/api/v1/tickets/purchase').reply((config) => {
    const { holdId } = JSON.parse(config.data);
    return ok({
      paymentUrl: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?demo=true&holdId=${holdId}`,
    });
  });

  // DELETE /api/v1/tickets/holds/:holdId
  mock.onDelete(/\/api\/v1\/tickets\/holds\//).reply(() => ok204());

  // GET /api/v1/tickets/my
  mock.onGet('/api/v1/tickets/my').reply((config) => {
    const params = config.params || {};
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 10;
    return paginated(mutableTickets, page, pageSize);
  });

  // GET /api/v1/tickets/:id
  mock.onGet(/\/api\/v1\/tickets\/ticket-/).reply((config) => {
    const id = config.url.split('/tickets/')[1];
    const ticket = mutableTickets.find(t => t.id === id);
    if (!ticket) return notFound('Ticket', id);
    return ok(ticket);
  });

  // POST /api/v1/tickets/:id/cancel
  mock.onPost(/\/api\/v1\/tickets\/ticket-.*\/cancel/).reply((config) => {
    const id = config.url.split('/tickets/')[1].split('/cancel')[0];
    const ticket = mutableTickets.find(t => t.id === id);
    if (ticket) ticket.status = 'Cancelled';
    return ok204();
  });

  // POST /api/v1/tickets/:id/transfer
  mock.onPost(/\/api\/v1\/tickets\/ticket-.*\/transfer$/).reply(() => ok204());

  // POST /api/v1/tickets/:id/transfer/accept
  mock.onPost(/\/api\/v1\/tickets\/ticket-.*\/transfer\/accept/).reply(() => ok204());

  // POST /api/v1/tickets/:id/transfer/cancel
  mock.onPost(/\/api\/v1\/tickets\/ticket-.*\/transfer\/cancel/).reply(() => ok204());

  // GET /api/v1/tickets/incoming-transfers
  mock.onGet('/api/v1/tickets/incoming-transfers').reply(() => ok([]));

  // ╔═══════════════════════════════════════╗
  // ║        TICKET TIER ENDPOINTS          ║
  // ╚═══════════════════════════════════════╝

  // GET /ticket-tiers
  mock.onGet('/ticket-tiers').reply((config) => {
    const showId = Number(config.params?.showId);
    const show = mutableShows.find(s => s.id === showId);
    return [200, { success: true, data: show?.ticketTiers || [] }];
  });

  // POST /ticket-tiers
  mock.onPost('/ticket-tiers').reply((config) => {
    const data = JSON.parse(config.data);
    const newTier = { id: Date.now(), ...data };
    // Add to the corresponding show
    const show = mutableShows.find(s => s.id === data.showId);
    if (show) {
      show.ticketTiers = [...(show.ticketTiers || []), newTier];
    }
    return [201, { success: true, data: newTier }];
  });

  // PUT /ticket-tiers/:id
  mock.onPut(/\/ticket-tiers\/\d+/).reply(() => ok204());

  // ╔═══════════════════════════════════════╗
  // ║          ADMIN ENDPOINTS              ║
  // ╚═══════════════════════════════════════╝

  // GET /admin/users
  mock.onGet('/admin/users').reply((config) => {
    const params = config.params || {};
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 15;

    let filtered = [...mutableUsers];
    if (params.searchText) {
      const q = params.searchText.toLowerCase();
      filtered = filtered.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (params.role) {
      filtered = filtered.filter(u => u.role === params.role);
    }
    if (params.isActive !== undefined && params.isActive !== '') {
      const active = params.isActive === true || params.isActive === 'true';
      filtered = filtered.filter(u => u.isActive === active);
    }

    return paginated(filtered, page, pageSize);
  });

  // GET /admin/users/:id
  mock.onGet(/\/admin\/users\//).reply((config) => {
    const id = config.url.split('/users/')[1];
    const user = mutableUsers.find(u => u.id === id);
    if (!user) return notFound('User', id);
    return ok(user);
  });

  // POST /admin/users/:id/deactivate
  mock.onPost(/\/admin\/users\/.*\/deactivate/).reply((config) => {
    const id = config.url.split('/users/')[1].split('/deactivate')[0];
    const user = mutableUsers.find(u => u.id === id);
    if (user) user.isActive = false;
    return ok204();
  });

  // POST /admin/users/:id/reactivate
  mock.onPost(/\/admin\/users\/.*\/reactivate/).reply((config) => {
    const id = config.url.split('/users/')[1].split('/reactivate')[0];
    const user = mutableUsers.find(u => u.id === id);
    if (user) user.isActive = true;
    return ok204();
  });

  // GET /admin/refund-requests
  mock.onGet('/admin/refund-requests').reply((config) => {
    const params = config.params || {};
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 15;
    const pending = mutableRefunds.filter(r => r.status === 'Pending');
    return paginated(pending, page, pageSize);
  });

  // POST /admin/refund-requests/:id/process
  mock.onPost(/\/admin\/refund-requests\/.*\/process/).reply((config) => {
    const id = config.url.split('/refund-requests/')[1].split('/process')[0];
    const { decision } = JSON.parse(config.data);
    const refund = mutableRefunds.find(r => r.id === id);
    if (refund) refund.status = decision === 'Approve' ? 'Approved' : 'Rejected';
    return ok204();
  });

  // GET /admin/ledger/integrity-check
  mock.onGet('/admin/ledger/integrity-check').reply(() => {
    // Return clean ledger for demo
    return ok([]);
  });

  // POST /admin/jobs/:jobId/trigger
  mock.onPost(/\/admin\/jobs\/.*\/trigger/).reply(() => ok204());

  // ╔═══════════════════════════════════════╗
  // ║       SUBSCRIPTION ENDPOINTS          ║
  // ╚═══════════════════════════════════════╝

  // GET /api/v1/subscriptions/packages
  mock.onGet('/api/v1/subscriptions/packages').reply(() => ok(MOCK_PACKAGES));

  // GET /api/v1/subscriptions/my
  mock.onGet('/api/v1/subscriptions/my').reply(() => ok(MOCK_MY_SUBSCRIPTION));

  // POST /api/v1/subscriptions/subscribe
  mock.onPost('/api/v1/subscriptions/subscribe').reply(() => {
    return ok({ paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?demo=true' });
  });

  // ╔═══════════════════════════════════════╗
  // ║       LIVESTREAM ENDPOINTS            ║
  // ╚═══════════════════════════════════════╝

  // GET /api/v1/livestreams/:id
  mock.onGet(/\/api\/v1\/livestreams\/\d+$/).reply((config) => {
    const id = Number(config.url.split('/livestreams/')[1]);
    const ls = mutableLivestreams.find(l => l.id === id);
    if (!ls) return notFound('Livestream', id);
    return ok(ls);
  });

  // POST /api/v1/livestreams (create)
  mock.onPost('/api/v1/livestreams').reply((config) => {
    const { showId } = JSON.parse(config.data);
    const newId = mutableLivestreams.length + 10;
    const newLs = { id: newId, loungeShowId: showId, status: 'Scheduled', viewerCount: 0, startedAt: null, endedAt: null, playbackUrl: null };
    mutableLivestreams.push(newLs);
    const show = mutableShows.find(s => s.id === showId);
    if (show) show.livestreamId = newId;
    return [201, { success: true, data: newLs, message: null }];
  });

  // POST /api/v1/livestreams/:id/start
  mock.onPost(/\/api\/v1\/livestreams\/\d+\/start/).reply((config) => {
    const id = Number(config.url.split('/livestreams/')[1].split('/start')[0]);
    const ls = mutableLivestreams.find(l => l.id === id);
    if (ls) {
      ls.status = 'Live';
      ls.startedAt = new Date().toISOString();
      ls.viewerCount = Math.floor(Math.random() * 50) + 10;
      // Also update the show
      const show = mutableShows.find(s => s.livestreamId === id);
      if (show) { show.status = 'Ongoing'; show.isOngoing = true; }
    }
    return ok204();
  });

  // POST /api/v1/livestreams/:id/end
  mock.onPost(/\/api\/v1\/livestreams\/\d+\/end/).reply((config) => {
    const id = Number(config.url.split('/livestreams/')[1].split('/end')[0]);
    const ls = mutableLivestreams.find(l => l.id === id);
    if (ls) {
      ls.status = 'Ended';
      ls.endedAt = new Date().toISOString();
      ls.viewerCount = 0;
      const show = mutableShows.find(s => s.livestreamId === id);
      if (show) { show.status = 'Ended'; show.isOngoing = false; }
    }
    return ok204();
  });

  // GET /api/v1/livestreams/:id/credentials
  mock.onGet(/\/api\/v1\/livestreams\/\d+\/credentials/).reply(() => ok(MOCK_CREDENTIALS));

  // GET /api/v1/livestreams/:id/chat
  mock.onGet(/\/api\/v1\/livestreams\/\d+\/chat/).reply(() => {
    return ok({ items: [...MOCK_CHAT_MESSAGES].reverse(), page: 1, pageSize: 50, totalCount: MOCK_CHAT_MESSAGES.length });
  });

  // ╔═══════════════════════════════════════╗
  // ║        DONATION ENDPOINTS             ║
  // ╚═══════════════════════════════════════╝

  // POST /api/v1/donations
  mock.onPost('/api/v1/donations').reply(() => {
    return ok({ paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?demo=true&type=donation' });
  });

  // ╔═══════════════════════════════════════╗
  // ║        WISHLIST ENDPOINTS             ║
  // ╚═══════════════════════════════════════╝

  // GET /api/v1/wishlist
  mock.onGet('/api/v1/wishlist').reply((config) => {
    const params = config.params || {};
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 10;
    const items = mutableShows.filter(s => wishlistedShowIds.has(s.id));
    return paginated(items, page, pageSize);
  });

  // POST /api/v1/wishlist/:showId
  mock.onPost(/\/api\/v1\/wishlist\/\d+/).reply((config) => {
    const showId = Number(config.url.split('/wishlist/')[1]);
    wishlistedShowIds.add(showId);
    return ok204();
  });

  // DELETE /api/v1/wishlist/:showId
  mock.onDelete(/\/api\/v1\/wishlist\/\d+/).reply((config) => {
    const showId = Number(config.url.split('/wishlist/')[1]);
    wishlistedShowIds.delete(showId);
    return ok204();
  });

  console.log('%c[MOCK MODE] All API requests are being intercepted by mock adapter.', 'color: #fbbf24; font-weight: bold; font-size: 14px;');
  return mock;
}
