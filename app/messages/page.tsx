import { ProtectedRoute } from "@/components/protected-route"
import { MessagesView } from "@/components/messages/messages-view"

export default function MessagesPage() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "seller", "admin"]}>
      <div className="container mx-auto px-4 py-8">
        <MessagesView />
      </div>
    </ProtectedRoute>
  )
}
