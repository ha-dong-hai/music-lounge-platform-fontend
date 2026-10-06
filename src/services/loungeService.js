import api from '../config/axios';

export const loungeService = {
  // Common endpoints
  getAll: (params) => api.get('/api/v1/lounges', { params }).then(res => res.data),
  getDetail: (id) => api.get(`/api/v1/lounges/${id}`).then(res => res.data),
  getZones: (id, params) => api.get(`/api/v1/lounges/${id}/zones`, { params }).then(res => res.data),

  // Owner endpoints
  getMine: (params) => api.get('/api/v1/lounges', { params: { ...params, mine: true } }).then(res => res.data),
  create: (data) => api.post('/api/v1/lounges', data).then(res => res.data),
  update: (id, data) => api.put(`/api/v1/lounges/${id}`, data).then(res => res.data),
  
  // Lounge Settings
  setCoverImage: (id, imageUrl) => api.put(`/api/v1/lounges/${id}/image`, { imageUrl }).then(res => res.data),
  setBusinessLicense: (id, documentUrl) => api.put(`/api/v1/lounges/${id}/business-license`, { documentUrl }).then(res => res.data),
  setModel3D: (id, modelUrl) => api.put(`/api/v1/lounges/${id}/model-3d`, { modelUrl }).then(res => res.data),
  setAreaLayoutImage: (id, imageUrl) => api.put(`/api/v1/lounges/${id}/area-layout-image`, { imageUrl }).then(res => res.data),

  // Staffing
  getStaff: (id) => api.get(`/api/v1/lounges/${id}/staff`).then(res => res.data),
  lookupStaff: (email) => api.get('/api/v1/lounges/staff/lookup', { params: { email } }).then(res => res.data),
  assignStaff: (id, userId) => api.post(`/api/v1/lounges/${id}/staff`, { userId }).then(res => res.data),
  deactivateStaff: (id, staffId) => api.delete(`/api/v1/lounges/${id}/staff/${staffId}`).then(res => res.data),

  // Zones Management
  createZone: (id, data) => api.post(`/api/v1/lounges/${id}/zones`, data).then(res => res.data),
  updateZone: (id, zoneId, data) => api.put(`/api/v1/lounges/${id}/zones/${zoneId}`, data).then(res => res.data),
  deactivateZone: (id, zoneId) => api.delete(`/api/v1/lounges/${id}/zones/${zoneId}`).then(res => res.data),
  setZoneLayout2D: (id, zoneId, data) => api.put(`/api/v1/lounges/${id}/zones/${zoneId}/layout-2d`, data).then(res => res.data),
  setZoneLayout3D: (id, zoneId, data) => api.put(`/api/v1/lounges/${id}/zones/${zoneId}/layout-3d`, data).then(res => res.data),

  // Delete lounge
  delete: (id) => api.delete(`/api/v1/lounges/${id}`).then(res => res.data),

  // Gallery
  addGalleryImage: (id, { imageUrl, caption }) => api.post(`/api/v1/lounges/${id}/gallery`, { imageUrl, caption }).then(res => res.data),
  removeGalleryImage: (id, imageId) => api.delete(`/api/v1/lounges/${id}/gallery/${imageId}`).then(res => res.data),

  // Virtual Tour
  getTour: (id) => api.get(`/api/v1/lounges/${id}/tour`).then(res => res.data),
  addTourScene: (id, { imageUrl, name }) => api.post(`/api/v1/lounges/${id}/tour/scenes`, { imageUrl, name }).then(res => res.data),
  stitchTourScenes: (id, { sourceImageUrls, name }) => api.post(`/api/v1/lounges/${id}/tour/scenes/stitch`, { sourceImageUrls, name }).then(res => res.data),
  getStitchStatus: (id, attemptId) => api.get(`/api/v1/lounges/${id}/tour/scenes/stitch/${attemptId}`).then(res => res.data),
  deleteTourScene: (id, sceneId) => api.delete(`/api/v1/lounges/${id}/tour/scenes/${sceneId}`).then(res => res.data),
  updateScenePosition: (id, sceneId, { x, y }) => api.put(`/api/v1/lounges/${id}/tour/scenes/${sceneId}/position`, { x, y }).then(res => res.data),
  addHotspot: (id, sceneId, data) => api.post(`/api/v1/lounges/${id}/tour/scenes/${sceneId}/hotspots`, data).then(res => res.data),
  deleteHotspot: (id, hotspotId) => api.delete(`/api/v1/lounges/${id}/tour/hotspots/${hotspotId}`).then(res => res.data),

  // Custom Criteria
  getCustomCriteria: (id) => api.get(`/api/v1/lounges/${id}/custom-criteria`).then(res => res.data),
  createCustomCriteria: (id, data) => api.post(`/api/v1/lounges/${id}/custom-criteria`, data).then(res => res.data),
  updateCustomCriteria: (id, criteriaId, data) => api.put(`/api/v1/lounges/${id}/custom-criteria/${criteriaId}`, data).then(res => res.data),
};
