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

    const cardsResult = await click2payInstance.getCards();
    console.log({ cardsResult });
  } catch (error) {
    console.log(error);
  }
}

const emailField = document.getElementById("email");
emailField.addEventListener("input", debounce(onEmailFieldInput, 500));

// Look up user by email
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
        document.getElementById("shipping_details");
      const cardDetailsSection = document.getElementById("card_details");

      shippingDetailsSection.style.display = "none";
      cardDetailsSection.style.display = "none";
    }
  } catch (error) {
    console.log(error);
  }
}

const form = document.getElementById("form");
form.addEventListener("submit", onFormSubmit);

async function onFormSubmit(e) {
  e.preventDefault();

  /////////////////////////////////////
  // First, encrypt the card details //
  /////////////////////////////////////

  // Request
  // encryptCard({
  //   required String primaryAccountNumber;
  //   required String panExpirationMonth;
  //   required String panExpirationYear;
  //   required String cardSecurityCode;
  //   optional String cardholderFirstName;
  //   optional String cardholderLastName;
  //   optional String billingAddress: {
  //       optional String name;
  //       optional String line1;
  //       optional String line2;
  //       optional String line3;
  //       optional String city;
  //       optional String state;
  //       optional String zip;
  //       optional String countryCode;
  //     }
  //  })

  // Response
  // {
  //   required String <JWE> encryptedCard;
  //   required String cardBrand;
  // }

  const formData = new FormData(e.target);
  const formValues = Object.fromEntries(formData.entries());
  const encryptCardPayload = {
    primaryAccountNumber: formValues.card_number,
    panExpirationMonth: formValues.card_exp_month,
    panExpirationYear: formValues.card_exp_year.slice(-2),
    cardSecurityCode: formValues.card_cvv,
    cardholderFirstName: formValues.first_name,
    cardholderLastName: formValues.last_name,
    billingAddress: {
      name: `${formValues.first_name} ${formValues.last_name}`,
      line1: formValues.address_line_1,
      line2: formValues.address_line_2,
      city: formValues.address_city,
      state: formValues.address_state,
      zip: formValues.address_zip,
      countryCode: formValues.address_country,
    },
  };

  const encryptedCardResult = await click2payInstance.encryptCard(
    encryptCardPayload
  );
  const encryptedCard = encryptedCardResult.encryptedCard;
  const cardBrand = encryptedCardResult.cardBrand;

  // console.log({ encryptedCard, cardBrand });

  ///////////////////////////////////////////////
  // Next, use the encrypted card to check out //
  ///////////////////////////////////////////////

  // Request
  // checkoutWithNewCard ({
  //    required String <JWE> encryptedCard;
  //    required String cardBrand;
  //    optional Consumer consumer;
  //    required Object windowRef;
  //    optional Object complianceSettings;
  //    optional DpaTransactionOptions dpaTransactionOptions : {
  //     optional AuthenticationPreferences authenticationPreferences;
  //     optional TransactionAmount transactionAmount;
  //     optional String dpaBillingPreference;
  //     optional Array<String> dpaAcceptedBillingCountries;
  //     optional Boolean consumerEmailAddressRequested;
  //     optional Boolean consumerPhoneNumberRequested;
  //     optional String merchantCategoryCode;
  //     optional String merchantCountryCode;
  //     optional String <UUID> merchantOrderId;
  //     optional String threeDsPreference;
  //     optional Array<PaymentOptions> paymentOptions;
  //     required String dpaLocale;
  //     optional String orderType;
  //     optional Boolean confirmPayment;
  //   };
  //   optional Boolean rememberMe;
  // })

  // Response
  // {
  //    required String checkoutActionCode;
  //    conditional String <JWS> checkoutResponse;
  //    conditional String <JWT> idToken;
  //    conditional String network;
  //    conditional Object headers {
  //      conditional String x-src-cx-flow-id;
  //      conditional String merchant-transaction-id;
  //    }
  // }

  const checkoutWithNewCardResult = await click2payInstance.checkoutWithNewCard(
    {
      encryptedCard,
      cardBrand,
      // windowRef: document.getElementById("c2p-modal").contentWindow,
      dpaTransactionOptions: {
        dpaLocale: "en_US",
      },
    }
  );

  const checkoutActionCode = checkoutWithNewCardResult.checkoutActionCode;
  const checkoutResponse = checkoutWithNewCardResult.checkoutResponse;
  const idToken = checkoutWithNewCardResult.idToken;
  const network = checkoutWithNewCardResult.network;
  const headers = checkoutWithNewCardResult.headers;

  console.log({
    checkoutActionCode,
    checkoutResponse,
    idToken,
    network,
    headers,
  });
}

// Simulate email field value change for testing
setTimeout(() => {
  emailField.value = ENV_EMAIL;
  const event = new Event("input", { bubbles: true });
  emailField.dispatchEvent(event);
}, 2000);

init();
