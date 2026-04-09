"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyLicenseButton({ licenseKey }: { licenseKey: string }) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(licenseKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button 
            onClick={copyToClipboard}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-all active:scale-90 shadow-lg shadow-indigo-600/20"
            title="Copiar Licença"
        >
            {copied ? <Check size={20} /> : <Copy size={20} />}
        </button>
    );
}
