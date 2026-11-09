import { useState, useCallback, useEffect, useRef } from 'react';
import { CameraFeed } from './components/CameraFeed';
import { ImageEditor as AnnotationCanvas } from './components/ImageEditor';
import { useGestureRecognition } from './hooks/useGestureRecognition';
import { useHandCursor } from './hooks/useHandCursor';
import { HandLandmarks, RecognizedGesture, EditorAction } from './types/hand';

function App() {
    const [hands, setHands] = useState<HandLandmarks[]>([]);
    const [currentAction, setCurrentAction] = useState<EditorAction>('NONE');
    const [isGesturePaused, setIsGesturePaused] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showCameraPreview, setShowCameraPreview] = useState(true);
    const [palmHoldProgress, setPalmHoldProgress] = useState(0);
    const wasOpenPalmRef = useRef(false);
    const wasSettingsGestureRef = useRef(false);

    const handleHandsDetected = useCallback((detectedHands: HandLandmarks[]) => {
        setHands(detectedHands);
    }, []);

    const handleGestureDetected = useCallback(
        (_gesture: RecognizedGesture, _action: EditorAction) => {
            // Gestos procesados en vivo sin sobrescribir la herramienta seleccionada en la barra
        },
        []
    );

    const { gestures } = useGestureRecognition({
        hands,
        onGestureDetected: handleGestureDetected,
        debounceMs: 350,
    });

    const {
        cursorPosition: handCursorPosition,
        isVisible: isHandCursorVisible,
        isDrawing,
        isErasing,
        isMoving,
    } = useHandCursor({
        hands,
        gestures,
        isGesturePaused,
        viewportSize: { width: window.innerWidth, height: window.innerHeight },
    });

    const openPalmStartTimeRef = useRef<number | null>(null);

    useEffect(() => {
        const hasOpenPalm = gestures.some((g) => g.type === 'OPEN_PALM');
        const now = Date.now();

        if (hasOpenPalm) {
            if (!openPalmStartTimeRef.current) {
                openPalmStartTimeRef.current = now;
                setPalmHoldProgress(0.08);
            } else {
                const elapsed = now - openPalmStartTimeRef.current;
                const progress = Math.min(1, elapsed / 1100);
                setPalmHoldProgress(progress);
                if (elapsed > 1100 && !wasOpenPalmRef.current) {
                    setIsGesturePaused((prev) => !prev);
                    wasOpenPalmRef.current = true;
                    setPalmHoldProgress(0);
                }
            }
        } else {
            openPalmStartTimeRef.current = null;
            wasOpenPalmRef.current = false;
            setPalmHoldProgress(0);
        }
    }, [gestures]);

    useEffect(() => {
        const specialGestureActive = hands.length >= 2 && gestures.every((g) => g.type === 'PEACE');
        if (specialGestureActive && !wasSettingsGestureRef.current) {
            setShowSettings((prev) => !prev);
        }
        wasSettingsGestureRef.current = specialGestureActive;
    }, [gestures, hands.length]);

    useEffect(() => {
        const syncFullscreenState = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        syncFullscreenState();
        document.addEventListener('fullscreenchange', syncFullscreenState);

        return () => {
            document.removeEventListener('fullscreenchange', syncFullscreenState);
        };
    }, []);

    const handleExitFullscreen = useCallback(async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
        } catch {
            // Ignored
        }
    }, []);

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
            <CameraFeed onHandsDetected={handleHandsDetected} className="absolute inset-0 z-0" showPreview={showCameraPreview} />

            <div className="pointer-events-none absolute inset-0 z-10">
                {/* Visual feedback for Open Palm pause countdown */}
                {palmHoldProgress > 0 && !wasOpenPalmRef.current && (
                    <div className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 rounded-full border border-cyan-400/40 bg-black/85 px-4 py-2 shadow-2xl backdrop-blur">
                        <span className="text-sm">🖐️</span>
                        <span className="text-xs font-semibold text-cyan-200">
                            {isGesturePaused ? 'Reanudando gestos...' : 'Pausando gestos...'} {Math.round(palmHoldProgress * 100)}%
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/20">
                            <div
                                className="h-full bg-cyan-400 transition-all duration-75"
                                style={{ width: `${palmHoldProgress * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Paused state persistent banner */}
                {isGesturePaused && palmHoldProgress === 0 && (
                    <div className="pointer-events-auto absolute top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 rounded-full border border-amber-400/30 bg-black/80 px-4 py-1.5 shadow-xl backdrop-blur">
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-xs font-semibold text-amber-200">Gestos en Pausa</span>
                        <button
                            onClick={() => setIsGesturePaused(false)}
                            className="ml-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white hover:bg-white/30"
                        >
                            Reanudar
                        </button>
                    </div>
                )}

                <AnnotationCanvas
                    className="absolute inset-0 z-20"
                    onActionCompleted={setCurrentAction}
                    hands={hands}
                    currentAction={currentAction}
                    gestures={gestures}
                    isGesturePaused={isGesturePaused}
                    onToggleGesturePause={() => setIsGesturePaused((prev) => !prev)}
                    handCursorPosition={handCursorPosition}
                    handCursorState={{ isVisible: isHandCursorVisible, isDrawing, isErasing, isMoving }}
                />

                {showSettings && (
                    <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center pb-6">
                        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-2 shadow-2xl backdrop-blur">
                            <button
                                onClick={() => setIsGesturePaused((prev) => !prev)}
                                className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20"
                            >
                                {isGesturePaused ? '▶' : '⏸'}
                            </button>
                            <button
                                onClick={handleExitFullscreen}
                                className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20"
                            >
                                {isFullscreen ? '⤡' : '⤢'}
                            </button>
                            <button
                                onClick={() => setShowCameraPreview((prev) => !prev)}
                                className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20"
                            >
                                {showCameraPreview ? '🖥️' : '📌'}
                            </button>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;