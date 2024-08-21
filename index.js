let click2payInstance;

async function init() {
  try {
    click2payInstance = new Click2Pay();
    const initResponse = await click2payInstance.init({
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
      cardBrands: ["mastercard", "visa", "amex", "discover"], // required
      checkoutExperience: "WITHIN_CHECKOUT", // optional
    });
    console.log({ initResponse });

    const cardsResult = await click2payInstance.getCards();
    console.log({ cardsResult });
  } catch (error) {
    console.log(error);
  }
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

function onFormSubmit(e) {
  e.preventDefault();

  /**
   * First, encrypt the card details by sending a 'inputFieldUpdate'
   * message that includes the card metadata to the cardx hosted field iframe.
   *
   * This will trigger the cardx hosted field to encrypt the card details with
   * the Click to Pay SDK and send window message with an author of 'cardx_hosted_card_field'
   * and a message that includes the encrypted card and card brand.
   *
   * Once we have those details, we can use the encrypted card to check out.
   */

  const formData = new FormData(e.target);
  const formValues = Object.fromEntries(formData.entries());
  const {
    address_zip,
    address_line_1,
    address_line_2,
    address_city,
    address_state,
    first_name,
    last_name,
    card_cvv,
    card_exp_month,
    card_exp_year,
  } = formValues;

  const cardXHostedFieldContentWindow =
    document.getElementById("hosted-card-field").contentWindow;
  cardXHostedFieldContentWindow.postMessage(
    {
      messageAuthor: "cardx_card_field_update",
      message: {
        updateType: "inputFieldUpdate",
        updateObject: {
          zip: address_zip,
          address: (address_line_1 + " " + address_line_2).trim(),
          city: address_city,
          state: address_state,
          name: `${first_name} ${last_name}`,
          cvv: card_cvv,
          expDate01: `${card_exp_month}/${card_exp_year.slice(-2)}`,
          email: "",
          clickToPayEnabled: true,
        },
      },
    },
    "*"
  );
}

window.addEventListener("message", (event) => {
  if (event.data.messageAuthor !== "cardx_hosted_card_field") return;
  const message = event.data.message;

  if (message.encryptedCard) {
    /**
     * Once the cardx hosted field iframe sends a message with the encrypted card,
     * we can use the encrypted card to check out.
     */
    console.log("Encrypted card:", message.encryptedCard);
    onReceiveEncryptedCard(message.encryptedCard, message.cardBrand);
  }
});

async function onReceiveEncryptedCard(encryptedCard, cardBrand) {
  try {
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

    const checkoutWithNewCardResult =
      await click2payInstance.checkoutWithNewCard({
        encryptedCard,
        cardBrand,
        windowRef: document.getElementById("c2p-modal").contentWindow,
        // windowRef: document.querySelector("#c2p-modal").contentWindow,
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
  emailField.value = `test+${crypto.randomUUID().slice(0, 8)}@test.com`;

  const event = new Event("input", { bubbles: true });
  emailField.dispatchEvent(event);
}, 1000);

redirectFromLocalhost();
init();
