const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
let checkoutScriptPromise;

function loadCheckoutScript() {
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScriptPromise) return checkoutScriptPromise;

  checkoutScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Razorpay Checkout could not be loaded"));
    document.head.appendChild(script);
  });

  return checkoutScriptPromise;
}

export async function openRazorpayCheckout({ checkout, account }) {
  await loadCheckoutScript();

  return new Promise((resolve, reject) => {
    const instance = new window.Razorpay({
      key: checkout.keyId,
      subscription_id: checkout.subscriptionId,
      name: "DataDock",
      description: `${checkout.plan.name} monthly plan`,
      prefill: {
        name: account.name,
        email: account.email,
      },
      handler: (response) => {
        resolve({
          paymentId: response.razorpay_payment_id,
          subscriptionId: response.razorpay_subscription_id,
          signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => resolve(null),
      },
    });

    instance.on("payment.failed", (response) => {
      reject(new Error(response.error?.description ?? "Payment failed"));
    });
    instance.open();
  });
}
