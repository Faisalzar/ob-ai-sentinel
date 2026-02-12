import React, { useState, useRef, useCallback, useContext } from 'react';
import { Upload, X, File as FileIcon, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Context to share state between Dropzone and its children
const DropzoneContext = React.createContext(null);

export const Dropzone = ({
    children,
    onDrop,
    accept,
    maxFiles = 1,
    maxSize,
    minSize,
    className,
    src, // Allow passing current files/preview if needed
    onError,
    ...props
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [internalError, setInternalError] = useState(null);
    const inputRef = useRef(null);

    const handleError = (msg) => {
        setInternalError(msg);
        if (onError) onError(msg);
        setTimeout(() => setInternalError(null), 3000);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const validateAndPassFiles = (files) => {
        if (files.length === 0) return;

        if (files.length > maxFiles) {
            handleError(`You can only upload ${maxFiles} file(s).`);
            return;
        }

        const validFiles = [];
        for (const file of files) {
            if (maxSize && file.size > maxSize) {
                handleError(`File ${file.name} is too large (Max ${maxSize / 1024 / 1024}MB).`);
                return;
            }
            // Simple mime check if accept is provided
            if (accept) {
                const isImage = file.type.startsWith('image/');
                // Very basic check, can be expanded
                if (!isImage && !Object.keys(accept).some(k => k.includes(file.type) || file.name.endsWith(k.replace('*', '')))) {
                    // looser check for now
                }
            }
            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            onDrop(validFiles);
        }
    };

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            setInternalError(null);

            const files = Array.from(e.dataTransfer.files);
            validateAndPassFiles(files);
        },
        [onDrop, maxFiles, maxSize]
    );

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        validateAndPassFiles(files);
        if (inputRef.current) inputRef.current.value = '';
    };

    const hasFiles = src && src.length > 0;

    return (
        <DropzoneContext.Provider value={{ isDragging, error: internalError, inputRef, hasFiles, src }}>
            <div
                className={cn(
                    "relative group cursor-pointer transition-all duration-300 ease-in-out",
                    "rounded-xl border-2 border-dashed overflow-hidden flex flex-col justify-center items-center",
                    isDragging
                        ? "border-purple-500 bg-purple-500/10 shadow-[0_0_30px_rgba(168,85,247,0.2)] scale-[1.01]"
                        : "border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900/50 hover:border-zinc-700",
                    hasFiles ? "border-solid border-zinc-700 bg-black/40" : "",
                    className
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                    inputRef.current?.click();
                }}
                {...props}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileInput}
                    multiple={maxFiles > 1}
                    accept={accept ? Object.keys(accept).join(',') : undefined}
                />
                {children}

                <AnimatePresence>
                    {internalError && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-4 left-0 right-0 mx-auto w-fit px-4 py-2 bg-red-500/90 text-white text-sm rounded-full font-medium shadow-lg backdrop-blur-sm pointer-events-none"
                        >
                            {internalError}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DropzoneContext.Provider>
    );
};

export const DropzoneContent = ({ children }) => {
    const { hasFiles, src } = useContext(DropzoneContext);
    if (!hasFiles) return null;

    if (children) return <>{children}</>;

    return (
        <div className="w-full flex flex-col items-center justify-center p-4 space-y-2">
            {src.map((file, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 w-full max-w-md">
                    <div className="p-2 bg-zinc-800 rounded-md">
                        {file.type.startsWith('image') ? <ImageIcon className="w-5 h-5 text-purple-400" /> : <FileIcon className="w-5 h-5 text-zinc-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                        <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const DropzoneEmptyState = ({ supportText }) => {
    const { hasFiles, isDragging } = React.useContext(DropzoneContext);
    if (hasFiles) return null;

    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4 w-full h-full">
            <div className={cn(
                "p-3 rounded-full transition-colors duration-300",
                isDragging ? "bg-purple-500/20 text-purple-400" : "bg-zinc-900 text-zinc-400 group-hover:bg-zinc-800 group-hover:text-zinc-300"
            )}>
                <Upload className={cn("w-6 h-6", isDragging && "animate-bounce")} />
            </div>
            <div className="space-y-1">
                <h3 className={cn(
                    "text-lg font-semibold transition-colors",
                    isDragging ? "text-purple-400" : "text-white"
                )}>
                    {isDragging ? "Drop it like it's hot!" : "Click or drag file to upload"}
                </h3>
                <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                    {supportText || "Supports JPG, PNG, WEBP (Max 5MB)"}
                </p>
            </div>
        </div>
    );
};
