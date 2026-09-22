import Razorpay from "razorpay";

let instance = null;

// Lazy singleton: ES module imports are hoisted above dotenv.config() in
// server.js, so the credentials are only read on first actual use.
export const getRazorpay = () => {
  if (!instance) {
    const key_id = process.env.RAZORPAY_API_KEY;
    const key_secret = process.env.RAZORPAY_SECRET_KEY;

    if (!key_id || !key_secret) {
      throw new Error(
        "Razorpay credentials missing. Set RAZORPAY_API_KEY and RAZORPAY_SECRET_KEY in server/.env"
      );
    }

    instance = new Razorpay({ key_id, key_secret });
  }
  return instance;
};
