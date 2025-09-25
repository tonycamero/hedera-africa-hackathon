"use client";
import { useEffect, useState } from "react";
import { hcsFeedService } from "@/lib/services/HCSFeedService";
import { fetchTopicMessages } from "@/lib/services/MirrorReader";

export default function HcsDebug() {
  const [topics, setTopics] = useState<any>({});
  const [counts, setCounts] = useState<any>({});
  const [errs, setErrs] = useState<string | null>(null);
  const [sampleMessages, setSampleMessages] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        await hcsFeedService.initialize();
        const t = hcsFeedService.getTopicIds();
        setTopics(t);
        const ids = Object.values(t).filter(Boolean) as string[];
        
        console.log("[HCS Debug] Topics:", t);
        
        const results = await Promise.all(
          ids.map(async id => {
            try {
              const messages = await fetchTopicMessages(id, 5);
              console.log(`[HCS Debug] Topic ${id}:`, messages.length, "messages");
              return { id, messages };
            } catch (e) {
              console.error(`[HCS Debug] Topic ${id} failed:`, e);
              setErrs(prev => prev + `\nTopic ${id}: ${e}`);
              return { id, messages: [] };
            }
          })
        );
        
        const byId: any = {};
        const samples: any[] = [];
        results.forEach(({ id, messages }) => {
          byId[id] = messages.length;
          if (messages.length > 0) {
            samples.push({
              topicId: id,
              decoded: messages[0].decoded.substring(0, 200) + "...",
              timestamp: messages[0].consensusTimestamp
            });
          }
        });
        
        setCounts(byId);
        setSampleMessages(samples);
      } catch (e: any) {
        setErrs(e?.message || String(e));
      }
    })();
  }, []);

  return (
    <div style={{padding: 20, fontFamily: "monospace", backgroundColor: "#f5f5f5"}}>
      <h2>🔍 HCS Debug Dashboard</h2>
      
      {errs && (
        <div style={{background: "#ffebee", padding: 10, marginBottom: 10, border: "1px solid #f44336"}}>
          <strong>Errors:</strong>
          <pre style={{color: "red", fontSize: "12px"}}>{errs}</pre>
        </div>
      )}
      
      <div style={{marginBottom: 20}}>
        <h3>📋 Resolved Topics</h3>
        <pre style={{background: "#e8f5e8", padding: 10, fontSize: "12px"}}>
          {JSON.stringify(topics, null, 2)}
        </pre>
      </div>
      
      <div style={{marginBottom: 20}}>
        <h3>📊 Mirror Message Counts (last 5 per topic)</h3>
        <pre style={{background: "#e3f2fd", padding: 10, fontSize: "12px"}}>
          {JSON.stringify(counts, null, 2)}
        </pre>
      </div>
      
      <div style={{marginBottom: 20}}>
        <h3>📝 Sample Messages</h3>
        {sampleMessages.map((sample, i) => (
          <div key={i} style={{background: "#fff3e0", padding: 10, marginBottom: 10, border: "1px solid #ff9800"}}>
            <strong>Topic: {sample.topicId}</strong><br/>
            <small>Timestamp: {sample.timestamp}</small><br/>
            <pre style={{fontSize: "11px", marginTop: 5}}>{sample.decoded}</pre>
          </div>
        ))}
      </div>
      
      <div style={{marginTop: 20, padding: 10, background: "#f0f0f0", borderRadius: 4}}>
        <h4>🎯 Expected Results:</h4>
        <ul style={{fontSize: "14px"}}>
          <li>✅ Topics should show actual HCS topic IDs (0.0.xxxxxx)</li>
          <li>✅ Recognition topic (6895261) should have messages &gt; 0</li>
          <li>✅ Feed/Contacts topic (6896005) should have messages &gt; 0</li>
          <li>✅ Sample messages should show JSON with type, actor, timestamp</li>
        </ul>
      </div>
    </div>
  );
}