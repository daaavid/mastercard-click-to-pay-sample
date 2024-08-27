let c2pInstance;
let c2pOtp = "";
let c2pAvailableCardBrands = [];
let c2pSavedCards = [];

async function init() {
  try {
    c2pInstance = new Click2Pay();
    const initResponse = await c2pInstance.init({
      srcDpaId: ENV_DPA_ID, // required
      dpaData: {
        dpaName: "Test", // required
        // dpaPresentationName: "Test", // optional
      },
      dpaTransactionOptions: {
        dpaLocale: "en_US", // required
        // paymentOptions: [{ dynamicDataType: "NONE" }], // optional
        // transactionAmount: { transactionAmount: 100, transactionCurrencyCode: "USD" }, // optional
        // consumerEmailAddressRequested: true, // optional
        // consumerPhoneNumberRequested: true, // optional
        // dpaBillingPreference: "POSTAL_COUNTRY", // optional
        // dpaLocale: "en_US", // optional
        // confirmPayment: false, // optional
        // paymentOptions: [{ dynamicDataType: "NONE" }], // optional
      },
      // cardBrands: ["mastercard", "visa", "amex", "discover"], // required
      cardBrands: ["mastercard", "amex", "discover"], // required
      checkoutExperience: "WITHIN_CHECKOUT", // optional
    });
    console.log({ initResponse });

    c2pAvailableCardBrands = initResponse.availableCardBrands;

    const cardsResult = await c2pInstance.getCards();
    console.log({ cardsResult });
  } catch (error) {
    console.log(error);
  }
}

function resetClasses() {
  const c2pOtpContainer = document.getElementById("c2p-otp-container");
  const modal = document.getElementById("modal");
  const c2pIframe = document.getElementById("c2p-iframe");
  const savedCardsSection = document.getElementById("saved_cards");

  c2pOtpContainer.classList.add("hidden");
  modal.classList.remove("open");
  c2pIframe.classList.add("hidden");
  savedCardsSection.classList.add("hidden");
}

function redirectFromLocalhost() {
  if (window.location.href.includes("localhost")) {
    const message = `This application must be run on 127.0.0.1 and cannot be run on localhost due to the Click to Pay SDK's security policy. Click "OK" to be redirected to 127.0.0.1.`;
    if (window.confirm(message)) {
      console.log("got here");
      window.location.href = window.location.href.replace(
        "localhost",
        "127.0.0.1"
      );
    }
  }
}

const emailField = document.getElementById("email");
emailField.addEventListener("input", debounce(onEmailFieldInput, 500));

// Look up user by email
async function onEmailFieldInput(e) {
  try {
    const email = e.target.value;
    const idLookupResult = await c2pInstance.idLookup({ email });
    console.log({ idLookupResult });
    const click2payUserExists = idLookupResult.consumerPresent;
    console.log(
      click2payUserExists
        ? `Click to Pay user for ${email} exists`
        : `Click to Pay user for ${email} does not exist`
    );

    const c2pOtpContainer = document.getElementById("c2p-otp-container");
    const modal = document.getElementById("modal");

    if (!click2payUserExists) {
      console.log("hiding c2pOtpContainer");
      modal.classList.remove("open");
      c2pOtpContainer.classList.add("hidden");
      savedCardsSection.classList.add("hidden");
      return;
    }

    const initiateValidationResult = await c2pInstance.initiateValidation();
    console.log({ initiateValidationResult });
    const { maskedValidationChannel, network } = initiateValidationResult;

    const c2pOtpInput = document.getElementById("c2p-otp-input");
    c2pOtpInput.setAttribute("masked-identity-value", maskedValidationChannel);
    c2pOtpInput.setAttribute("network-id", network);
    c2pOtpInput.setAttribute("card-brands", c2pAvailableCardBrands.join(","));

    const c2pCardList = document.getElementById("c2p-card-list");
    c2pCardList.setAttribute("card-brands", c2pAvailableCardBrands.join(","));

    c2pOtpContainer.classList.remove("hidden");
    modal.classList.add("open");

    c2pOtpInput.addEventListener("otpChanged", function ({ detail }) {
      console.log("otpChanged:", detail);
      c2pOtp = detail;
    });
    c2pOtpInput.addEventListener("continue", async function () {
      // TODO: Display a loader
      console.log(
        "user has clicked continue or has otherwise finished entering OTP"
      );

      c2pSavedCards = [];

      try {
        const validateResponse = await c2pInstance.validate({
          value: c2pOtp,
        });

        console.log({ validateResponse });

        // TODO: add success attribute to c2p-otp-input and then close the modal

        c2pSavedCards = validateResponse;
      } catch (error) {
        // TODO: add error attribute to c2p-otp-input
        return;
      }

      const savedCardsSection = document.getElementById("saved_cards");
      savedCardsSection.classList.remove("hidden");
    });
    c2pOtpInput.addEventListener("alternateRequested", function () {
      console.log("user requested alternate payment method");
    });
    c2pOtpInput.addEventListener("close", function () {
      console.log("user requested to close the modal");

      modal.classList.remove("open");
    });
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

  try {
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

    const encryptedCardResult = await c2pInstance.encryptCard(
      encryptCardPayload
    );
    const encryptedCard = encryptedCardResult.encryptedCard;
    const cardBrand = encryptedCardResult.cardBrand;

    console.log({ encryptedCard, cardBrand });

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

    const c2pIframe = document.getElementById("c2p-iframe");
    c2pIframe.classList.remove("hidden");

    const c2pOtpContainer = document.getElementById("c2p-otp-container");
    c2pOtpContainer.classList.add("hidden");

    const modal = document.getElementById("modal");
    modal.classList.add("open");

    /**
     * You can either use an iframe or a new window to display the Click to Pay iframe.
     * This application is using an iframe inside of a modal.
     *
     * To use a new window, you can do something like this:
     * ```
     * const srcWindow = window.open("", "_blank", "popup");
     * srcWindow.moveTo(500, 100);
     * srcWindow.resizeTo(550, 650);
     *
     * checkoutWithNewCard({
     *   [...]
     *   windowRef: srcWindow,
     * });
     * ```
     */
    const checkoutWithNewCardResult = await c2pInstance.checkoutWithNewCard({
      encryptedCard: encryptedCard,
      cardBrand: cardBrand,
      windowRef: document.getElementById("c2p-iframe").contentWindow,
      // windowRef: document.querySelector("#c2p-iframe").contentWindow,
      dpaTransactionOptions: { dpaLocale: "en_US" },
    });

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
  } catch (error) {
    console.log(error);
  }
}

// Simulate email field value change for testing
setTimeout(() => {
  // has click to pay user
  // emailField.value = "test@test.com";
  // does not have click to pay user (probably)
  // emailField.value = `test${crypto.randomUUID().slice(0, 8)}@test.com`;
  // emailField.value = "david@staxpayments.com";
  // const event = new Event("input", { bubbles: true });
  // emailField.dispatchEvent(event);
}, 1000);

window.addEventListener("message", (event) => {
  // console.log("event", event);
});

redirectFromLocalhost();
init();
