/**
 * GATE PASS SERVICE
 * API service for Gate Pass Management
 * - Disposal/Service gate passes
 * - End User gate passes
 */

import apiClient from '../utils/apiClient';

const gatePassService = {
  /**
   * Get gate passes with filters
   * @param {Object} params - Query parameters
   */
  getGatePasses: async (params = {}) => {
    try {
      const response = await apiClient.get('/gate-passes', { params });
      return response;
    } catch (error) {
      console.error('Error fetching gate passes:', error);
      throw error;
    }
  },

  /**
   * Get single gate pass details
   * @param {string} id - Gate pass ID
   */
  getGatePassById: async (id) => {
    try {
      const response = await apiClient.get(`/gate-passes/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching gate pass:', error);
      throw error;
    }
  },

  /**
   * Create new gate pass
   * @param {Object} data - Gate pass data
   */
  createGatePass: async (data) => {
    try {
      const response = await apiClient.post('/gate-passes', data);
      return response;
    } catch (error) {
      console.error('Error creating gate pass:', error);
      throw error;
    }
  },

  /**
   * Delete gate pass
   * @param {string} id - Gate pass ID
   */
  deleteGatePass: async (id) => {
    try {
      const response = await apiClient.delete(`/gate-passes/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting gate pass:', error);
      throw error;
    }
  },

  /**
   * Download gate pass PDF
   * @param {string} id - Gate pass ID
   * @param {string} gatePassNumber - Gate pass number for filename
   */
  downloadPDF: async (id, gatePassNumber = '') => {
    try {
      const response = await apiClient.get(`/gate-passes/${id}/pdf`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Gate_Pass_${gatePassNumber || id}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  },

  /**
   * Search assets for gate pass
   * @param {string} search - Search term
   */
  searchAssets: async (search, limit = 20) => {
    try {
      const response = await apiClient.get('/gate-passes/assets/search', {
        params: { search, limit }
      });
      return response;
    } catch (error) {
      console.error('Error searching assets:', error);
      throw error;
    }
  },

    /**
 * Get assets assigned to a user
 */
getUserAssets: async (userId) => {
  try {
    const response = await apiClient.get(`/gate-passes/users/${userId}/assets`);
    return response;
  } catch (error) {
    console.error('Error fetching user assets:', error);
    throw error;
  }
},

  /**
   * Get asset with its components
   * @param {string} assetId - Asset ID
   */
  getAssetWithComponents: async (assetId) => {
    try {
      const response = await apiClient.get(`/gate-passes/assets/${assetId}/with-components`);
      return response;
    } catch (error) {
      console.error('Error fetching asset with components:', error);
      throw error;
    }
  },

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Get gate pass type display name
   */
  getTypeDisplayName: (type) => {
    const names = {
      disposal_service: 'Disposal / Service',
      end_user: 'End User'
    };
    return names[type] || type || 'N/A';
  },

  /**
   * Get gate pass type color
   */
  getTypeColor: (type) => {
    const colors = {
      disposal_service: 'orange',
      end_user: 'blue'
    };
    return colors[type] || 'default';
  },

  /**
   * Get purpose display name
   */
  getPurposeDisplayName: (type, purpose) => {
    const purposes = {
      disposal_service: {
        scrap: 'Scrap / Disposal',
        buyback: 'Buyback / Sale',
        repair: 'External Repair'
      },
      end_user: {
        new_assignment: 'New Assignment',
        temporary_handover: 'Temporary Handover',
        permanent_transfer: 'Permanent Transfer',
        repair_return: 'Repair and Return'
      }
    };
    return purposes[type]?.[purpose] || purpose || 'N/A';
  },

  /**
   * Get condition color
   */
  getConditionColor: (condition) => {
    const colors = {
      working: 'green',
      damaged: 'orange',
      for_repair: 'cyan',
      faulty: 'red',
      unknown: 'default'
    };
    return colors[condition] || 'default';
  },

  /**
   * Purpose options by type
   */
  getPurposeOptions: (type) => {
    const options = {
      disposal_service: [
        { value: 'scrap', label: 'Scrap / Disposal' },
        { value: 'buyback', label: 'Buyback / Sale' },
        { value: 'repair', label: 'External Repair / Service' }
      ],
      end_user: [
        { value: 'new_assignment', label: 'New Assignment' },
        { value: 'temporary_handover', label: 'Temporary Handover' },
        { value: 'permanent_transfer', label: 'Permanent Transfer' },
        { value: 'repair_return', label: 'Repair and Return' }
      ]
    };
    return options[type] || [];
  },

    exportExcel: async (params = {}) => {
  try {
    const response = await apiClient.get(
      "/gate-passes/export",
      {
        params,
        responseType: "blob"
      }
    );

    const blob = new Blob([
      response.data
    ]);

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "GatePasses.xlsx";

    document.body.appendChild(a);

    a.click();

    a.remove();

    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
    throw err;
  }
},

  /**
   * Condition options
   */
  conditionOptions: [
    { value: 'working', label: 'Working' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'for_repair', label: 'For Repair' },
    { value: 'faulty', label: 'Faulty' },
    { value: 'unknown', label: 'Unknown' }
  ]
};

 

export default gatePassService;
