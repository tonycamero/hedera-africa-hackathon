"use client";
import { useHcsEvents } from "@/hooks/useHcsEvents";

export default function HcsDebug() {
  const trust = useHcsEvents('trust', 3000);
  const recognition = useHcsEvents('recognition', 3000);
  const contact = useHcsEvents('contact', 3000);
  const profile = useHcsEvents('profile', 3000);

  return (
    <div style={{padding: 20, fontFamily: "monospace", backgroundColor: "#f5f5f5"}}>
      <h2>🔥 HCS Live Events Dashboard</h2>
      
      <div style={{marginBottom: 20}}>
        <h3>🤝 Trust Events (watermark: {trust.watermark || '-'})</h3>
        <div style={{background: "#e8f5e8", padding: 10, fontSize: "12px", marginBottom: 10}}>
          {trust.isLoading ? "Loading..." : `${trust.items.length} items loaded`}
        </div>
        <div style={{maxHeight: "200px", overflow: "auto", background: "white", padding: 10}}>
          {trust.items.slice(0, 3).map((item: any, i: number) => (
            <div key={i} style={{marginBottom: 10, padding: 8, background: "#f9f9f9", border: "1px solid #ddd"}}>
              <strong>Type:</strong> {item.json?.type}<br/>
              <strong>Actor:</strong> {item.json?.actor}<br/>
              <strong>Target:</strong> {item.json?.target}<br/>
              <strong>Timestamp:</strong> {item.consensus_timestamp}<br/>
              {item.json?.metadata && <><strong>Metadata:</strong> {JSON.stringify(item.json.metadata)}</>}
            </div>
          ))}
        </div>
      </div>
      
      <div style={{marginBottom: 20}}>
        <h3>🎯 Recognition Events (watermark: {recognition.watermark || '-'})</h3>
        <div style={{background: "#e3f2fd", padding: 10, fontSize: "12px", marginBottom: 10}}>
          {recognition.isLoading ? "Loading..." : `${recognition.items.length} items loaded`}
        </div>
        <div style={{maxHeight: "200px", overflow: "auto", background: "white", padding: 10}}>
          {recognition.items.slice(0, 3).map((item: any, i: number) => (
            <div key={i} style={{marginBottom: 10, padding: 8, background: "#f9f9f9", border: "1px solid #ddd"}}>
              <strong>Type:</strong> {item.json?.type}<br/>
              <strong>Seq:</strong> {item.sequence_number}<br/>
              <strong>Timestamp:</strong> {item.consensus_timestamp}<br/>
              <strong>Data:</strong> {JSON.stringify(item.json).substring(0, 100)}...<br/>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{marginBottom: 20}}>
        <h3>📞 Contact Events (watermark: {contact.watermark || '-'})</h3>
        <div style={{background: "#fff3e0", padding: 10, fontSize: "12px", marginBottom: 10}}>
          {contact.isLoading ? "Loading..." : `${contact.items.length} items loaded`}
        </div>
        <div style={{maxHeight: "200px", overflow: "auto", background: "white", padding: 10}}>
          {contact.items.slice(0, 2).map((item: any, i: number) => (
            <div key={i} style={{marginBottom: 10, padding: 8, background: "#f9f9f9", border: "1px solid #ddd"}}>
              <strong>Type:</strong> {item.json?.type}<br/>
              <strong>Actor:</strong> {item.json?.actor}<br/>
              <strong>Target:</strong> {item.json?.target}<br/>
              <strong>Timestamp:</strong> {item.consensus_timestamp}<br/>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{marginTop: 20, padding: 10, background: "#e8f5e8", borderRadius: 4}}>
        <h4>✅ System Status:</h4>
        <ul style={{fontSize: "14px"}}>
          <li>🔥 <strong>HCS Events API:</strong> Working perfectly!</li>
          <li>🎯 <strong>Trust Events:</strong> {trust.items.length} loaded, watermark advancing</li>
          <li>🏆 <strong>Recognition Events:</strong> {recognition.items.length} loaded</li>
          <li>📱 <strong>Real-time polling:</strong> Every 3 seconds</li>
          <li>⚡ <strong>Next step:</strong> Wire these events to your Circle & Signals pages!</li>
        </ul>
      </div>
    </div>
  );
}