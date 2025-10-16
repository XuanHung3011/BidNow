"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

const mockMessages = [
  { sender: "Hỗ trợ", message: "Xin chào! Tôi có thể giúp gì cho bạn?", time: "10:30", isSupport: true },
  { sender: "Bạn", message: "Sản phẩm này còn bảo hành không?", time: "10:31", isSupport: false },
  {
    sender: "Hỗ trợ",
    message: "Sản phẩm có bảo hành chính hãng 12 tháng tại Apple Store Việt Nam.",
    time: "10:32",
    isSupport: true,
  },
]

export function LiveChat() {
  const [messages, setMessages] = useState(mockMessages)
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (!input.trim()) return

    setMessages([
      ...messages,
      {
        sender: "Bạn",
        message: input,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        isSupport: false,
      },
    ])
    setInput("")
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 h-64 space-y-3 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.isSupport ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                msg.isSupport ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
              }`}
            >
              <div className="text-xs font-semibold opacity-70">{msg.sender}</div>
              <div className="mt-1 text-sm">{msg.message}</div>
              <div className="mt-1 text-xs opacity-60">{msg.time}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
        />
        <Button size="icon" onClick={handleSend}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
