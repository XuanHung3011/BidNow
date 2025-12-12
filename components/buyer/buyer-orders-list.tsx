"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, AlertCircle, MessageSquare, CheckCircle2, XCircle, Info, Filter } from "lucide-react"
import { PaymentsAPI, type OrderDto } from "@/lib/api/payments"
import { OrderConfirmation } from "./order-confirmation"
import { useRouter } from "next/navigation"
import { disputesAPI, type DisputeDto } from "@/lib/api/disputes"

interface BuyerOrdersListProps {
  buyerId: number
}

export function BuyerOrdersList({ buyerId }: BuyerOrdersListProps) {
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [disputes, setDisputes] = useState<Map<number, DisputeDto>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<"all" | "awaiting_payment" | "awaiting_shipment" | "shipped" | "completed" | "dispute">("all")
  const router = useRouter()

  useEffect(() => {
    loadOrders()
  }, [buyerId])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await PaymentsAPI.getBuyerOrders(buyerId)
      setOrders(data)
      
      // Load disputes for orders that might have disputes
      const disputeMap = new Map<number, DisputeDto>()
      for (const order of data) {
        // Check if order has dispute status or might have been resolved
        if (order.orderStatus === 'dispute' || order.orderStatus === 'cancelled' || order.orderStatus === 'completed') {
          try {
            const dispute = await disputesAPI.getByOrderId(order.id)
            if (dispute) {
              disputeMap.set(order.id, dispute)
            }
          } catch (err) {
            // Dispute might not exist, ignore
            console.debug(`No dispute found for order ${order.id}`)
          }
        }
      }
      setDisputes(disputeMap)
    } catch (err) {
      console.error('Error loading orders:', err)
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (order: OrderDto) => {
    const status = order.orderStatus?.toLowerCase() || ''
    
    if (status === 'awaiting_payment') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Chờ thanh toán</Badge>
    }
    if (status === 'awaiting_shipment') {
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Chờ vận chuyển</Badge>
    }
    if (status === 'shipped') {
      return <Badge className="bg-purple-500 hover:bg-purple-600 text-white">Đã gửi hàng</Badge>
    }
    if (status === 'completed') {
      return <Badge className="bg-green-500 hover:bg-green-600 text-white">Hoàn thành</Badge>
    }
    if (status === 'dispute') {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Khiếu nại</Badge>
    }
    
    return <Badge variant="outline">{order.orderStatus}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleOpenDisputeChat = async (orderId: number) => {
    try {
      // Get dispute by orderId
      const dispute = await disputesAPI.getByOrderId(orderId)
      if (dispute && dispute.id) {
        router.push(`/messages?disputeId=${dispute.id}`)
      } else {
        // If no dispute found, show helpful message
        const shouldReload = confirm(
          "Không tìm thấy khiếu nại cho đơn hàng này.\n\n" +
          "Có thể khiếu nại đang được tạo hoặc đã bị xóa.\n\n" +
          "Bạn có muốn làm mới trang để kiểm tra lại không?"
        )
        if (shouldReload) {
          loadOrders()
        }
      }
    } catch (error: any) {
      console.error("Error opening dispute chat:", error)
      const errorMessage = error.message || "Lỗi không xác định"
      if (errorMessage.includes("Unauthorized") || errorMessage.includes("Forbid")) {
        alert("Bạn không có quyền truy cập khiếu nại này")
      } else if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        const shouldReload = confirm(
          "Không tìm thấy khiếu nại cho đơn hàng này.\n\n" +
          "Có thể khiếu nại đang được tạo hoặc đã bị xóa.\n\n" +
          "Bạn có muốn làm mới trang để kiểm tra lại không?"
        )
        if (shouldReload) {
          loadOrders()
        }
      } else {
        alert("Không thể mở chat khiếu nại: " + errorMessage)
      }
    }
  }

  // Filter và sắp xếp orders - Phải đặt trước các early returns
  const filteredOrders = useMemo(() => {
    let filtered = [...orders]
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(o => o.orderStatus === filterStatus)
    }
    
    // Sắp xếp: shipped lên đầu (cần xác nhận), sau đó theo trạng thái
    filtered.sort((a, b) => {
      if (a.orderStatus === 'shipped' && b.orderStatus !== 'shipped') return -1
      if (a.orderStatus !== 'shipped' && b.orderStatus === 'shipped') return 1
      
      // Sắp xếp theo ngày tạo (mới nhất trước)
      const aDate = new Date(a.createdAt).getTime()
      const bDate = new Date(b.createdAt).getTime()
      return bDate - aDate
    })
    
    return filtered
  }, [orders, filterStatus])

  const shippedOrders = filteredOrders.filter(o => o.orderStatus === 'shipped')
  const otherOrders = filteredOrders.filter(o => o.orderStatus !== 'shipped')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-destructive">
          <AlertCircle className="mx-auto h-12 w-12 mb-4" />
          <p>{error}</p>
          <Button onClick={loadOrders} className="mt-4">
            Thử lại
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Đơn hàng của tôi</h2>
        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              Tất cả
            </Button>
            <Button
              variant={filterStatus === "awaiting_payment" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("awaiting_payment")}
            >
              Chờ thanh toán
            </Button>
            <Button
              variant={filterStatus === "awaiting_shipment" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("awaiting_shipment")}
            >
              Chờ vận chuyển
            </Button>
            <Button
              variant={filterStatus === "shipped" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("shipped")}
            >
              Đã gửi hàng
            </Button>
            <Button
              variant={filterStatus === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("completed")}
            >
              Hoàn thành
            </Button>
            <Button
              variant={filterStatus === "dispute" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("dispute")}
            >
              Khiếu nại
            </Button>
          </div>
          <Button onClick={loadOrders} variant="outline" size="sm">
            Làm mới
          </Button>
        </div>
      </div>

      {/* Shipped Orders - Need Confirmation */}
      {shippedOrders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-500" />
            Cần xác nhận ({shippedOrders.length})
          </h3>
          <div className="space-y-4">
            {shippedOrders.map((order) => (
              <div key={order.id}>
                <OrderConfirmation order={order} onUpdate={loadOrders} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Orders */}
      {otherOrders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Tất cả đơn hàng ({otherOrders.length})</h3>
          <div className="space-y-4">
            {otherOrders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 flex-wrap mb-4">
                      <h3 className="font-semibold text-foreground">Đơn hàng #{order.id}</h3>
                      {getStatusBadge(order)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Giá trị: <span className="font-semibold text-foreground">{formatCurrency(order.finalPrice)}</span></p>
                      <p>Ngày tạo: <span className="font-semibold text-foreground">{formatDate(order.createdAt)}</span></p>
                      {order.payment?.paidAt && (
                        <p className="text-green-600">Đã thanh toán: {formatDate(order.payment.paidAt)}</p>
                      )}
                      {order.trackingNumber && (
                        <p>Mã vận đơn: <span className="font-semibold text-foreground">{order.trackingNumber}</span></p>
                      )}
                    </div>
                    {/* Dispute Resolution Info */}
                    {disputes.has(order.id) && (() => {
                      const dispute = disputes.get(order.id)!
                      const isResolved = dispute.status === 'buyer_won' || dispute.status === 'seller_won'
                      const isBuyerWinner = dispute.status === 'buyer_won'
                      
                      if (isResolved) {
                        return (
                          <div className={`mt-4 p-4 rounded-lg border-2 ${
                            isBuyerWinner 
                              ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700' 
                              : 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700'
                          }`}>
                            <div className="flex items-start gap-3">
                              {isBuyerWinner ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <p className={`font-semibold mb-1 ${
                                  isBuyerWinner 
                                    ? 'text-green-800 dark:text-green-200' 
                                    : 'text-red-800 dark:text-red-200'
                                }`}>
                                  {isBuyerWinner ? 'Bạn thắng khiếu nại' : 'Người bán thắng khiếu nại'}
                                </p>
                                {dispute.adminNotes && (
                                  <p className={`text-sm ${
                                    isBuyerWinner 
                                      ? 'text-green-700 dark:text-green-300' 
                                      : 'text-red-700 dark:text-red-300'
                                  }`}>
                                    <strong>Lý do:</strong> {dispute.adminNotes}
                                  </p>
                                )}
                                {dispute.resolvedAt && (
                                  <p className={`text-xs mt-1 ${
                                    isBuyerWinner 
                                      ? 'text-green-600 dark:text-green-400' 
                                      : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    Giải quyết vào: {formatDate(dispute.resolvedAt)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                  {order.orderStatus === 'dispute' && (
                    <Button
                      onClick={() => handleOpenDisputeChat(order.id)}
                      variant="outline"
                      className="bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Mở chat khiếu nại
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {filteredOrders.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg mb-2">
              {filterStatus === "all" 
                ? "Chưa có đơn hàng nào"
                : filterStatus === "awaiting_payment"
                ? "Không có đơn hàng nào chờ thanh toán"
                : filterStatus === "awaiting_shipment"
                ? "Không có đơn hàng nào chờ vận chuyển"
                : filterStatus === "shipped"
                ? "Không có đơn hàng nào đã gửi hàng"
                : filterStatus === "completed"
                ? "Không có đơn hàng nào đã hoàn thành"
                : "Không có đơn hàng nào đang khiếu nại"}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}


