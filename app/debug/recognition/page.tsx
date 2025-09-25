"use client";
import { useEffect, useState } from "react";
import { hcsRecognitionService } from "@/lib/services/HCSRecognitionService";
import { hcsFeedService } from "@/lib/services/HCSFeedService";
import { getSessionId } from "@/lib/session";

export default function RecognitionDebug() {
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [userInstances, setUserInstances] = useState<any[]>([]);
  const [feedEvents, setFeedEvents] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const currentSessionId = getSessionId();
        setSessionId(currentSessionId);
        console.log("[RecognitionDebug] Session ID:", currentSessionId);

        // Initialize services
        await hcsFeedService.initialize();
        console.log("[RecognitionDebug] HCS Feed Service initialized");

        // Get all feed events (should include recognition mints)
        const events = await hcsFeedService.getAllFeedEvents();
        setFeedEvents(events);
        console.log("[RecognitionDebug] Feed events:", events.length);

        // Filter recognition events for Alex Chen
        const recognitionEvents = events.filter(e => 
          e.type === 'NFT_MINT' && e.actors.to === currentSessionId
        );
        console.log("[RecognitionDebug] Recognition events for Alex:", recognitionEvents);

        // Try to get recognition definitions
        if (hcsRecognitionService.isReady()) {
          const defs = await hcsRecognitionService.getAllRecognitionDefinitions();
          setDefinitions(defs);
          console.log("[RecognitionDebug] Recognition definitions:", defs.length);

          // Try to get all instances
          const allInstances = await hcsRecognitionService.getAllRecognitionInstances();
          setInstances(allInstances);
          console.log("[RecognitionDebug] All recognition instances:", allInstances.length);

          // Try to get user instances
          const userInsts = await hcsRecognitionService.getUserRecognitionInstances(currentSessionId);
          setUserInstances(userInsts);
          console.log("[RecognitionDebug] User recognition instances:", userInsts.length);
        } else {
          console.warn("[RecognitionDebug] HCS Recognition Service not ready");
          setError("HCS Recognition Service not ready");
        }

      } catch (e: any) {
        console.error("[RecognitionDebug] Error:", e);
        setError(e?.message || String(e));
      }
    })();
  }, []);

  const mintTestRecognition = async () => {
    try {
      console.log("[RecognitionDebug] Minting test recognition for Alex...");
      
      await hcsFeedService.logRecognitionMint(
        'debug-test',
        sessionId,
        'Test Recognition',
        'Debug test recognition token',
        'professional',
        'test-recognition-id'
      );
      
      console.log("[RecognitionDebug] Test recognition minted!");
      
      // Refresh data
      setTimeout(() => window.location.reload(), 2000);
      
    } catch (error) {
      console.error("[RecognitionDebug] Failed to mint test recognition:", error);
      setError(String(error));
    }
  };

  return (
    <div style={{padding: 20, fontFamily: "monospace", backgroundColor: "#f5f5f5"}}>
      <h2>🏆 Recognition Debug Dashboard</h2>
      
      <div style={{marginBottom: 20}}>
        <h3>📋 Session Info</h3>
        <p><strong>Session ID:</strong> {sessionId}</p>
        <p><strong>HCS Recognition Service Ready:</strong> {hcsRecognitionService.isReady() ? "✅ Yes" : "❌ No"}</p>
        {error && (
          <div style={{background: "#ffebee", padding: 10, marginTop: 10, border: "1px solid #f44336"}}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <div style={{marginBottom: 20}}>
        <h3>📊 Data Counts</h3>
        <ul>
          <li><strong>Feed Events:</strong> {feedEvents.length}</li>
          <li><strong>Recognition Definitions:</strong> {definitions.length}</li>
          <li><strong>All Recognition Instances:</strong> {instances.length}</li>
          <li><strong>Alex's Recognition Instances:</strong> {userInstances.length}</li>
        </ul>
      </div>

      <div style={{marginBottom: 20}}>
        <h3>🎯 Recognition Events for Alex</h3>
        {feedEvents.filter(e => e.type === 'NFT_MINT' && e.actors.to === sessionId).length === 0 ? (
          <div style={{background: "#fff3e0", padding: 10, border: "1px solid #ff9800"}}>
            <strong>No recognition events found for Alex Chen</strong>
            <p>This explains why no recognition tokens are showing up.</p>
            <button 
              onClick={mintTestRecognition}
              style={{
                background: "#4caf50", 
                color: "white", 
                padding: "8px 16px", 
                border: "none", 
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "10px"
              }}
            >
              🎯 Mint Test Recognition for Alex
            </button>
          </div>
        ) : (
          <div>
            {feedEvents.filter(e => e.type === 'NFT_MINT' && e.actors.to === sessionId).map((event, i) => (
              <div key={i} style={{background: "#e8f5e8", padding: 10, marginBottom: 10, border: "1px solid #4caf50"}}>
                <strong>Event {i + 1}:</strong><br/>
                <pre style={{fontSize: "11px", marginTop: 5}}>
                  {JSON.stringify(event, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{marginBottom: 20}}>
        <h3>📝 Recognition Definitions</h3>
        {definitions.length === 0 ? (
          <div style={{background: "#fff3e0", padding: 10, border: "1px solid #ff9800"}}>
            No recognition definitions found
          </div>
        ) : (
          <div style={{maxHeight: "200px", overflow: "auto"}}>
            {definitions.map((def, i) => (
              <div key={i} style={{background: "#e3f2fd", padding: 8, marginBottom: 5, border: "1px solid #2196f3"}}>
                <strong>{def.name}</strong> ({def.category}) - {def.description}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{marginTop: 20, padding: 10, background: "#f0f0f0", borderRadius: 4}}>
        <h4>🔍 What to Look For:</h4>
        <ul style={{fontSize: "14px"}}>
          <li>✅ Alex should have 3 recognition events: Prof Fav, Code Monkey, Note Taker</li>
          <li>✅ Recognition definitions should be loaded</li>
          <li>✅ Alex's recognition instances should show up</li>
          <li>✅ Feed events should include NFT_MINT events for Alex</li>
        </ul>
      </div>
    </div>
  );
}