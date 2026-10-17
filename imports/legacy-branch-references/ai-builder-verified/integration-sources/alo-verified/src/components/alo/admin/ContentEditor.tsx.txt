'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import {
  Type, Square, Circle, Minus, Undo2, Redo2, ZoomIn, ZoomOut,
  Save, Download, Rocket, Eye, EyeOff, Lock, Unlock,
  ChevronUp, ChevronDown, Trash2, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Plus, ImageIcon, Palette, Layers
} from 'lucide-react'

interface CanvasElement {
  id: string
  type: 'text' | 'rectangle' | 'circle' | 'line'
  x: number
  y: number
  width: number
  height: number
  text: string
  fontFamily: string
  fontSize: number
  color: string
  fontWeight: string
  fontStyle: string
  textDecoration: string
  textAlign: string
  opacity: number
  zIndex: number
  visible: boolean
  locked: boolean
  fill: string
}

const TEMPLATES = [
  { name: 'Facebook Post', w: 1200, h: 630 },
  { name: 'Facebook Cover', w: 820, h: 312 },
  { name: 'Instagram Post', w: 1080, h: 1080 },
  { name: 'Instagram Story', w: 1080, h: 1920 },
  { name: 'TikTok Video', w: 1080, h: 1920 },
  { name: 'YouTube Thumbnail', w: 1280, h: 720 },
  { name: 'LinkedIn Post', w: 1200, h: 627 },
  { name: 'WhatsApp Status', w: 1080, h: 1920 },
]

const FONTS = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana']

let idCounter = 0
const newId = () => `el-${++idCounter}-${Date.now()}`

const makeTextEl = (z: number): CanvasElement => ({
  id: newId(), type: 'text', x: 100, y: 100, width: 300, height: 60,
  text: 'Your Text Here', fontFamily: 'Arial', fontSize: 28, color: '#ffffff',
  fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none',
  textAlign: 'left', opacity: 100, zIndex: z, visible: true, locked: false, fill: 'transparent',
})

const makeShapeEl = (shape: 'rectangle' | 'circle' | 'line', z: number): CanvasElement => ({
  id: newId(), type: shape, x: 150, y: 150,
  width: shape === 'line' ? 200 : 150, height: shape === 'line' ? 4 : 150,
  text: '', fontFamily: 'Arial', fontSize: 16, color: '#ffffff',
  fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none',
  textAlign: 'left', opacity: 100, zIndex: z, visible: true, locked: false,
  fill: shape === 'line' ? '#ffffff' : '#F37021',
})

export default function ContentEditor() {
  const [template, setTemplate] = useState(TEMPLATES[0])
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(50)
  const [bgColor, setBgColor] = useState('#1A2332')
  const [bgImage, setBgImage] = useState('')
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null)
  const [resizing, setResizing] = useState<{ id: string; corner: string; sx: number; sy: number; sw: number; sh: number } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savedDesigns, setSavedDesigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Fetch saved designs from API
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const res = await fetch('/api/content-editor')
        if (res.ok) {
          const data = await res.json()
          setSavedDesigns(data.designs || [])
        }
      } catch (err) {
        console.error('Failed to fetch designs:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDesigns()
  }, [])

  const selected = elements.find(e => e.id === selectedId) || null
  const scale = zoom / 100

  const addText = () => setElements(prev => [...prev, makeTextEl(prev.length)])
  const addShape = (s: 'rectangle' | 'circle' | 'line') => setElements(prev => [...prev, makeShapeEl(s, prev.length)])

  const updateEl = useCallback((id: string, patch: Partial<CanvasElement>) => {
    setElements(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
  }, [])

  const deleteEl = (id: string) => {
    setElements(prev => prev.filter(e => e.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const moveLayer = (id: string, dir: 'up' | 'down') => {
    setElements(prev => {
      const idx = prev.findIndex(e => e.id === id)
      if (idx < 0) return prev
      const arr = [...prev]
      const swapIdx = dir === 'up' ? idx + 1 : idx - 1
      if (swapIdx < 0 || swapIdx >= arr.length) return prev
      ;[arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]]
      return arr.map((e, i) => ({ ...e, zIndex: i }))
    })
  }

  const toCanvas = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const r = canvasRef.current.getBoundingClientRect()
    return { x: (clientX - r.left) / scale, y: (clientY - r.top) / scale }
  }

  const onCanvasDown = (e: React.MouseEvent) => {
    const pos = toCanvas(e.clientX, e.clientY)
    const hit = [...elements].reverse().find(el => el.visible && !el.locked &&
      pos.x >= el.x && pos.x <= el.x + el.width && pos.y >= el.y && pos.y <= el.y + el.height)
    if (hit) {
      setSelectedId(hit.id)
      setDragging({ id: hit.id, ox: pos.x - hit.x, oy: pos.y - hit.y })
    } else {
      setSelectedId(null)
    }
    setEditingId(null)
  }

  const onHandleDown = (e: React.MouseEvent, id: string, corner: string) => {
    e.stopPropagation()
    const el = elements.find(el2 => el2.id === id)
    if (!el) return
    setResizing({ id, corner, sx: e.clientX, sy: e.clientY, sw: el.width, sh: el.height })
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging) {
        const pos = toCanvas(e.clientX, e.clientY)
        updateEl(dragging.id, { x: Math.round(pos.x - dragging.ox), y: Math.round(pos.y - dragging.oy) })
      }
      if (resizing) {
        const dx = (e.clientX - resizing.sx) / scale
        const dy = (e.clientY - resizing.sy) / scale
        const el = elements.find(el2 => el2.id === resizing.id)
        if (!el) return
        let w = resizing.sw, h = resizing.sh, x = el.x, y = el.y
        if (resizing.corner.includes('r')) w = Math.max(20, resizing.sw + dx)
        if (resizing.corner.includes('b')) h = Math.max(10, resizing.sh + dy)
        if (resizing.corner.includes('l')) { w = Math.max(20, resizing.sw - dx); x = el.x + (resizing.sw - w) }
        if (resizing.corner.includes('t')) { h = Math.max(10, resizing.sh - dy); y = el.y + (resizing.sh - h) }
        updateEl(resizing.id, { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) })
      }
    }
    const onUp = () => { setDragging(null); setResizing(null) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging, resizing, scale, elements, updateEl])

  const onDblClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setEditingId(id)
    setSelectedId(id)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0f1724' }}>
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: '#1e2d42', background: '#141e2e' }}>
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm">{template.name}</span>
          <span className="text-gray-400 text-xs">{template.w}×{template.h}px</span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="text-gray-400 hover:text-white h-8 w-8"><Undo2 size={16}/></Button></TooltipTrigger><TooltipContent>Undo</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="text-gray-400 hover:text-white h-8 w-8"><Redo2 size={16}/></Button></TooltipTrigger><TooltipContent>Redo</TooltipContent></Tooltip>
          <Separator orientation="vertical" className="h-5 mx-1 bg-gray-700"/>
          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="text-gray-400 hover:text-white h-8 w-8" onClick={() => setZoom(z => Math.max(10, z - 10))}><ZoomOut size={16}/></Button></TooltipTrigger><TooltipContent>Zoom Out</TooltipContent></Tooltip>
          <span className="text-gray-300 text-xs w-10 text-center">{zoom}%</span>
          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="text-gray-400 hover:text-white h-8 w-8" onClick={() => setZoom(z => Math.min(200, z + 10))}><ZoomIn size={16}/></Button></TooltipTrigger><TooltipContent>Zoom In</TooltipContent></Tooltip>
          <Separator orientation="vertical" className="h-5 mx-1 bg-gray-700"/>
          <Button size="sm" className="h-7 text-xs bg-[#F37021] hover:bg-[#e06010] text-white" onClick={async () => {
            try {
              const res = await fetch('/api/content-editor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: template.name, templateType: template.name, width: template.w, height: template.h, layers: elements })
              })
              if (res.ok) { toast.success('Template saved!'); const data = await fetch('/api/content-editor'); if (data.ok) { const d = await data.json(); setSavedDesigns(d.designs || []) } }
              else { toast.error('Failed to save') }
            } catch { toast.error('Failed to save') }
          }}><Save size={14} className="mr-1"/>Save</Button>
          <Button size="sm" className="h-7 text-xs bg-[#0066CC] hover:bg-[#0055aa] text-white" onClick={() => toast.success('Exported!')}><Download size={14} className="mr-1"/>Export PNG</Button>
          <Button size="sm" className="h-7 text-xs bg-[#1A2332] hover:bg-[#253345] text-white border border-gray-600" onClick={() => toast.success('Sent to Marketing Studio!')}><Rocket size={14} className="mr-1"/>Use in Marketing</Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL */}
        <div className="w-56 border-r flex flex-col overflow-y-auto" style={{ borderColor: '#1e2d42', background: '#141e2e' }}>
          <div className="p-3">
            <h3 className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Templates</h3>
            <div className="space-y-1">
              {TEMPLATES.map(t => (
                <button key={t.name} onClick={() => setTemplate(t)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${template.name === t.name ? 'bg-[#F37021]/20 text-[#F37021]' : 'text-gray-300 hover:bg-gray-700/50'}`}>
                  {t.name} <span className="text-gray-500 ml-1">{t.w}×{t.h}</span>
                </button>
              ))}
            </div>
          </div>
          <Separator className="bg-gray-700/50"/>
          <div className="p-3">
            <h3 className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Elements</h3>
            <div className="space-y-1.5">
              <Button size="sm" className="w-full h-8 text-xs bg-[#F37021] hover:bg-[#e06010] text-white justify-start" onClick={addText}><Type size={14} className="mr-2"/>Add Text</Button>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-gray-600 text-gray-300" onClick={() => addShape('rectangle')}><Square size={12} className="mr-1"/>Rect</Button>
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-gray-600 text-gray-300" onClick={() => addShape('circle')}><Circle size={12} className="mr-1"/>Circle</Button>
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-gray-600 text-gray-300" onClick={() => addShape('line')}><Minus size={12} className="mr-1"/>Line</Button>
              </div>
            </div>
          </div>
          <Separator className="bg-gray-700/50"/>
          <div className="p-3">
            <h3 className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Background</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Palette size={14} className="text-gray-400"/>
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"/>
                <span className="text-gray-400 text-xs">{bgColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon size={14} className="text-gray-400"/>
                <Input value={bgImage} onChange={e => setBgImage(e.target.value)} placeholder="Image URL" className="h-7 text-xs bg-gray-800 border-gray-600 text-gray-200"/>
              </div>
            </div>
          </div>
        </div>

        {/* CANVAS AREA */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-8"
          style={{ background: 'repeating-conic-gradient(#1a2535 0% 25%, #151f2d 0% 50%) 0 0 / 20px 20px' }}>
          <div ref={canvasRef}
            className="relative shadow-2xl"
            style={{
              width: template.w, height: template.h,
              transform: `scale(${scale})`, transformOrigin: 'center center',
              background: bgImage ? `url(${bgImage}) center/cover` : bgColor,
            }}
            onMouseDown={onCanvasDown}>
            {elements.filter(e => e.visible).map(el => (
              <div key={el.id}
                className={`absolute cursor-move ${el.locked ? 'cursor-not-allowed' : ''}`}
                style={{ left: el.x, top: el.y, width: el.width, height: el.height, zIndex: el.zIndex, opacity: el.opacity / 100 }}
                onMouseDown={e => { if (!el.locked) { e.stopPropagation(); setSelectedId(el.id); setDragging({ id: el.id, ox: (e.clientX / scale) - el.x + (canvasRef.current?.getBoundingClientRect().left || 0) / scale, oy: (e.clientY / scale) - el.y + (canvasRef.current?.getBoundingClientRect().top || 0) / scale }) } else { e.stopPropagation(); setSelectedId(el.id) } }}
                onDoubleClick={e => onDblClick(e, el.id)}>
                {el.type === 'text' ? (
                  editingId === el.id ? (
                    <textarea value={el.text} onChange={e => updateEl(el.id, { text: e.target.value })}
                      className="w-full h-full bg-transparent border-none outline-none resize-none"
                      style={{ fontFamily: el.fontFamily, fontSize: el.fontSize, color: el.color, fontWeight: el.fontWeight, fontStyle: el.fontStyle, textDecoration: el.textDecoration, textAlign: el.textAlign as CanvasTextAlign }}
                      autoFocus onBlur={() => setEditingId(null)}/>
                  ) : (
                    <div className="w-full h-full overflow-hidden whitespace-pre-wrap break-words select-none"
                      style={{ fontFamily: el.fontFamily, fontSize: el.fontSize, color: el.color, fontWeight: el.fontWeight, fontStyle: el.fontStyle, textDecoration: el.textDecoration, textAlign: el.textAlign as CanvasTextAlign }}>
                      {el.text || ' '}
                    </div>
                  )
                ) : el.type === 'rectangle' ? (
                  <div className="w-full h-full rounded" style={{ background: el.fill }}/>
                ) : el.type === 'circle' ? (
                  <div className="w-full h-full rounded-full" style={{ background: el.fill }}/>
                ) : (
                  <div className="w-full h-full" style={{ background: el.fill }}/>
                )}
                {selectedId === el.id && (
                  <>
                    <div className="absolute inset-0 border-2 border-[#0066CC] pointer-events-none"/>
                    {!el.locked && ['tl','tr','bl','br'].map(c => (
                      <div key={c} className="absolute w-2.5 h-2.5 bg-white border-2 border-[#0066CC] rounded-sm"
                        style={{
                          top: c.includes('t') ? -5 : undefined, bottom: c.includes('b') ? -5 : undefined,
                          left: c.includes('l') ? -5 : undefined, right: c.includes('r') ? -5 : undefined,
                          cursor: c === 'tl' ? 'nwse-resize' : c === 'tr' ? 'nesw-resize' : c === 'bl' ? 'nesw-resize' : 'nwse-resize',
                        }}
                        onMouseDown={e => onHandleDown(e, el.id, c)}/>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-60 border-l flex flex-col overflow-y-auto" style={{ borderColor: '#1e2d42', background: '#141e2e' }}>
          {selected ? (
            <div className="p-3 space-y-3">
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Properties</h3>
              {selected.type === 'text' && (
                <>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Text</label>
                    <Input value={selected.text} onChange={e => updateEl(selected.id, { text: e.target.value })} className="h-7 text-xs bg-gray-800 border-gray-600 text-gray-200"/>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Font</label>
                    <Select value={selected.fontFamily} onValueChange={v => updateEl(selected.id, { fontFamily: v })}>
                      <SelectTrigger className="h-7 text-xs bg-gray-800 border-gray-600 text-gray-200 w-full"><SelectValue/></SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">{FONTS.map(f => <SelectItem key={f} value={f} className="text-gray-200 text-xs">{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Size: {selected.fontSize}px</label>
                    <Slider value={[selected.fontSize]} min={12} max={72} step={1} onValueChange={v => updateEl(selected.id, { fontSize: v[0] })}/>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={selected.color} onChange={e => updateEl(selected.id, { color: e.target.value })} className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"/>
                      <span className="text-gray-400 text-xs">{selected.color}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Toggle size="sm" pressed={selected.fontWeight === 'bold'} onPressedChange={p => updateEl(selected.id, { fontWeight: p ? 'bold' : 'normal' })} className="text-gray-300 data-[state=on]:bg-[#F37021] data-[state=on]:text-white h-7 w-7"><Bold size={14}/></Toggle>
                    <Toggle size="sm" pressed={selected.fontStyle === 'italic'} onPressedChange={p => updateEl(selected.id, { fontStyle: p ? 'italic' : 'normal' })} className="text-gray-300 data-[state=on]:bg-[#F37021] data-[state=on]:text-white h-7 w-7"><Italic size={14}/></Toggle>
                    <Toggle size="sm" pressed={selected.textDecoration === 'underline'} onPressedChange={p => updateEl(selected.id, { textDecoration: p ? 'underline' : 'none' })} className="text-gray-300 data-[state=on]:bg-[#F37021] data-[state=on]:text-white h-7 w-7"><Underline size={14}/></Toggle>
                  </div>
                  <div className="flex gap-1">
                    <Toggle size="sm" pressed={selected.textAlign === 'left'} onPressedChange={() => updateEl(selected.id, { textAlign: 'left' })} className="text-gray-300 data-[state=on]:bg-[#F37021] data-[state=on]:text-white h-7 w-7"><AlignLeft size={14}/></Toggle>
                    <Toggle size="sm" pressed={selected.textAlign === 'center'} onPressedChange={() => updateEl(selected.id, { textAlign: 'center' })} className="text-gray-300 data-[state=on]:bg-[#F37021] data-[state=on]:text-white h-7 w-7"><AlignCenter size={14}/></Toggle>
                    <Toggle size="sm" pressed={selected.textAlign === 'right'} onPressedChange={() => updateEl(selected.id, { textAlign: 'right' })} className="text-gray-300 data-[state=on]:bg-[#F37021] data-[state=on]:text-white h-7 w-7"><AlignRight size={14}/></Toggle>
                  </div>
                </>
              )}
              {(selected.type === 'rectangle' || selected.type === 'circle' || selected.type === 'line') && (
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Fill Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={selected.fill} onChange={e => updateEl(selected.id, { fill: e.target.value })} className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"/>
                    <span className="text-gray-400 text-xs">{selected.fill}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Opacity: {selected.opacity}%</label>
                <Slider value={[selected.opacity]} min={0} max={100} step={1} onValueChange={v => updateEl(selected.id, { opacity: v[0] })}/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-gray-400 text-xs mb-1 block">X</label><Input type="number" value={selected.x} onChange={e => updateEl(selected.id, { x: +e.target.value })} className="h-7 text-xs bg-gray-800 border-gray-600 text-gray-200"/></div>
                <div><label className="text-gray-400 text-xs mb-1 block">Y</label><Input type="number" value={selected.y} onChange={e => updateEl(selected.id, { y: +e.target.value })} className="h-7 text-xs bg-gray-800 border-gray-600 text-gray-200"/></div>
                <div><label className="text-gray-400 text-xs mb-1 block">W</label><Input type="number" value={selected.width} onChange={e => updateEl(selected.id, { width: +e.target.value })} className="h-7 text-xs bg-gray-800 border-gray-600 text-gray-200"/></div>
                <div><label className="text-gray-400 text-xs mb-1 block">H</label><Input type="number" value={selected.height} onChange={e => updateEl(selected.id, { height: +e.target.value })} className="h-7 text-xs bg-gray-800 border-gray-600 text-gray-200"/></div>
              </div>
              <Button size="sm" variant="destructive" className="w-full h-8 text-xs" onClick={() => deleteEl(selected.id)}><Trash2 size={14} className="mr-1"/>Delete Element</Button>
            </div>
          ) : (
            <div className="p-3 text-center text-gray-500 text-xs mt-8">
              <Layers size={24} className="mx-auto mb-2 opacity-50"/>
              Select an element to edit its properties
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM PANEL - LAYERS */}
      <div className="border-t" style={{ borderColor: '#1e2d42', background: '#141e2e' }}>
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1"><Layers size={12}/> Layers ({elements.length})</span>
          <Button size="sm" variant="ghost" className="h-6 text-xs text-gray-400" onClick={addText}><Plus size={12} className="mr-1"/>Add</Button>
        </div>
        <div className="flex gap-1 px-3 pb-2 overflow-x-auto max-h-20">
          {elements.length === 0 && <span className="text-gray-600 text-xs py-2">No elements yet</span>}
          {elements.map((el, i) => (
            <Card key={el.id}
              className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 cursor-pointer text-xs border ${selectedId === el.id ? 'border-[#0066CC] bg-[#0066CC]/10' : 'border-gray-700 bg-gray-800/50'}`}
              onClick={() => setSelectedId(el.id)}>
              {el.type === 'text' ? <Type size={10} className="text-gray-400"/> : el.type === 'rectangle' ? <Square size={10} className="text-gray-400"/> : el.type === 'circle' ? <Circle size={10} className="text-gray-400"/> : <Minus size={10} className="text-gray-400"/>}
              <span className="text-gray-300 max-w-[60px] truncate">{el.type === 'text' ? (el.text.slice(0, 8) || 'Text') : el.type}</span>
              <button className="text-gray-500 hover:text-gray-300" onClick={e => { e.stopPropagation(); updateEl(el.id, { visible: !el.visible }) }}>
                {el.visible ? <Eye size={10}/> : <EyeOff size={10}/>}
              </button>
              <button className="text-gray-500 hover:text-gray-300" onClick={e => { e.stopPropagation(); updateEl(el.id, { locked: !el.locked }) }}>
                {el.locked ? <Lock size={10}/> : <Unlock size={10}/>}
              </button>
              <button className="text-gray-500 hover:text-gray-300" disabled={i === elements.length - 1} onClick={e => { e.stopPropagation(); moveLayer(el.id, 'up') }}><ChevronUp size={10}/></button>
              <button className="text-gray-500 hover:text-gray-300" disabled={i === 0} onClick={e => { e.stopPropagation(); moveLayer(el.id, 'down') }}><ChevronDown size={10}/></button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
