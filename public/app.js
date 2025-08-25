// TODO: Replace with your Stripe publishable key
const stripe = Stripe('pk_test_12345');

const elements = stripe.elements();

async function initializeStripe() {
  const paymentRequest = stripe.paymentRequest({
    country: 'US',
    currency: 'usd',
    total: {
      label: 'VoltaAudio Headphones',
      amount: 5000,
    },
  });

  const prButton = elements.create('paymentRequestButton', { paymentRequest });

  const result = await paymentRequest.canMakePayment();
  if (result) {
    prButton.mount('#payment-request-button');
  } else {
    document.getElementById('payment-request-button').style.display = 'none';
  }

  paymentRequest.on('paymentmethod', async (event) => {
    try {
      const res = await fetch('/create-payment-intent', { method: 'POST' });
      const data = await res.json();

      const { error } = await stripe.confirmPayment({
        clientSecret: data.clientSecret,
        payment_method: event.paymentMethod.id,
      });

      if (error) {
        event.complete('fail');
        document.getElementById('result-message').textContent = error.message;
      } else {
        event.complete('success');
        document.getElementById('result-message').textContent = 'Payment complete 🎉';
      }
    } catch (err) {
      event.complete('fail');
      document.getElementById('result-message').textContent = err.message;
    }
  });
}

initializeStripe();

paypal.Buttons({
  createOrder: (data, actions) => {
    return actions.order.create({
      purchase_units: [{
        amount: { value: '50.00' },
      }],
    });
  },
  onApprove: async (data, actions) => {
    await actions.order.capture();
    document.getElementById('result-message').textContent = 'Payment complete 🎉';
  },
}).render('#paypal-button-container');
