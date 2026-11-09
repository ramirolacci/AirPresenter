import React, { useRef, useEffect, useState, useCallback } from 'react';
import { EditorAction, HandLandmarks, RecognizedGesture } from '../types/hand';
import { useCanvasManipulation } from '../hooks/useCanvasManipulation';
import { useUndoRedo } from '../hooks/useUndoRedo';

interface ImageEditorProps {
    onActionCompleted?: (action: EditorAction) => void;
    className?: string;
    hands?: HandLandmarks[];
    currentAction?: EditorAction;
    gestures?: RecognizedGesture[];
    isGesturePaused?: boolean;
    onToggleGesturePause?: () => void;
    handCursorPosition?: { x: number; y: number } | null;
    handCursorState?: { isVisible: boolean; isDrawing: boolean; isErasing: boolean; isMoving: boolean };
}

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning';
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
    onActionCompleted,
    className = '',
    hands = [],
    currentAction = 'NONE',
    gestures = [],
    isGesturePaused = false,
    onToggleGesturePause,
    handCursorPosition = null,
    handCursorState,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 2500);
    }, []);

    const [showToolbar, setShowToolbar] = useState(true);

    const {
        currentTool,
        selectTool,
        pointerPos,
        brushColor,
        brushSize,
        setBrushColor,
        setBrushSize,
        undo,
        redo,
        historyEntries,
        clearCanvas,
        exportAs,
    } = useCanvasManipulation({
        canvasRef,
        onActionCompleted,
        hands,
        gestures,
        isGesturePaused,
        onToggleGesturePause,
        showToast,
        virtualPointerPos: handCursorPosition,
    });

    const canvasWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const canvasHeight = typeof window !== 'undefined' ? window.innerHeight : 720;

    const { toastMessage } = useUndoRedo({
        hands,
        gestures,
        isPaused: isGesturePaused,
        undo,
        redo,
        onToast: showToast,
        historyEntries,
    });

    useEffect(() => {
        if (currentAction && currentAction !== 'NONE' && currentAction !== currentTool) {
            selectTool(currentAction);
        }
    }, [currentAction, currentTool, selectTool]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) {
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
                setShowToolbar((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const cursorPosition = handCursorPosition ?? pointerPos;
    const showCursor = Boolean(cursorPosition) && !isGesturePaused && (handCursorState?.isVisible ?? true);
    const cursorColor = currentTool === 'SELECT_ERASER' ? '#3b82f6' : currentTool === 'SELECT_LASER' ? '#FF0055' : currentTool === 'SELECT_MOVE' ? '#22c55e' : brushColor;
    const quickColors = ['#00F0FF', '#FFD700', '#FF007F', '#00FF66', '#FFFFFF', '#FF3333'];

    return (
        <div className={`relative h-screen w-screen overflow-hidden ${className}`}>
            <div className="absolute inset-0">
                <div className="absolute inset-0 overflow-hidden">
                    <canvas ref={canvasRef} className="block h-screen w-screen" />
                </div>
                {showCursor && cursorPosition && (
                    <div
                        className="pointer-events-none absolute flex items-center justify-center rounded-full border-2 transition-none"
                        style={{
                            left: `${(cursorPosition.x / canvasWidth) * 100}%`,
                            top: `${(cursorPosition.y / canvasHeight) * 100}%`,
                            width: currentTool === 'SELECT_ERASER' ? `${Math.max(brushSize * 4, 24)}px` : `${Math.max(brushSize + 10, 16)}px`,
                            height: currentTool === 'SELECT_ERASER' ? `${Math.max(brushSize * 4, 24)}px` : `${Math.max(brushSize + 10, 16)}px`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 100,
                            borderColor: cursorColor,
                            backgroundColor: `${cursorColor}33`,
                            boxShadow: `0 0 15px ${cursorColor}aa`,
                        }}
                    >
                        <div
                            className="rounded-full"
                            style={{
                                width: `${Math.min(brushSize, 10)}px`,
                                height: `${Math.min(brushSize, 10)}px`,
                                backgroundColor: cursorColor,
                            }}
                        />
                        <div
                            className="absolute left-6 top-6 whitespace-nowrap rounded-md border border-white/20 bg-black/80 px-2 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur"
                            style={{ borderColor: cursorColor }}
                        >
                            {handCursorState?.isErasing
                                ? '🧹 Borrando'
                                : currentTool === 'SELECT_LASER' && handCursorState?.isDrawing
                                ? '🔴 Puntero Láser'
                                : currentTool === 'SELECT_MOVE' && handCursorState?.isMoving
                                ? '✋ Moviendo objeto'
                                : handCursorState?.isDrawing
                                ? currentTool === 'DRAW_RECT'
                                    ? '⬜ Rectángulo'
                                    : currentTool === 'DRAW_CIRCLE'
                                    ? '⭕ Círculo'
                                    : currentTool === 'DRAW_LINE'
                                    ? '📏 Línea'
                                    : '✏️ Dibujando'
                                : '📍 Puntero (Señala para interactuar)'}
                        </div>
                    </div>
                )}
            </div>

            <div className="pointer-events-none absolute inset-0 z-10">
                {/* Top Left Gestures Guide */}
                <div className="pointer-events-auto absolute left-4 top-4 z-20 flex flex-col gap-2">
                    {!isGesturePaused && (
                        <div className="flex max-w-xs flex-col gap-1.5 rounded-2xl border border-cyan-400/30 bg-black/80 p-3.5 shadow-2xl backdrop-blur text-xs text-white">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 mb-0.5">
                                🖐️ Guía de Gestos
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-base">☝️</span>
                                <div>
                                    <span className="font-semibold text-cyan-200">Solo Índice (Señalar):</span>
                                    <p className="text-[11px] text-white/70">✏️ <b>Dibujar y escribir en vivo</b></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-base">🤏</span>
                                <div>
                                    <span className="font-semibold text-emerald-300">Pinch (Pulgar + Índice):</span>
                                    <p className="text-[11px] text-white/70">✋ <b>Tocar / Agarrar y Arrastrar objeto</b></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-base">✌️</span>
                                <div>
                                    <span className="font-semibold text-rose-300">Dos Dedos (Índice + Medio):</span>
                                    <p className="text-[11px] text-white/70">🧹 <b>Borrar trazos por encima</b></p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Presenter Toolbar */}
                <div
                    className={`pointer-events-auto absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/90 px-4 py-2.5 shadow-2xl backdrop-blur transition-all duration-300 ${
                        showToolbar ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-20 opacity-0'
                    }`}
                >
                    <button
                        onClick={() => selectTool('SELECT_BRUSH')}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${currentTool === 'SELECT_BRUSH' ? 'bg-cyan-500 text-black shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        title="Pincel Libre (Dibujar con Solo Índice)"
                    >
                        ✏️ Dibujar
                    </button>
                    <button
                        onClick={() => selectTool('SELECT_LASER')}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${currentTool === 'SELECT_LASER' ? 'bg-rose-500 text-white shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        title="Puntero Láser (Desvanecimiento automático en 1.8s)"
                    >
                        🔴 Láser
                    </button>
                    <button
                        onClick={() => selectTool('SELECT_MOVE')}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${currentTool === 'SELECT_MOVE' ? 'bg-emerald-500 text-black shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        title="Agarrar y Arrastrar (Pinch sobre objeto)"
                    >
                        ✋ Agarrar
                    </button>
                    <button
                        onClick={() => selectTool('SELECT_ERASER')}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${currentTool === 'SELECT_ERASER' ? 'bg-blue-500 text-white shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        title="Borrador Vectorial (Gesto Dos Dedos ✌️)"
                    >
                        🧹 Borrar
                    </button>

                    <div className="h-5 w-[1px] bg-white/20 mx-1" />

                    {/* Shapes */}
                    <button
                        onClick={() => selectTool('DRAW_CIRCLE')}
                        className={`rounded-full p-1.5 text-xs transition ${currentTool === 'DRAW_CIRCLE' ? 'bg-cyan-500 text-black font-bold' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                        title="Círculo"
                    >
                        ⭕
                    </button>
                    <button
                        onClick={() => selectTool('DRAW_RECT')}
                        className={`rounded-full p-1.5 text-xs transition ${currentTool === 'DRAW_RECT' ? 'bg-cyan-500 text-black font-bold' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                        title="Rectángulo"
                    >
                        ⬜
                    </button>
                    <button
                        onClick={() => selectTool('DRAW_LINE')}
                        className={`rounded-full p-1.5 text-xs transition ${currentTool === 'DRAW_LINE' ? 'bg-cyan-500 text-black font-bold' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                        title="Línea / Flecha"
                    >
                        📏
                    </button>

                    <div className="h-5 w-[1px] bg-white/20 mx-1" />

                    {/* Colors */}
                    <div className="flex items-center gap-1.5">
                        {quickColors.map((color) => (
                            <button
                                key={color}
                                onClick={() => setBrushColor(color)}
                                className={`h-5 w-5 rounded-full border transition-transform ${brushColor === color ? 'scale-125 border-white shadow-sm' : 'border-white/30 opacity-80 hover:opacity-100'}`}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>

                    <div className="h-5 w-[1px] bg-white/20 mx-1" />

                    <input
                        type="range"
                        min="2"
                        max="30"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-20 accent-cyan-400 cursor-pointer"
                        title="Grosor de trazo"
                    />

                    <div className="h-5 w-[1px] bg-white/20 mx-1" />

                    <button
                        onClick={() => void undo()}
                        className="rounded-full bg-white/10 p-1.5 text-xs text-white hover:bg-white/20"
                        title="Deshacer (Ctrl+Z)"
                    >
                        ↩
                    </button>
                    <button
                        onClick={() => void redo()}
                        className="rounded-full bg-white/10 p-1.5 text-xs text-white hover:bg-white/20"
                        title="Rehacer (Ctrl+Y)"
                    >
                        ↪
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                await exportAs({ format: 'png', scale: 2 });
                                showToast('📸 Captura guardada en alta resolución', 'success');
                            } catch {
                                showToast('Error al exportar captura', 'warning');
                            }
                        }}
                        className="rounded-full border border-emerald-400/30 bg-emerald-600/80 px-2.5 py-1 text-xs font-semibold text-white shadow hover:bg-emerald-500 transition"
                        title="Guardar captura PNG para compartir en la videollamada"
                    >
                        📸 Captura
                    </button>
                    <button
                        onClick={() => void clearCanvas()}
                        className="rounded-full border border-white/20 bg-rose-600/80 px-2.5 py-1 text-xs font-semibold text-white shadow hover:bg-rose-500 transition"
                        title="Limpiar pizarra"
                    >
                        🧽 Limpiar
                    </button>
                    <button
                        onClick={() => setShowToolbar(false)}
                        className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/20 hover:text-white transition"
                        title="Ocultar barra para presentación limpia (Tecla H)"
                    >
                        👁️ Ocultar
                    </button>
                </div>

                {/* Floating pill to restore toolbar when hidden */}
                {!showToolbar && (
                    <button
                        onClick={() => setShowToolbar(true)}
                        className="pointer-events-auto absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/20 bg-black/80 px-3 py-1.5 text-xs text-white shadow-xl backdrop-blur transition hover:bg-black/95 hover:scale-105"
                        title="Restaurar barra de herramientas (Tecla H)"
                    >
                        <span>👁️</span>
                        <span className="font-semibold text-white/80">Mostrar Barra (H)</span>
                    </button>
                )}



                {toastMessage && (
                    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
                        <div className="rounded-full border border-cyan-400/40 bg-black/80 px-4 py-2 text-sm font-semibold text-white shadow-2xl backdrop-blur">
                            {toastMessage}
                        </div>
                    </div>
                )}
            </div>

            <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((t) => (
                    <div key={t.id} className={`pointer-events-auto rounded-xl border px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur ${t.type === 'success' ? 'border-emerald-500/40 bg-emerald-600/90' : t.type === 'warning' ? 'border-amber-500/40 bg-amber-600/90' : 'border-cyan-500/40 bg-cyan-600/90'}`}>
                        {t.message}
                    </div>
                ))}
            </div>
        </div>
    );
};
