import { useState, useRef, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { socketsData, SocketData } from "@/data/mockData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

const Switch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={(e) => {
        e.stopPropagation();
        onCheckedChange();
    }}
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      checked ? "bg-green-500" : "bg-slate-700"
    )}
  >
    <span
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
        checked ? "translate-x-5" : "translate-x-0"
      )}
    />
  </button>
);

const LightningIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const EditableTitle = ({ initialValue, onSave }: { initialValue: string, onSave: (val: string) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            setIsEditing(false);
            if (value.trim()) onSave(value);
            else setValue(initialValue);
        } else if (e.key === "Escape") {
            setIsEditing(false);
            setValue(initialValue);
        }
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (value.trim()) onSave(value);
        else setValue(initialValue);
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="bg-slate-900 text-slate-100 border border-blue-500 rounded px-2 py-1 text-xl font-medium w-full outline-none"
            />
        );
    }

    return (
        <div 
            onClick={() => setIsEditing(true)} 
            className="group flex items-center gap-2 cursor-pointer hover:bg-slate-900/50 rounded -ml-2 px-2 py-1 transition-colors"
        >
            <h3 className="text-xl font-medium text-slate-100 leading-tight tracking-tight truncate max-w-[180px]">
                {value}
            </h3>
            <Pencil size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

const DeviceMonitoring = () => {
  const [sockets, setSockets] = useState<SocketData[]>(() => {
    const saved = localStorage.getItem("app_sockets_data");
    return saved ? JSON.parse(saved) : socketsData;
  });

  useEffect(() => {
    localStorage.setItem("app_sockets_data", JSON.stringify(sockets));
  }, [sockets]);

  const toggleSocket = (socketId: number) => {
    setSockets((prev) =>
      prev.map((socket) =>
        socket.id === socketId
          ? { ...socket, status: socket.status === "on" ? "off" : "on" }
          : socket
      )
    );
  };

  const updateSocketName = (socketId: number, newName: string) => {
      setSockets((prev) => 
        prev.map((socket) => 
            socket.id === socketId ? { ...socket, name: newName } : socket
        )
      );
      toast.success(`Device renamed to "${newName}"`);
  };

  return (
    <Container fluid className="p-4 bg-slate-900 min-h-screen"> 
      <div className="mb-8">
        <h1 className="text-white fw-bold mb-2 text-3xl">Device Monitoring</h1>
        <p className="text-slate-400">Monitor and control individual socket consumption and status</p>
      </div>

      <Row className="g-4">
        {sockets.slice(0, 3).map((socket) => {
            const isOn = socket.status === "on";
            
            return (
              <Col key={socket.id} md={6} lg={4}> 
                <div className="rounded-lg border bg-slate-950 border-slate-800 text-slate-100 shadow-xl overflow-hidden">
                  
                  <div className="flex flex-col space-y-1.5 p-6 pb-2">
                    <div className="flex flex-row items-center justify-between">
                        
                        <div className="flex-1 mr-4">
                            <EditableTitle 
                                initialValue={socket.name} 
                                onSave={(newName) => updateSocketName(socket.id, newName)}
                            />
                        </div>

                        <Switch 
                            checked={isOn} 
                            onCheckedChange={() => toggleSocket(socket.id)} 
                        />
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <div className="flex flex-col mt-4 space-y-1">
                        
                        <div className="flex items-center gap-2">
                        <LightningIcon 
                            className={cn(
                            "h-6 w-6 transition-colors duration-300", 
                            isOn ? "text-blue-500" : "text-slate-600"
                            )} 
                        />
                        <span className={cn(
                            "text-5xl font-bold transition-colors duration-300",
                            isOn ? "text-blue-500" : "text-slate-600"
                        )}>
                            {isOn ? `${socket.currentPower}W` : "0W"}
                        </span>
                        </div>

                        <p className="text-sm text-slate-400 font-medium pl-1">
                        {isOn ? "Live consumption" : "Off"}
                        </p>
                    </div>
                  </div>

                </div>
              </Col>
            );
        })}
      </Row>
    </Container>
  );
};

export default DeviceMonitoring;