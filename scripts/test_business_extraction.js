// Test script for business info extraction
const { businessInfoExtractor } = require('../lib/services/businessInfoExtractor')

async function testExtraction() {
  const testMessages = [
    { role: 'user', content: 'I run a coffee shop' },
    { role: 'assistant', content: 'That sounds interesting! What is the name of your coffee shop?' },
    { role: 'user', content: 'It\'s called Joe\'s Coffee' },
    { role: 'assistant', content: 'Great! What do you serve?' },
    { role: 'user', content: 'We serve coffee, pastries, and sandwiches to local customers' }
  ]

  console.log('Testing business info extraction...')
  const extractedInfo = businessInfoExtractor.extractFromMessages(testMessages)
  
  console.log('Extracted business info:', extractedInfo)
  
  if (extractedInfo.business_type) {
    console.log('✅ Business type extracted:', extractedInfo.business_type)
  } else {
    console.log('❌ No business type extracted')
  }
  
  if (extractedInfo.business_name) {
    console.log('✅ Business name extracted:', extractedInfo.business_name)
  } else {
    console.log('❌ No business name extracted')
  }
  
  if (extractedInfo.products_services) {
    console.log('✅ Products/services extracted:', extractedInfo.products_services)
  } else {
    console.log('❌ No products/services extracted')
  }
  
  if (extractedInfo.target_customers) {
    console.log('✅ Target customers extracted:', extractedInfo.target_customers)
  } else {
    console.log('❌ No target customers extracted')
  }
}

testExtraction().catch(console.error) 