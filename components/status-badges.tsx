"use client"

import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  Package, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  CreditCard,
  Shield,
  DollarSign
} from "lucide-react"
import { getOrderStatusConfig, getPaymentStatusConfig } from "@/lib/utils/order-status"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CreditCard,
  Shield,
  DollarSign
}

export function OrderStatusBadge({ status }: { status?: string | null }) {
  const config = getOrderStatusConfig(status)
  const Icon = config.icon ? iconMap[config.icon] : null

  return (
    <Badge variant={config.variant} className={config.className}>
      {Icon && <Icon className="h-3 w-3 mr-1" />}
      {config.text}
    </Badge>
  )
}

export function PaymentStatusBadge({ status }: { status?: string | null }) {
  const config = getPaymentStatusConfig(status)
  const Icon = config.icon ? iconMap[config.icon] : null

  return (
    <Badge variant={config.variant} className={config.className}>
      {Icon && <Icon className="h-3 w-3 mr-1" />}
      {config.text}
    </Badge>
  )
}



