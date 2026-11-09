import { useEffect, useRef, useState, useCallback } from 'react';
import * as mpHands from '@mediapipe/hands';
import * as mpCamera from '@mediapipe/camera_utils';
import * as mpDrawing from '@mediapipe/drawing_utils';
import { HandLandmarks, HandTrackingState } from '../types/hand';

// Resuelve constructores tanto en window global como en módulos importados (evita Rollup CJS constructor errors)
const getHandsConstructor = (): any => {
    return (window as any).Hands || (mpHands as any).Hands || (mpHands as any).default?.Hands || (mpHands as any).default;
};

const getCameraConstructor = (): any => {
    return (window as any).Camera || (mpCamera as any).Camera || (mpCamera as any).default?.Camera || (mpCamera as any).default;
};

const getDrawConnectors = (): any => {
    return (window as any).drawConnectors || (mpDrawing as any).drawConnectors || (mpDrawing as any).default?.drawConnectors;
};

const getDrawLandmarks = (): any => {
    return (window as any).drawLandmarks || (mpDrawing as any).drawLandmarks || (mpDrawing as any).default?.drawLandmarks;
};

const getHandConnections = (): any => {
    return (window as any).HAND_CONNECTIONS || (mpHands as any).HAND_CONNECTIONS || (mpHands as any).default?.HAND_CONNECTIONS || [
        [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
        [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
        [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
    ];
};

interface UseHandTrackingOptions {
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    maxHands?: number;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
    onHandsDetected?: (hands: HandLandmarks[]) => void;
}

const DEFAULT_OPTIONS: Partial<UseHandTrackingOptions> = {
    maxHands: 2,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5,
};

export function useHandTracking(options: UseHandTrackingOptions) {
    const {
        videoRef,
        canvasRef,
        maxHands = DEFAULT_OPTIONS.maxHands!,
        minDetectionConfidence = DEFAULT_OPTIONS.minDetectionConfidence!,
        minTrackingConfidence = DEFAULT_OPTIONS.minTrackingConfidence!,
        onHandsDetected,
    } = options;

    const [state, setState] = useState<HandTrackingState>({
        isTracking: false,
        hands: [],
        gestures: [],
        lastAction: 'NONE',
        isLoading: false,
        error: null,
    });

    const handsRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const animationFrameRef = useRef<number | null>(null);
    const isTrackingRef = useRef(false);

    const startCameraLoop = useCallback(() => {
        if (!videoRef.current || cameraRef.current) return;
        const CameraClass = getCameraConstructor();
        if (!CameraClass) return;

        const camera = new CameraClass(videoRef.current, {
            onFrame: async () => {
                if (handsRef.current && videoRef.current) {
                    try {
                        await handsRef.current.send({
                            image: videoRef.current,
                        });
                    } catch {
                        // Ignorar caídas momentáneas de frames
                    }
                }
            },
            width: 1280,
            height: 720,
        });

        camera.start();
        cameraRef.current = camera;
    }, [videoRef]);

    // Inicializar MediaPipe Hands
    useEffect(() => {
        const initializeHands = async () => {
            setState(prev => ({ ...prev, isLoading: true }));

            try {
                const HandsClass = getHandsConstructor();
                if (!HandsClass) {
                    throw new Error('MediaPipe Hands no está disponible');
                }
                const hands = new HandsClass({
                    locateFile: (file: string) => {
                        return `/mediapipe/${file}`;
                    },
                });

                hands.setOptions({
                    maxNumHands: maxHands,
                    modelComplexity: 1,
                    minDetectionConfidence: minDetectionConfidence,
                    minTrackingConfidence: minTrackingConfidence,
                });

                hands.onResults((results: any) => {
                    if (!canvasRef.current || !videoRef.current) return;

                    // Dibujar landmarks en el canvas
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    ctx.save();
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Dibujar imagen del video con proporción preservada en pantalla completa
                    const videoWidth = videoRef.current.videoWidth;
                    const videoHeight = videoRef.current.videoHeight;
                    const canvasRatio = canvas.width / canvas.height;
                    const videoRatio = videoWidth / videoHeight;

                    let sx = 0;
                    let sy = 0;
                    let sWidth = videoWidth;
                    let sHeight = videoHeight;

                    if (videoRatio > canvasRatio) {
                        sWidth = videoHeight * canvasRatio;
                        sx = (videoWidth - sWidth) / 2;
                    } else {
                        sHeight = videoWidth / canvasRatio;
                        sy = (videoHeight - sHeight) / 2;
                    }

                    // Voltear horizontalmente para efecto espejo en videollamada
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);

                    ctx.drawImage(
                        videoRef.current,
                        sx,
                        sy,
                        sWidth,
                        sHeight,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    // Procesar y dibujar cada mano detectada
                    const detectedHands: HandLandmarks[] = [];

                    if (results.multiHandLandmarks && results.multiHandedness) {
                        for (
                            let index = 0;
                            index < results.multiHandLandmarks.length;
                            index++
                        ) {
                            const landmarks = results.multiHandLandmarks[index];
                            const handedness = results.multiHandedness[index];

                            // Convertir landmarks a nuestro formato
                            const handLandmarks: HandLandmarks = {
                                landmarks: landmarks.map((landmark: any) => ({
                                    x: landmark.x,
                                    y: landmark.y,
                                    z: landmark.z || 0,
                                })),
                                handedness: handedness.label === 'Left' ? 'left' : 'right',
                            };

                            detectedHands.push(handLandmarks);

                            // Dibujar conexiones y landmarks en el canvas espejado
                            const handConnections = getHandConnections();
                            const drawConnectors = getDrawConnectors();
                            const drawLandmarks = getDrawLandmarks();
                            if (drawConnectors) {
                                drawConnectors(ctx, landmarks, handConnections, {
                                    color: '#00F0FF',
                                    lineWidth: 2,
                                });
                            }
                            if (drawLandmarks) {
                                drawLandmarks(ctx, landmarks, {
                                    color: '#FF0055',
                                    lineWidth: 1,
                                    radius: 3,
                                });
                            }
                        }
                    }

                    ctx.restore();

                    // Actualizar estado solo cuando cambia el estatus de tracking para evitar re-renders a 60fps
                    if (!isTrackingRef.current) {
                        isTrackingRef.current = true;
                        setState(prev => ({
                            ...prev,
                            isTracking: true,
                            isLoading: false,
                        }));
                    }

                    // Notificar manos detectadas directamente
                    if (onHandsDetected) {
                        onHandsDetected(detectedHands);
                    }
                });

                handsRef.current = hands;
                if (videoRef.current && videoRef.current.srcObject) {
                    startCameraLoop();
                }
            } catch (error) {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: `Error inicializando Hands: ${error}`,
                }));
            }
        };

        initializeHands();

        return () => {
            if (handsRef.current) {
                handsRef.current.close();
            }
        };
    }, [maxHands, minDetectionConfidence, minTrackingConfidence, onHandsDetected, canvasRef, videoRef, startCameraLoop]);

    // Iniciar cámara
    const startCamera = useCallback(async () => {
        if (!videoRef.current) return;

        try {
            setState(prev => ({ ...prev, isLoading: true }));

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user',
                },
            });

            videoRef.current.srcObject = stream;

            await new Promise<void>((resolve) => {
                if (videoRef.current) {
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                        resolve();
                    };
                }
            });

            // Configurar canvas con mismo tamaño que video
            if (canvasRef.current && videoRef.current) {
                const videoWidth = videoRef.current.videoWidth || 640;
                const videoHeight = videoRef.current.videoHeight || 480;
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;
            }

            if (handsRef.current) {
                startCameraLoop();
            }

            setState(prev => ({
                ...prev,
                isTracking: true,
                isLoading: false,
                error: null,
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: `Error iniciando cámara: ${error}`,
            }));
        }
    }, [videoRef, canvasRef, startCameraLoop]);

    // Detener cámara
    const stopCamera = useCallback(() => {
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }

        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }

        isTrackingRef.current = false;
        setState(prev => ({
            ...prev,
            isTracking: false,
            hands: [],
        }));
    }, [videoRef]);

    // Limpiar al desmontar
    useEffect(() => {
        const animRef = animationFrameRef;
        return () => {
            stopCamera();
            if (animRef.current) {
                cancelAnimationFrame(animRef.current);
            }
        };
    }, [stopCamera]);

    return {
        state,
        startCamera,
        stopCamera,
        restartCamera: () => {
            stopCamera();
            setTimeout(() => startCamera(), 100);
        },
    };
}