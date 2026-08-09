/**
 * Redux Slice: Standby Asset Assignments
 * Handles temporary standby asset assignments (assign, return, make permanent)
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Initial state
const initialState = {
  assignments: [],
  userHistory: [],
  assetHistory: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  },
  filters: {
    status: null,
    user_id: null,
    reason_category: null,
    search: ''
  },
  loading: false,
  error: null,
  operationLoading: false,
  operationError: null,
  historyLoading: false,
  historyError: null
};

// Async Thunks

/**
 * Fetch standby assignments with filters
 */
export const fetchStandbyAssignments = createAsyncThunk(
  'standbyAssignment/fetchAssignments',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/standby/assignments', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch standby assignments');
    }
  }
);


export const unassignStandbyAsset = createAsyncThunk(
  'standbyAssignment/unassign',

  async ({ assignmentId }, { rejectWithValue }) => {

    try {

      const response = await api.put(
        `/standby/assignments/${assignmentId}/unassign`
      );

      return response.data;

    } catch (error) {

      return rejectWithValue(
        error.response?.data?.message ||
        'Failed to unassign standby asset'
      );

    }

  }
);

/**
 * Assign standby asset to user
 */
export const assignStandbyAsset = createAsyncThunk(
  'standbyAssignment/assign',
  async (assignmentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/standby/assignments', assignmentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign standby asset');
    }
  }
);




/**
 * Reassign standby asset
 */
export const reassignStandbyAsset = createAsyncThunk(
  'standbyAssignment/reassign',
  async ({ assignmentId, assignmentData }, { rejectWithValue }) => {
    try {
      console.log("assignmentId", assignmentId);
console.log("assignmentData", assignmentData);

const response = await api.put(
    `/standby/assignments/${assignmentId}/reassign`,
    assignmentData
);

console.log(response);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to reassign standby asset'
      );
    }
  }
);

/**
 * Return standby asset and swap back to original
 */
export const returnStandbyAsset = createAsyncThunk(
  'standbyAssignment/return',
  async ({ assignmentId, returnData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/standby/assignments/${assignmentId}/return`, returnData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to return standby asset');
    }
  }
);

/**
 * Make standby assignment permanent
 */
export const makeAssignmentPermanent = createAsyncThunk(
  'standbyAssignment/makePermanent',
  async ({ assignmentId, notes }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/standby/assignments/${assignmentId}/permanent`, { notes });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to make assignment permanent');
    }
  }
);

/**
 * Get user's standby assignment history
 */
export const fetchUserStandbyHistory = createAsyncThunk(
  'standbyAssignment/fetchUserHistory',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/standby/assignments/user/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user history');
    }
  }
);

/**
 * Get asset's standby assignment history
 */
export const fetchAssetStandbyHistory = createAsyncThunk(
  'standbyAssignment/fetchAssetHistory',
  async (assetId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/standby/assignments/asset/${assetId}/history`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch asset history');
    }
  }
);

// Slice
const standbyAssignmentSlice = createSlice({
  name: 'standbyAssignment',
  initialState,
  reducers: {
    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },

    // Set pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    // Clear operation error
    clearOperationError: (state) => {
      state.operationError = null;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Clear history
    clearHistory: (state) => {
      state.userHistory = [];
      state.assetHistory = [];
      state.historyError = null;
    },

    // Reset state
    resetAssignmentState: () => initialState
  },

  extraReducers: (builder) => {
    // Fetch Standby Assignments
    builder
      .addCase(fetchStandbyAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStandbyAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments = action.payload.data?.assignments || [];
        state.pagination = action.payload.data?.pagination || state.pagination;
      })
      .addCase(fetchStandbyAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Assign Standby Asset
    builder
      .addCase(assignStandbyAsset.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(assignStandbyAsset.fulfilled, (state, action) => {
        state.operationLoading = false;
        // Add new assignment to list
        const newAssignment = action.payload.data?.assignment;
        if (newAssignment) {
          state.assignments.unshift(newAssignment);
        }
      })
      .addCase(assignStandbyAsset.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      });

    // Return Standby Asset
    builder
      .addCase(returnStandbyAsset.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(returnStandbyAsset.fulfilled, (state, action) => {
        state.operationLoading = false;
        // Update assignment status in list
        const assignmentId = action.payload.data?.assignment_id;
        const assignmentIndex = state.assignments.findIndex(a => a.id === assignmentId);
        if (assignmentIndex !== -1) {
          state.assignments[assignmentIndex] = {
            ...state.assignments[assignmentIndex],
            status: 'returned',
            actual_return_date: new Date().toISOString()
          };
        }
      })
      .addCase(returnStandbyAsset.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      });


      // Reassign Standby Asset
builder
  .addCase(reassignStandbyAsset.pending, (state) => {
    state.operationLoading = true;
    state.operationError = null;
  })
  .addCase(reassignStandbyAsset.fulfilled, (state, action) => {
    state.operationLoading = false;

    const updatedAssignment = action.payload.data?.assignment;

    if (updatedAssignment) {
      const index = state.assignments.findIndex(
        (a) => a.id === updatedAssignment.id
      );

      if (index !== -1) {
        state.assignments[index] = updatedAssignment;
      }
    }
  })
  .addCase(reassignStandbyAsset.rejected, (state, action) => {
    state.operationLoading = false;
    state.operationError = action.payload;
  });

    // Make Assignment Permanent
    builder
      .addCase(makeAssignmentPermanent.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(makeAssignmentPermanent.fulfilled, (state, action) => {
        state.operationLoading = false;
        // Update assignment status in list
        const assignmentId = action.payload.data?.assignment_id;
        const assignmentIndex = state.assignments.findIndex(a => a.id === assignmentId);
        if (assignmentIndex !== -1) {
          state.assignments[assignmentIndex] = {
            ...state.assignments[assignmentIndex],
            status: 'permanent',
            made_permanent_at: new Date().toISOString()
          };
        }
      })
      .addCase(makeAssignmentPermanent.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      });

    // Fetch User Standby History
    builder
      .addCase(fetchUserStandbyHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchUserStandbyHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.userHistory = action.payload.data?.assignments || [];
      })
      .addCase(fetchUserStandbyHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload;
      });

    // Fetch Asset Standby History
    builder
      .addCase(fetchAssetStandbyHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchAssetStandbyHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.assetHistory = action.payload.data?.history || [];
      })
      .addCase(fetchAssetStandbyHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload;
      });
  }
});

// Export actions
export const {
  setFilters,
  clearFilters,
  setPagination,
  clearOperationError,
  clearError,
  clearHistory,
  resetAssignmentState
} = standbyAssignmentSlice.actions;

// Export selectors
export const selectStandbyAssignments = (state) => state.standbyAssignment.assignments;
export const selectUserStandbyHistory = (state) => state.standbyAssignment.userHistory;
export const selectAssetStandbyHistory = (state) => state.standbyAssignment.assetHistory;
export const selectAssignmentPagination = (state) => state.standbyAssignment.pagination;
export const selectAssignmentFilters = (state) => state.standbyAssignment.filters;
export const selectAssignmentLoading = (state) => state.standbyAssignment.loading;
export const selectAssignmentError = (state) => state.standbyAssignment.error;
export const selectAssignmentOperationLoading = (state) => state.standbyAssignment.operationLoading;
export const selectAssignmentOperationError = (state) => state.standbyAssignment.operationError;
export const selectAssignmentHistoryLoading = (state) => state.standbyAssignment.historyLoading;
export const selectAssignmentHistoryError = (state) => state.standbyAssignment.historyError;

// Export reducer
export default standbyAssignmentSlice.reducer;
