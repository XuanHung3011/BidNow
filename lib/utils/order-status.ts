/**
 * Map order status to Vietnamese text
 */
export function getOrderStatusText(status?: string | null): string {
  if (!status) return "Chưa xác định"
  
  const statusMap: Record<string, string> = {
    'awaiting_payment': 'Chờ thanh toán',
    'awaiting_shipment': 'Chờ vận chuyển',
    'shipped': 'Đã gửi hàng',
    'dispute': 'Đang khiếu nại',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy'
  }
  
  return statusMap[status.toLowerCase()] || status
}

/**
 * Map payment status to Vietnamese text
 */
export function getPaymentStatusText(status?: string | null): string {
  if (!status) return "Chưa xác định"
  
  const statusMap: Record<string, string> = {
    'pending': 'Chờ thanh toán',
    'paid_held': 'Đã thanh toán (giữ tiền)',
    'released_to_seller': 'Đã giải phóng tiền',
    'refunded_to_buyer': 'Đã hoàn tiền',
    'hold_dispute': 'Tạm giữ (khiếu nại)'
  }
  
  return statusMap[status.toLowerCase()] || status
}

/**
 * Get order status config (text, variant, className, icon)
 */
export function getOrderStatusConfig(status?: string | null) {
  if (!status) {
    return {
      text: 'Chưa xác định',
      variant: 'outline' as const,
      className: 'bg-gray-50 text-gray-700 border-gray-300',
      icon: null
    }
  }
  
  const statusLower = status.toLowerCase()
  
  if (statusLower === 'awaiting_payment') {
    return {
      text: 'Chờ thanh toán',
      variant: 'outline' as const,
      className: 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400',
      icon: 'Clock'
    }
  }
  
  if (statusLower === 'awaiting_shipment') {
    return {
      text: 'Chờ vận chuyển',
      variant: 'default' as const,
      className: 'bg-blue-500 hover:bg-blue-600 text-white',
      icon: 'Package'
    }
  }
  
  if (statusLower === 'shipped') {
    return {
      text: 'Đã gửi hàng',
      variant: 'default' as const,
      className: 'bg-purple-500 hover:bg-purple-600 text-white',
      icon: 'Truck'
    }
  }
  
  if (statusLower === 'completed') {
    return {
      text: 'Hoàn thành',
      variant: 'default' as const,
      className: 'bg-green-500 hover:bg-green-600 text-white',
      icon: 'CheckCircle2'
    }
  }
  
  if (statusLower === 'dispute') {
    return {
      text: 'Đang khiếu nại',
      variant: 'outline' as const,
      className: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400',
      icon: 'AlertCircle'
    }
  }
  
  if (statusLower === 'cancelled') {
    return {
      text: 'Đã hủy',
      variant: 'outline' as const,
      className: 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400',
      icon: 'XCircle'
    }
  }
  
  return {
    text: status,
    variant: 'outline' as const,
    className: '',
    icon: null
  }
}

/**
 * Get payment status config (text, variant, className, icon)
 */
export function getPaymentStatusConfig(status?: string | null) {
  if (!status) {
    return {
      text: 'Chưa xác định',
      variant: 'outline' as const,
      className: 'bg-gray-50 text-gray-700 border-gray-300',
      icon: 'CreditCard'
    }
  }
  
  const statusLower = status.toLowerCase()
  
  if (statusLower === 'pending') {
    return {
      text: 'Chờ thanh toán',
      variant: 'outline' as const,
      className: 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400',
      icon: 'Clock'
    }
  }
  
  if (statusLower === 'paid_held') {
    return {
      text: 'Đã thanh toán (giữ tiền)',
      variant: 'default' as const,
      className: 'bg-green-500 hover:bg-green-600 text-white',
      icon: 'Shield'
    }
  }
  
  if (statusLower === 'released_to_seller') {
    return {
      text: 'Đã giải phóng tiền',
      variant: 'default' as const,
      className: 'bg-green-600 hover:bg-green-700 text-white',
      icon: 'DollarSign'
    }
  }
  
  if (statusLower === 'refunded_to_buyer') {
    return {
      text: 'Đã hoàn tiền',
      variant: 'outline' as const,
      className: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400',
      icon: 'XCircle'
    }
  }
  
  if (statusLower === 'hold_dispute') {
    return {
      text: 'Tạm giữ (khiếu nại)',
      variant: 'outline' as const,
      className: 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400',
      icon: 'AlertCircle'
    }
  }
  
  return {
    text: status,
    variant: 'outline' as const,
    className: 'bg-gray-50 text-gray-700 border-gray-300',
    icon: 'CreditCard'
  }
}

