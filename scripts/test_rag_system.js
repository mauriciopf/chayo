const fs = require('fs');
const path = require('path');

// Test document content
const testDocument = `
Business Operations Manual

1. Customer Service Guidelines
Our company prioritizes excellent customer service. All customer inquiries should be responded to within 24 hours. 
We offer support via email, phone, and live chat. Our customer service team is available Monday through Friday, 9 AM to 6 PM EST.

2. Product Information
Our flagship product is the Chayo AI Assistant, designed to help businesses automate customer interactions.
Key features include:
- Natural language processing
- Multi-channel support (WhatsApp, email, phone)
- Customizable business knowledge base
- Real-time conversation analysis
- Integration with existing CRM systems

3. Pricing Structure
Basic Plan: $29/month - Up to 1000 conversations
Professional Plan: $79/month - Up to 5000 conversations
Enterprise Plan: $199/month - Unlimited conversations

4. Technical Support
For technical issues, customers can contact our support team at support@chayo.ai
We provide 24/7 emergency support for Enterprise customers.
`;

async function testRAGSystem() {
  console.log('🧪 Testing RAG System...\n');

  try {
    // Step 1: Create a test file
    const testFilePath = path.join(__dirname, 'test_document.txt');
    fs.writeFileSync(testFilePath, testDocument);
    console.log('✅ Created test document');

    // Step 2: Upload the document
    console.log('\n📤 Uploading document...');
    const formData = new FormData();
    const file = new File([testDocument], 'test_document.txt', { type: 'text/plain' });
    formData.append('file', file);

    const uploadResponse = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Cookie': 'your-auth-cookie-here' // You'll need to replace this with actual auth
      }
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Document uploaded:', uploadResult);

    // Step 3: Test chat with RAG
    console.log('\n💬 Testing chat with RAG...');
    
    const testQueries = [
      "What are your customer service hours?",
      "Tell me about your pricing plans",
      "How can I get technical support?",
      "What features does your AI assistant have?"
    ];

    for (const query of testQueries) {
      console.log(`\n🤔 Query: "${query}"`);
      
      const chatResponse = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'your-auth-cookie-here' // You'll need to replace this with actual auth
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }]
        })
      });

      if (!chatResponse.ok) {
        console.log(`❌ Chat failed: ${chatResponse.statusText}`);
        continue;
      }

      const chatResult = await chatResponse.json();
      console.log(`🤖 Response: ${chatResult.aiMessage.substring(0, 200)}...`);
    }

    // Cleanup
    fs.unlinkSync(testFilePath);
    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Note: You may need to:');
    console.log('1. Start the development server (npm run dev)');
    console.log('2. Replace "your-auth-cookie-here" with actual authentication');
    console.log('3. Ensure you have a valid user session');
  }
}

// Run the test
testRAGSystem(); 