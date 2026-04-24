import React, { useState, useRef, useCallback } from 'react'
import { Camera, QrCode, Sparkles, Loader2 } from 'lucide-react'
import { ocrPhoto, lookupBarcode, getSuggestions } from '../lib/api'
import toast from 'react-hot-toast'

interface Props {
  listId: string
  onAdd: (names: string[]) => void
  creditBalance: number
}

export default function AddItemBar({ listId, onAdd, creditBalance }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanning, setScanning] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd([trimmed])
    setText('')
  }

  const handlePhoto = useCallback(async (file: File) => {
    if (creditBalance <= 0) {
      toast.error('No credits left. Buy more to use AI features.')
      return
    }
    setLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const items = await ocrPhoto(base64)
        if (items.length === 0) {
          toast.error('No products found in photo')
        } else {
          onAdd(items)
          toast.success(`Added ${items.length} item${items.length > 1 ? 's' : ''}`)
        }
        setLoading(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      toast.error(err.message === 'NO_CREDITS' ? 'No credits' : 'OCR failed')
      setLoading(false)
    }
  }, [creditBalance, onAdd])

  const handleBarcodeScan = useCallback(async () => {
    if (!('BarcodeDetector' in window)) {
      toast.error('Barcode scanning not supported on this device')
      return
    }
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (!videoRef.current) return
      videoRef.current.srcObject = stream
      videoRef.current.play()

      // @ts-ignore
      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] })
      
      const scan = async () => {
        if (!videoRef.current || !scanning) return
        try {
          const barcodes = await detector.detect(videoRef.current)
          if (barcodes.length > 0) {
            const barcode = barcodes[0].rawValue
            stream.getTracks().forEach(t => t.stop())
            setScanning(false)
            
            setLoading(true)
            const name = await lookupBarcode(barcode)
            setLoading(false)
            
            if (name) {
              onAdd([name])
              toast.success(`Added: ${name}`)
            } else {
              onAdd([barcode])
              toast.success(`Added barcode: ${barcode}`)
            }
          } else {
            requestAnimationFrame(scan)
          }
        } catch {
          requestAnimationFrame(scan)
        }
      }
      requestAnimationFrame(scan)
    } catch {
      toast.error('Could not access camera')
      setScanning(false)
      setLoading(false)
    }
  }, [scanning, onAdd])

  const stopScanning = () => {
    setScanning(false)
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
  }

  const handleSuggest = async () => {
    if (creditBalance <= 0) {
      toast.error('No credits left. Buy more to use AI features.')
      return
    }
    setLoading(true)
    try {
      const suggestions = await getSuggestions(listId)
      if (suggestions.length === 0) {
        toast('No suggestions yet — add more items first!')
      } else {
        onAdd(suggestions)
        toast.success(`Added ${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''}`)
      }
    } catch (err: any) {
      toast.error('Could not get suggestions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {scanning && (
        <div className="relative bg-black" style={{ height: '200px' }}>
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-32 border-2 border-brand-400 rounded-lg opacity-70" />
          </div>
          <button
            onClick={stopScanning}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg"
          >
            ×
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add item..."
          className="flex-1 text-[17px] bg-gray-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-400 min-w-0"
          autoComplete="off"
          autoCorrect="off"
        />
        {text.trim() ? (
          <button
            type="submit"
            className="flex-shrink-0 bg-brand-500 text-white rounded-xl px-4 py-2.5 font-semibold text-[17px] active:bg-brand-600 transition-colors"
          >
            Add
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
              title="Photo OCR"
            >
              {loading ? <Loader2 size={20} className="text-gray-500 animate-spin" /> : <Camera size={20} className="text-gray-600" />}
            </button>
            <button
              type="button"
              onClick={scanning ? stopScanning : handleBarcodeScan}
              disabled={loading}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${scanning ? 'bg-brand-100' : 'bg-gray-100 active:bg-gray-200'}`}
              title="Scan barcode"
            >
              <QrCode size={20} className={scanning ? 'text-brand-600' : 'text-gray-600'} />
            </button>
            <button
              type="button"
              onClick={handleSuggest}
              disabled={loading}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
              title="AI Suggestions"
            >
              <Sparkles size={20} className="text-brand-500" />
            </button>
          </div>
        )}
      </form>
      
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handlePhoto(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
