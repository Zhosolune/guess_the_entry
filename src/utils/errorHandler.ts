import React from 'react';

/**
 * 错误处理工具函数
 * 提供统一的错误处理和用户友好的错误消息
 * 
 * 主要功能：
 * - 错误分类：将错误分为API、网络、验证、存储等类型
 * - 用户友好：将技术错误转换为易懂的用户提示
 * - 降级处理：为不同类型的错误提供合适的降级方案
 * - 日志记录：提供详细的错误日志用于调试
 * 
 * 错误处理策略：
 * - API错误：根据HTTP状态码和响应内容分类处理
 * - 网络错误：检测超时、连接失败等网络问题
 * - 验证错误：处理输入验证和格式检查错误
 * - 存储错误：处理localStorage等存储相关问题
 */

/**
 * 错误类型枚举
 * 定义了应用中可能出现的所有错误类型
 */
export enum ErrorType {
  API_ERROR = 'API_ERROR',           // API相关错误（HTTP错误、服务端错误）
  NETWORK_ERROR = 'NETWORK_ERROR',   // 网络连接错误（超时、断网等）
  VALIDATION_ERROR = 'VALIDATION_ERROR', // 数据验证错误（输入格式、必填项等）
  STORAGE_ERROR = 'STORAGE_ERROR',   // 存储相关错误（localStorage、内存不足等）
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'    // 未知错误（兜底类型）
}

/**
 * 应用错误类
 * 统一的错误对象，包含错误类型、错误代码和详细信息
 * 
 * @param message - 用户友好的错误消息
 * @param type - 错误类型（API_ERROR, NETWORK_ERROR等）
 * @param code - 错误代码（用于错误识别和处理）
 * @param details - 详细的错误信息（用于调试）
 * 
 * @example
 * ```typescript
 * throw new AppError('网络连接失败', ErrorType.NETWORK_ERROR, 'NETWORK_ERROR');
 * ```
 */
export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * API错误响应接口
 * 定义了API返回的错误响应格式
 */
interface ApiErrorResponse {
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  message?: string;
  status?: number;
}

/**
 * 错误处理工具类
 * 提供各种错误类型的处理方法和用户友好的错误消息
 * 
 * 主要方法：
 * - handleApiError: 处理API相关错误
 * - handleNetworkError: 处理网络连接错误
 * - handleValidationError: 处理输入验证错误
 * - handleStorageError: 处理存储相关错误
 * - handleError: 统一的错误处理入口
 * 
 * @example
 * ```typescript
 * try {
 *   await someApiCall();
 * } catch (error) {
 *   const appError = ErrorHandler.handleError(error);
 *   console.error(appError.message); // 用户友好的错误消息
 * }
 * ```
 */
export class ErrorHandler {
  /**
   * 处理API错误
   * 根据HTTP响应状态码和错误信息分类处理API错误
   * 
   * @param error - Axios错误或HTTP错误
   * @returns 标准化的AppError对象
   * 
   * 错误分类：
   * - 4xx错误：客户端错误（400, 401, 403, 404等）
   * - 5xx错误：服务端错误（500, 502, 503等）
   * - 网络错误：连接失败、超时等
   */
  static handleApiError(error: any): AppError {
    if (error.response) {
      // 服务器响应错误
      const response: ApiErrorResponse = error.response.data;
      const message = response.error?.message || response.message || 'API请求失败';
      const code = response.error?.code || error.response.status?.toString();
      
      return new AppError(
        this.getUserFriendlyMessage(message, ErrorType.API_ERROR),
        ErrorType.API_ERROR,
        code,
        response.error?.details || response
      );
    } else if (error.request) {
      // 网络错误
      return new AppError(
        '网络连接失败，请检查网络连接',
        ErrorType.NETWORK_ERROR,
        'NETWORK_ERROR'
      );
    } else {
      // 其他错误
      return new AppError(
        error.message || 'API请求失败',
        ErrorType.API_ERROR,
        'API_ERROR'
      );
    }
  }

  /**
   * 处理网络错误
   * 专门处理网络连接相关的错误（超时、断网等）
   * 
   * @param error - 网络错误对象
   * @returns 标准化的AppError对象
   * 
   * 常见网络错误：
   * - timeout: 请求超时
   * - Network Error: 连接失败
   * - CORS: 跨域问题
   */
  static handleNetworkError(error: any): AppError {
    if (error.message?.includes('timeout')) {
      return new AppError(
        '请求超时，请稍后重试',
        ErrorType.NETWORK_ERROR,
        'TIMEOUT'
      );
    }
    
    if (error.message?.includes('Network Error')) {
      return new AppError(
        '网络连接失败，请检查网络连接',
        ErrorType.NETWORK_ERROR,
        'NETWORK_ERROR'
      );
    }
    
    return new AppError(
      '网络错误，请稍后重试',
      ErrorType.NETWORK_ERROR,
      'NETWORK_ERROR'
    );
  }

  /**
   * 处理验证错误
   * 处理输入验证和格式检查错误
   * 
   * @param message - 验证错误消息
   * @param field - 出错的字段名（可选）
   * @returns 标准化的AppError对象
   * 
   * @example
   * ```typescript
   * if (!input) {
   *   throw ErrorHandler.handleValidationError('输入不能为空', 'input');
   * }
   * ```
   */
  static handleValidationError(message: string, field?: string): AppError {
    return new AppError(
      this.getUserFriendlyMessage(message, ErrorType.VALIDATION_ERROR),
      ErrorType.VALIDATION_ERROR,
      field ? `VALIDATION_${field.toUpperCase()}` : 'VALIDATION_ERROR'
    );
  }

  /**
   * 处理存储错误
   * 处理localStorage、IndexedDB等存储相关的错误
   * 
   * @param error - 存储错误对象
   * @returns 标准化的AppError对象
   * 
   * 常见存储错误：
   * - QuotaExceededError: 存储空间不足
   * - SecurityError: 存储权限被拒绝
   * - NotFoundError: 存储项不存在
   */
  static handleStorageError(error: any): AppError {
    if (error.name === 'QuotaExceededError') {
      return new AppError(
        '存储空间不足，请清理浏览器缓存',
        ErrorType.STORAGE_ERROR,
        'QUOTA_EXCEEDED'
      );
    }
    
    if (error.name === 'SecurityError') {
      return new AppError(
        '存储权限被拒绝，请检查浏览器设置',
        ErrorType.STORAGE_ERROR,
        'SECURITY_ERROR'
      );
    }
    
    return new AppError(
      '数据存储失败',
      ErrorType.STORAGE_ERROR,
      'STORAGE_ERROR'
    );
  }

  /**
   * 处理未知错误
   * 处理无法识别的错误，提供兜底处理
   * 
   * @param error - 未知错误对象
   * @returns 标准化的AppError对象
   * 
   * 用于处理：
   * - 非Error对象
   * - 无法识别的错误类型
   * - 异常的边缘情况
   */
  static handleUnknownError(error: any): AppError {
    const message = error instanceof Error ? error.message : '发生未知错误';
    
    return new AppError(
      this.getUserFriendlyMessage(message, ErrorType.UNKNOWN_ERROR),
      ErrorType.UNKNOWN_ERROR,
      'UNKNOWN_ERROR'
    );
  }

  /**
   * 获取用户友好的错误消息
   * 将技术错误消息转换为普通用户能理解的提示
   * 
   * @param message - 原始错误消息
   * @param type - 错误类型
   * @returns 用户友好的错误消息
   * 
   * 转换规则：
   * - API限流 -> "API调用频率超限，请稍后重试"
   * - 网络错误 -> "网络连接失败，请检查网络连接"
   * - 输入验证 -> "输入无效，请检查输入内容"
   * - 存储错误 -> "存储空间不足，请清理浏览器缓存"
   */
  private static getUserFriendlyMessage(message: string, type: ErrorType): string {
    const errorMessages: Record<string, string> = {
      // API相关错误
      'API rate limit exceeded': 'API调用频率超限，请稍后重试',
      'Invalid API key': 'API密钥无效，请联系管理员',
      'Service temporarily unavailable': '服务暂时不可用，请稍后重试',
      'Request timeout': '请求超时，请稍后重试',
      
      // 网络相关错误
      'Network Error': '网络连接失败，请检查网络连接',
      'Failed to fetch': '网络请求失败，请检查网络连接',
      
      // 验证相关错误
      'Invalid input': '输入无效，请检查输入内容',
      'Required field missing': '必填字段缺失，请完善信息',
      'Invalid format': '格式无效，请检查输入格式',
      
      // 通用错误
      'default': '操作失败，请稍后重试'
    };

    // 查找匹配的错误消息
    for (const [key, userMessage] of Object.entries(errorMessages)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return userMessage;
      }
    }

    // 返回默认消息或原消息
    return errorMessages.default;
  }

  /**
   * 统一错误处理入口
   * 自动识别错误类型并调用相应的处理方法
   * 
   * @param error - 需要处理的错误对象
   * @returns 标准化的AppError对象
   * 
   * @example
   * ```typescript
   * try {
   *   await someOperation();
   * } catch (error) {
   *   const appError = ErrorHandler.handleError(error);
   *   
   *   // 根据错误类型处理
   *   switch (appError.type) {
   *     case ErrorType.NETWORK_ERROR:
   *       showNetworkErrorMessage();
   *       break;
   *     case ErrorType.API_ERROR:
   *       showApiErrorMessage();
   *       break;
   *     default:
   *       showGenericErrorMessage();
   *   }
   * }
   * ```
   */
  static handleError(error: any): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error.response || error.request) {
      return this.handleApiError(error);
    }

    if (error.name === 'NetworkError' || error.message?.includes('Network')) {
      return this.handleNetworkError(error);
    }

    if (error.name === 'QuotaExceededError' || error.name === 'SecurityError') {
      return this.handleStorageError(error);
    }

    return this.handleUnknownError(error);
  }

  /**
   * 获取错误日志信息
   */
  static getErrorLog(error: AppError): string {
    return `[${error.type}] ${error.message}${error.code ? ` (${error.code})` : ''}`;
  }

  /**
   * 是否为用户可恢复的错误
   */
  static isRecoverable(error: AppError): boolean {
    const recoverableTypes = [
      ErrorType.NETWORK_ERROR,
      ErrorType.API_ERROR
    ];
    
    return recoverableTypes.includes(error.type);
  }
}

/**
 * 错误边界组件（用于React）
 * 捕获React组件树中的错误并显示备用UI
 * 
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> {
  state = {
    hasError: false,
    error: null as AppError | null
  };

  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    const appError = ErrorHandler.handleError(error);
    return { hasError: true, error: appError };
  }

  componentDidCatch(error: any, errorInfo: any) {
    const appError = ErrorHandler.handleError(error);
    console.error('Error caught by boundary:', ErrorHandler.getErrorLog(appError));
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return React.createElement('div', { className: 'min-h-screen bg-gray-50 flex items-center justify-center p-4' },
        React.createElement('div', { className: 'bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center' },
          React.createElement('div', { className: 'w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4' },
            React.createElement('svg', { className: 'w-8 h-8 text-red-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
              React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.667.192 3 1.732 3z' })
            )
          ),
          React.createElement('h2', { className: 'text-xl font-semibold text-gray-800 mb-2' }, '出错了'),
          React.createElement('p', { className: 'text-gray-600 mb-4' }, this.state.error.message),
          React.createElement('button', {
            onClick: () => this.setState({ hasError: false, error: null }),
            className: 'bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200'
          }, '重试')
        )
      );
    }

    return this.props.children;
  }
}