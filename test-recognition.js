// Quick test script to verify recognition service on production
const fetch = require('node-fetch');

async function testRecognitionEndpoint() {
  try {
    console.log('Testing recognition endpoint...');
    const response = await fetch('https://trust-mesh-hackathon-pml5c7wea.vercel.app/api/recognition/definitions');
    
    if (!response.ok) {
      console.log('Response not OK:', response.status, response.statusText);
      const text = await response.text();
      console.log('Response body:', text.slice(0, 500));
      return;
    }
    
    const data = await response.json();
    console.log('Recognition definitions response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRecognitionEndpoint();