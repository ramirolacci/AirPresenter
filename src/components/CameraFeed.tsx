import React, { useEffect, useRef } from 'react';
import { useHandTracking } from '../hooks/useHandTracking';
import { HandLandmarks } from '../types/hand';

interface CameraFeedProps {
    onHandsDetected?: (hands: HandLandmarks[]) => void;
    className?: string;
    showPreview?: boolean;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
    onHandsDetected,
    className = '',
    showPreview = true,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { state, startCamera, stopCamera, restartCamera } = useHandTracking({
        videoRef,
        canvasRef,
        maxHands: 2,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
        onHandsDetected,
    });

    useEffect(() => {
        void startCamera();
        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    return (
        <div className={`relative h-screen w-screen overflow-hidden bg-black ${className}`}>
            <video ref={videoRef} className="hidden" playsInline muted autoPlay />
            <canvas
                ref={canvasRef}
                className={showPreview ? 'absolute inset-0 block w-full h-full object-cover' : 'hidden'}
                style={showPreview ? { objectFit: 'cover' } : undefined}
            />
            {!showPreview && (
                <div className="absolute inset-0 flex items-center justify-center bg-black text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60">
                    Modo pantalla
                </div>
            )}

            {state.isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                </div>
            )}

            {state.error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center gap-3 backdrop-blur-md">
                    <span className="text-3xl">📷</span>
                    <h3 className="text-base font-bold text-white">Acceso a la cámara necesario</h3>
                    <p className="text-xs text-white/70 max-w-sm">
                        {state.error.includes('Permission') || state.error.includes('NotAllowedError')
                            ? 'Permite el acceso a la cámara en los permisos de Chrome para comenzar a presentar.'
                            : state.error}
                    </p>
                    <button
                        onClick={restartCamera}
                        className="mt-2 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-5 py-2 text-xs font-semibold text-cyan-200 backdrop-blur hover:bg-cyan-500/30 transition hover:scale-105"
                    >
                        🔄 Reintentar Conexión
                    </button>
                </div>
            )}
        </div>
    );
};