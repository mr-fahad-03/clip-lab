"use client"

import { useState, useEffect } from "react"
import { Instagram, X, Star, Shield, Zap, Download, Headphones, Video } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PremiumPopup() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Show popup after a short delay when page loads
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const closePopup = () => {
    setIsOpen(false)
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md md:max-w-lg bg-black/80 border border-gray-700 rounded-xl overflow-hidden backdrop-filter backdrop-blur-lg shadow-2xl">
            {/* Close button */}
            <button
              onClick={closePopup}
              className="absolute top-3 right-3 text-gray-400 hover:text-white z-10"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="p-5 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-red-500 to-purple-600 p-2 rounded-lg">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Clip-Lab Premium</h2>
                  <p className="text-gray-400 text-sm">Enhanced Video Experience</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-white font-medium mb-4">Premium Features Implemented:</h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Embedding Bypass</h4>
                    <p className="text-gray-400 text-sm">Watch restricted videos that normally can't be embedded</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Headphones className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Background Audio</h4>
                    <p className="text-gray-400 text-sm">Continue listening to videos while using other apps</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Video Downloads</h4>
                    <p className="text-gray-400 text-sm">Save videos for offline viewing in multiple formats</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Ad-Free Experience</h4>
                    <p className="text-gray-400 text-sm">Enjoy videos without interruptions</p>
                  </div>
                </div>

               
              </div>

              {/* Creator credit */}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-gray-400 text-sm">Created By</p>
                    <p className="text-white font-bold">Mr ~FZ</p>
                  </div>
                  <a
                    href="https://www.instagram.com/mr_fahad_03/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
                  >
                    <Instagram className="h-4 w-4" />
                    <span>Follow on Instagram</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 bg-gray-900/50 border-t border-gray-700 flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                variant="outline"
                onClick={closePopup}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Close
              </Button>
             
            </div>
          </div>
        </div>
      )}
    </>
  )
}
