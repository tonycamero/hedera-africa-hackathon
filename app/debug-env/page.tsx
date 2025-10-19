"use client";

export default function DebugEnvPage() {
  const envVars = {
    NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_MODE: process.env.NEXT_PUBLIC_APP_MODE,
    NEXT_PUBLIC_HCS_ENABLED: process.env.NEXT_PUBLIC_HCS_ENABLED,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Debug</h1>
      <div className="space-y-2">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="bg-gray-100 p-2 rounded">
            <strong>{key}:</strong> {value || "(empty)"}
          </div>
        ))}
      </div>
      
      <h2 className="text-xl font-bold mt-6 mb-4">Magic.link Test</h2>
      <button 
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() => {
          try {
            const { Magic } = require("magic-sdk");
            const magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!);
            console.log("Magic initialized:", magic);
            alert("Magic initialized successfully! Check console.");
          } catch (error) {
            console.error("Magic initialization failed:", error);
            alert(`Magic failed: ${error.message}`);
          }
        }}
      >
        Test Magic.link
      </button>
    </div>
  );
}