import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Alert, Typography } from 'antd'
import { UserOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login, clearError } from '../store/slices/authSlice'
import { Link } from 'react-router-dom'

const { Title, Text } = Typography

const Login = () => {
  const [form] = Form.useForm()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, error, isAuthenticated, user } = useSelector(state => state.auth)
  const [showError, setShowError] = useState(false)

  // Handle redirect if already authenticated (e.g., page refresh while logged in)
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.mustChangePassword) {
        navigate('/force-password-change', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    if (error) {
      setShowError(true)
    }
  }, [error])

  const handleSubmit = async (values) => {
    try {
      dispatch(clearError())
      setShowError(false)

      // Get the login result directly to check mustChangePassword
      const result = await dispatch(login(values)).unwrap()

      // Immediately redirect based on mustChangePassword flag
      if (result.user?.mustChangePassword) {
        navigate('/force-password-change', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  const handleErrorClose = () => {
    setShowError(false)
    dispatch(clearError())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
         <Link to="/" className="inline-flex items-center text-red-600 hover:text-red-700 mb-4">
            <ArrowLeftOutlined className="mr-2" />
            Back to Home
          </Link>
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="PolePlus"
            className="h-16 w-auto mx-auto mb-4"
          />
          <Title level={2} className="mb-2">
            Unified ITSM Platform
          </Title>
          <Text className="text-gray-600">
            Sign in to access your account
          </Text>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg border-0">
          {/* {showError && (
            <Alert
              message="Login Failed"
              description={error}
              type="error"
              showIcon
              closable
              onClose={handleErrorClose}
              className="mb-4"
            />
          )} */}

          
          {showError && error && (
            <Alert
              message="Login Failed"
              description={error}
              type="error"
              showIcon
              closable
              onClose={handleErrorClose}
              className="mb-4"
            />
          )}


          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            onValuesChange={() => {
                setShowError(false);
                dispatch(clearError());
              }}
            layout="vertical"
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="employeeId"
              label="Employee ID"
              rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: 'Please enter your Employee ID',
                  },
                ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Enter your Employee ID (e.g., T-12345)"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: 'Please enter your password',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                className="w-full h-12 text-base font-medium"
                loading={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Form.Item>
          </Form>

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-red-600 hover:text-red-700 text-sm">
              Forgot Password?
            </Link>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <Text className="text-gray-500 text-sm">
            © 2024 Asset Management System. All rights reserved.
          </Text>
        </div>
      </div>
    </div>
  )
}

export default Login
