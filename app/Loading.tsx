"use client"

export default function Loading() {
    return (
        <div className="h-screen w-full flex items-center justify-center">
            <div className="flex space-x-2">
                <div className="w-4 h-4 bg-gray-600 rounded-full animate-bounce"></div>
                <div className="w-4 h-4 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-4 h-4 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
        </div>
    )
}