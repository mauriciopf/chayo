export const useBillingManagement = () => {
  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const { url, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      window.location.href = url
    } catch (error) {
      console.error('Error:', error)
      alert('Unable to open billing portal. Please try again.')
    }
  }

  return { handleManageBilling }
} 