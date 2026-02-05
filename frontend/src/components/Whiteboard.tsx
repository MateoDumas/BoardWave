import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Trash2, Eraser, Pen } from 'lucide-react';

interface WhiteboardProps {
  roomId: string;
  username: string;
}

export default function Whiteboard({ roomId, username }: WhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Estado local para herramientas
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  
  // Referencias para el estado de dibujo
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  
  // Yjs references
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const strokesRef = useRef<Y.Array<any> | null>(null); // Array compartido de trazos

  // Inicializar Yjs
  useEffect(() => {
    if (!roomId) return;

    // 1. Crear documento Yjs
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // 2. Conectar provider (WebSocket)
    // Conectamos a /yjs/ROOM_ID
    const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    const wsUrl = `${baseUrl}/yjs/${roomId}`;
    const provider = new WebsocketProvider(wsUrl, roomId, ydoc);
    providerRef.current = provider;

    provider.on('status', (event: any) => {
      setIsConnected(event.status === 'connected');
    });

    // 3. Obtener array compartido de trazos
    const strokes = ydoc.getArray('strokes');
    strokesRef.current = strokes;

    // 4. Escuchar cambios en los trazos para redibujar
    strokes.observe(() => {
      redrawCanvas();
    });

    // Cleanup
    return () => {
      provider.disconnect();
      ydoc.destroy();
    };
  }, [roomId]);

  // Manejar redimensionado y dibujo inicial
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redrawCanvas();
    };

    // Usar ResizeObserver para detectar cambios en el contenedor (ej. al cambiar de pestaña)
    const resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
    });
    
    resizeObserver.observe(container);
    resizeCanvas(); // Initial resize

    return () => {
        resizeObserver.disconnect();
    };
  }, []);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !strokesRef.current) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar todos los trazos
    strokesRef.current.forEach((stroke: any) => {
      if (!stroke.points || stroke.points.length < 2) return;
      
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const [start, ...points] = stroke.points;
      ctx.moveTo(start.x, start.y);
      points.forEach((p: any) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const { offsetX, offsetY } = e.nativeEvent;
    lastPoint.current = { x: offsetX, y: offsetY };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPoint.current || !strokesRef.current) return;
    
    const { offsetX, offsetY } = e.nativeEvent;
    const currentPoint = { x: offsetX, y: offsetY };

    // Dibujamos en el canvas localmente INMEDIATAMENTE
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = tool === 'eraser' ? 20 : brushSize;
      ctx.lineCap = 'round';
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
    }

    // Guardamos el segmento en Yjs
    const stroke = {
      color: tool === 'eraser' ? '#ffffff' : color,
      width: tool === 'eraser' ? 20 : brushSize,
      points: [lastPoint.current, currentPoint]
    };
    
    strokesRef.current.push([stroke]);

    lastPoint.current = currentPoint;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    lastPoint.current = null;
  };

  const clearBoard = () => {
    if (strokesRef.current) {
        // Eliminar todos los elementos del array Yjs
        strokesRef.current.delete(0, strokesRef.current.length);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-white rounded-lg overflow-hidden cursor-crosshair">
      {!isConnected && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded z-20">
          Conectando pizarra...
        </div>
      )}
      
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white shadow-md rounded-full px-4 py-2 flex items-center gap-4 z-10 border border-gray-200">
        <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
            <button 
                onClick={() => setTool('pen')}
                className={`p-2 rounded-full transition-colors ${tool === 'pen' ? 'bg-gray-100 text-primary' : 'text-gray-500 hover:bg-gray-50'}`}
                title="Lápiz"
            >
                <Pen size={18} />
            </button>
            <button 
                onClick={() => setTool('eraser')}
                className={`p-2 rounded-full transition-colors ${tool === 'eraser' ? 'bg-gray-100 text-primary' : 'text-gray-500 hover:bg-gray-50'}`}
                title="Borrador"
            >
                <Eraser size={18} />
            </button>
        </div>

        <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
            <button onClick={() => { setColor('#000000'); setTool('pen'); }} className={`w-6 h-6 rounded-full bg-black border-2 ${color === '#000000' && tool === 'pen' ? 'border-primary scale-110' : 'border-transparent'}`} title="Negro" />
            <button onClick={() => { setColor('#ef4444'); setTool('pen'); }} className={`w-6 h-6 rounded-full bg-red-500 border-2 ${color === '#ef4444' && tool === 'pen' ? 'border-primary scale-110' : 'border-transparent'}`} title="Rojo" />
            <button onClick={() => { setColor('#3b82f6'); setTool('pen'); }} className={`w-6 h-6 rounded-full bg-blue-500 border-2 ${color === '#3b82f6' && tool === 'pen' ? 'border-primary scale-110' : 'border-transparent'}`} title="Azul" />
            <button onClick={() => { setColor('#22c55e'); setTool('pen'); }} className={`w-6 h-6 rounded-full bg-green-500 border-2 ${color === '#22c55e' && tool === 'pen' ? 'border-primary scale-110' : 'border-transparent'}`} title="Verde" />
        </div>

        <button 
            onClick={clearBoard}
            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Borrar todo"
        >
            <Trash2 size={18} />
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="touch-none"
      />
    </div>
  );
}
