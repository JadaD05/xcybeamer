

export const handleCheckout = async (items, userEmail) => {
  console.log("Checkout payload:", { items, userEmail });
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/payments/create-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, userEmail }),
    });

    const data = await res.json();

    if (!data.success) throw new Error(data.message || 'Failed to create checkout session');

    // NEW FLOW: redirect directly to the session URL
    window.location.href = data.url;

  } catch (err) {
    console.error('Checkout error:', err);
    alert(err.message);
  }
};
