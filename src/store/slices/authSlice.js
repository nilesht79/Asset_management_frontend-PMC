import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authService from '../../services/auth'
import { storeUserDataForRedirect, clearStoredUserData } from '../../utils/redirectUtils'

// Initial state
const initialState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  loginAttempts: 0,
  lastLoginError: null,
  isRefreshing: false, // Prevent multiple refresh attempts
}

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      let response;
      
      // Check if it's a role-based login
      if (credentials.role && credentials.loginType === 'role-based') {
        response = await authService.roleBasedLogin(credentials, credentials.role)
      } else {
        response = await authService.login(credentials)
      }
      
      // OAuth 2.0 API returns user data (tokens are stored as HttpOnly cookies)
      const responseData = response.data.data || response.data

      // Process the response (tokens are automatically stored as cookies)
      authService.storeOAuthResponse(responseData)

      return {
        user: responseData.user,
        tokens: {
          tokenType: responseData.token_type,
          expiresIn: responseData.expires_in,
          scope: responseData.scope
        }
      }
    // } catch (error) {
    //   return rejectWithValue({
    //     message: error.response?.data?.message || error.message || 'Login failed',
    //     status: error.response?.status,
    //     errors: error.response?.data?.errors
    //   })
    // }
      } catch (error) {
  const message = !error.response
    ? 'Unable to connect to the server. Please try again.'
    : error.response?.data?.message ||
      'Invalid Employee ID or password.';

  return rejectWithValue({
    message,
    status: error.response?.status,
    errors: error.response?.data?.errors
  });
}
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Call logout endpoint to clear HttpOnly cookies
      await authService.logout()

      return null
    } catch (error) {
      // Even if logout API fails, consider it successful on frontend
      return rejectWithValue({
        message: error.response?.data?.message || 'Logout failed'
      })
    }
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState()

    // Prevent multiple simultaneous refresh attempts
    if (auth.isRefreshing) {
      return rejectWithValue({ message: 'Refresh already in progress' })
    }

    try {
      const response = await authService.refreshToken()

      // Tokens are automatically updated as HttpOnly cookies
      return response.data
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Token refresh failed'
      })
    }
  }
)

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState()

    console.log('🔍 Checking authentication status...', {
      isLoading: auth.isLoading,
      isRefreshing: auth.isRefreshing,
      isAuthenticated: auth.isAuthenticated
    })

    try {
      // Simply try to get user profile - server validates HttpOnly cookies
      const response = await authService.getProfile()
      console.log('✅ Auth check successful - user is authenticated', response.data.data)

      return {
        user: response.data.data,
        tokens: null // Tokens are handled via HttpOnly cookies
      }
    } catch (error) {
      // If profile fails, user is not authenticated - this is normal, not an error
      if (error.response?.status === 401) {
        console.log('ℹ️ User not authenticated (expected behavior)')
        return rejectWithValue({
          message: 'Not authenticated'
        })
      }

      // Only log actual errors (not 401)
      console.log('❌ Auth check failed:', error.response?.status, error.response?.data?.message)
      return rejectWithValue({
        message: error.response?.data?.message || 'Authentication check failed'
      })
    }
  }
)

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(profileData)
      return response.data
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Profile update failed',
        errors: error.response?.data?.errors
      })
    }
  }
)

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { dispatch, rejectWithValue }) => {
    try {
      const response = await authService.changePassword(passwordData)
      
      // Force logout after password change
      dispatch(logout())
      
      return response.data
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Password change failed',
        errors: error.response?.data?.errors
      })
    }
  }
)

// Create slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
      state.lastLoginError = null
    },
    clearUser: (state) => {
      state.user = null
      state.tokens = null
      state.isAuthenticated = false
      state.error = null
      state.loginAttempts = 0
      state.lastLoginError = null
      state.isRefreshing = false
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
    setTokens: (state, action) => {
      state.tokens = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.lastLoginError = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.tokens = action.payload.tokens
        state.isAuthenticated = true
        state.error = null
        state.loginAttempts = 0
        state.lastLoginError = null

        // Store user data for role-based redirects
        storeUserDataForRedirect(action.payload.user)

        console.log('🎉 Login successful - user authenticated:', action.payload.user)
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.user = null
        state.tokens = null
        state.isAuthenticated = false
        state.error = action.payload?.message || 'Login failed'
        state.lastLoginError = action.payload
        state.loginAttempts += 1
      })
      
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.tokens = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = null
        state.loginAttempts = 0
        state.lastLoginError = null

        // Clear stored user data
        clearStoredUserData()
      })
      .addCase(logout.rejected, (state, action) => {
        // Even if logout API fails, clear user data locally
        state.user = null
        state.tokens = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = action.payload?.message || 'Logout failed'

        // Clear stored user data even on logout failure
        clearStoredUserData()
      })
      
      // Refresh Token
      .addCase(refreshToken.pending, (state) => {
        state.isRefreshing = true
      })
      .addCase(refreshToken.fulfilled, (state) => {
        state.isRefreshing = false
        // Tokens are handled via HttpOnly cookies
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isRefreshing = false
        state.user = null
        state.tokens = null
        state.isAuthenticated = false
        state.error = 'Session expired. Please login again.'
      })
      
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.tokens = action.payload.tokens
        state.isAuthenticated = true
        state.error = null

        // Store user data for role-based redirects
        storeUserDataForRedirect(action.payload.user)

        console.log('🎉 Auth check fulfilled - user authenticated')
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false
        state.user = null
        state.tokens = null
        state.isAuthenticated = false
        state.error = action.payload?.message || 'Authentication failed'
        console.log('❌ Auth check rejected - user not authenticated')
      })
      
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, ...action.payload }
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.error = action.payload?.message || 'Profile update failed'
      })
      
      // Change Password
      .addCase(changePassword.fulfilled, (state) => {
        // Password change successful - user will be logged out
        state.error = null
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.error = action.payload?.message || 'Password change failed'
      })
  }
})

// Export actions
export const { clearError, clearUser, updateUser, setTokens } = authSlice.actions

// Selectors
export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectAuthLoading = (state) => state.auth.isLoading
export const selectAuthError = (state) => state.auth.error
export const selectUserRole = (state) => state.auth.user?.role
export const selectUserPermissions = (state) => state.auth.user?.permissions || []

// Export reducer
export default authSlice.reducer
