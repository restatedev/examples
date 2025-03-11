"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {randomUUID} from "node:crypto";

// Simple message type
type Message = {
  id: string
  content: string
  sender: "user" | "assistant" | "system"
  timestamp: number
}

export default function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [sessionId, setSessionId] = useState("") // Example session ID
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // set session id to session plus random number
    setSessionId("session" + Math.floor(Math.random() * 1000))
  }, [])

  // Function to send a message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputMessage.trim()) return

    // Add user message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")

    try {
      // Send message to the specified endpoint
      const response = await fetch(`http://localhost:8080/ChatSession/${sessionId}/onMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: inputMessage }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const responseData = await response.json()

      // Add response to the chat
      const responseMessage: Message = {
        id: Date.now().toString(),
        content: responseData.message || "No response",
        sender: "assistant",
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, responseMessage])
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  // Function to poll for new messages
  const pollForMessages = async () => {
    console.log("Polling for messages for session:", sessionId)
    try {
      const response = await fetch(`http://localhost:8080/ChatSession/${sessionId}/getChatHistory`, {
        method: "GET",
      })

      if (!response.ok) {
        return
      }

      const data = await response.json()

      console.log(data)

      if (data && data.length > 0) {
        const newMessages = data.map((msg: any) => {
          console.log(msg)
          return {
            id: Date.now().toString() + Math.random(),
            content: (msg["role"] == "assistant") ? JSON.parse(msg["content"])["message"] : msg["content"],
            sender: msg["role"],
            timestamp: Date.now(),
          }
        })

        console.log(newMessages)

        setMessages((prev) => [...newMessages])
      }
    } catch (error) {
      console.error("Error polling for messages:", error)
    }
  }

  // Set up polling interval
  useEffect(() => {
    const interval = setInterval(pollForMessages, 3000)
    return () => clearInterval(interval)
  }, [sessionId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#f5f5f7] dark:bg-[#1c1c1e]">
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <h1 className="text-xl font-medium text-center mb-4 text-[#1d1d1f] dark:text-white">Messages</h1>

        {/* Session ID input */}
        <div className="mb-4">
          <div className="flex items-center bg-white dark:bg-[#2c2c2e] rounded-xl shadow-sm overflow-hidden">
            <span className="pl-3 text-[#86868b] text-sm">Session: {sessionId}</span>
          </div>
        </div>

        {/* Messages container */}
        <div className="flex-1 overflow-y-auto mb-4 px-2">
          {messages.map((message) => (
            <div key={message.id} className={`mb-3 max-w-[80%] ${message.sender === "user" ? "ml-auto" : "mr-auto"}`}>
              <div
                className={`p-3 rounded-2xl ${
                  message.sender === "user"
                    ? "bg-[#0a84ff] text-white rounded-tr-sm"
                    : "bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white rounded-tl-sm shadow-sm"
                }`}
              >
                {message.content}
              </div>
              <div className={`text-xs mt-1 text-[#86868b] ${message.sender === "user" ? "text-right" : "text-left"}`}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input form */}
      <div className="border-t border-[#d2d2d7] dark:border-[#38383c] p-4 bg-white dark:bg-[#1c1c1e]">
        <form onSubmit={sendMessage} className="flex items-center">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Message"
            className="flex-1 p-3 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] outline-none text-[#1d1d1f] dark:text-white"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className={`ml-2 w-10 h-10 rounded-full flex items-center justify-center ${
              inputMessage.trim() ? "bg-[#0a84ff] text-white" : "bg-[#e5e5ea] dark:bg-[#2c2c2e] text-[#86868b]"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}

