import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PLAN_PRICING = {
  starter: { name: 'Starter Plan', price: 49, calls: '500 calls/month' },
  professional: { name: 'Professional Plan', price: 149, calls: '2,000 calls/month' },
  enterprise: { name: 'Enterprise Plan', price: 499, calls: 'Unlimited calls' }
}

export default function Checkout() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [setupRequest, setSetupRequest] = useState(null)
  const [error, setError] = useState('')

  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardDetails, setCardDetails] = useState({
    number: '',
    exp_month: '',
    exp_year: '',
    cvc: '',
    name: ''
  })

  useEffect(() => {
    // Fetch setup request details
    fetch(`/api/setup-requests/${requestId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setSetupRequest(data)
        }
      })
      .catch(err => setError('Failed to load setup request'))
  }, [requestId])

  const handlePayment = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // In production, this would integrate with Stripe
      // For now, simulate payment process
      const response = await fetch(`/api/setup-requests/${requestId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: paymentMethod,
          card_details: cardDetails
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to confirmation page
        navigate(`/setup-complete/${requestId}`)
      } else {
        setError(data.error || 'Payment failed')
      }
    } catch (err) {
      setError('Payment processing error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (error && !setupRequest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button onClick={() => navigate('/')} className="mt-4">Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!setupRequest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const planInfo = PLAN_PRICING[setupRequest.selected_plan] || PLAN_PRICING.starter

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Order</h1>
          <p className="text-gray-600 mt-2">Setup Request ID: {setupRequest.request_id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-semibold">{setupRequest.company_name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold">{setupRequest.contact_email}</p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">Selected Plan</p>
                  <p className="font-semibold text-lg">{planInfo.name}</p>
                  <p className="text-sm text-gray-600">{planInfo.calls}</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Monthly Subscription</span>
                    <span className="font-semibold">${planInfo.price}.00</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">Setup Fee</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <span className="text-lg font-bold">Total Due Today</span>
                    <span className="text-2xl font-bold text-blue-600">${planInfo.price}.00</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Billed monthly. Cancel anytime.</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                  <p className="text-sm font-semibold text-green-800">What's Included:</p>
                  <ul className="text-xs text-green-700 mt-2 space-y-1">
                    <li>✓ Full account setup by our team</li>
                    <li>✓ PBX integration configuration</li>
                    <li>✓ Testing & validation</li>
                    <li>✓ Training session</li>
                    <li>✓ Ongoing support</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>
                  Secure payment processing powered by PayPal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePayment} className="space-y-6">
                  {/* Payment Method Selection */}
                  <div>
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`p-4 border-2 rounded-lg flex items-center justify-center transition-all ${
                          paymentMethod === 'paypal' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <svg className="w-8 h-8 mr-2" fill="#0070BA" viewBox="0 0 24 24">
                          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.76-4.852.073-.455.463-.788.922-.788h.581c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.833-4.46z" />
                        </svg>
                        PayPal
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-4 border-2 rounded-lg flex items-center justify-center transition-all ${
                          paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <svg className="w-8 h-8 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                        </svg>
                        Debit / Credit
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="card_name">Cardholder Name</Label>
                        <Input
                          id="card_name"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                          placeholder="John Smith"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="card_number">Card Number</Label>
                        <Input
                          id="card_number"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim() })}
                          placeholder="4242 4242 4242 4242"
                          maxLength="19"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="exp_month">Exp. Month</Label>
                          <Input
                            id="exp_month"
                            type="number"
                            value={cardDetails.exp_month}
                            onChange={(e) => setCardDetails({ ...cardDetails, exp_month: e.target.value })}
                            placeholder="MM"
                            min="1"
                            max="12"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="exp_year">Exp. Year</Label>
                          <Input
                            id="exp_year"
                            type="number"
                            value={cardDetails.exp_year}
                            onChange={(e) => setCardDetails({ ...cardDetails, exp_year: e.target.value })}
                            placeholder="YYYY"
                            min="2026"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="cvc">CVC</Label>
                          <Input
                            id="cvc"
                            type="number"
                            value={cardDetails.cvc}
                            onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                            placeholder="123"
                            maxLength="4"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'paypal' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-12 h-12 flex-shrink-0" fill="#0070BA" viewBox="0 0 24 24">
                          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.76-4.852.073-.455.463-.788.922-.788h.581c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.833-4.46z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-blue-900 mb-2">Pay with PayPal</p>
                          <p className="text-sm text-blue-800">
                            You'll be redirected to PayPal to securely complete your subscription.
                            You can use your PayPal balance, bank account, or credit/debit card.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      {error}
                    </div>
                  )}

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      🔒 Your payment information is encrypted and secure. We use PayPal for payment processing - your financial details are never shared with us or stored on our servers.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 text-lg"
                  >
                    {loading ? 'Processing...' : `Complete Order - $${planInfo.price}/month`}
                  </Button>

                  <p className="text-xs text-center text-gray-500">
                    By completing this order, you agree to our Terms of Service and Privacy Policy.
                    Your subscription will automatically renew monthly until cancelled.
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <div className="mt-6 flex items-center justify-center space-x-6 text-gray-500">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">SSL Encrypted</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">PCI Compliant</span>
              </div>
              <div className="flex items-center">
                <svg className="w-16 h-6 mr-1" fill="#0070BA" viewBox="0 0 100 32">
                  <path d="M12 4.917v18.42c0 1.5-.75 2.145-2.149 2.145-.586 0-1.27-.088-1.73-.279l-.279 2.55c.642.252 1.559.374 2.609.374 2.806 0 4.329-1.32 4.329-4.26V4.917h-2.78zm9.885 22.172c-4.092 0-6.71-2.933-6.71-7.298 0-4.67 2.856-7.62 6.938-7.62.718 0 1.425.093 1.973.28v2.43c-.483-.217-1.035-.327-1.717-.327-2.343 0-4.083 1.737-4.083 4.98 0 3.056 1.605 4.847 4.19 4.847.642 0 1.176-.112 1.61-.3v2.46c-.562.28-1.314.547-2.201.547zm23.59-.164h-2.828l.005-10.914-4.611 10.914h-2.274l-4.607-10.914v10.914h-2.777V4.917h3.392l5.292 12.465 5.14-12.465h3.39l-.123 22.008zm-37.277 0h2.78v-9.364h6.61V15.11h-6.61V7.465h7.32V4.917h-10.1v22.008z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
