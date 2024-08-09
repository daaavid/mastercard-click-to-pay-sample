let click2payInstance;

async function init() {
  try {
    click2payInstance = new Click2Pay();
    await click2payInstance.init({
      srcDpaId: ENV_DPA_ID, // required
      dpaData: {
        dpaName: "Test", // required
        // dpaPresentationName: "Test",
      },
      dpaTransactionOptions: {
        dpaLocale: "en_US", // required
        // paymentOptions: [
        //   {
        //     dynamicDataType: "NONE",
        //   },
        // ],
        // transactionAmount: {
        //   transactionAmount: 100,
        //   transactionCurrencyCode: "USD",
        // },
        // consumerEmailAddressRequested: true,
        // consumerPhoneNumberRequested: true,
        // dpaBillingPreference: "POSTAL_COUNTRY",
        // dpaLocale: "en_US",
        // confirmPayment: false,
        // paymentOptions: [{ dynamicDataType: "NONE" }],
      },
      cardBrands: ["mastercard", "visa", "amex", "discover"], // required
      // checkoutExperience: "WITHIN_CHECKOUT",
    });
  } catch (error) {
    console.log(error);
  }
}

const emailField = document.getElementById("email");
emailField.addEventListener("input", debounce(onEmailFieldInput, 500));

async function onEmailFieldInput(e) {
  try {
    const email = e.target.value;
    const r = await click2payInstance.idLookup({ email });

    const click2payUserExists = r.consumerPresent;
    console.log(
      click2payUserExists
        ? `Click to Pay user for ${email} exists`
        : `Click to Pay user for ${email} does not exist`
    );

    if (click2payUserExists) {
      const shippingDetailsSection =
        document.getElementById("shipping-details");
      const cardDetailsSection = document.getElementById("card-details");

      shippingDetailsSection.style.display = "none";
      cardDetailsSection.style.display = "none";
    }
  } catch (error) {
    console.log(error);
  }
}

const submitButton = document.getElementById("submit");
submitButton.addEventListener("click", onSubmitClick);

async function onSubmitClick() {}

// Simulate email field value change for testing
setTimeout(() => {
  emailField.value = ENV_EMAIL;
  const event = new Event("input", { bubbles: true });
  emailField.dispatchEvent(event);
}, 2000);

init();
