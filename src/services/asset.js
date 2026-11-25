import api, { apiUtils } from './api'

const assetService = {
  // Get all assets with pagination and filtering
  getAssets: (params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return api.get(`/assets${queryString ? `?${queryString}` : ''}`)
  },

  // Get assets assigned to current user
  getMyAssets: (params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return api.get(`/assets/my-assets${queryString ? `?${queryString}` : ''}`)
  },

  // Get assets for a specific user (for coordinators to create requests on behalf)
  getUserAssets: (userId) => {
    return api.get(`/assets/user/${userId}/assets`)
  },

  // Get asset statistics for dashboard
  getAssetStatistics: () => {
    return api.get('/assets/statistics')
  },

  // Get single asset by ID
  getAsset: (id) => {
    return api.get(`/assets/${id}`)
  },

  // Get movement history for a specific asset
getAssetMovementHistory: (assetId, params = {}) => {
  const queryString = apiUtils.buildQueryString(params);

  return api.get(
    `/assets/${assetId}/movements${queryString ? `?${queryString}` : ''}`
  );
},

  // Create new asset
  createAsset: (data) => {
    return api.post('/assets', data)
  },

  // Update asset
  updateAsset: (id, data) => {
    return api.put(`/assets/${id}`, data)
  },

  // Delete asset (soft delete)
  deleteAsset: (id) => {
    return api.delete(`/assets/${id}`)
  },

  // Assign asset to user
  assignAsset: (id, data) => {
    return api.post(`/assets/${id}/assign`, data)
  },

  // Unassign asset from user
  unassignAsset: (id) => {
    return api.post(`/assets/${id}/unassign`)
  },

  // Get assets dropdown for forms
  getAssetsDropdown: (params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return api.get(`/assets/dropdown${queryString ? `?${queryString}` : ''}`)
  },

  // Export assets
  exportAssets: (params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return api.get(`/assets/export${queryString ? `?${queryString}` : ''}`, {
      responseType: 'blob'
    })
  },

  // Get deleted assets
  getDeletedAssets: (params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return api.get(`/assets/deleted${queryString ? `?${queryString}` : ''}`)
  },

  // Restore deleted asset
  restoreAsset: (id) => {
    return api.post(`/assets/${id}/restore`)
  },

  // ============================================================================
  // Software Management APIs
  // ============================================================================

  // Get all software installations for an asset
  getAssetSoftware: (assetId) => {
    return api.get(`/assets/${assetId}/software`)
  },

  // ============================================================================
  // Component Management APIs
  // ============================================================================

  // Get all components installed in an asset
  getAssetComponents: (assetId, params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return api.get(`/assets/${assetId}/components${queryString ? `?${queryString}` : ''}`)
  },

  // Get asset hierarchy tree (recursive)
  getAssetHierarchy: (assetId) => {
    return api.get(`/assets/${assetId}/components/hierarchy`)
  },

  // Install a component into an asset
  installComponent: (parentAssetId, data) => {
    return api.post(`/assets/${parentAssetId}/components`, data)
  },

  // Remove a component from an asset
  removeComponent: (parentAssetId, componentId, data = {}) => {
    return api.delete(`/assets/${parentAssetId}/components/${componentId}`, { data })
  },

  // Reinstall a previously removed component
  reinstallComponent: (parentAssetId, componentId, data) => {
    return api.post(`/assets/${parentAssetId}/components/${componentId}/reinstall`, data)
  },

  // ============================================================================
  // Lifecycle Management APIs
  // ============================================================================

  // Get assets with lifecycle alerts (warranty, EOL, EOS)
  getLifecycleAssets: (params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return api.get(`/assets/lifecycle${queryString ? `?${queryString}` : ''}`)
  },

  // Get lifecycle statistics summary
  getLifecycleStatistics: () => {
    return api.get('/assets/lifecycle/statistics')
  },

  // Renew/extend warranty for an asset
  renewWarranty: (assetId, data) => {
    return api.post(`/assets/${assetId}/lifecycle/renew`, data)
  },

  // Dispose an asset
  disposeAsset: (assetId, data) => {
    return api.post(`/assets/${assetId}/lifecycle/dispose`, data)
  },

  // ============================================================================
  // Label Generation APIs
  // ============================================================================

  // Get label preview data for an asset
  getLabelPreview: (assetId) => {
    return api.get(`/assets/${assetId}/label/preview`)
  },

  // Download label PDF for a single asset
  downloadLabel: (assetId) => {
    return api.get(`/assets/${assetId}/label`, {
      responseType: 'blob'
    })
  },

  // Generate bulk labels for selected assets
  downloadBulkLabels: (assetIds) => {
    return api.post('/assets/labels/bulk', { assetIds }, {
      responseType: 'blob'
    })
  },

  // Generate labels for all assets (with filters)
  downloadAllLabels: (params = {}) => {
    const queryString = apiUtils.buildQueryString(params)
    return api.get(`/assets/labels/all${queryString ? `?${queryString}` : ''}`, {
      responseType: 'blob'
    })
  }
}

export default assetService
