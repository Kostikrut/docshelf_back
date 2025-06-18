import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const emailOptions = {
    from: "SnapSale admin <admin@SnapSale.cc>",
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  await transporter.sendMail(emailOptions);
};

const sendCheckoutEmail = async (invoice) => {
  const emailOptions = {
    to: invoice?.user?.email || invoice.guestInfo.email,
    subject: "Order Confirmation - SnapSale Market",
    text: `Thank you for your purchase! Order ID: ${invoice._id}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 8px; background-color: #fafafa;">
        <h2 style="color: #2a9d8f; text-align: center;">Thank you for your purchase, ${
          invoice?.user?.fullName || invoice.guestInfo.fullName
        }!</h2>
        <p style="font-size: 16px; text-align: center; color: #555;">Your order has been successfully completed. Here are the details:</p>

        <div style="background-color: #e5f7f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>Order ID:</strong> ${invoice.id}</li>
            <li><strong>Total Amount:</strong> $${invoice.totalPrice}</li>
            <li><strong>Status:</strong> Complete</li>
            <li><strong>Shipping:</strong> ${
              invoice.shippingOpt.shippingType
            }</li>
          </ul>
        </div>

        <h3 style="color: #264653; font-size: 18px; margin-top: 20px;">Items Purchased:</h3>
        <ul style="list-style-type: none; padding: 0;">
          ${invoice.listings
            .map((item) => {
              const totalItemPrice = item.variants.reduce(
                (acc, variant) => acc + Number(variant.price),
                Number(item.price)
              );

              const variantNames = item.variants
                .map((variant) => variant.type)
                .join(", ");

              return `
                <li style="border-bottom: 1px solid #e0e0e0; padding: 10px 0;">
                  <p style="margin: 0; color: #2a9d8f;"><strong>Product:</strong> ${
                    item.title
                  } ${variantNames}</p>
                  <p style="margin: 0; color: #555;"><strong>Quantity:</strong> ${
                    item.amount
                  }</p>
                  <p style="margin: 0; color: #555;"><strong>Price:</strong> $${(
                    totalItemPrice * item.amount
                  ).toFixed(2)}</p>
                </li>
              `;
            })
            .join("")}
        </ul>

        <p style="font-size: 16px; margin-top: 20px; color: #555; text-align: center;">
          We hope you enjoy your purchase. If you have any questions, please feel free to reach out!
        </p>
        <footer style="text-align: center; margin-top: 20px; font-size: 14px; color: #888;">
          <p>SnapSale Market</p>
          <p>Thank you for shopping with us!</p>
        </footer>
      </div>
    `,
  };

  await sendEmail(emailOptions);
};

const sendResetPasswordUrl = async ({ to, fullName, resetUrl }) => {
  const emailOptions = {
    to,
    subject: "Reset Your Password - SnapSale Market",
    text: `Hi ${fullName},\n\nWe received a request to reset your password.\nClick the link below to reset it:\n${resetUrl}\n\nNote: This link is valid for only 10 minutes.\n\nIf you didn't request this, you can ignore this message.`,
    html: `${resetUrl}`,
  };

  await sendEmail(emailOptions);
};

export { sendCheckoutEmail, sendResetPasswordUrl, sendEmail };
